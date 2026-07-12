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

  /* ---- 按分类 + 作者过滤 ---- */
  function getFilteredData() {
    var data = fanworksData;

    /* 作者搜索 */
    if (authorKeyword.trim()) {
      var authorKw = authorKeyword.trim().toLowerCase();
      data = data.filter(function (user) {
        return user.id.toLowerCase().indexOf(authorKw) !== -1;
      });
    }

    /* 视频标题搜索 */
    if (videoTitleKeyword.trim()) {
      var titleKw = videoTitleKeyword.trim().toLowerCase();
      data = data.filter(function (user) {
        return user.groups.some(function (g) {
          return g.isVideo && g.title && g.title.toLowerCase().indexOf(titleKw) !== -1;
        });
      }).map(function (user) {
        return {
          id: user.id,
          idLink: user.idLink,
          likes: user.likes,
          groups: user.groups.filter(function (g) {
            return g.isVideo && g.title && g.title.toLowerCase().indexOf(titleKw) !== -1;
          })
        };
      });
    }

    /* 分类过滤 */
    if (activeCategory) {
      data = data.filter(function (user) {
        return user.groups.some(function (g) {
          return g.tags.indexOf(activeCategory) !== -1;
        });
      }).map(function (user) {
        return {
          id: user.id,
          idLink: user.idLink,
          groups: user.groups.filter(function (g) {
            return g.tags.indexOf(activeCategory) !== -1;
          })
        };
      });
    }

    return data;
  }

  /* ---- 渲染 ---- */
  function render() {
    if (!fwList) return;

    var users = getFilteredData();
    var html = "";

    if (users.length === 0) {
      html = "<p class=\"dyn-empty\">无匹配二创</p>";
      fwList.innerHTML = html;
      return;
    }

    users.forEach(function (user, uIdx) {
      var uid = user.id;

      html += "<div class=\"fw-card\">";

      /* header: ID + tags */
      html += "<div class=\"fw-card__header\">";
      html += "<a class=\"fw-card__id\" href=\"" + encodeURI(user.idLink) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHTML(uid) + "</a>";
      /* tags from all groups (排除"动态") */
      var allTags = {};
      user.groups.forEach(function (g) {
        g.tags.forEach(function (t) { if (t !== "动态") allTags[t] = true; });
      });
      var tags = Object.keys(allTags);
      if (tags.length > 0 && !activeCategory) {
        html += "<span class=\"fw-card__tags\">";
        tags.forEach(function (t) {
          html += "<span class=\"fw-card__tag\">" + escapeHTML(t) + "</span>";
        });
        html += "</span>";
      }
      html += "</div>";

      /* groups */
      html += "<div class=\"fw-card__groups\">";
      user.groups.forEach(function (group, gIdx) {
        var globalGIdx = user.groups.indexOf(group);
        var cover = group.images[0];
        var count = group.images.length;
        var coverClass = "fw-group__cover" + (group.isVideo ? " fw-group__cover--video" : "");
        html += "<div class=\"fw-group\" data-user=\"" + uIdx + "\" data-group=\"" + globalGIdx + "\">";
        html += "<div class=\"" + coverClass + "\">";
        html += "<img class=\"fw-group__img\" src=\"" + encodeURI(cover) + "\" alt=\"" + escapeHTML(group.title) + "\" loading=\"lazy\">";
        if (group.isVideo) {
          html += "<span class=\"fw-group__play\">▶</span>";
        } else if (count > 1) {
          html += "<span class=\"fw-group__count\">" + count + "</span>";
        }
        html += "</div>";
        if (group.isVideo && group.title) {
          html += "<span class=\"fw-group__title\">" + escapeHTML(group.title) + "</span>";
        }
        html += "</div>";
      });
      html += "</div>";

      html += "</div>";
    });

    fwList.innerHTML = html;

    /* bind: expand button */
    /* bind: cover click → video跳转 / 图片灯箱 */
    fwList.querySelectorAll(".fw-group__cover").forEach(function (coverEl) {
      coverEl.addEventListener("click", function () {
        var groupEl = coverEl.closest(".fw-group");
        var uIdx = parseInt(groupEl.getAttribute("data-user"), 10);
        var gIdx = parseInt(groupEl.getAttribute("data-group"), 10);
        var users = getFilteredData();
        var group = users[uIdx].groups[gIdx];
        if (group.isVideo) {
          window.open(group.link, "_blank", "noopener noreferrer");
        } else {
          openLightbox(users, uIdx, gIdx);
        }
      });
    });
  }

  /* ---- Lightbox ---- */
  var lightboxImages = [];
  var lightboxIndex = 0;
  var lightboxLink = "";

  var lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.id = "fw-lightbox";
  lightbox.innerHTML = "<div class=\"lightbox__close\">&times;</div>" +
    "<button class=\"lightbox__nav lightbox__nav--prev\" id=\"fw-lb-prev\" aria-label=\"上一张\">&lt;</button>" +
    "<img class=\"lightbox__img\" id=\"fw-lb-img\" alt=\"\">" +
    "<div class=\"lightbox__bar\" id=\"fw-lb-bar\"><a class=\"lightbox__bar-link\" id=\"fw-lb-link\" href=\"#\" target=\"_blank\" rel=\"noopener noreferrer\">跳转至源二创页面，为创作者点赞、收藏</a></div>" +
    "<button class=\"lightbox__nav lightbox__nav--next\" id=\"fw-lb-next\" aria-label=\"下一张\">&gt;</button>";
  document.body.appendChild(lightbox);

  var lbImg = document.getElementById("fw-lb-img");
  var lbLink = document.getElementById("fw-lb-link");
  var lbBar = document.getElementById("fw-lb-bar");
  var lbScale = 1;
  var lbOffX = 0, lbOffY = 0;

  function clampLbOffsets() {
    var rect = lbImg.getBoundingClientRect();
    var iw = rect.width / lbScale;
    var ih = rect.height / lbScale;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var maxX = Math.max(0, (iw * lbScale - vw) / 2);
    var maxY = Math.max(0, (ih * lbScale - vh) / 2);
    lbOffX = Math.max(-maxX, Math.min(maxX, lbOffX));
    lbOffY = Math.max(-maxY, Math.min(maxY, lbOffY));
  }

  function applyLbTransform() {
    clampLbOffsets();
    lbImg.style.transform = "translate(" + lbOffX + "px," + lbOffY + "px) scale(" + lbScale + ")";
  }

  function setLbScale(s) {
    lbScale = Math.max(0.5, Math.min(5, s));
    applyLbTransform();
  }

  function resetLbTransform() {
    lbScale = 1;
    lbOffX = 0;
    lbOffY = 0;
    lbImg.style.transform = "";
  }

  function openLightbox(data, uIdx, gIdx) {
    var group = data[uIdx].groups[gIdx];
    lightboxImages = group.images;
    lightboxIndex = 0;
    lightboxLink = group.link;
    lbLink.href = group.link;
    resetLbTransform();
    showLbImage(0);
    lightbox.classList.add("lightbox--show");
  }

  function showLbImage(idx) {
    lightboxIndex = idx;
    lbImg.src = lightboxImages[idx];
    resetLbTransform();
    document.getElementById("fw-lb-prev").style.visibility = idx > 0 ? "visible" : "hidden";
    document.getElementById("fw-lb-next").style.visibility = idx < lightboxImages.length - 1 ? "visible" : "hidden";
    lbBar.style.display = lightboxLink ? "flex" : "none";
  }

  function closeLb() {
    lightbox.classList.remove("lightbox--show");
    resetLbTransform();
  }

  /* PC：点击放大（1x ↔ 5x 切换），缩回时重置偏移 */
  lbImg.addEventListener("click", function (e) {
    e.stopPropagation();
    if (lbTouchMoved || lbMouseMoved) { lbTouchMoved = false; lbMouseMoved = false; return; }
    if (lbScale >= 4) {
      resetLbTransform();
    } else {
      setLbScale(5);
    }
  });

  /* PC：鼠标拖拽（仅放大后可拖） */
  var lbMousePan = false;
  var lbMouseMoved = false;
  var lbMSX = 0, lbMSY = 0;
  var lbMOX = 0, lbMOY = 0;

  lbImg.addEventListener("mousedown", function (e) {
    if (lbScale <= 1) return;
    lbMousePan = true;
    lbMouseMoved = false;
    lbMSX = e.clientX;
    lbMSY = e.clientY;
    lbMOX = lbOffX;
    lbMOY = lbOffY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", function (e) {
    if (!lbMousePan) return;
    var dx = e.clientX - lbMSX;
    var dy = e.clientY - lbMSY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) lbMouseMoved = true;
    lbOffX = lbMOX + dx;
    lbOffY = lbMOY + dy;
    applyLbTransform();
  });

  document.addEventListener("mouseup", function () {
    lbMousePan = false;
  });

  /* PC：滚轮上下移动 */
  lightbox.addEventListener("wheel", function (e) {
    e.preventDefault();
    lbOffY -= e.deltaY;
    applyLbTransform();
  }, { passive: false });

  /* 移动端：触摸拖拽 + 双指缩放 */
  var lbTouchPan = false;
  var lbTouchPinch = false;
  var lbTouchMoved = false;
  var lbTSX = 0, lbTSY = 0;
  var lbTOX = 0, lbTOY = 0;
  var lbPinchDist = 0, lbPinchScale = 1;

  function getTouchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  lbImg.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      lbTouchPinch = true;
      lbTouchPan = false;
      lbPinchDist = getTouchDist(e.touches);
      lbPinchScale = lbScale;
      e.preventDefault();
      return;
    }
    var p = e.touches[0];
    lbTouchPan = true;
    lbTouchPinch = false;
    lbTouchMoved = false;
    lbTSX = p.clientX;
    lbTSY = p.clientY;
    lbTOX = lbOffX;
    lbTOY = lbOffY;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (lbTouchPinch && e.touches.length === 2) {
      e.preventDefault();
      var dist = getTouchDist(e.touches);
      if (lbPinchDist > 0) setLbScale(lbPinchScale * (dist / lbPinchDist));
      return;
    }
    if (!lbTouchPan) return;
    e.preventDefault();
    var p = e.touches[0];
    var dx = p.clientX - lbTSX;
    var dy = p.clientY - lbTSY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) lbTouchMoved = true;
    lbOffX = lbTOX + dx;
    lbOffY = lbTOY + dy;
    applyLbTransform();
  }, { passive: false });

  document.addEventListener("touchend", function () {
    if (lbTouchPan && !lbTouchMoved) {
      closeLb();
    }
    lbTouchPan = false;
    lbTouchPinch = false;
  });

  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLb);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });

  document.getElementById("fw-lb-prev").addEventListener("click", function (e) {
    e.stopPropagation();
    if (lightboxIndex > 0) showLbImage(lightboxIndex - 1);
  });
  document.getElementById("fw-lb-next").addEventListener("click", function (e) {
    e.stopPropagation();
    if (lightboxIndex < lightboxImages.length - 1) showLbImage(lightboxIndex + 1);
  });

  var swipeSX = 0, swipeSY = 0;
  lightbox.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) { swipeSX = e.touches[0].clientX; swipeSY = e.touches[0].clientY; }
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - swipeSX;
      var dy = e.changedTouches[0].clientY - swipeSY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0 && lightboxIndex < lightboxImages.length - 1) showLbImage(lightboxIndex + 1);
        else if (dx > 0 && lightboxIndex > 0) showLbImage(lightboxIndex - 1);
      }
    }
  });

  /* ---- 分类切换 ---- */
  categoryTags.forEach(function (tag) {
    tag.addEventListener("click", function () {
      activeCategory = tag.getAttribute("data-category") || "";
      categoryTags.forEach(function (t) { t.classList.remove("fw-categories__tag--active"); });
      tag.classList.add("fw-categories__tag--active");
      render();
    });
  });

  /* ---- HTML 转义 ---- */
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---- 作者搜索 ---- */
  var filterAuthor = document.getElementById("filter-author");
  var filterVTitle = document.getElementById("filter-vtitle");

  if (filterAuthor) {
    filterAuthor.addEventListener("input", function () {
      authorKeyword = filterAuthor.value;
      render();
    });
  }

  if (filterVTitle) {
    filterVTitle.addEventListener("input", function () {
      videoTitleKeyword = filterVTitle.value;
      render();
    });
  }

  /* ---- 点赞计算（AI tag 减半） ---- */
  function effectiveGroupLikes(g) {
    var raw = g.likes || 0;
    if (g.tags && g.tags.indexOf("AI") !== -1) {
      return Math.round(raw / 2);
    }
    return raw;
  }

  function totalEffectiveLikes(user) {
    return user.groups.reduce(function (sum, g) {
      return sum + effectiveGroupLikes(g);
    }, 0);
  }

  /* ---- 排序 ---- */
  fanworksData.sort(function (a, b) { return totalEffectiveLikes(b) - totalEffectiveLikes(a); });
  fanworksData.forEach(function (u) {
    u.groups.sort(function (a, b) { return effectiveGroupLikes(b) - effectiveGroupLikes(a); });
  });

  /* ---- 初始化 ---- */
  render();
})();
