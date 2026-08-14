/**
 * Lightweight image helpers. List and card views use generated WebP previews;
 * full-resolution originals remain available to lightboxes and fallbacks.
 */
(function () {
  "use strict";

  function previewUrl(src) {
    var value = String(src || "");
    var match = value.match(/^assets\/images\/(.+)\.(jpe?g|png)$/i);
    return match ? "assets/images/previews/" + match[1] + ".webp" : value;
  }

  function useOriginalOnError(img) {
    if (!img || !img.getAttribute) return;
    var original = img.getAttribute("data-full-src");
    if (!original || img.getAttribute("src") === original) return;
    img.addEventListener("error", function fallback() {
      img.removeEventListener("error", fallback);
      img.src = original;
    });
  }

  window.siteImages = {
    previewUrl: previewUrl,
    useOriginalOnError: useOriginalOnError
  };

  document.addEventListener("error", function (event) {
    var target = event.target;
    if (!target || target.tagName !== "IMG") return;
    var original = target.getAttribute("data-full-src");
    if (original && target.getAttribute("src") !== original) target.src = original;
  }, true);
})();
