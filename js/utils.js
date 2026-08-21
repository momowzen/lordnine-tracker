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

function getTzOffsetMs(tz) {
  try {
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: tz, hour12: false });
    const local = new Date(str);
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC", hour12: false }));
    return local.getTime() - utc.getTime();
  } catch {
    return 9 * 3600000;
  }
}

function fmtTz(ms, tz) {
  return new Date(ms).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz
  });
}

function fmtTime(ms, tz) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz
  });
}

function fmtDur(ms) {
  if (ms <= 0) return "SPAWNED";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = n => String(n).padStart(2, "0");
  return d ? `${d}d ${p(h)}h` : h ? `${h}h ${p(m)}m` : `${m}m ${p(sec)}s`;
}

function fmtShort(ms) {
  if (ms <= 0) return "NOW";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d` : h ? `${h}h` : `${m}m`;
}

function urgencyClass(ms) {
  if (ms <= 0) return "alive";
  if (ms <= 5 * 60000) return "urgent";
  if (ms <= 30 * 60000) return "soon";
  return "";
}

function statusClassFor(ms) {
  if (ms <= 0) return "status-alive";
  if (ms <= 5 * 60000) return "status-danger";
  if (ms <= 30 * 60000) return "status-soon";
  return "";
}

export {
  IANA_TIMEZONES, getTzOffsetMs, fmtTz, fmtTime, fmtDur, fmtShort,
  urgencyClass, statusClassFor
};
