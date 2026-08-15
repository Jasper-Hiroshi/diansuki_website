/**
 * diansss.com — 专题合集脚本
 */
(function () {
  "use strict";

  var gridEl = document.getElementById("col-grid");
  var searchEl = document.getElementById("col-search");
  var typeEl = document.getElementById("col-type");
  var emptyEl = document.getElementById("col-empty");

  function previewUrl(src) {
    return window.siteImages ? window.siteImages.previewUrl(src) : src;
  }

  if (!gridEl) return;

  /* 类型徽标配色：按类型名哈希到固定颜色 */
  var TYPE_COLORS = ["#2b7bd6", "#4caf50", "#e6b800", "#ff6600", "#8e24aa", "#00acc1", "#e53935", "#6d4c41", "#5e35b1", "#00897b"];

  function typeColor(type) {
    var h = 0;
    for (var i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
    return TYPE_COLORS[h % TYPE_COLORS.length];
  }

  function escapeHTML(str) {
    return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function collections() {
    return (typeof collectionsData !== "undefined" && collectionsData.collections) ? collectionsData.collections : [];
  }

  /* 日期升序：上方更早、下方更晚 */
  function byDateAsc(a, b) {
    return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
  }

  function populateTypeSelect() {
    if (!typeEl) return;
    var seen = {};
    var prev = typeEl.value;
    var html = "<option value=\"\">全部类型</option>";
    collections().forEach(function (c) {
      if (c.type && !seen[c.type]) {
        seen[c.type] = true;
        html += "<option value=\"" + escapeHTML(c.type) + "\">" + escapeHTML(c.type) + "</option>";
      }
    });
    typeEl.innerHTML = html;
    if (prev) {
      Array.prototype.forEach.call(typeEl.options, function (opt) {
        if (opt.value === prev) typeEl.value = prev;
      });
    }
  }

  function matches(col) {
    var kw = searchEl ? searchEl.value.trim().toLowerCase() : "";
    var type = typeEl ? typeEl.value : "";
    if (type && col.type !== type) return false;
    if (kw && (col.name || "").toLowerCase().indexOf(kw) === -1) return false;
    return true;
  }

  function renderStream(s) {
    var html = "<a class=\"col-stream\" href=\"" + encodeURI(s.link || "#") + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
    if (s.cover) {
      html += "<img class=\"col-stream__cover\" src=\"" + escapeHTML(previewUrl(s.cover)) + "\" data-full-src=\"" + escapeHTML(s.cover) + "\" alt=\"\" loading=\"lazy\" decoding=\"async\">";
    }
    html += "<span class=\"col-stream__body\">";
    html += "<span class=\"col-stream__meta\"><span class=\"col-stream__date\">" + escapeHTML(s.date) + "</span><span class=\"col-stream__time\">" + escapeHTML(s.time) + "</span></span>";
    html += "<span class=\"col-stream__title\">" + escapeHTML(s.title) + "</span>";
    html += "</span>";
    html += "<span class=\"col-stream__play\">▶</span>";
    html += "</a>";
    return html;
  }

  function renderItem(col) {
    var html = "<div class=\"col-item\">";
    html += "<button class=\"col-item__bar\" type=\"button\" aria-expanded=\"false\">";
    if (col.type) html += "<span class=\"col-item__type\" style=\"background:" + typeColor(col.type) + "\">" + escapeHTML(col.type) + "</span>";
    html += "<span class=\"col-item__name\">" + escapeHTML(col.name) + "</span>";
    html += "<span class=\"col-item__toggle\">展开</span>";
    html += "</button>";

    html += "<div class=\"col-item__body\" hidden>";
    var streams = (col.streams || []).slice().sort(byDateAsc);
    if (streams.length === 0) {
      html += "<p class=\"dyn-empty\">该合集暂无直播。</p>";
    } else {
      streams.forEach(function (s) { html += renderStream(s); });
    }
    html += "</div>";
    html += "</div>";
    return html;
  }

  function render() {
    var list = collections().filter(matches);
    if (list.length === 0) {
      gridEl.innerHTML = "";
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var html = "";
    list.forEach(function (c) { html += renderItem(c); });
    gridEl.innerHTML = html;

    gridEl.querySelectorAll(".col-item__bar").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var body = btn.parentNode.querySelector(".col-item__body");
        var toggle = btn.querySelector(".col-item__toggle");
        var expanded = btn.getAttribute("aria-expanded") === "true";

        if (expanded) {
          btn.setAttribute("aria-expanded", "false");
          if (toggle) toggle.textContent = "展开";
          body.hidden = true;
        } else {
          btn.setAttribute("aria-expanded", "true");
          if (toggle) toggle.textContent = "收起";
          body.hidden = false;
        }
      });
    });
  }

  if (searchEl) searchEl.addEventListener("input", render);
  if (typeEl) typeEl.addEventListener("change", render);

  /* ---- 懒加载合集数据 ----
   * collections-data.js（约 123KB）只在首次进入「专题合集」时下载，避免首屏白白加载。
   * 注意：若用 scripts/add_collection.py 修改了 collections-data.js 内容，记得同步更新下方 ?v= 版本号。 */
  var DATA_URL = "js/collections-data.js?v=20260813120000";
  var loading = false;

  function init() {
    populateTypeSelect();
    render();
  }

  function loadAndRender() {
    if (typeof collectionsData !== "undefined") { init(); return; }
    if (loading) return;
    loading = true;
    var s = document.createElement("script");
    s.src = DATA_URL;
    s.async = true;
    s.onload = init;
    s.onerror = function () {
      if (emptyEl) emptyEl.hidden = false;
    };
    document.body.appendChild(s);
  }

  /* 用户点击「专题合集」tab 时触发加载 */
  var colTabBtn = document.querySelector('.cal-tabs__btn[data-tab="collections"]');
  if (colTabBtn) colTabBtn.addEventListener("click", loadAndRender);

  /* 若上次停留在此 tab（刷新后恢复），立即加载 */
  var colPanel = document.getElementById("cal-tab-collections");
  if (colPanel && colPanel.style.display !== "none") loadAndRender();
})();
