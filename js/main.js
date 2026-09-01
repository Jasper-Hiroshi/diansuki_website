/** diansss.com — 首页脚本 */

(function () {
  "use strict";

  /* 最新三条动态 */
  var grid = document.querySelector(".dynamics__grid");
  if (grid && typeof dynamicsData !== "undefined") {
    var latest = [];
    for (var i = 0; i < dynamicsData.length && latest.length < 3; i++) {
      var entry = dynamicsData[i];
      for (var j = 0; j < entry.dynamics.length && latest.length < 3; j++) {
        latest.push({ date: entry.date, dyn: entry.dynamics[j] });
      }
    }

    var html = "";
    latest.forEach(function (item) {
      var d = item.dyn;
      var content = d.content;
      html += "<li class=\"dynamic-card\">";
      html += "<time class=\"dynamic-card__date\" datetime=\"" + item.date + "\">" + item.date + " " + d.time + "</time>";
      html += "<p class=\"dynamic-card__summary\">" + escapeHTML(content) + "</p>";
      html += "<a class=\"btn btn--card\" href=\"" + encodeURI(d.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">查看动态</a>";
      html += "</li>";
    });
    grid.innerHTML = html;
  }

  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 粉丝数 */
  var followerCountEl = document.getElementById("follower-count");

  if (followerCountEl) {
    fetch("https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent("https://space.bilibili.com/1323355750"))
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var countNode = doc.querySelector("span.nav-statistics__item-num[title]");
        if (countNode) {
          var count = Number(countNode.getAttribute("title").replace(/,/g, ""));
          if (Number.isFinite(count)) followerCountEl.textContent = count.toLocaleString("zh-CN");
        }
      })
      .catch(function () {
        /* 请求失败时保留 HTML 中的占位数字，不做替换 */
      });
  }

  /* 纪念日：以访客本地日期为准，今天遇到纪念日时显示 0 天。 */
  var today = new Date();
  var todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var oneDay = 24 * 60 * 60 * 1000;

  function daysUntil(month, day) {
    var target = new Date(todayDate.getFullYear(), month - 1, day);
    if (target < todayDate) target.setFullYear(target.getFullYear() + 1);
    return Math.round((target - todayDate) / oneDay);
  }

  var debutDaysEl = document.getElementById("debut-days");
  var birthdayDaysEl = document.getElementById("birthday-days");
  var anniversaryDaysEl = document.getElementById("anniversary-days");
  if (debutDaysEl) {
    var debutDate = new Date(2024, 6, 16);
    debutDaysEl.textContent = Math.floor((todayDate - debutDate) / oneDay) + 1;
  }
  if (birthdayDaysEl) birthdayDaysEl.textContent = daysUntil(10, 20);
  if (anniversaryDaysEl) anniversaryDaysEl.textContent = daysUntil(7, 16);

  /* 底部按钮：有 data-next 则跳转，否则滚动回顶部 */
  var scrollBtn = document.getElementById("scroll-more");

  if (scrollBtn) {
    var nextPage = scrollBtn.getAttribute("data-next");
    if (nextPage) {
      scrollBtn.addEventListener("click", function () {
        window.location.href = nextPage;
      });
    } else {
      scrollBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }
})();
