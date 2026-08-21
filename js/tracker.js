(function () {
  var timers = {};
  var userTz = "Asia/Tokyo";
  var userWebhook = "";
  var uid = null;
  var nxtBoss = null;
  var nxtTime = null;
  var intSortMode = "time";
  var schedSortMode = "time";

  var $ = function (id) { return document.getElementById(id); };
  var RING_CIRCUMFERENCE = 2 * Math.PI * 44;
  function now() { return Date.now(); }

  var SVG_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  var SVG_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var SVG_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
  var SVG_ALPHA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>';

  function rNext() {
    var bb = null, bs = null, bAlive = false, cn = now();
    var BOSSES = AppBosses.BOSSES;

    for (var i = 0; i < BOSSES.length; i++) {
      var b = BOSSES[i];
      if (b.rs) {
        var tm = timers[b.id];
        if (tm && tm.endTime && tm.endTime <= cn) {
          if (!bs || tm.endTime > bs.getTime()) {
            bs = new Date(tm.endTime); bb = b; bAlive = true;
          }
        }
      } else if (b.wr) {
        var p = AppBosses.prevSpawnSchedule(b, cn);
        if (p && cn - p.getTime() <= AppBosses.SCHED_SPAWN_EXPIRE_MS) {
          if (!bs || p.getTime() > bs.getTime()) {
            bs = p; bb = b; bAlive = true;
          }
        }
      }
    }

    if (!bAlive) {
      for (var i = 0; i < BOSSES.length; i++) {
        var b = BOSSES[i];
        if (b.rs) {
          var n = AppBosses.nextSpawnAt(b, timers, cn, userTz);
          if (n && n.getTime() > cn && (!bs || n.getTime() < bs.getTime())) {
            bs = n; bb = b;
          }
        } else if (b.wr) {
          var x = AppBosses.nextSpawnSchedule(b, cn);
          if (x && x.getTime() > cn && (!bs || x.getTime() < bs.getTime())) {
            bs = x; bb = b;
          }
        }
      }
    }

    if (bb && bs) {
      $("nextName").textContent = bb.name;
      $("nextLv").textContent = "Lv." + bb.lvl;
      $("nextAt").textContent = AppUtils.fmtTz(bs.getTime(), userTz);
      var isInt = !!bb.rs;
      $("nextTag").textContent = isInt ? "Interval" : "Schedule";
      $("nextTag").className = "hero-tag " + (isInt ? "interval" : "scheduled");

      var rem = bAlive ? 0 : bs.getTime() - cn;
      var isAlive = bAlive || rem <= 0;
      $("heroKillBtn").hidden = !(isAlive && isInt);
      $("heroKillBtn").dataset.bossId = bb.id;

      var ring = $("heroStatusRing");
      if (isAlive) { ring.classList.add("alive"); } else { ring.classList.remove("alive"); }

      var im = $("heroBossImg");
      var url = "assets/" + bb.id + ".png";
      if (im.getAttribute("src") !== url) {
        im.style.opacity = 0;
        im.onload = function () { im.style.opacity = 1; };
        im.src = url;
      }
      nxtBoss = bb;
      nxtTime = bs;
    } else {
      $("nextName").textContent = "--";
      $("nextLv").textContent = "";
      $("nextAt").textContent = "";
      $("nextTag").textContent = "";
      $("heroBossImg").style.opacity = 0;
      $("heroKillBtn").hidden = true;
      $("heroStatusRing").classList.remove("alive");
      nxtBoss = null;
      nxtTime = null;
    }
  }

  function rNextCd() {
    var el = $("nextCd");
    var label = $("heroCountdownLabel");
    if (nxtTime) {
      var r = Math.max(0, nxtTime.getTime() - now());
      var isAlive = r <= 0;
      var text = isAlive ? "SPAWNED" : AppUtils.fmtDur(r);
      if (el.textContent !== text) el.textContent = text;
      var cls = "hero-countdown-value " + (isAlive ? "alive" : AppUtils.urgencyClass(r));
      if (el.className !== cls) el.className = cls;
      if (label) label.hidden = isAlive;
      var ring = $("heroProgress");
      if (ring) {
        var offset = isAlive ? 0 : RING_CIRCUMFERENCE;
        if (!isAlive && nxtBoss) {
          var maxSpan = 24 * 3600000;
          if (nxtBoss.rs) maxSpan = nxtBoss.rs * 1000;
          else if (nxtBoss.wr) {
            var prev = AppBosses.prevSpawnSchedule(nxtBoss, nxtTime.getTime() - 1000);
            maxSpan = prev ? nxtTime.getTime() - prev.getTime() : 604800000;
          }
          offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, r / maxSpan)));
        }
        if (ring.style.strokeDashoffset !== offset + "px") ring.style.strokeDashoffset = offset;
      }
    } else {
      if (el.textContent !== "--:--:--") el.textContent = "--:--:--";
      el.className = "hero-countdown-value";
      if (label) label.hidden = true;
      var ring2 = $("heroProgress");
      if (ring2) ring2.style.strokeDashoffset = RING_CIRCUMFERENCE;
    }
  }

  var lastIntListHtml = "";
  function rIntList() {
    var n = now();
    var bosses = AppBosses.intBosses().slice();
    if (intSortMode === "time") {
      bosses.sort(function (a, b) {
        var ta = timers[a.id] ? timers[a.id].endTime : 0;
        var tb = timers[b.id] ? timers[b.id].endTime : 0;
        var aAlive = ta && ta <= n;
        var bAlive = tb && tb <= n;
        if (aAlive && !bAlive) return -1;
        if (!aAlive && bAlive) return 1;
        var aNext = (!ta || ta <= n) ? Infinity : ta;
        var bNext = (!tb || tb <= n) ? Infinity : tb;
        return aNext - bNext;
      });
    } else {
      bosses.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    var h = '<div class="boss-list">';
    if (!bosses.length) {
      h = '<div class="empty-state"><p>No interval bosses</p></div>';
    } else {
      for (var i = 0; i < bosses.length; i++) {
        var b = bosses[i];
        var tm = timers[b.id];
        var et = tm ? tm.endTime : null;
        var isAlive = et && et <= n;
        var hasTimer = et && et > 0;
        var rem = isAlive ? 0 : (et ? et - n : 0);
        var cls = isAlive ? "status-alive" : (rem > 0 && rem <= 5 * 60000 ? "status-danger" : (rem > 0 && rem <= 30 * 60000 ? "status-soon" : ""));
        var timeText = isAlive ? "SPAWNED" : (hasTimer && et > n ? AppUtils.fmtTime(et, userTz) : "--");

        var setBtn = '<button class="boss-card-icon-btn set-btn" data-boss-id="' + b.id + '" data-time="' + (et || 0) + '">' + SVG_GEAR + '</button>';
        var untrackBtn = hasTimer ? '<button class="boss-card-icon-btn untrack-btn" data-boss-id="' + b.id + '">' + SVG_X + '</button>' : "";

        h += '<div class="boss-card ' + cls + '">' +
          '<div class="boss-card-main"><span class="boss-card-name">' + b.name + '</span><span class="boss-card-sub">Lv.' + b.lvl + ' &middot; Every ' + AppUtils.fmtShort(b.rs * 1000) + '</span></div>' +
          '<div class="boss-card-time">' + setBtn + untrackBtn +
          '<span class="boss-card-time-value">' + timeText + '</span></div></div>';
      }
      h += '</div>';
    }
    if (h === lastIntListHtml) return;
    $("intList").innerHTML = h;
    lastIntListHtml = h;

    $("intList").querySelectorAll(".boss-card-icon-btn.set-btn").forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var bossId = btn.dataset.bossId;
        var boss = AppBosses.BOSSES.find(function (b) { return b.id === bossId; });
        var t = parseInt(btn.dataset.time) || 0;
        AppModal.openSetModal(boss.name, userTz).then(function (result) {
          if (result && result.action === "set") {
            var newEndTime = result.time + (boss.rs * 1000);
            AppTimers.setTimer(uid, bossId, { endTime: newEndTime, startedAt: result.time }).then(function () {
              AppDiscord.notifySet(boss, newEndTime, userTz, userWebhook);
            });
          } else if (result && result.action === "delete") {
            AppTimers.untrackBoss(uid, bossId);
          }
        });
      });
    });

    $("intList").querySelectorAll(".boss-card-icon-btn.untrack-btn").forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        AppTimers.untrackBoss(uid, btn.dataset.bossId);
      });
    });
  }

  var lastSchedListHtml = "";
  function rSchedList() {
    var n = now();
    var bosses = AppBosses.schedBosses().slice();
    if (schedSortMode === "time") {
      bosses.sort(function (a, b) {
        var na = AppBosses.nextSpawnSchedule(a, n);
        var nb = AppBosses.nextSpawnSchedule(b, n);
        var ta = na ? na.getTime() : Infinity;
        var tb = nb ? nb.getTime() : Infinity;
        return ta - tb;
      });
    } else {
      bosses.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    var h = '<div class="boss-list">';
    if (!bosses.length) {
      h = '<div class="empty-state"><p>No schedule bosses</p></div>';
    } else {
      for (var i = 0; i < bosses.length; i++) {
        var b = bosses[i];
        var next = AppBosses.nextSpawnSchedule(b, n);
        var prev = AppBosses.prevSpawnSchedule(b, n);
        var isAlive = prev && n - prev.getTime() <= AppBosses.SCHED_SPAWN_EXPIRE_MS;
        var cls = isAlive ? "status-alive" : "";
        var timeText = isAlive ? "SPAWNED" : (next ? AppUtils.fmtTime(next.getTime(), userTz) : "--");

        var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var schedText = b.wr.map(function (w) { var c = AppBosses.convertWrToTz(w, userTz); return dayNames[c.d] + " " + AppBosses.p2(c.h) + ":" + AppBosses.p2(c.m); }).join(", ");

        h += '<div class="boss-card ' + cls + '">' +
          '<div class="boss-card-main"><span class="boss-card-name">' + b.name + '</span><span class="boss-card-sub">Lv.' + b.lvl + ' &middot; ' + schedText + '</span></div>' +
          '<div class="boss-card-time">' +
          '<span class="boss-card-time-value">' + timeText + '</span></div></div>';
      }
      h += '</div>';
    }
    if (h === lastSchedListHtml) return;
    $("schedList").innerHTML = h;
    lastSchedListHtml = h;
  }

  function rAll() { rNext(); rIntList(); rSchedList(); rNextCd(); }
  function visualRefresh() { rIntList(); rSchedList(); }

  var notifArmed = {};
  var notifSpoken = {};

  function checkNotifications() {
    if (!userWebhook) return;
    var n = now();
    var BOSSES = AppBosses.BOSSES;
    for (var i = 0; i < BOSSES.length; i++) {
      var b = BOSSES[i];
      var tm = timers[b.id];

      if (tm && tm.endTime) {
        var rem = tm.endTime - n;
        if (rem > 0) notifArmed[b.id] = tm.endTime;
        if (rem > 0 && rem <= 5 * 60000) {
          var key = b.id + "_" + tm.endTime + "_respawn5";
          if (!notifSpoken[key]) {
            notifSpoken[key] = true;
            AppDiscord.notifyRespawning5(b, userWebhook);
          }
        } else if (rem <= 0 && rem > -300000) {
          var armedEnd = notifArmed[b.id];
          if (armedEnd === tm.endTime) {
            var key2 = b.id + "_" + tm.endTime + "_spawned";
            if (!notifSpoken[key2]) {
              notifSpoken[key2] = true;
              AppDiscord.notifyRespawned(b, userWebhook);
              delete notifArmed[b.id];
            }
          }
        }
        continue;
      }

      if (b.wr) {
        var next = AppBosses.nextSpawnSchedule(b, n);
        if (!next) continue;
        var sRem = next.getTime() - n;
        if (sRem > 0 && sRem <= 5 * 60000) {
          var sKey = b.id + "_" + next.getTime() + "_respawn5";
          if (!notifSpoken[sKey]) {
            notifSpoken[sKey] = true;
            AppDiscord.notifyRespawning5(b, userWebhook);
          }
        } else if (sRem <= 0 && sRem > -AppBosses.SCHED_SPAWN_EXPIRE_MS) {
          var sKey2 = b.id + "_" + next.getTime() + "_spawned";
          if (!notifSpoken[sKey2]) {
            notifSpoken[sKey2] = true;
            AppDiscord.notifyRespawned(b, userWebhook);
          }
        }
      }
    }
  }

  function expireSchedSpawn() {
    if (nxtBoss && nxtBoss.wr && nxtTime && now() - nxtTime.getTime() >= AppBosses.SCHED_SPAWN_EXPIRE_MS) rNext();
  }

  function tick() {
    if (document.hidden) return;
    expireSchedSpawn();
    rNext();
    visualRefresh();
    rNextCd();
    checkNotifications();
  }
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { expireSchedSpawn(); rNext(); visualRefresh(); rNextCd(); }
  });

  $("heroKillBtn").addEventListener("click", function () {
    if (!nxtBoss) return;
    var killTime = now();
    if (nxtBoss.rs) {
      var newEndTime = killTime + (nxtBoss.rs * 1000);
      AppTimers.setTimer(uid, nxtBoss.id, { endTime: newEndTime, startedAt: killTime }).then(function () {
        AppDiscord.notifyKill(nxtBoss, newEndTime, userTz, userWebhook);
      });
    }
  });

  $("settingsBtn").addEventListener("click", function () {
    AppModal.openSettingsModal(userTz, userWebhook).then(function (result) {
      if (result) {
        userTz = result.timezone;
        userWebhook = result.webhookUrl;
        db.collection("users").doc(uid).update({
          timezone: userTz,
          webhookUrl: userWebhook
        }).then(function () { rAll(); });
      }
    });
  });

  $("intSortBtn").addEventListener("click", function () {
    intSortMode = intSortMode === "time" ? "name" : "time";
    $("intSortBtn").innerHTML = intSortMode === "time" ? SVG_CLOCK : SVG_ALPHA;
    $("intSortBtn").title = intSortMode === "time" ? "Sort by name" : "Sort by time";
    lastIntListHtml = "";
    rIntList();
  });

  $("schedSortBtn").addEventListener("click", function () {
    schedSortMode = schedSortMode === "time" ? "name" : "time";
    $("schedSortBtn").innerHTML = schedSortMode === "time" ? SVG_CLOCK : SVG_ALPHA;
    $("schedSortBtn").title = schedSortMode === "time" ? "Sort by name" : "Sort by time";
    lastSchedListHtml = "";
    rSchedList();
  });

  AppAuth.initAuth(function (user, profile) {
    uid = user.uid;
    userTz = profile.timezone || "Asia/Tokyo";
    userWebhook = profile.webhookUrl || "";
    $("userEmail").textContent = user.email;

    AppTimers.initTimers(uid, function (t) {
      timers = t;
      rAll();
      checkNotifications();
    }).then(function () {
      rAll();
    }).catch(function (err) {
      console.error("initTimers error:", err);
    });
  });
})();
