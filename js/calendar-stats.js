/**
 * diansss.com — 直播数据统计脚本
 * 依赖全局 calendarData（由 js/calendar-data.js 提供）
 * 使用原生 HTML/CSS Grid 与 SVG 实现，不依赖任何图表库。
 */
(function () {
  "use strict";

  if (typeof calendarData === "undefined") return;

  var startInput = document.getElementById("stats-start");
  var endInput = document.getElementById("stats-end");
  var emptyEl = document.getElementById("stats-empty");
  var heatmapEl = document.getElementById("stats-heatmap");
  var hourBarEl = document.getElementById("stats-hour-bar");
  var timeLineEl = document.getElementById("stats-time-line");
  var weekdayPieEl = document.getElementById("stats-weekday-pie");
  var topicPieEl = document.getElementById("stats-topic-pie");
  var categoryBarEl = document.getElementById("stats-category-bar");
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll(".stats-range__btn"));

  if (!startInput || !heatmapEl) return;

  var WEEKDAY_NAMES = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
  var WEEKDAY_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#00acc1", "#1e88e5", "#8e24aa"];
  var TOPIC_COLORS = { "杂谈": "#e6b800", "游戏": "#2b7bd6", "音声": "#4caf50", "联动": "#ff6600" };
  var FALLBACK_COLOR = "#9e9e9e";
  var BAR_COLOR = "#2b7bd6";

  /* ---- 工具 ---- */
  function parseDate(str) {
    var p = str.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function fmtDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function addDays(d, n) {
    var r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    r.setDate(r.getDate() + n);
    return r;
  }

  function timeToHours(t) {
    var p = String(t || "0:00").split(":");
    var h = parseInt(p[0], 10) || 0;
    var m = parseInt(p[1], 10) || 0;
    return h + m / 60;
  }

  function escapeHTML(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 所有直播条目，按日期升序 */
  var allEntries = calendarData.streams.slice().sort(function (a, b) {
    return a.date < b.date ? -1 : 1;
  });
  var minDate = allEntries.length ? allEntries[0].date : null;

  var rangeStart = null;
  var rangeEnd = null;

  /* 统计指定日期范围内的直播（扁平化，附日期） */
  function getStreamsInRange() {
    var s = fmtDate(rangeStart);
    var e = fmtDate(rangeEnd);
    var result = [];
    allEntries.forEach(function (entry) {
      if (entry.date >= s && entry.date <= e) {
        entry.streams.forEach(function (st) {
          result.push({ date: entry.date, stream: st });
        });
      }
    });
    return result;
  }

  function getStreamCountMap() {
    var map = {};
    allEntries.forEach(function (entry) {
      map[entry.date] = (entry.streams ? entry.streams.length : 0);
    });
    return map;
  }

  /* ---- 范围设置 ---- */
  function setRange(start, end) {
    rangeStart = start;
    rangeEnd = end;
    startInput.value = fmtDate(start);
    endInput.value = fmtDate(end);
    renderAll();
  }

  function applyPreset(days) {
    /* 结束日期以「今天」为锚点，而非最后一次直播日期 */
    var now = new Date();
    var anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setRange(addDays(anchor, -(days - 1)), anchor);
  }

  /* ---- 渲染总控 ---- */
  function renderAll() {
    var streams = getStreamsInRange();
    emptyEl.hidden = streams.length > 0;

    renderHeatmap();
    renderHourBar(streams);
    renderTimeLine(streams);
    renderWeekdayPie(streams);
    renderTopicPie(streams);
    renderCategoryBar(streams);
  }

  /* ---- 直播频率热力图 ---- */
  var HEAT_ASPECT = 3; // 目标宽高比：列数约为行数 × 3，任何范围都「列多行少」

  function renderHeatmap() {
    var countMap = getStreamCountMap();
    var s = fmtDate(rangeStart);
    var e = fmtDate(rangeEnd);

    /* 行主序：从左到右、从上到下；左上最早（起始日期）、右下最晚（结束日期） */
    var totalDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;
    if (totalDays < 1) totalDays = 1;

    /* 列数 ≈ √(天数 × 宽高比)，行数 = ⌈天数 / 列数⌉：不固定行数，始终横向多、竖向少 */
    var cols = Math.ceil(Math.sqrt(totalDays * HEAT_ASPECT));
    if (cols > totalDays) cols = totalDays;
    var rows = Math.ceil(totalDays / cols);

    /* 只渲染到结束日期为止，不补空白格子凑矩形，最后一行允许不完整 */
    var html = "";
    for (var idx = 0; idx < totalDays; idx++) {
      var d = addDays(rangeStart, idx);
      var ds = fmtDate(d);
      var count = countMap[ds] || 0;
      var level = count > 0 ? Math.min(count, 4) : 0;
      var cls = "stats-heatmap__cell";
      if (level > 0) cls += " stats-heatmap__cell--" + level;
      html += "<span class=\"" + cls + "\" aria-hidden=\"true\" data-tip=\"" + escapeHTML(ds + " · " + count + " 场直播") + "\"></span>";
    }

    heatmapEl.style.gridTemplateRows = "repeat(" + rows + ", 12px)";
    heatmapEl.style.gridTemplateColumns = "repeat(" + cols + ", 12px)";
    heatmapEl.innerHTML = html;
    heatmapEl.setAttribute("aria-label", "直播频率热力图：" + s + " 至 " + e);
  }

  /* ---- 热力图 tooltip ---- */
  var tipEl = document.createElement("div");
  tipEl.className = "stats-tip";
  tipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(tipEl);

  function showTip(text) {
    tipEl.textContent = text;
    tipEl.classList.add("stats-tip--show");
  }

  function hideTip() {
    tipEl.classList.remove("stats-tip--show");
  }

  function moveTip(e) {
    var x = e.clientX + 14;
    var y = e.clientY + 14;
    tipEl.style.left = "0px";
    tipEl.style.top = "0px";
    var tw = tipEl.offsetWidth;
    var th = tipEl.offsetHeight;
    if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 10;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - 10;
    tipEl.style.left = x + "px";
    tipEl.style.top = y + "px";
  }

  heatmapEl.addEventListener("mouseover", function (e) {
    var cell = e.target.closest ? e.target.closest(".stats-heatmap__cell") : null;
    if (!cell) return;
    var t = cell.getAttribute("data-tip");
    if (t) { showTip(t); moveTip(e); }
    else hideTip();
  });

  heatmapEl.addEventListener("mousemove", function (e) {
    if (tipEl.classList.contains("stats-tip--show")) moveTip(e);
  });

  heatmapEl.addEventListener("mouseleave", function () { hideTip(); });

  /* ---- 直播时间柱状图（0~23 点） ---- */
  function renderHourBar(streams) {
    var counts = new Array(24).fill(0);
    streams.forEach(function (s) {
      var h = parseInt(String(s.stream.time || "0:00").split(":")[0], 10);
      if (!isNaN(h) && h >= 0 && h < 24) counts[h]++;
    });
    var max = Math.max.apply(null, counts);
    if (max <= 0) max = 1;

    var W = 720, H = 260;
    var padL = 36, padR = 12, padT = 16, padB = 34;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;
    var slot = chartW / counts.length;
    var barW = slot * 0.6;
    var baseline = padT + chartH;

    var svg = "<svg viewBox=\"0 0 " + W + " " + H + "\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"开播时间分布柱状图\">";

    [0, 0.5, 1].forEach(function (f, idx) {
      var y = padT + chartH * (1 - f);
      var val = Math.round(max * f);
      svg += "<line x1=\"" + padL + "\" y1=\"" + y + "\" x2=\"" + (W - padR) + "\" y2=\"" + y + "\" stroke=\"#e1e4e8\" stroke-width=\"1\"/>";
      if (idx !== 1) svg += "<text x=\"" + (padL - 6) + "\" y=\"" + (y + 4) + "\" text-anchor=\"end\" font-size=\"10\" fill=\"#555\">" + val + "</text>";
    });

    svg += "<line x1=\"" + padL + "\" y1=\"" + baseline + "\" x2=\"" + (W - padR) + "\" y2=\"" + baseline + "\" stroke=\"#d0d7de\" stroke-width=\"1\"/>";

    counts.forEach(function (c, i) {
      var x = padL + slot * i + (slot - barW) / 2;
      svg += "<text x=\"" + (padL + slot * i + slot / 2) + "\" y=\"" + (H - padB + 16) + "\" text-anchor=\"middle\" font-size=\"9\" fill=\"#555\">" + i + "</text>";
      if (c <= 0) return;
      var h = c / max * chartH;
      var y = baseline - h;
      svg += "<rect x=\"" + x.toFixed(2) + "\" y=\"" + y.toFixed(2) + "\" width=\"" + barW.toFixed(2) + "\" height=\"" + h.toFixed(2) + "\" rx=\"3\" fill=\"" + BAR_COLOR + "\"><title>" + i + " 点：" + c + " 场直播</title></rect>";
    });

    svg += "</svg>";
    hourBarEl.innerHTML = svg;
  }

  /* ---- 开播时间折线图 ---- */
  function renderTimeLine(streams) {
    var pts = streams.slice().sort(function (a, b) {
      var ka = a.date + " " + (a.stream.time || "00:00");
      var kb = b.date + " " + (b.stream.time || "00:00");
      return ka < kb ? -1 : 1;
    });

    var W = 720, H = 260;
    var padL = 44, padR = 16, padT = 16, padB = 34;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;
    var baseline = padT + chartH;

    var svg = "<svg viewBox=\"0 0 " + W + " " + H + "\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"开播时间变化折线图\">";

    [0, 6, 12, 18, 24].forEach(function (hour) {
      var y = padT + chartH * (1 - hour / 24);
      svg += "<line x1=\"" + padL + "\" y1=\"" + y + "\" x2=\"" + (W - padR) + "\" y2=\"" + y + "\" stroke=\"#e1e4e8\" stroke-width=\"1\"/>";
      svg += "<text x=\"" + (padL - 6) + "\" y=\"" + (y + 4) + "\" text-anchor=\"end\" font-size=\"10\" fill=\"#555\">" + hour + "</text>";
    });
    svg += "<line x1=\"" + padL + "\" y1=\"" + baseline + "\" x2=\"" + (W - padR) + "\" y2=\"" + baseline + "\" stroke=\"#d0d7de\" stroke-width=\"1\"/>";

    if (pts.length === 0) {
      svg += "</svg>";
      timeLineEl.innerHTML = svg;
      return;
    }

    var coords = pts.map(function (p, i) {
      var x = padL + (pts.length === 1 ? chartW / 2 : chartW * i / (pts.length - 1));
      var h = timeToHours(p.stream.time);
      var y = baseline - chartH * (h / 24);
      return { x: x, y: y, p: p };
    });

    var d = coords.map(function (c, i) {
      return (i === 0 ? "M" : "L") + c.x.toFixed(2) + " " + c.y.toFixed(2);
    }).join(" ");
    svg += "<path d=\"" + d + "\" fill=\"none\" stroke=\"" + BAR_COLOR + "\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>";

    coords.forEach(function (c) {
      svg += "<circle cx=\"" + c.x.toFixed(2) + "\" cy=\"" + c.y.toFixed(2) + "\" r=\"3\" fill=\"" + BAR_COLOR + "\"><title>" + escapeHTML(c.p.date + " " + (c.p.stream.time || "") + " · " + c.p.stream.title) + "</title></circle>";
    });

    function addDateLabel(idx) {
      var c = coords[idx];
      svg += "<text x=\"" + c.x.toFixed(2) + "\" y=\"" + (H - padB + 16) + "\" text-anchor=\"middle\" font-size=\"9\" fill=\"#555\">" + c.p.date.slice(5) + "</text>";
    }
    addDateLabel(0);
    if (coords.length > 1) addDateLabel(coords.length - 1);
    if (coords.length > 2) addDateLabel(Math.floor((coords.length - 1) / 2));

    svg += "</svg>";
    timeLineEl.innerHTML = svg;
  }

  /* ---- 直播日期饼图（7 天 7 色） ---- */
  function renderWeekdayPie(streams) {
    var counts = [0, 0, 0, 0, 0, 0, 0];
    streams.forEach(function (s) {
      var dow = parseDate(s.date).getDay();
      counts[(dow + 6) % 7]++;
    });
    var total = streams.length;
    var data = WEEKDAY_NAMES.map(function (name, i) {
      return { label: name, value: counts[i], color: WEEKDAY_COLORS[i] };
    });
    weekdayPieEl.innerHTML = buildPie(data, total) + buildLegend(data);
  }

  /* ---- 直播类型（topic 饼图） ---- */
  function renderTopicPie(streams) {
    var counts = {};
    streams.forEach(function (s) {
      var t = s.stream.topic || "未分类";
      counts[t] = (counts[t] || 0) + 1;
    });
    var order = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var total = streams.length;
    var data = order.map(function (t) {
      return { label: t, value: counts[t], color: TOPIC_COLORS[t] || FALLBACK_COLOR };
    });
    topicPieEl.innerHTML = buildPie(data, total) + buildLegend(data);
  }

  function pointOn(cx, cy, r, angleDeg) {
    var rad = angleDeg * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function slicePath(cx, cy, r, a0, a1) {
    var p0 = pointOn(cx, cy, r, a0);
    var p1 = pointOn(cx, cy, r, a1);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return "M" + cx.toFixed(2) + "," + cy.toFixed(2) +
      " L" + p0[0].toFixed(2) + "," + p0[1].toFixed(2) +
      " A" + r + "," + r + " 0 " + large + " 1 " +
      p1[0].toFixed(2) + "," + p1[1].toFixed(2) + " Z";
  }

  function buildPie(data, total) {
    var size = 220, cx = 110, cy = 110, r = 92;
    var svg = "<svg viewBox=\"0 0 " + size + " " + size + "\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\">";
    if (total <= 0) {
      svg += "<circle cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + r + "\" fill=\"#ebedf0\"/>";
      svg += "</svg>";
      return svg;
    }
    var angle = -90;
    data.forEach(function (slice) {
      if (slice.value <= 0) return;
      var sweep = slice.value / total * 360;
      var title = "<title>" + escapeHTML(slice.label + "：" + slice.value + " 场") + "</title>";
      if (sweep >= 359.99) {
        svg += "<circle cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + r + "\" fill=\"" + slice.color + "\">" + title + "</circle>";
      } else {
        svg += "<path d=\"" + slicePath(cx, cy, r, angle, angle + sweep) + "\" fill=\"" + slice.color + "\" stroke=\"#fff\" stroke-width=\"2\">" + title + "</path>";
      }
      angle += sweep;
    });
    svg += "</svg>";
    return svg;
  }

  function buildLegend(data) {
    var html = "<div class=\"stats-legend\">";
    data.forEach(function (item) {
      html += "<span class=\"stats-legend__item\"><span class=\"stats-legend__swatch\" style=\"background:" + item.color + "\"></span>" + escapeHTML(item.label) + "<span class=\"stats-legend__count\">" + item.value + " 场</span></span>";
    });
    html += "</div>";
    return html;
  }

  /* ---- 直播类型（category 柱状图） ---- */
  function renderCategoryBar(streams) {
    var topics = {};
    streams.forEach(function (s) {
      var t = s.stream.topic || "未分类";
      var c = s.stream.category || "未分类";
      if (!topics[t]) topics[t] = {};
      topics[t][c] = (topics[t][c] || 0) + 1;
    });

    function topicSum(o) {
      return Object.keys(o).reduce(function (acc, k) { return acc + o[k]; }, 0);
    }

    var topicOrder = Object.keys(topics).sort(function (a, b) {
      return topicSum(topics[b]) - topicSum(topics[a]);
    });

    var html = "";
    topicOrder.forEach(function (t) {
      var catMap = topics[t];
      var catOrder = Object.keys(catMap).sort(function (a, b) { return catMap[b] - catMap[a]; });
      var items = catOrder.map(function (c) { return { label: c, value: catMap[c] }; });
      html += "<div class=\"stats-subchart\"><h3 class=\"stats-subchart__title\">" + escapeHTML(t) + "</h3>";
      html += buildHBar(items, TOPIC_COLORS[t] || FALLBACK_COLOR);
      html += "</div>";
    });
    categoryBarEl.innerHTML = html;
  }

  function buildHBar(items, color) {
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }));
    if (max <= 0) max = 1;
    var labelW = 175, barAreaW = 360, valueW = 60, rowH = 42, barH = 22;
    var W = labelW + barAreaW + valueW;
    var H = items.length * rowH + 6;
    var svg = "<svg viewBox=\"0 0 " + W + " " + H + "\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\">";
    items.forEach(function (item, i) {
      var y = i * rowH;
      var bw = item.value / max * barAreaW;
      svg += "<text class=\"stats-bar__label\" x=\"" + (labelW - 14) + "\" y=\"" + (y + barH - 1) + "\" text-anchor=\"end\" font-weight=\"800\" font-size=\"18\" fill=\"#151515\">" + escapeHTML(item.label) + "</text>";
      svg += "<rect class=\"stats-bar__track\" x=\"" + labelW + "\" y=\"" + y + "\" width=\"" + barAreaW + "\" height=\"" + barH + "\" rx=\"6\" fill=\"rgba(21,21,21,0.08)\"/>";
      svg += "<rect class=\"stats-bar__fill\" x=\"" + labelW + "\" y=\"" + y + "\" width=\"" + bw.toFixed(2) + "\" height=\"" + barH + "\" rx=\"6\" fill=\"" + color + "\"><title>" + escapeHTML(item.label + "：" + item.value + " 场") + "</title></rect>";
      svg += "<text class=\"stats-bar__value\" x=\"" + (labelW + barAreaW + 14) + "\" y=\"" + (y + barH - 1) + "\" font-weight=\"900\" font-size=\"17\" fill=\"#151515\">" + item.value + "</text>";
    });
    svg += "</svg>";
    return svg;
  }

  /* ---- 事件 ---- */
  presetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      presetBtns.forEach(function (b) { b.classList.remove("stats-range__btn--active"); });
      btn.classList.add("stats-range__btn--active");
      applyPreset(parseInt(btn.getAttribute("data-days"), 10));
    });
  });

  function onDateChange() {
    var s = startInput.value;
    var e = endInput.value;
    if (!s || !e) return;
    var sd = parseDate(s);
    var ed = parseDate(e);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return;
    if (sd > ed) { var t = sd; sd = ed; ed = t; }
    presetBtns.forEach(function (b) { b.classList.remove("stats-range__btn--active"); });
    setRange(sd, ed);
  }

  startInput.addEventListener("change", onDateChange);
  endInput.addEventListener("change", onDateChange);

  if (minDate) { startInput.min = minDate; endInput.min = minDate; }
  var todayStr = fmtDate(new Date());
  startInput.max = todayStr;
  endInput.max = todayStr;

  /* ---- 初始化：默认最近 7 日（以今天为结束日期） ---- */
  applyPreset(7);
})();
