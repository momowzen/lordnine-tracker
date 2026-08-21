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

  document.getElementById("setModalClose").addEventListener("click", function () {
    setModal.hidden = true;
    if (modalResolve) modalResolve(null);
  });

  setModal.addEventListener("click", function (e) {
    if (e.target === setModal) {
      setModal.hidden = true;
      if (modalResolve) modalResolve(null);
    }
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

  return {
    openSetModal: openSetModal,
    openSettingsModal: openSettingsModal
  };
})();
