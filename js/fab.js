/**
 * diansss.com — 悬浮导航球（居中展开式 + 可拖动）
 */
(function () {
  "use strict";

  var PAGES = [
    { name: "首页",     href: "index.html" },
    { name: "小组件",   href: "widgets.html" },
    { name: "二创",     href: "fanworks.html" },
    { name: "专栏",     href: "columns.html" },
    { name: "歌",       href: "songs.html" },
    { name: "直播日历", href: "calendar.html" }
  ];

  var RADIUS = 100;
  var ANGLES = [0, 60, 120, 180, 240, 300];

  /* ---- 构建 HTML ---- */
  var fabHTML = "<div class=\"fab__overlay\" id=\"fab-overlay\"></div>";
  fabHTML += "<div class=\"fab\" id=\"fab\">";
  fabHTML += "<div class=\"fab__ball\" id=\"fab-ball\">";
  fabHTML += "<img class=\"fab__ball-img\" src=\"assets/images/logo2.png\" alt=\"\">";
  fabHTML += "</div>";
  fabHTML += "<div class=\"fab__menu\" id=\"fab-menu\">";
  PAGES.forEach(function (page, i) {
    var rad = ANGLES[i] * Math.PI / 180;
    var tx = Math.round(Math.cos(rad) * RADIUS);
    var ty = Math.round(Math.sin(rad) * RADIUS) * -1;
    fabHTML += "<a class=\"fab__item\" href=\"" + page.href + "\" style=\"--tx:" + tx + "px;--ty:" + ty + "px\" title=\"" + page.name + "\">" + page.name + "</a>";
  });
  fabHTML += "</div>";
  fabHTML += "</div>";

  document.body.insertAdjacentHTML("beforeend", fabHTML);

  /* ---- 元素引用 ---- */
  var fab = document.getElementById("fab");
  var fabBall = document.getElementById("fab-ball");
  var fabOverlay = document.getElementById("fab-overlay");

  /* ---- 开关 ---- */
  function openMenu() {
    fab.classList.add("fab--open");
    fabOverlay.classList.add("fab__overlay--show");
  }

  function closeMenu() {
    fab.classList.remove("fab--open");
    fabOverlay.classList.remove("fab__overlay--show");
  }

  function toggleMenu() {
    if (fab.classList.contains("fab--open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /* ---- 拖动 ---- */
  var dragging = false;
  var moved = false;
  var startX = 0, startY = 0;
  var origDX = 0, origDY = 0;
  var offsetDX = 0, offsetDY = 0;

  function applyOffset() {
    fab.style.transform = "translate(" + offsetDX + "px," + offsetDY + "px)";
  }

  fabBall.addEventListener("mousedown", function (e) {
    if (fab.classList.contains("fab--open")) return;
    e.preventDefault();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    origDX = offsetDX;
    origDY = offsetDY;
  });

  document.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    offsetDX = origDX + dx;
    offsetDY = origDY + dy;
    applyOffset();
  });

  document.addEventListener("mouseup", function () {
    dragging = false;
  });

  /* 点击球：无拖动 → 切换菜单；已展开时直接关闭 */
  fabBall.addEventListener("click", function (e) {
    if (fab.classList.contains("fab--open")) {
      e.stopPropagation();
      closeMenu();
      return;
    }
    if (moved) { moved = false; return; }
    e.stopPropagation();
    toggleMenu();
  });

  /* 触摸 */
  fabBall.addEventListener("touchstart", function (e) {
    if (fab.classList.contains("fab--open")) return;
    e.preventDefault();
    dragging = true;
    moved = false;
    var p = e.touches[0];
    startX = p.clientX;
    startY = p.clientY;
    origDX = offsetDX;
    origDY = offsetDY;
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    e.preventDefault();
    var p = e.touches[0];
    var dx = p.clientX - startX;
    var dy = p.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    offsetDX = origDX + dx;
    offsetDY = origDY + dy;
    applyOffset();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (!dragging) return;
    dragging = false;
    if (!moved) toggleMenu();
  });

  /* ---- overlay / 菜单项关闭 ---- */
  fabOverlay.addEventListener("click", closeMenu);

  var items = fab.querySelectorAll(".fab__item");
  items.forEach(function (item) {
    item.addEventListener("click", function () {
      closeMenu();
    });
  });
})();
