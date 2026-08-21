const IANA_TIMEZONES = [
  "Pacific/Midway","Pacific/Pago_Pago","Pacific/Honolulu","America/Anchorage",
  "America/Los_Angeles","America/Denver","America/Chicago","America/New_York",
  "America/Caracas","America/Halifax","America/St_Johns","America/Sao_Paulo",
  "Atlantic/South_Georgia","Atlantic/Azores","Europe/London","Europe/Paris",
  "Europe/Berlin","Europe/Athens","Europe/Istanbul","Africa/Cairo",
  "Africa/Nairobi","Asia/Dubai","Asia/Karachi","Asia/Kolkata",
  "Asia/Dhaka","Asia/Bangkok","Asia/Shanghai","Asia/Tokyo",
  "Asia/Seoul","Australia/Sydney","Pacific/Auckland","Pacific/Fiji"
];

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

let modalResolve = null;

const setModal = document.getElementById("setModal");
const setModalTitle = document.getElementById("setModalTitle");
const setModalDatetime = document.getElementById("setModalDatetime");
const setModalSave = document.getElementById("setModalSave");
const setModalCancel = document.getElementById("setModalCancel");
const setModalDelete = document.getElementById("setModalDelete");

setModalSave.addEventListener("click", () => {
  const val = setModalDatetime.value;
  if (!val) return;
  const ms = new Date(val).getTime();
  if (isNaN(ms)) return;
  setModal.hidden = true;
  if (modalResolve) modalResolve({ action: "set", time: ms });
});

setModalCancel.addEventListener("click", () => {
  setModal.hidden = true;
  if (modalResolve) modalResolve(null);
});

setModalDelete.addEventListener("click", () => {
  setModal.hidden = true;
  if (modalResolve) modalResolve({ action: "delete" });
});

function openSetModal(bossName, tz, existingEndTime) {
  setModalTitle.textContent = `Set Kill Time - ${bossName}`;
  if (existingEndTime && existingEndTime > Date.now()) {
    const d = new Date(existingEndTime);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    setModalDatetime.value = local.toISOString().slice(0, 16);
  } else {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setModalDatetime.value = local.toISOString().slice(0, 16);
  }
  setModal.hidden = false;
  return new Promise(resolve => { modalResolve = resolve; });
}

const settingsModal = document.getElementById("settingsModal");
const settingsTimezone = document.getElementById("settingsTimezone");
const settingsWebhook = document.getElementById("settingsWebhook");
const settingsSave = document.getElementById("settingsSave");
const settingsCancel = document.getElementById("settingsCancel");
let settingsResolve = null;

populateTimezones(settingsTimezone, "Asia/Tokyo");

settingsSave.addEventListener("click", () => {
  const tz = settingsTimezone.value;
  const webhook = settingsWebhook.value.trim();
  settingsModal.hidden = true;
  if (settingsResolve) settingsResolve({ timezone: tz, webhookUrl: webhook });
});

settingsCancel.addEventListener("click", () => {
  settingsModal.hidden = true;
  if (settingsResolve) settingsResolve(null);
});

function openSettingsModal(currentTz, currentWebhook) {
  populateTimezones(settingsTimezone, currentTz || "Asia/Tokyo");
  settingsWebhook.value = currentWebhook || "";
  settingsModal.hidden = false;
  return new Promise(resolve => { settingsResolve = resolve; });
}

export { openSetModal, openSettingsModal, populateTimezones as populateSettingsTimezones };
