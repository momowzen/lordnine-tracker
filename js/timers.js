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
      });
  }

  function getTimers() { return timers; }

  function setTimer(uid, bossId, data) {
    return db.collection("users").doc(uid).collection("timers").doc(bossId).set(data, { merge: true });
  }

  function loadAllTimers(uid) {
    return db.collection("users").doc(uid).collection("timers").get().then(function (snap) {
      var t = {};
      snap.forEach(function (d) { t[d.id] = d.data(); });
      timers = t;
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
    setTimer: setTimer
  };
})();
