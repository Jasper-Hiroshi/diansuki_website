/**
 * diansss.com — 动态页脚本
 */
(function () {
  "use strict";

  /* ---- 元素引用 ---- */
  var dynList = document.getElementById("dyn-list");
  var dateDisplay = document.getElementById("dyn-date");
  var prevBtn = document.getElementById("dyn-prev");
  var nextBtn = document.getElementById("dyn-next");
  var datePickerBtn = document.getElementById("date-picker-btn");
  var datePickerDrop = document.getElementById("date-picker-drop");
  var datePickerClear = document.getElementById("date-picker-clear");
  var filterKeyword = document.getElementById("filter-keyword");
  var scrollBtn = document.getElementById("scroll-more");

  /* ---- 状态 ---- */
  var currentIndex = 0;
  var keyword = "";

  /* ---- 获取含匹配动态的日期列表（受关键词影响） ---- */
  function getFilteredEntries() {
    if (!keyword.trim()) return dynamicsData;

    var kw = keyword.trim().toLowerCase();
    return dynamicsData.reduce(function (result, entry) {
      var filtered = entry.dynamics.filter(function (d) {
        if (d.content.toLowerCase().indexOf(kw) !== -1) return true;
        var r = d.repost;
        if (r) {
          if (r.id && r.id.toLowerCase().indexOf(kw) !== -1) return true;
          if (r.content && r.content.toLowerCase().indexOf(kw) !== -1) return true;
          if (r.title && r.title.toLowerCase().indexOf(kw) !== -1) return true;
        }
        return false;
      });
      if (filtered.length > 0) {
        result.push({ date: entry.date, dynamics: filtered });
      }
      return result;
    }, []);
  }

  /* ---- 格式化日期显示：2026.05.20 ---- */
  function formatDisplayDate(dateStr) {
    var parts = dateStr.split("-");
    return parts[0] + "." + parts[1] + "." + parts[2];
  }

  /* ---- 构建单张动态卡片 HTML ---- */
  function buildCard(dateStr, d) {
    var html = "";
    html += "<article class=\"dyn-card\">";
    html += "<div class=\"dyn-card__header\">";
    html += "<img class=\"dyn-card__avatar\" src=\"assets/images/avatar.png\" alt=\"点酥Susu 头像\" width=\"80\" height=\"80\">";
    html += "<div class=\"dyn-card__meta\">";
    html += "<span class=\"dyn-card__name\">点酥Susu</span>";
    html += "<time class=\"dyn-card__time\" datetime=\"" + dateStr + "T" + d.time + ":00\">" + dateStr + " " + d.time + "</time>";
    html += "</div>";
    html += "</div>";
    html += "<div class=\"dyn-card__body\">";
    html += "<p class=\"dyn-card__text\">" + highlightMention(d.content) + "</p>";
    /* 图片 */
    if (d.images && d.images.length > 0) {
      var compact = d.images.length > 3 ? " dyn-card__images--compact" : "";
      html += "<div class=\"dyn-card__images" + compact + "\">";
      d.images.forEach(function (src) {
        html += "<img class=\"dyn-card__img\" src=\"" + encodeURI(src) + "\" alt=\"\" loading=\"lazy\">";
      });
      html += "</div>";
    }
    html += "</div>";
    /* 转发子框 */
    if (d.repost) {
      var r = d.repost;
      var isVideo = r.type === "video" || r.type === "post_video" || r.type === "article";
      html += "<div class=\"dyn-repost\">";
      if (r.id) {
        html += "<div class=\"dyn-repost__header\">";
        html += "<span class=\"dyn-repost__id\">" + escapeHTML(r.id) + "</span>";
        html += "</div>";
      }
      html += "<div class=\"dyn-repost__body\">";
      if (isVideo) {
        if (r.content) {
          html += "<p class=\"dyn-card__text\">" + highlightMention(r.content) + "</p>";
        }
        html += "<p class=\"dyn-repost__title\">" + escapeHTML(r.title) + "</p>";
        if (r.cover) {
          html += "<img class=\"dyn-repost__cover\" src=\"" + encodeURI(r.cover) + "\" alt=\"\" loading=\"lazy\">";
        }
      } else {
        html += "<p class=\"dyn-card__text\">" + highlightMention(r.content) + "</p>";
        if (r.images && r.images.length > 0) {
          var rCompact = r.images.length > 3 ? " dyn-card__images--compact" : "";
          html += "<div class=\"dyn-card__images" + rCompact + "\">";
          r.images.forEach(function (src) {
            html += "<img class=\"dyn-card__img\" src=\"" + encodeURI(src) + "\" alt=\"\" loading=\"lazy\">";
          });
          html += "</div>";
        }
      }
      html += "</div>";
      html += "<div class=\"dyn-repost__footer\">";
      if (r.dynamic_link) {
        html += "<a class=\"dyn-card__source\" href=\"" + encodeURI(r.dynamic_link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">查看源动态</a>";
      }
      var btnLabel = r.type === "article" ? "查看源文章" : (isVideo ? "查看源视频" : "查看源动态");
      html += "<a class=\"dyn-card__source\" href=\"" + encodeURI(r.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + btnLabel + "</a>";
      html += "</div>";
      html += "</div>";
    }
    html += "<div class=\"dyn-card__footer\">";
    html += "<a class=\"dyn-card__source\" href=\"" + encodeURI(d.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">查看源动态</a>";
    html += "</div>";
    html += "</article>";
    return html;
  }

  /* ---- 渲染 ---- */
  function render() {
    if (!dynList) return;

    var entries = getFilteredEntries();

    if (entries.length === 0) {
      dynList.innerHTML = "<p class=\"dyn-empty\">无匹配动态</p>";
      if (dateDisplay) dateDisplay.textContent = "---.--.--";
      if (prevBtn) prevBtn.style.visibility = "hidden";
      if (nextBtn) nextBtn.style.visibility = "hidden";
      return;
    }

    /* Clamp 索引 */
    if (currentIndex >= entries.length) {
      currentIndex = 0;
    }

    var entry = entries[currentIndex];

    /* 日期显示 */
    if (dateDisplay) {
      dateDisplay.textContent = formatDisplayDate(entry.date);
    }

    /* 导航按钮 */
    if (prevBtn) {
      prevBtn.style.visibility = currentIndex > 0 ? "visible" : "hidden";
    }
    if (nextBtn) {
      nextBtn.style.visibility = currentIndex < entries.length - 1 ? "visible" : "hidden";
    }

    /* 同步日期按钮文字 */
    if (datePickerBtn) {
      datePickerBtn.textContent = entry.date;
    }
    if (datePickerClear) {
      datePickerClear.hidden = false;
    }

    /* 保存当前位置 */
    try { sessionStorage.setItem("dyn-date", entry.date); } catch (e) {}

    /* 构建卡片 */
    var html = "";
    entry.dynamics.forEach(function (d) {
      html += buildCard(entry.date, d);
    });

    dynList.innerHTML = html;
  }

  /* ---- 导航到指定索引 ---- */
  function navigateToIndex(index) {
    var entries = getFilteredEntries();
    if (index < 0 || index >= entries.length) return;
    currentIndex = index;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navPrev() {
    navigateToIndex(currentIndex - 1);
  }

  function navNext() {
    navigateToIndex(currentIndex + 1);
  }

  /* ---- 日期选择：在当前匹配结果中定位，保留关键词 ---- */
  function navToDate(dateStr) {
    if (!dateStr) return;

    var entries = getFilteredEntries();
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].date === dateStr) {
        currentIndex = i;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        closeDatePicker();
        return;
      }
    }
  }

  /* ---- 自定义日期下拉（日历形式） ---- */
  var pickerYear, pickerMonth;
  var WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  function openDatePicker() {
    if (!datePickerDrop) return;
    var entries = getFilteredEntries();
    var curDate = entries.length > 0 ? entries[currentIndex].date : "";
    if (curDate) {
      var parts = curDate.split("-");
      pickerYear = parseInt(parts[0], 10);
      pickerMonth = parseInt(parts[1], 10) - 1;
    } else {
      var today = new Date();
      pickerYear = today.getFullYear();
      pickerMonth = today.getMonth();
    }
    renderCalendar();

    datePickerDrop.classList.add("dyn-date-picker__drop--open");
    datePickerBtn.classList.add("dyn-date-picker__btn--open");
    setTimeout(function () {
      document.addEventListener("click", closeOnOutside, { once: true });
    }, 0);
  }

  function renderCalendar() {
    if (!datePickerDrop) return;
    var activeSet = getActiveDateSet();
    var entries = getFilteredEntries();
    var curDate = entries.length > 0 ? entries[currentIndex].date : "";

    var html = "";
    /* header */
    html += "<div class=\"dyn-cal-hdr\">";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"prev\">&lt;</button>";
    html += "<span class=\"dyn-cal-hdr__label\">" + pickerYear + "年" + (pickerMonth + 1) + "月</span>";
    html += "<button class=\"dyn-cal-hdr__nav\" type=\"button\" data-nav=\"next\">&gt;</button>";
    html += "</div>";

    /* weekdays */
    html += "<div class=\"dyn-cal-wdays\">";
    WEEKDAYS.forEach(function (w) { html += "<span>" + w + "</span>"; });
    html += "</div>";

    /* grid */
    var firstDay = new Date(pickerYear, pickerMonth, 1);
    var lastDay = new Date(pickerYear, pickerMonth + 1, 0);
    var totalDays = lastDay.getDate();
    var startDow = firstDay.getDay(); // 0=日

    html += "<div class=\"dyn-cal-grid\">";
    for (var i = 0; i < startDow; i++) {
      html += "<span class=\"dyn-cal-cell dyn-cal-cell--empty\"></span>";
    }
    for (var d = 1; d <= totalDays; d++) {
      var ds = pickerYear + "-" + String(pickerMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      var isActive = !!activeSet[ds];
      var isCur = ds === curDate;
      var cls = "dyn-cal-cell";
      if (!isActive) cls += ""; // stays grey
      else cls += " dyn-cal-cell--active";
      if (isCur) cls += " dyn-cal-cell--current";
      if (isActive) {
        html += "<button class=\"" + cls + "\" type=\"button\" data-date=\"" + ds + "\">" + d + "</button>";
      } else {
        html += "<span class=\"" + cls + "\">" + d + "</span>";
      }
    }
    html += "</div>";

    datePickerDrop.innerHTML = html;

    /* nav buttons */
    datePickerDrop.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (btn.getAttribute("data-nav") === "prev") {
          pickerMonth--;
          if (pickerMonth < 0) { pickerMonth = 11; pickerYear--; }
        } else {
          pickerMonth++;
          if (pickerMonth > 11) { pickerMonth = 0; pickerYear++; }
        }
        renderCalendar();
        /* re-attach outside listener */
        setTimeout(function () {
          document.addEventListener("click", closeOnOutside, { once: true });
        }, 0);
      });
    });

    /* date clicks */
    datePickerDrop.querySelectorAll(".dyn-cal-cell--active").forEach(function (btn) {
      btn.addEventListener("click", function () {
        navToDate(btn.getAttribute("data-date"));
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
    if (picker && !picker.contains(e.target)) {
      closeDatePicker();
    } else {
      setTimeout(function () {
        document.addEventListener("click", closeOnOutside, { once: true });
      }, 0);
    }
  }

  function getActiveDateSet() {
    var entries = getFilteredEntries();
    var set = {};
    entries.forEach(function (e) { set[e.date] = true; });
    return set;
  }

  if (datePickerBtn) {
    datePickerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (datePickerDrop.classList.contains("dyn-date-picker__drop--open")) {
        closeDatePicker();
      } else {
        openDatePicker();
      }
    });
  }

  if (datePickerClear) {
    datePickerClear.addEventListener("click", function (e) {
      e.stopPropagation();
      currentIndex = 0;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---- HTML 转义 ---- */
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---- 高亮 @点酥Susu ---- */
  function highlightMention(text) {
    var escaped = escapeHTML(text);
    escaped = escaped.replace(/@点酥Susu/g, "<span class=\"mention\">@点酥Susu</span>");
    escaped = escaped.replace(/@雨纪_Ameki/g, "<span class=\"mention\">@雨纪_Ameki</span>");
    escaped = escaped.replace(/@花礼Harei/g, "<span class=\"mention\">@花礼Harei</span>");
    escaped = escaped.replace(/@明灯盏盏zzz​/g, "<span class=\"mention mention--blue\">@明灯盏盏zzz</span>");
    escaped = escaped.replace(/@AAA兵部杂鱼小张/g, "<span class=\"mention mention--blue\">@AAA兵部杂鱼小张</span>");
    escaped = escaped.replace(/@一只弥鸢​/g, "<span class=\"mention mention--blue\">@一只弥鸢</span>");
    escaped = escaped.replace(/@阿鱼今天摸了吗​/g, "<span class=\"mention mention--blue\">@阿鱼今天摸了吗</span>");
    escaped = escaped.replace(/@bili_84722739707/g, "<span class=\"mention mention--blue\">@bili_84722739707</span>");
    escaped = escaped.replace(/#にじさんじ8周年#/g, "<span class=\"mention\">#にじさんじ8周年#</span>");
    escaped = escaped.replace(/#にじさんじの日#/g, "<span class=\"mention\">#にじさんじの日#</span>");
    return escaped;
  }

  /* ---- 图片放大 ---- */
  var lightboxImages = [];
  var lightboxIndex = 0;

  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.id = "lightbox";
  lightbox.innerHTML = "<div class=\"lightbox__close\">&times;</div><button class=\"lightbox__nav lightbox__nav--prev\" id=\"lb-prev\" aria-label=\"上一张\">&lt;</button><img class=\"lightbox__img\" id=\"lightbox-img\" alt=\"\"><button class=\"lightbox__nav lightbox__nav--next\" id=\"lb-next\" aria-label=\"下一张\">&gt;</button>";
  document.body.appendChild(lightbox);

  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxScale = 1;
  var lbOffsetX = 0, lbOffsetY = 0;

  function clampOffsets() {
    var rect = lightboxImg.getBoundingClientRect();
    var iw = rect.width / lightboxScale;
    var ih = rect.height / lightboxScale;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var maxX = Math.max(0, (iw * lightboxScale - vw) / 2);
    var maxY = Math.max(0, (ih * lightboxScale - vh) / 2);
    lbOffsetX = Math.max(-maxX, Math.min(maxX, lbOffsetX));
    lbOffsetY = Math.max(-maxY, Math.min(maxY, lbOffsetY));
  }

  function applyLightboxTransform() {
    clampOffsets();
    lightboxImg.style.transform = "translate(" + lbOffsetX + "px," + lbOffsetY + "px) scale(" + lightboxScale + ")";
  }

  function setLightboxScale(s) {
    lightboxScale = Math.max(0.5, Math.min(5, s));
    applyLightboxTransform();
  }

  function resetLightboxTransform() {
    lightboxScale = 1;
    lbOffsetX = 0;
    lbOffsetY = 0;
    lightboxImg.style.transform = "";
  }

  function showLightbox(index) {
    lightboxIndex = index;
    lightboxImg.src = lightboxImages[lightboxIndex].src;
    resetLightboxTransform();
    document.getElementById("lb-prev").style.visibility = lightboxIndex > 0 ? "visible" : "hidden";
    document.getElementById("lb-next").style.visibility = lightboxIndex < lightboxImages.length - 1 ? "visible" : "hidden";
    lightbox.classList.add("lightbox--show");
  }

  function closeLightbox() {
    lightbox.classList.remove("lightbox--show");
    resetLightboxTransform();
  }

  /* PC：点击放大（1x ↔ 5x 切换），缩回时重置偏移 */
  lightboxImg.addEventListener("click", function (e) {
    e.stopPropagation();
    if (lbTouchMoved || lbMouseMoved) { lbTouchMoved = false; lbMouseMoved = false; return; }
    if (lightboxScale >= 4) {
      resetLightboxTransform();
    } else {
      setLightboxScale(5);
    }
  });

  /* PC：鼠标拖拽（仅放大后可拖） */
  var lbMousePan = false;
  var lbMouseMoved = false;
  var lbMSX = 0, lbMSY = 0;
  var lbMOX = 0, lbMOY = 0;

  lightboxImg.addEventListener("mousedown", function (e) {
    if (lightboxScale <= 1) return;
    lbMousePan = true;
    lbMouseMoved = false;
    lbMSX = e.clientX;
    lbMSY = e.clientY;
    lbMOX = lbOffsetX;
    lbMOY = lbOffsetY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!lbMousePan) return;
    var dx = e.clientX - lbMSX;
    var dy = e.clientY - lbMSY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) lbMouseMoved = true;
    lbOffsetX = lbMOX + dx;
    lbOffsetY = lbMOY + dy;
    applyLightboxTransform();
  });

  document.addEventListener("mouseup", function () {
    lbMousePan = false;
  });

  /* PC：滚轮上下移动 */
  lightbox.addEventListener("wheel", function (e) {
    e.preventDefault();
    lbOffsetY -= e.deltaY;
    applyLightboxTransform();
  }, { passive: false });

  /* 移动端：触摸拖拽 + 双指缩放 */
  var lbTouchPan = false;
  var lbTouchPinch = false;
  var lbTouchMoved = false;
  var lbTouchSX = 0, lbTouchSY = 0;
  var lbTouchOX = 0, lbTouchOY = 0;
  var lbPinchDist = 0, lbPinchScale = 1;

  function getTouchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  lightboxImg.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      lbTouchPinch = true;
      lbTouchPan = false;
      lbPinchDist = getTouchDist(e.touches);
      lbPinchScale = lightboxScale;
      e.preventDefault();
      return;
    }
    var p = e.touches[0];
    lbTouchPan = true;
    lbTouchPinch = false;
    lbTouchMoved = false;
    lbTouchSX = p.clientX;
    lbTouchSY = p.clientY;
    lbTouchOX = lbOffsetX;
    lbTouchOY = lbOffsetY;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (lbTouchPinch && e.touches.length === 2) {
      e.preventDefault();
      var dist = getTouchDist(e.touches);
      if (lbPinchDist > 0) setLightboxScale(lbPinchScale * (dist / lbPinchDist));
      return;
    }
    if (!lbTouchPan) return;
    e.preventDefault();
    var p = e.touches[0];
    var dx = p.clientX - lbTouchSX;
    var dy = p.clientY - lbTouchSY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) lbTouchMoved = true;
    lbOffsetX = lbTouchOX + dx;
    lbOffsetY = lbTouchOY + dy;
    applyLightboxTransform();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (lbTouchPan && !lbTouchMoved) {
      /* 移动端轻触 → 退出浏览 */
      closeLightbox();
    }
    lbTouchPan = false;
    lbTouchPinch = false;
  });

  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.getElementById("lb-prev").addEventListener("click", function (e) {
    e.stopPropagation();
    if (lightboxIndex > 0) showLightbox(lightboxIndex - 1);
  });
  document.getElementById("lb-next").addEventListener("click", function (e) {
    e.stopPropagation();
    if (lightboxIndex < lightboxImages.length - 1) showLightbox(lightboxIndex + 1);
  });

  /* 滑动切图 */
  var swipeStartX = 0, swipeStartY = 0;
  lightbox.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    }
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - swipeStartX;
      var dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0 && lightboxIndex < lightboxImages.length - 1) {
          showLightbox(lightboxIndex + 1);
        } else if (dx > 0 && lightboxIndex > 0) {
          showLightbox(lightboxIndex - 1);
        }
      }
    }
  });

  if (dynList) {
    dynList.addEventListener("click", function (e) {
      var img = e.target.closest(".dyn-card__img, .dyn-repost__cover");
      if (!img) return;

      var card = img.closest("article");
      if (!card) return;

      var allImgs = card.querySelectorAll(".dyn-card__img, .dyn-repost__cover");
      lightboxImages = Array.from(allImgs);
      var idx = lightboxImages.indexOf(img);
      showLightbox(idx >= 0 ? idx : 0);
    });
  }

  /* ---- 事件绑定 ---- */
  if (prevBtn) prevBtn.addEventListener("click", navPrev);
  if (nextBtn) nextBtn.addEventListener("click", navNext);

  if (filterKeyword) {
    filterKeyword.addEventListener("input", function () {
      keyword = filterKeyword.value;
      currentIndex = 0;
      render();
    });
  }

  if (scrollBtn) {
    scrollBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---- 初始化 ---- */
  /* 判断是否为刷新（F5），而非从其他页面切回 */
  var isReload = false;
  try {
    if (performance.navigation) {
      isReload = performance.navigation.type === 1;
    } else if (performance.getEntriesByType) {
      var navs = performance.getEntriesByType("navigation");
      isReload = navs.length > 0 && navs[0].type === "reload";
    }
  } catch (e) {}

  if (isReload) {
    var savedDate = "";
    try { savedDate = sessionStorage.getItem("dyn-date") || ""; } catch (e) {}
    if (savedDate) {
      var initEntries = getFilteredEntries();
      for (var i = 0; i < initEntries.length; i++) {
        if (initEntries[i].date === savedDate) { currentIndex = i; break; }
      }
    }
  }
  var initEntries = getFilteredEntries();
  if (initEntries.length > 0) {
    render();
  }
})();
