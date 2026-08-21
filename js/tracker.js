import { initAuth, currentUser, userProfile, loadProfile, auth, db } from "./auth.js";
import { initTimers, getTimers, setTimer } from "./timers.js";
import { doc, updateDoc } from "firebase/firestore";
import { BOSSES, nextSpawnAt, nextSpawnSchedule, prevSpawnSchedule, intBosses, schedBosses, grpInterval, SCHED_SPAWN_EXPIRE_MS } from "./bosses.js";
import { IANA_TIMEZONES, getTzOffsetMs, fmtTz, fmtTime, fmtDur, fmtShort, urgencyClass, statusClassFor } from "./utils.js";
import { openSetModal, openSettingsModal } from "./modal.js";
import { notifyKill, notifySet, notifyRespawning5, notifyRespawned } from "./discord.js";

let timers = {};
let userTz = "Asia/Tokyo";
let userWebhook = "";
let uid = null;

const $ = id => document.getElementById(id);
const RING_CIRCUMFERENCE = 2 * Math.PI * 44;

function now() { return Date.now(); }

function p2(n) { return String(n).padStart(2, "0"); }

function populateTimezones(selectEl, current) {
  selectEl.innerHTML = "";
  for (const tz of IANA_TIMEZONES) {
    const opt = document.createElement("option");
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, " ");
    if (tz === current) opt.selected = true;
    selectEl.appendChild(opt);
  }
}

function rNext() {
  let bb = null, bs = null, cn = now();
  for (const b of BOSSES) {
    const n = nextSpawnAt(b, timers, cn, userTz);
    if (n && n.getTime() > cn && (!bs || n.getTime() < bs.getTime())) {
      bs = n; bb = b;
    }
  }
  if (bb && bs) {
    $("nextName").textContent = bb.name;
    $("nextLv").textContent = "Lv." + bb.lvl;
    $("nextAt").textContent = fmtTz(bs.getTime(), userTz);
    const isInt = !!bb.rs;
    $("nextTag").textContent = isInt ? "Interval" : "Schedule";
    $("nextTag").className = "hero-tag " + (isInt ? "interval" : "scheduled");

    const rem = bs.getTime() - cn;
    const isAlive = rem <= 0;
    const killBtn = $("heroKillBtn");
    killBtn.hidden = !isAlive;
    killBtn.dataset.bossId = bb.id;

    const im = $("heroBossImg");
    const url = "assets/" + bb.id + ".png";
    if (im.getAttribute("src") !== url) {
      im.style.opacity = 0;
      im.onload = () => { im.style.opacity = 1; };
      im.src = url;
    }

    window._nxtBoss = bb;
    window._nxtTime = bs;
  } else {
    $("nextName").textContent = "--";
    $("nextLv").textContent = "";
    $("nextAt").textContent = "";
    $("nextTag").textContent = "";
    $("heroBossImg").style.opacity = 0;
    $("heroKillBtn").hidden = true;
    window._nxtBoss = null;
    window._nxtTime = null;
  }
}

function rNextCd() {
  const el = $("nextCd");
  const boss = window._nxtBoss;
  const time = window._nxtTime;
  if (time) {
    const r = Math.max(0, time.getTime() - now());
    const text = fmtDur(r);
    if (el.textContent !== text) el.textContent = text;
    const cls = "hero-countdown-value " + urgencyClass(r);
    if (el.className !== cls) el.className = cls;
    const ring = $("heroProgress");
    if (ring) {
      let maxSpan = 24 * 3600000;
      if (boss) {
        if (boss.rs) maxSpan = boss.rs * 1000;
        else if (boss.wr) {
          const prev = prevSpawnSchedule(boss, time.getTime() - 1000, userTz);
          maxSpan = prev ? time.getTime() - prev.getTime() : 604800000;
        }
      }
      const offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, r / maxSpan)));
      if (ring.style.strokeDashoffset !== offset + "px") ring.style.strokeDashoffset = offset;
    }
  } else {
    if (el.textContent !== "--:--:--") el.textContent = "--:--:--";
    el.className = "hero-countdown-value";
    const ring = $("heroProgress");
    if (ring) ring.style.strokeDashoffset = RING_CIRCUMFERENCE;
  }
}

