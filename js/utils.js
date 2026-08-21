var AppUtils = (function () {
  var IANA_TIMEZONES = [
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
      var now = new Date();
      var str = now.toLocaleString("en-US", { timeZone: tz, hour12: false });
      var local = new Date(str);
      var utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC", hour12: false }));
      return local.getTime() - utc.getTime();
    } catch (e) {
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
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    function p2(n) { return String(n).padStart(2, "0"); }
    return d ? d + "d " + p2(h) + "h" : h ? h + "h " + p2(m) + "m" : m + "m " + p2(sec) + "s";
  }

  function fmtShort(ms) {
    if (ms <= 0) return "NOW";
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    return d ? d + "d" : h ? h + "h" : m + "m";
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

  function populateTimezones(selectEl, current) {
    selectEl.innerHTML = "";
    for (var i = 0; i < IANA_TIMEZONES.length; i++) {
      var opt = document.createElement("option");
      opt.value = IANA_TIMEZONES[i];
      var offsetMs = getTzOffsetMs(IANA_TIMEZONES[i]);
      var absOff = Math.abs(offsetMs);
      var h = Math.floor(absOff / 3600000);
      var m = Math.floor((absOff % 3600000) / 60000);
      var sign = offsetMs >= 0 ? "+" : "-";
      var utcLabel = m > 0 ? sign + h + ":" + String(m).padStart(2, "0") : sign + h;
      opt.textContent = IANA_TIMEZONES[i].replace(/_/g, " ") + " (UTC" + utcLabel + ")";
      if (IANA_TIMEZONES[i] === current) opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  return {
    IANA_TIMEZONES: IANA_TIMEZONES,
    getTzOffsetMs: getTzOffsetMs,
    fmtTz: fmtTz,
    fmtTime: fmtTime,
    fmtDur: fmtDur,
    fmtShort: fmtShort,
    urgencyClass: urgencyClass,
    statusClassFor: statusClassFor,
    populateTimezones: populateTimezones
  };
})();
