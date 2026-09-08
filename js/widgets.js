/** diansss.com — 小组件页交互 */
(function () {
  "use strict";

  var openButton = document.getElementById("open-wardrobe");
  var dialog = document.getElementById("wardrobe-dialog");
  var closeButton = document.getElementById("close-wardrobe");
  if (!openButton || !dialog || !closeButton) return;

  var wardrobeTrigger = null;

  function openWardrobe() {
    wardrobeTrigger = document.activeElement;
    dialog.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("wardrobe-is-open");
    window.requestAnimationFrame(function () {
      dialog.classList.add("wardrobe-dialog--show");
      closeButton.focus();
    });
  }

  function closeWardrobe() {
    dialog.classList.remove("wardrobe-dialog--show");
    dialog.hidden = true;
    openButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("wardrobe-is-open");
    if (wardrobeTrigger && typeof wardrobeTrigger.focus === "function") wardrobeTrigger.focus();
  }

  function trapFocus(event) {
    var focusable = Array.prototype.slice.call(dialog.querySelectorAll("button:not([disabled]),a[href],[tabindex]:not([tabindex='-1'])"));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.setAttribute("aria-expanded", "false");
  openButton.addEventListener("click", openWardrobe);
  closeButton.addEventListener("click", closeWardrobe);

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeWardrobe();
  });

  document.addEventListener("keydown", function (event) {
    if (dialog.hidden) return;
    if (event.key === "Escape") {
      closeWardrobe();
      return;
    }
    if (event.key === "Tab") trapFocus(event);
  });
})();
