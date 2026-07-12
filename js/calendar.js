/**
 * diansss.com — 直播日历脚本
 */
(function () {
  "use strict";

  var calGrid = document.getElementById("cal-grid");
  var filterTitle = document.getElementById("filter-title");
  var datePickerBtn = document.getElementById("date-picker-btn");
  var datePickerDrop = document.getElementById("date-picker-drop");

  var WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
  var cellStreamIdx = {};

  function buildStreamMap() {
    var map = {};
    calendarData.streams.forEach(function (entry) {
      map[entry.date] = entry.streams;
    });
    return map;
  }

  function fmtDate(y, m, d) {
    return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }

  function getMonthWeeks(year, month) {
    var weeks = [];
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var totalDays = lastDay.getDate();
    var startDow = firstDay.getDay(); // 0=日 1=一 ...

    var currentWeek = [];
    for (var i = 0; i < startDow; i++) currentWeek.push(null);
    for (var d = 1; d <= totalDays; d++) {
      currentWeek.push(fmtDate(year, month, d));
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  }

  function generateMonths() {
    var today = new Date();
    var endYear = today.getFullYear(), endMonth = today.getMonth();
    var months = [];
    var y = endYear, m = endMonth;
    while (y > 2024 || (y === 2024 && m >= 5)) {
      months.push({ year: y, month: m, label: y + "年" + (m + 1) + "月", weeks: getMonthWeeks(y, m) });
      m--;
      if (m < 0) { m = 11; y--; }
    }
    return months;
  }

  function monthHasMatch(month, streamMap, keyword) {
    for (var w = 0; w < month.weeks.length; w++) {
      var week = month.weeks[w];
      for (var d = 0; d < week.length; d++) {
        var ds = week[d];
        if (!ds) continue;
        var streams = streamMap[ds];
        if (!streams) continue;
        if (!keyword) return true;
        for (var s = 0; s < streams.length; s++) {
          if (streams[s].title.toLowerCase().indexOf(keyword) !== -1) return true;
        }
      }
    }
    return false;
  }

  function getFilteredMonths(streamMap, keyword) {
    var months = generateMonths();
    if (!keyword) return months;
    return months.filter(function (m) { return monthHasMatch(m, streamMap, keyword); });
  }

  /* ---- 渲染 ---- */
  function render() {
    if (!calGrid) return;

    var streamMap = buildStreamMap();
    var keyword = filterTitle ? filterTitle.value.trim().toLowerCase() : "";
    var months = getFilteredMonths(streamMap, keyword);

    var html = "";
    html += "<div class=\"cal-weekdays\">";
    WEEKDAYS.forEach(function (wd) { html += "<span class=\"cal-weekdays__item\">" + wd + "</span>"; });
    html += "</div>";

    months.forEach(function (month) {
      html += "<div class=\"cal-month\" data-month=\"" + month.year + "-" + String(month.month + 1).padStart(2, "0") + "\">";
      html += "<h2 class=\"cal-month__label\">" + month.label + "</h2>";
      html += "<div class=\"cal-month__grid\">";

      month.weeks.forEach(function (week) {
        week.forEach(function (dateStr) {
          if (!dateStr) {
            html += "<div class=\"cal-day cal-day--empty\"></div>";
            return;
          }

          var parts = dateStr.split("-");
          var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);

          var streams = streamMap[dateStr];
          var filteredStreams = streams;
          if (keyword && streams) {
            filteredStreams = streams.filter(function (s) { return s.title.toLowerCase().indexOf(keyword) !== -1; });
          }

          if (filteredStreams && filteredStreams.length > 0) {
            /* 按时间排序 */
            var sorted = filteredStreams.slice().sort(function (a, b) { return a.time.localeCompare(b.time); });
            var key = dateStr;
            if (!(key in cellStreamIdx)) cellStreamIdx[key] = 0;
            if (cellStreamIdx[key] >= sorted.length) cellStreamIdx[key] = 0;
            var cur = sorted[cellStreamIdx[key]];
            var hasMulti = sorted.length > 1;
            var coverStyle = cur.cover ? "background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url(" + cur.cover + ");background-size:cover;background-position:center;" : "";

            html += "<div class=\"cal-day cal-day--stream\" style=\"" + coverStyle + "\" data-date=\"" + dateStr + "\">";
            html += "<span class=\"cal-day__date\">" + dateStr + "</span>";
            html += "<span class=\"cal-day__time\">" + escapeHTML(cur.time) + "</span>";
            html += "<span class=\"cal-day__title\">" + escapeHTML(cur.title) + "</span>";
            var hasPrev = cellStreamIdx[key] > 0;
            var hasNext = cellStreamIdx[key] < sorted.length - 1;
            if (hasPrev || hasNext) {
              html += "<span class=\"cal-day__actions\">";
              if (hasPrev) {
                html += "<button class=\"cal-day__switch cal-day__switch--up\" type=\"button\" data-dir=\"up\" data-date=\"" + dateStr + "\">▲</button>";
              }
              html += "<a class=\"cal-day__play\" href=\"" + encodeURI(cur.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"观看回放\">▶</a>";
              if (hasNext) {
                html += "<button class=\"cal-day__switch cal-day__switch--dn\" type=\"button\" data-dir=\"dn\" data-date=\"" + dateStr + "\">▼</button>";
              }
              html += "</span>";
            } else {
              html += "<a class=\"cal-day__play\" href=\"" + encodeURI(cur.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"观看回放\">▶</a>";
            }
            html += "</div>";
          } else {
            html += "<div class=\"cal-day\">";
            html += "<span class=\"cal-day__date\">" + dateStr + "</span>";
            html += "</div>";
          }
        });
      });

      html += "</div></div>";
    });

    calGrid.innerHTML = html;

    /* 切换直播 */
    calGrid.querySelectorAll(".cal-day__switch").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var ds = btn.getAttribute("data-date");
        var dir = btn.getAttribute("data-dir");
        var streams = streamMap[ds];
        if (!streams) return;
        if (keyword) {
          streams = streams.filter(function (s) { return s.title.toLowerCase().indexOf(keyword) !== -1; });
        }
        streams.sort(function (a, b) { return a.time.localeCompare(b.time); });
        if (dir === "up") cellStreamIdx[ds] = (cellStreamIdx[ds] - 1 + streams.length) % streams.length;
        else cellStreamIdx[ds] = (cellStreamIdx[ds] + 1) % streams.length;
        render();
      });
    });
  }

  /* ---- 自定义日历检索 ---- */
  var pickerYear, pickerMonth;

  function getActiveDateSet() {
    var map = buildStreamMap();
    var set = {};
    Object.keys(map).forEach(function (d) { set[d] = true; });
    return set;
  }

  function openDatePicker() {
    if (!datePickerDrop) return;
    var activeSet = getActiveDateSet();

    // 默认打开当前视图中第一个月份
    var firstMonth = calGrid.querySelector(".cal-month");
    if (firstMonth) {
      var dm = firstMonth.getAttribute("data-month").split("-");
      pickerYear = parseInt(dm[0], 10);
      pickerMonth = parseInt(dm[1], 10) - 1;
    } else {
      var today = new Date();
      pickerYear = today.getFullYear();
      pickerMonth = today.getMonth();
    }
    renderDatePicker(activeSet);
    datePickerDrop.classList.add("dyn-date-picker__drop--open");
    datePickerBtn.classList.add("dyn-date-picker__btn--open");
    setTimeout(function () { document.addEventListener("click", closeOnOutside, { once: true }); }, 0);
  }

  function renderDatePicker(activeSet) {
    var html = "";
    html += "<div class=\"dyn-cal-hdr\">";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"prev\">&lt;</button>";
    html += "<span class=\"dyn-cal-hdr__label\">" + pickerYear + "年" + (pickerMonth + 1) + "月</span>";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"next\">&gt;</button>";
    html += "</div>";
    html += "<div class=\"dyn-cal-wdays\">";
    WEEKDAYS.forEach(function (w) { html += "<span>" + w + "</span>"; });
    html += "</div>";

    var firstDay = new Date(pickerYear, pickerMonth, 1);
    var lastDay = new Date(pickerYear, pickerMonth + 1, 0);
    var totalDays = lastDay.getDate();
    var startDow = firstDay.getDay(); // 0=日

    html += "<div class=\"dyn-cal-grid\">";
    for (var i = 0; i < startDow; i++) html += "<span class=\"dyn-cal-cell dyn-cal-cell--empty\"></span>";
    for (var d = 1; d <= totalDays; d++) {
      var ds = pickerYear + "-" + String(pickerMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var isActive = !!activeSet[ds];
      var cls = "dyn-cal-cell";
      if (isActive) cls += " dyn-cal-cell--active";
      if (isActive) {
        html += "<button class=\"" + cls + "\" type=\"button\" data-date=\"" + ds + "\">" + d + "</button>";
      } else {
        html += "<span class=\"" + cls + "\">" + d + "</span>";
      }
    }
    html += "</div>";
    datePickerDrop.innerHTML = html;

    datePickerDrop.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (btn.getAttribute("data-nav") === "prev") { pickerMonth--; if (pickerMonth < 0) { pickerMonth = 11; pickerYear--; } }
        else { pickerMonth++; if (pickerMonth > 11) { pickerMonth = 0; pickerYear++; } }
        renderDatePicker(activeSet);
        setTimeout(function () { document.addEventListener("click", closeOnOutside, { once: true }); }, 0);
      });
    });

    datePickerDrop.querySelectorAll(".dyn-cal-cell--active").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ds = btn.getAttribute("data-date");
        closeDatePicker();
        setTimeout(function () {
          var el = calGrid.querySelector("[data-month=\"" + ds.slice(0, 7) + "\"]");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      });
    });
  }

  function closeDatePicker() {
    if (!datePickerDrop) return;
    datePickerDrop.classList.remove("dyn-date-picker__drop--open");
    datePickerBtn.classList.remove("dyn-date-picker__btn--open");
    document.removeEventListener("click", closeOnOutside);
  }

  function closeOnOutside(e) {
    var picker = document.getElementById("date-picker");
    if (picker && !picker.contains(e.target)) closeDatePicker();
    else setTimeout(function () { document.addEventListener("click", closeOnOutside, { once: true }); }, 0);
  }

  if (datePickerBtn) {
    datePickerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (datePickerDrop.classList.contains("dyn-date-picker__drop--open")) closeDatePicker();
      else openDatePicker();
    });
  }

  /* ---- 关键词搜索 ---- */
  if (filterTitle) {
    filterTitle.addEventListener("input", function () { cellStreamIdx = {}; render(); });
  }

  /* ---- HTML 转义 ---- */
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---- 初始化 ---- */
  render();
})();
