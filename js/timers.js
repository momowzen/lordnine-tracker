var AppTimers = (function () {
  var timers = {};
  var unsubscribeTimers = null;

  function listenUserTimers(uid, onUpdate) {
    if (unsubscribeTimers) unsubscribeTimers();
    unsubscribeTimers = db.collection("users").doc(uid).collection("timers")
      .onSnapshot(function (snap) {
        var t = {};
        snap.forEach(function (d) { t[d.id] = d.data(); });
        timers = t;
        onUpdate(timers);
      }, function (err) {
        console.warn("Firestore listener failed:", err);
      });
  }

  function getTimers() { return timers; }

  function setTimer(uid, bossId, data) {
    return db.collection("users").doc(uid).collection("timers").doc(bossId).set(data, { merge: true });
  }

  function trackBoss(uid, bossId, killTimeMs) {
    var boss = AppBosses.BOSSES.find(function (b) { return b.id === bossId; });
    if (!boss) return Promise.reject(new Error("Boss not found"));
    if (!boss.rs) return Promise.resolve();
    var endTime = killTimeMs + boss.rs * 1000;
    return setTimer(uid, bossId, { endTime: endTime, startedAt: killTimeMs });
  }

  function untrackBoss(uid, bossId) {
    return db.collection("users").doc(uid).collection("timers").doc(bossId).delete();
  }

  function loadAllTimers(uid) {
    return db.collection("users").doc(uid).collection("timers").get().then(function (snap) {
      var t = {};
      snap.forEach(function (d) { t[d.id] = d.data(); });
      timers = t;
      return timers;
    }).catch(function (err) {
      console.warn("Failed to load timers:", err);
      timers = {};
      return timers;
    });
  }

  function initTimers(uid, onUpdate) {
    return loadAllTimers(uid).then(function () {
      listenUserTimers(uid, onUpdate);
    });
  }

  return {
    initTimers: initTimers,
    getTimers: getTimers,
    setTimer: setTimer,
    trackBoss: trackBoss,
    untrackBoss: untrackBoss
  };
})();
