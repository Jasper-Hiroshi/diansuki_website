/**
 * diansss.com — 专栏页脚本
 * 功能：自定义日期选择器（左右各一）、左栏外链跳转、右栏全文 overlay
 */
(function () {
  "use strict";

  /* ---- 状态 ---- */
  var state = {
    left:  { keyword: "", date: "" },
    right: { keyword: "", date: "" }
  };

  /* 日期选择器独立状态 */
  var pickerState = {
    left:  { year: 0, month: 0 },
    right: { year: 0, month: 0 }
  };
  var WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  /* ---- HTML 转义 ---- */
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---- 获取过滤后的文章 ---- */
  function getFilteredArticles(side) {
    var articles = columnsData[side].articles.slice();
    var s = state[side];

    if (s.date) {
      articles = articles.filter(function (a) { return a.date === s.date; });
    }
    if (s.keyword.trim()) {
      var kw = s.keyword.trim().toLowerCase();
      articles = articles.filter(function (a) { return a.title.toLowerCase().indexOf(kw) !== -1; });
    }
    return articles;
  }

  /* ---- 获取有文章的日期集 ---- */
  function getActiveDateSet(side) {
    var articles = columnsData[side].articles;
    /* 应用关键词过滤但不应用日期过滤 */
    var filtered = articles;
    if (state[side].keyword.trim()) {
      var kw = state[side].keyword.trim().toLowerCase();
      filtered = articles.filter(function (a) { return a.title.toLowerCase().indexOf(kw) !== -1; });
    }
    var set = {};
    filtered.forEach(function (a) { set[a.date] = true; });
    return set;
  }

  /* ---- 渲染单栏文章列表 ---- */
  function renderColumn(side) {
    var listEl = document.getElementById("col-list-" + side);
    if (!listEl) return;

    var articles = getFilteredArticles(side);
    var html = "";

    if (articles.length === 0) {
      html = "<li class=\"col-articles__empty\">暂无匹配文章</li>";
    } else {
      articles.forEach(function (a) {
        if (side === "left") {
          /* 左栏：外链跳转 */
          html += "<li class=\"col-articles__item\">";
          html += "<a class=\"col-articles__link\" href=\"" + encodeURI(a.link || "") + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
          html += "<span class=\"col-articles__title\">" + escapeHTML(a.title) + "</span>";
          html += "<time class=\"col-articles__date\" datetime=\"" + a.date + "\">" + a.date + "</time>";
          html += "</a>";
          html += "</li>";
        } else {
          /* 右栏：点击展开全文 overlay */
          html += "<li class=\"col-articles__item\">";
          html += "<button class=\"col-articles__link col-articles__link--btn\" type=\"button\""
            + " data-title=\"" + escapeHTML(a.title) + "\""
            + " data-content=\"" + escapeHTML(a.content || "") + "\">";
          html += "<span class=\"col-articles__title\">" + escapeHTML(a.title) + "</span>";
          html += "<time class=\"col-articles__date\" datetime=\"" + a.date + "\">" + a.date + "</time>";
          html += "</button>";
          html += "</li>";
        }
      });
    }

    listEl.innerHTML = html;

    /* 绑定右栏点击事件 */
    if (side === "right") {
      var btns = listEl.querySelectorAll(".col-articles__link--btn");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          openArticleOverlay(btn.getAttribute("data-title"), btn.getAttribute("data-content"));
        });
      });
    }
  }

  function renderAll() {
    renderColumn("left");
    renderColumn("right");
  }

  /* ---- 文章 Overlay ---- */
  var overlay = document.getElementById("article-overlay");
  var overlayTitle = document.getElementById("article-overlay-title");
  var overlayBody = document.getElementById("article-overlay-body");
  var overlayClose = document.getElementById("article-overlay-close");

  function openArticleOverlay(title, content) {
    if (!overlay) return;
    overlayTitle.textContent = title;
    overlayBody.textContent = content;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeArticleOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  if (overlayClose) {
    overlayClose.addEventListener("click", closeArticleOverlay);
  }
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeArticleOverlay();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && !overlay.hidden) {
      closeArticleOverlay();
    }
  });

  /* ---- 日期选择器 ---- */
  function openDatePicker(side) {
    var drop = document.getElementById("date-picker-drop-" + side);
    var btn = document.getElementById("date-picker-btn-" + side);
    if (!drop) return;

    var articles = columnsData[side].articles;
    var allDates = articles.map(function (a) { return a.date; }).sort();
    var curDate = allDates.length > 0 ? allDates[allDates.length - 1] : "";
    if (state[side].date) curDate = state[side].date;

    if (curDate) {
      var parts = curDate.split("-");
      pickerState[side].year = parseInt(parts[0], 10);
      pickerState[side].month = parseInt(parts[1], 10) - 1;
    } else {
      var today = new Date();
      pickerState[side].year = today.getFullYear();
      pickerState[side].month = today.getMonth();
    }

    renderCalendar(side);
    drop.classList.add("dyn-date-picker__drop--open");
    btn.classList.add("dyn-date-picker__btn--open");
    setTimeout(function () {
      document.addEventListener("click", closeOnOutside, { once: true });
    }, 0);
  }

  function renderCalendar(side) {
    var drop = document.getElementById("date-picker-drop-" + side);
    if (!drop) return;

    var y = pickerState[side].year;
    var m = pickerState[side].month;
    var activeSet = getActiveDateSet(side);
    var curDate = state[side].date;

    var html = "";
    html += "<div class=\"dyn-cal-hdr\">";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"prev\">&lt;</button>";
    html += "<span class=\"dyn-cal-hdr__label\">" + y + "年" + (m + 1) + "月</span>";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"next\">&gt;</button>";
    html += "</div>";

    html += "<div class=\"dyn-cal-wdays\">";
    WEEKDAYS.forEach(function (w) { html += "<span>" + w + "</span>"; });
    html += "</div>";

    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);
    var totalDays = lastDay.getDate();
    var startDow = firstDay.getDay();

    html += "<div class=\"dyn-cal-grid\">";
    for (var i = 0; i < startDow; i++) {
      html += "<span class=\"dyn-cal-cell dyn-cal-cell--empty\"></span>";
    }
    for (var d = 1; d <= totalDays; d++) {
      var ds = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var isActive = !!activeSet[ds];
      var isCur = ds === curDate;
      var cls = "dyn-cal-cell";
      if (isActive) cls += " dyn-cal-cell--active";
      if (isCur) cls += " dyn-cal-cell--current";
      if (isActive) {
        html += "<button class=\"" + cls + "\" type=\"button\" data-date=\"" + ds + "\">" + d + "</button>";
      } else {
        html += "<span class=\"" + cls + "\">" + d + "</span>";
      }
    }
    html += "</div>";

    drop.innerHTML = html;

    /* nav buttons */
    drop.querySelectorAll("[data-nav]").forEach(function (navBtn) {
      navBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (navBtn.getAttribute("data-nav") === "prev") {
          pickerState[side].month--;
          if (pickerState[side].month < 0) { pickerState[side].month = 11; pickerState[side].year--; }
        } else {
          pickerState[side].month++;
          if (pickerState[side].month > 11) { pickerState[side].month = 0; pickerState[side].year++; }
        }
        renderCalendar(side);
        setTimeout(function () {
          document.addEventListener("click", closeOnOutside, { once: true });
        }, 0);
      });
    });

    /* date clicks */
    drop.querySelectorAll(".dyn-cal-cell--active").forEach(function (cell) {
      cell.addEventListener("click", function () {
        selectDate(side, cell.getAttribute("data-date"));
      });
    });
  }

  function selectDate(side, dateStr) {
    state[side].date = dateStr;
    var btn = document.getElementById("date-picker-btn-" + side);
    if (btn) btn.textContent = dateStr;
    var clearBtn = document.getElementById("date-picker-clear-" + side);
    if (clearBtn) clearBtn.hidden = false;
    closeDatePicker(side);
    renderColumn(side);
  }

  function closeDatePicker(side) {
    var drop = document.getElementById("date-picker-drop-" + side);
    var btn = document.getElementById("date-picker-btn-" + side);
    if (drop) drop.classList.remove("dyn-date-picker__drop--open");
    if (btn) btn.classList.remove("dyn-date-picker__btn--open");
    document.removeEventListener("click", closeOnOutside);
  }

  function closeOnOutside(e) {
    var pickers = document.querySelectorAll(".dyn-date-picker");
    var inside = false;
    pickers.forEach(function (p) { if (p.contains(e.target)) inside = true; });
    if (!inside) {
      closeDatePicker("left");
      closeDatePicker("right");
    } else {
      setTimeout(function () {
        document.addEventListener("click", closeOnOutside, { once: true });
      }, 0);
    }
  }

  /* ---- 绑定事件 ---- */
  function bindSide(side) {
    var pickerBtn = document.getElementById("date-picker-btn-" + side);
    var keywordEl = document.getElementById("filter-keyword-" + side);

    if (pickerBtn) {
      pickerBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var drop = document.getElementById("date-picker-drop-" + side);
        if (drop && drop.classList.contains("dyn-date-picker__drop--open")) {
          closeDatePicker(side);
        } else {
          /* 关闭另一个 */
          var other = side === "left" ? "right" : "left";
          closeDatePicker(other);
          openDatePicker(side);
        }
      });
    }

    if (keywordEl) {
      keywordEl.addEventListener("input", function () {
        state[side].keyword = keywordEl.value;
        renderColumn(side);
      });
    }

    /* 清除日期按钮 */
    var clearBtn = document.getElementById("date-picker-clear-" + side);
    if (clearBtn) {
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        state[side].date = "";
        pickerBtn.textContent = "按日期检索";
        clearBtn.hidden = true;
        renderColumn(side);
      });
    }
  }

  bindSide("left");
  bindSide("right");

  /* ---- 初始化 ---- */
  renderAll();
})();
