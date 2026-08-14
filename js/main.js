/**
 * diansss.com — 首页脚本（占位数据，无 API）
 */

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
    fetch("https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent("https://api.bilibili.com/x/relation/stat?vmid=1323355750"))
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (json) {
        if (json.code === 0 && json.data && typeof json.data.follower === "number") {
          followerCountEl.textContent = json.data.follower.toLocaleString();
        }
      })
      .catch(function () {
        /* 请求失败时保留 HTML 中的占位数字，不做替换 */
      });
  }

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
