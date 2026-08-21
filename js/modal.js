var AppModal = (function () {
  var modalResolve = null;

  var setModal = document.getElementById("setModal");
  var setModalTitle = document.getElementById("setModalTitle");
  var setModalDatetime = document.getElementById("setModalDatetime");
  var setModalSave = document.getElementById("setModalSave");
  var setModalCancel = document.getElementById("setModalCancel");
  var setModalDelete = document.getElementById("setModalDelete");

  setModalSave.addEventListener("click", function () {
    var val = setModalDatetime.value;
    if (!val) return;
    var ms = new Date(val).getTime();
    if (isNaN(ms)) return;
    setModal.hidden = true;
    if (modalResolve) modalResolve({ action: "set", time: ms });
  });

  setModalCancel.addEventListener("click", function () {
    setModal.hidden = true;
    if (modalResolve) modalResolve(null);
  });

  setModalDelete.addEventListener("click", function () {
    setModal.hidden = true;
    if (modalResolve) modalResolve({ action: "delete" });
  });

  function openSetModal(bossName, tz, existingEndTime) {
    setModalTitle.textContent = "Set Kill Time - " + bossName;
    if (existingEndTime && existingEndTime > Date.now()) {
      var d = new Date(existingEndTime);
      var local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setModalDatetime.value = local.toISOString().slice(0, 16);
    } else {
      var now = new Date();
      var localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      setModalDatetime.value = localNow.toISOString().slice(0, 16);
    }
    setModal.hidden = false;
    return new Promise(function (resolve) { modalResolve = resolve; });
  }

  var settingsModal = document.getElementById("settingsModal");
  var settingsTimezone = document.getElementById("settingsTimezone");
  var settingsWebhook = document.getElementById("settingsWebhook");
  var settingsSave = document.getElementById("settingsSave");
  var settingsCancel = document.getElementById("settingsCancel");
  var settingsResolve = null;

  AppUtils.populateTimezones(settingsTimezone, "Asia/Tokyo");

  settingsSave.addEventListener("click", function () {
    var tz = settingsTimezone.value;
    var webhook = settingsWebhook.value.trim();
    settingsModal.hidden = true;
    if (settingsResolve) settingsResolve({ timezone: tz, webhookUrl: webhook });
  });

  settingsCancel.addEventListener("click", function () {
    settingsModal.hidden = true;
    if (settingsResolve) settingsResolve(null);
  });

  function openSettingsModal(currentTz, currentWebhook) {
    AppUtils.populateTimezones(settingsTimezone, currentTz || "Asia/Tokyo");
    settingsWebhook.value = currentWebhook || "";
    settingsModal.hidden = false;
    return new Promise(function (resolve) { settingsResolve = resolve; });
  }

  var trackModal = document.getElementById("trackModal");
  var trackSearch = document.getElementById("trackSearch");
  var trackBossList = document.getElementById("trackBossList");
  var trackResolve = null;

  function renderTrackList(trackedIds) {
    var query = trackSearch.value.toLowerCase();
    var bosses = AppBosses.BOSSES;
    var html = "";
    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      if (query && b.name.toLowerCase().indexOf(query) === -1) continue;
      var isInterval = !!b.rs;
      var isTracked = trackedIds.indexOf(b.id) !== -1;
      var type = isInterval ? "interval" : "schedule";
      var typeLabel = isInterval ? "Interval " + AppUtils.fmtShort(b.rs * 1000) : "Auto";
      var clickClass = isInterval && !isTracked ? "" : " tracked";
      html += '<div class="track-boss-item' + clickClass + '" data-boss-id="' + b.id + '" data-interval="' + (isInterval ? "1" : "0") + '">' +
        '<img class="track-boss-item-img" src="assets/' + b.id + '.png" alt="" loading="lazy">' +
        '<div class="track-boss-item-info">' +
          '<div class="track-boss-item-name">' + b.name + '</div>' +
          '<div class="track-boss-item-meta">Lv.' + b.lvl + '</div>' +
        '</div>' +
        '<span class="track-boss-item-tag ' + type + '">' + typeLabel + '</span>' +
      '</div>';
    }
    trackBossList.innerHTML = html || '<div class="empty-state"><p>No bosses found</p></div>';

    trackBossList.querySelectorAll(".track-boss-item:not(.tracked)").forEach(function (item) {
      item.addEventListener("click", function () {
        if (item.dataset.interval !== "1") return;
        var bossId = item.dataset.bossId;
        trackModal.hidden = true;
        if (trackResolve) trackResolve(bossId);
      });
    });
  }

  function openTrackModal(trackedIds) {
    trackSearch.value = "";
    renderTrackList(trackedIds || []);
    trackModal.hidden = false;
    trackSearch.focus();
    return new Promise(function (resolve) { trackResolve = resolve; });
  }

  trackSearch.addEventListener("input", function () {
    var existing = trackBossList.querySelectorAll(".track-boss-item.tracked");
    var trackedIds = [];
    existing.forEach(function (el) { trackedIds.push(el.dataset.bossId); });
    renderTrackList(trackedIds);
  });

  document.getElementById("trackModalClose").addEventListener("click", function () {
    trackModal.hidden = true;
    if (trackResolve) trackResolve(null);
  });

  trackModal.addEventListener("click", function (e) {
    if (e.target === trackModal) {
      trackModal.hidden = true;
      if (trackResolve) trackResolve(null);
    }
  });

  return {
    openSetModal: openSetModal,
    openSettingsModal: openSettingsModal,
    openTrackModal: openTrackModal
  };
})();
