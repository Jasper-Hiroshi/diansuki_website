/**
 * diansss.com — 二创页脚本
 */
(function () {
  "use strict";

  var fwList = document.getElementById("fw-list");
  var categoryTags = document.querySelectorAll(".fw-categories__tag");
  var activeCategory = "";
  var authorKeyword = "";
  var videoTitleKeyword = "";

  function previewUrl(src) {
    return window.siteImages ? window.siteImages.previewUrl(src) : src;
  }

  function escapeHTML(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getFilteredData() {
    var authorKw = authorKeyword.trim().toLowerCase();
    var titleKw = videoTitleKeyword.trim().toLowerCase();

    return fanworksData.map(function (user) {
      var groups = user.groups.filter(function (group) {
        if (titleKw && String(group.title || "").toLowerCase().indexOf(titleKw) === -1) return false;
        if (activeCategory && group.tags.indexOf(activeCategory) === -1) return false;
        return true;
      });
      return { id: user.id, idLink: user.idLink, groups: groups };
    }).filter(function (user) {
      if (authorKw && user.id.toLowerCase().indexOf(authorKw) === -1) return false;
      return user.groups.length > 0;
    });
  }

  function effectiveGroupLikes(group) {
    var raw = group.likes || 0;
    return group.tags && group.tags.indexOf("AI") !== -1 ? Math.round(raw / 2) : raw;
  }

  function render() {
    if (!fwList) return;

    var users = getFilteredData();
    if (!users.length) {
      fwList.innerHTML = "<p class=\"dyn-empty\">无匹配二创</p>";
      return;
    }

    fwList.innerHTML = users.map(function (user) {
      var allTags = {};
      user.groups.forEach(function (group) {
        group.tags.forEach(function (tag) { if (tag !== "动态") allTags[tag] = true; });
      });
      var tags = Object.keys(allTags);
      var tagHTML = !activeCategory && tags.length
        ? "<span class=\"fw-card__tags\">" + tags.map(function (tag) {
          return "<span class=\"fw-card__tag\">" + escapeHTML(tag) + "</span>";
        }).join("") + "</span>"
        : "";

      var groupsHTML = user.groups.map(function (group) {
        var cover = group.images[0] || "";
        var count = Number(group.displayCount || 0);
        var countHTML = !group.isVideo && count > 0
          ? "<span class=\"fw-group__count\">" + count + "</span>"
          : "";
        var playHTML = group.isVideo ? "<span class=\"fw-group__play\">▶</span>" : "";
        var titleHTML = group.title ? "<span class=\"fw-group__title\">" + escapeHTML(group.title) + "</span>" : "";

        return "<div class=\"fw-group\">" +
          "<a class=\"fw-group__cover" + (group.isVideo ? " fw-group__cover--video" : "") + "\" href=\"" + escapeHTML(group.link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" +
          "<img class=\"fw-group__img\" src=\"" + escapeHTML(previewUrl(cover)) + "\" alt=\"" + escapeHTML(group.title) + "\" loading=\"lazy\" decoding=\"async\">" +
          playHTML + countHTML + "</a>" + titleHTML + "</div>";
      }).join("");

      return "<article class=\"fw-card\"><div class=\"fw-card__header\">" +
        "<a class=\"fw-card__id\" href=\"" + escapeHTML(user.idLink) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHTML(user.id) + "</a>" +
        tagHTML + "</div><div class=\"fw-card__groups\">" + groupsHTML + "</div></article>";
    }).join("");
  }

  fanworksData.forEach(function (user) {
    user.groups.sort(function (a, b) { return effectiveGroupLikes(b) - effectiveGroupLikes(a); });
  });
  fanworksData.sort(function (a, b) {
    var aLikes = a.groups.reduce(function (sum, group) { return sum + effectiveGroupLikes(group); }, 0);
    var bLikes = b.groups.reduce(function (sum, group) { return sum + effectiveGroupLikes(group); }, 0);
    return bLikes - aLikes;
  });

  categoryTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeCategory = tag.getAttribute("data-category") || "";
      categoryTags.forEach(function (item) { item.classList.remove("fw-categories__tag--active"); });
      tag.classList.add("fw-categories__tag--active");
      render();
    });
  });

  var filterAuthor = document.getElementById("filter-author");
  var filterVTitle = document.getElementById("filter-vtitle");
  if (filterAuthor) filterAuthor.addEventListener("input", function () { authorKeyword = filterAuthor.value; render(); });
  if (filterVTitle) filterVTitle.addEventListener("input", function () { videoTitleKeyword = filterVTitle.value; render(); });

  render();
})();
