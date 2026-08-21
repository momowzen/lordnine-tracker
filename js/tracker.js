(function () {
  var timers = {};
  var userTz = "Asia/Tokyo";
  var userWebhook = "";
  var uid = null;
  var nxtBoss = null;
  var nxtTime = null;

  var $ = function (id) { return document.getElementById(id); };
  var RING_CIRCUMFERENCE = 2 * Math.PI * 44;
  function now() { return Date.now(); }

  function rNext() {
    var bb = null, bs = null, cn = now();
    var BOSSES = AppBosses.BOSSES;
    for (var i = 0; i < BOSSES.length; i++) {
      var n = AppBosses.nextSpawnAt(BOSSES[i], timers, cn, userTz);
      if (n && n.getTime() > cn && (!bs || n.getTime() < bs.getTime())) {
        bs = n; bb = BOSSES[i];
      }
    }
    if (bb && bs) {
      $("nextName").textContent = bb.name;
      $("nextLv").textContent = "Lv." + bb.lvl;
      $("nextAt").textContent = AppUtils.fmtTz(bs.getTime(), userTz);
      var isInt = !!bb.rs;
      $("nextTag").textContent = isInt ? "Interval" : "Schedule";
      $("nextTag").className = "hero-tag " + (isInt ? "interval" : "scheduled");

      var rem = bs.getTime() - cn;
      var isAlive = rem <= 0;
      $("heroKillBtn").hidden = !isAlive;
      $("heroKillBtn").dataset.bossId = bb.id;

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
      nxtBoss = null;
      nxtTime = null;
    }
  }

  function rNextCd() {
    var el = $("nextCd");
    if (nxtTime) {
      var r = Math.max(0, nxtTime.getTime() - now());
      var text = AppUtils.fmtDur(r);
      if (el.textContent !== text) el.textContent = text;
      var cls = "hero-countdown-value " + AppUtils.urgencyClass(r);
      if (el.className !== cls) el.className = cls;
      var ring = $("heroProgress");
      if (ring) {
        var maxSpan = 24 * 3600000;
        if (nxtBoss) {
          if (nxtBoss.rs) maxSpan = nxtBoss.rs * 1000;
          else if (nxtBoss.wr) {
            var prev = AppBosses.prevSpawnSchedule(nxtBoss, nxtTime.getTime() - 1000, userTz);
            maxSpan = prev ? nxtTime.getTime() - prev.getTime() : 604800000;
          }
        }
        var offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, r / maxSpan)));
        if (ring.style.strokeDashoffset !== offset + "px") ring.style.strokeDashoffset = offset;
      }
    } else {
      if (el.textContent !== "--:--:--") el.textContent = "--:--:--";
      el.className = "hero-countdown-value";
      var ring2 = $("heroProgress");
      if (ring2) ring2.style.strokeDashoffset = RING_CIRCUMFERENCE;
    }
  }

  var lastUpHtml = { today: "", tomorrow: "" };
  function rUpcoming() {
    var n = now(), offset = AppUtils.getTzOffsetMs(userTz);
    var tKey = Math.floor((n + offset) / 86400000);
    var tmKey = tKey + 1;
    var dayKey = function (t) { return Math.floor((t + offset) / 86400000); };
    var list = { today: [], tomorrow: [] };
    var BOSSES = AppBosses.BOSSES;

    var push = function (b, t) {
      if (t <= n) { list.today.push({ b: b, t: t }); return; }
      var dk = dayKey(t);
      if (dk === tKey) list.today.push({ b: b, t: t });
      else if (dk === tmKey) list.tomorrow.push({ b: b, t: t });
    };

    for (var i = 0; i < BOSSES.length; i++) {
      var b = BOSSES[i];
      if (b.rs) {
        var et = timers[b.id] ? timers[b.id].endTime : null;
        if (et) push(b, et);
      } else if (b.wr) {
        var x = AppBosses.nextSpawnAt(b, timers, n, userTz);
        if (x && x.getTime() > n) push(b, x.getTime());
        var p = AppBosses.prevSpawnSchedule(b, n, userTz);
        if (p && n - p.getTime() <= AppBosses.SCHED_SPAWN_EXPIRE_MS) push(b, p.getTime());
      }
    }

    list.today.sort(function (a, b) { return a.t - b.t; });
    list.tomorrow.sort(function (a, b) { return a.t - b.t; });

    var views = ["today", "tomorrow"];
    for (var vi = 0; vi < views.length; vi++) {
      var v = views[vi];
      var e = v === "today" ? $("upcomingList") : $("upcomingTmrw");
      var h;
      if (!list[v].length) {
        h = '<div class="empty-state"><p>No spawns</p></div>';
      } else {
        h = '<div class="boss-list">';
        for (var j = 0; j < list[v].length; j++) {
          var item = list[v][j];
          var rem2 = item.t - n;
          var cls = AppUtils.statusClassFor(rem2);
          var isInt2 = !!item.b.rs;
          var setBtn = isInt2 ? '<button class="boss-card-set-btn" data-boss-id="' + item.b.id + '" data-time="' + item.t + '">SET</button>' : "";
          h += '<div class="boss-card ' + cls + '" data-t="' + item.t + '">' +
            '<div class="boss-card-main"><span class="boss-card-name">' + item.b.name + '</span></div>' +
            '<div class="boss-card-time"><span class="boss-card-time-value">' + (rem2 <= 0 ? "SPAWNED" : AppUtils.fmtTime(item.t, userTz)) + '</span>' + setBtn + '</div></div>';
        }
        h += '</div>';
      }
      if (h !== lastUpHtml[v]) { e.innerHTML = h; lastUpHtml[v] = h; }
    }

    document.querySelectorAll(".boss-card-set-btn").forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var bossId = btn.dataset.bossId;
        var boss = AppBosses.BOSSES.find(function (b) { return b.id === bossId; });
        var t = parseInt(btn.dataset.time);
        AppModal.openSetModal(boss.name, userTz, t).then(function (result) {
          if (result && result.action === "set") {
            var newEndTime = result.time + (boss.rs * 1000);
            AppTimers.setTimer(uid, bossId, { endTime: newEndTime, startedAt: result.time }).then(function () {
              AppDiscord.notifySet(boss, newEndTime, userTz, userWebhook);
            });
          } else if (result && result.action === "delete") {
            AppTimers.setTimer(uid, bossId, { endTime: 0, startedAt: 0 });
          }
        });
      });
    });
  }

  var lastSchedHtml = "";
  function rSched() {
    var offset = AppUtils.getTzOffsetMs(userTz);
    var j = new Date(now() + offset);
    var cd = j.getUTCDay();
    var order = [1, 2, 3, 4, 5, 6, 0];
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var by = order.map(function (d) { return { d: d, n: dayNames[d], es: [] }; });
    var scheds = AppBosses.schedBosses();
    for (var i = 0; i < scheds.length; i++) {
      var b = scheds[i];
      for (var w = 0; w < b.wr.length; w++) {
        var wr = b.wr[w];
        var col = by.find(function (x) { return x.d === wr.d; });
        if (col) col.es.push({ b: b, t: AppBosses.p2(wr.h) + ":" + AppBosses.p2(wr.m) });
      }
    }
    for (var d = 0; d < by.length; d++) by[d].es.sort(function (a, b) { return a.t.localeCompare(b.t); });

    var h = '<div class="schedule-grid">';
    for (var di = 0; di < by.length; di++) {
      var day = by[di];
      h += '<div class="day-card ' + (day.d === cd ? "today" : "") + '">' +
        '<div class="day-header"><span>' + day.n + '</span><span>' + (day.d === cd ? "Today" : "") + '</span></div>' +
        '<div class="day-events">';
      if (day.es.length) {
        for (var ei = 0; ei < day.es.length; ei++) {
          h += '<div class="day-event"><span class="day-event-name">' + day.es[ei].b.name + '</span><span class="day-event-time">' + day.es[ei].t + '</span></div>';
        }
      } else {
        h += '<div class="day-empty">--</div>';
      }
      h += '</div></div>';
    }
    h += '</div>';
    if (h === lastSchedHtml) return;
    $("schedGrid").innerHTML = h;
    lastSchedHtml = h;
  }

  var lastIntHtml = "";
  function rInt() {
    var n = now();
    var groups = AppBosses.grpInterval();
    var h = '<div class="interval-grid">';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var isNext = nxtBoss && g.b.indexOf(nxtBoss) !== -1;
      h += '<div class="interval-card ' + (isNext ? "highlight" : "") + '">' +
        '<div class="interval-header"><div class="interval-title">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
        '<span>Every ' + AppUtils.fmtShort(g.s * 1000) + '</span></div>' +
        '<span class="interval-count">' + g.b.length + '</span></div>' +
        '<div class="interval-rows">';
      for (var j = 0; j < g.b.length; j++) {
        var b = g.b[j];
        var et = timers[b.id] ? timers[b.id].endTime : null;
        var al = et && et > n;
        h += '<div class="interval-row" data-t="' + (et || 0) + '">' +
          '<span class="interval-row-name">' + b.name + '</span>' +
          '<span class="interval-row-time ' + (al ? "live" : "na") + '">' + (al ? AppUtils.fmtShort(et - n) : "--") + '</span></div>';
      }
      h += '</div></div>';
    }
    h += '</div>';
    if (h === lastIntHtml) return;
    $("ivGrid").innerHTML = h;
    lastIntHtml = h;
  }

  function rAll() { rNext(); rUpcoming(); rSched(); rInt(); rNextCd(); }
  function visualRefresh() { rUpcoming(); rSched(); rInt(); }

  var notifArmed = {};
  var notifSpoken = {};

  function checkNotifications() {
    if (!userWebhook) return;
    var n = now();
    var BOSSES = AppBosses.BOSSES;
    for (var i = 0; i < BOSSES.length; i++) {
      var b = BOSSES[i];
      var tm = timers[b.id];
      if (!tm || !tm.endTime) continue;
      var rem = tm.endTime - n;
      if (rem > 0) notifArmed[b.id] = tm.endTime;
      if (rem > 0 && rem <= 5 * 60000) {
        var m = Math.ceil(rem / 60000);
        var key = b.id + "_" + tm.endTime + "_" + m;
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
    }
  }

  function expireSchedSpawn() {
    if (nxtBoss && nxtBoss.wr && nxtTime && now() - nxtTime.getTime() >= AppBosses.SCHED_SPAWN_EXPIRE_MS) rNext();
  }

  function tick() {
    if (document.hidden) return;
    expireSchedSpawn();
    visualRefresh();
    rNextCd();
    checkNotifications();
  }
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { expireSchedSpawn(); visualRefresh(); rNextCd(); }
  });

  $("heroKillBtn").addEventListener("click", function () {
    if (!nxtBoss) return;
    var killTime = now();
    if (nxtBoss.rs) {
      var newEndTime = killTime + (nxtBoss.rs * 1000);
      AppTimers.setTimer(uid, nxtBoss.id, { endTime: newEndTime, startedAt: killTime }).then(function () {
        AppDiscord.notifyKill(nxtBoss, newEndTime, userTz, userWebhook);
      });
    } else if (nxtBoss.wr) {
      var next = AppBosses.nextSpawnSchedule(nxtBoss, killTime, userTz);
      if (next) AppDiscord.notifyKill(nxtBoss, next.getTime(), userTz, userWebhook);
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

  $("upTodayBtn").addEventListener("click", function () {
    $("upTodayBtn").classList.add("active");
    $("upTmrwBtn").classList.remove("active");
    $("upcomingList").hidden = false;
    $("upcomingTmrw").hidden = true;
    $("upcomingLbl").textContent = "Today";
  });

  $("upTmrwBtn").addEventListener("click", function () {
    $("upTmrwBtn").classList.add("active");
    $("upTodayBtn").classList.remove("active");
    $("upcomingTmrw").hidden = false;
    $("upcomingList").hidden = true;
    $("upcomingLbl").textContent = "Tomorrow";
  });

  $("ivBtn").addEventListener("click", function () {
    $("ivBtn").classList.add("active");
    $("schedBtn").classList.remove("active");
    $("ivGrid").hidden = false;
    $("schedGrid").hidden = true;
    $("viewTitle").textContent = "Interval";
  });

  $("schedBtn").addEventListener("click", function () {
    $("schedBtn").classList.add("active");
    $("ivBtn").classList.remove("active");
    $("schedGrid").hidden = false;
    $("ivGrid").hidden = true;
    $("viewTitle").textContent = "Schedule";
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
    });
  });
})();