let lastUpHtml = { today: "", tomorrow: "" };
function rUpcoming() {
  const n = now(), offset = getTzOffsetMs(userTz);
  const tKey = Math.floor((n + offset) / 86400000);
  const tmKey = tKey + 1;
  const dayKey = t => Math.floor((t + offset) / 86400000);
  const list = { today: [], tomorrow: [] };

  const push = (b, t) => {
    if (t <= n) { list.today.push({ b, t }); return; }
    const dk = dayKey(t);
    if (dk === tKey) list.today.push({ b, t });
    else if (dk === tmKey) list.tomorrow.push({ b, t });
  };

  for (const b of BOSSES) {
    if (b.rs) {
      const et = timers[b.id]?.endTime;
      if (et) push(b, et);
    } else if (b.wr) {
      const x = nextSpawnAt(b, timers, n, userTz);
      if (x && x.getTime() > n) push(b, x.getTime());
      const p = prevSpawnSchedule(b, n, userTz);
      if (p && n - p.getTime() <= SCHED_SPAWN_EXPIRE_MS) push(b, p.getTime());
    }
  }

  list.today.sort((a, b) => a.t - b.t);
  list.tomorrow.sort((a, b) => a.t - b.t);

  for (const v of ["today", "tomorrow"]) {
    const e = v === "today" ? $("upcomingList") : $("upcomingTmrw");
    let h;
    if (!list[v].length) {
      h = '<div class="empty-state"><p>No spawns</p></div>';
    } else {
      h = '<div class="boss-list">' + list[v].map(x => {
        const rem = x.t - n;
        const cls = statusClassFor(rem);
        const isInt = !!x.b.rs;
        const setBtn = isInt ? `<button class="boss-card-set-btn" data-boss-id="${x.b.id}" data-time="${x.t}">SET</button>` : "";
        return `<div class="boss-card ${cls}" data-t="${x.t}">
          <div class="boss-card-main">
            <span class="boss-card-name">${x.b.name}</span>
          </div>
          <div class="boss-card-time">
            <span class="boss-card-time-value">${rem <= 0 ? "SPAWNED" : fmtTime(x.t, userTz)}</span>
            ${setBtn}
          </div>
        </div>`;
      }).join("") + "</div>";
    }
    if (h !== lastUpHtml[v]) { e.innerHTML = h; lastUpHtml[v] = h; }
  }

  document.querySelectorAll(".boss-card-set-btn").forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const bossId = btn.dataset.bossId;
      const boss = BOSSES.find(b => b.id === bossId);
      const t = parseInt(btn.dataset.time);
      const result = await openSetModal(boss.name, userTz, t);
      if (result && result.action === "set") {
        const newEndTime = result.time + (boss.rs * 1000);
        await setTimer(uid, bossId, { endTime: newEndTime, startedAt: result.time });
        await notifySet(boss, newEndTime, userTz, userWebhook);
      } else if (result && result.action === "delete") {
        await setTimer(uid, bossId, { endTime: 0, startedAt: 0 });
      }
    });
  });
}

let lastSchedHtml = "";
function rSched() {
  const offset = getTzOffsetMs(userTz);
  const j = new Date(now() + offset);
  const cd = j.getUTCDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const by = order.map(d => ({ d, n: dayNames[d], es: [] }));
  for (const b of schedBosses()) {
    for (const w of b.wr) {
      const col = by.find(x => x.d === w.d);
      if (col) col.es.push({ b, t: p2(w.h) + ":" + p2(w.m) });
    }
  }
  for (const d of by) d.es.sort((a, b) => a.t.localeCompare(b.t));

  const h = '<div class="schedule-grid">' + by.map(d => {
    return `<div class="day-card ${d.d === cd ? "today" : ""}">
      <div class="day-header"><span>${d.n}</span><span>${d.d === cd ? "Today" : ""}</span></div>
      <div class="day-events">${d.es.length ? d.es.map(e =>
        `<div class="day-event"><span class="day-event-name">${e.b.name}</span><span class="day-event-time">${e.t}</span></div>`
      ).join("") : '<div class="day-empty">--</div>'}</div>
    </div>`;
  }).join("") + "</div>";
  if (h === lastSchedHtml) return;
  $("schedGrid").innerHTML = h;
  lastSchedHtml = h;
}

let lastIntHtml = "";
function rInt() {
  const n = now();
  const h = '<div class="interval-grid">' + grpInterval().map(g => {
    const isNext = window._nxtBoss && g.b.includes(window._nxtBoss);
    return `<div class="interval-card ${isNext ? "highlight" : ""}">
      <div class="interval-header">
        <div class="interval-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Every ${fmtShort(g.s * 1000)}</span>
        </div>
        <span class="interval-count">${g.b.length}</span>
      </div>
      <div class="interval-rows">${g.b.map(b => {
        const et = timers[b.id]?.endTime;
        const al = et && et > n;
        return `<div class="interval-row" data-t="${et || 0}">
          <span class="interval-row-name">${b.name}</span>
          <span class="interval-row-time ${al ? "live" : "na"}">${al ? fmtShort(et - n) : "--"}</span>
        </div>`;
      }).join("")}</div>
    </div>`;
  }).join("") + "</div>";
  if (h === lastIntHtml) return;
  $("ivGrid").innerHTML = h;
  lastIntHtml = h;
}

function rAll() { rNext(); rUpcoming(); rSched(); rInt(); rNextCd(); }
function visualRefresh() { rUpcoming(); rSched(); rInt(); }

const notifArmed = new Map();
const notifSpoken = new Set();

function checkNotifications() {
  if (!userWebhook) return;
  const n = now();
  for (const b of BOSSES) {
    const tm = timers[b.id];
    if (!tm || !tm.endTime) continue;
    const rem = tm.endTime - n;
    if (rem > 0) notifArmed.set(b.id, tm.endTime);
    if (rem > 0 && rem <= 5 * 60000) {
      const m = Math.ceil(rem / 60000);
      const key = `${b.id}_${tm.endTime}_${m}`;
      if (!notifSpoken.has(key)) {
        notifSpoken.add(key);
        notifyRespawning5(b, userWebhook);
      }
    } else if (rem <= 0 && rem > -300000) {
      const armedEnd = notifArmed.get(b.id);
      if (armedEnd === tm.endTime) {
        const key = `${b.id}_${tm.endTime}_spawned`;
        if (!notifSpoken.has(key)) {
          notifSpoken.add(key);
          notifyRespawned(b, userWebhook);
          notifArmed.delete(b.id);
        }
      }
    }
  }
}

function expireSchedSpawn() {
  const boss = window._nxtBoss;
  const time = window._nxtTime;
  if (boss && boss.wr && time && now() - time.getTime() >= SCHED_SPAWN_EXPIRE_MS) rNext();
}

function tick() {
  if (document.hidden) return;
  expireSchedSpawn();
  visualRefresh();
  rNextCd();
  checkNotifications();
}
setInterval(tick, 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { expireSchedSpawn(); visualRefresh(); rNextCd(); }
});

 $("heroKillBtn").addEventListener("click", async () => {
  const boss = window._nxtBoss;
  if (!boss) return;
  const killTime = now();
  if (boss.rs) {
    const newEndTime = killTime + (boss.rs * 1000);
    await setTimer(uid, boss.id, { endTime: newEndTime, startedAt: killTime });
    await notifyKill(boss, newEndTime, userTz, userWebhook);
  } else if (boss.wr) {
    const next = nextSpawnSchedule(boss, killTime, userTz);
    if (next) await notifyKill(boss, next.getTime(), userTz, userWebhook);
  }
});

$("settingsBtn").addEventListener("click", async () => {
  const result = await openSettingsModal(userTz, userWebhook);
  if (result) {
    userTz = result.timezone;
    userWebhook = result.webhookUrl;
    await updateDoc(doc(db, "users", uid), {
      timezone: userTz,
      webhookUrl: userWebhook
    });
    rAll();
  }
});

initAuth(async (user, profile) => {
  uid = user.uid;
  userTz = profile.timezone || "Asia/Tokyo";
  userWebhook = profile.webhookUrl || "";
  $("userEmail").textContent = user.email;

  await initTimers(uid, (t) => {
    timers = t;
    rAll();
    checkNotifications();
  });
  rAll();
});
