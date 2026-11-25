/* Light / dark switch, shared by index.html and admin.html.
   A first-time visitor sees the theme written on <html data-theme="..."> in the page, which is light. Once they use
   the switch, their choice is remembered in this browser (localStorage "nts-theme") and every later visit opens in it.
   Nothing is sent anywhere. Loads in <head> so a saved choice is applied before the page draws (no flash of the other
   theme). Any element with class "theme-sw" is a switch. */
(function () {
  var KEY = "nts-theme", root = document.documentElement;

  function saved() { try { var t = localStorage.getItem(KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; } }
  function sync() {
    var dark = root.getAttribute("data-theme") !== "light", sw = document.querySelectorAll(".theme-sw");
    for (var i = 0; i < sw.length; i++) { sw[i].setAttribute("aria-checked", String(dark)); sw[i].title = dark ? "Switch to light mode" : "Switch to dark mode"; }
  }
  function apply(t) { root.setAttribute("data-theme", t); sync(); }

  var t0 = saved(); if (t0) root.setAttribute("data-theme", t0);

  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".theme-sw")) return;
    var t = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(t);
    try { localStorage.setItem(KEY, t); } catch (err) { }
  });
  /* keep other open tabs of the site in step */
  window.addEventListener("storage", function (e) { if (e.key === KEY && (e.newValue === "light" || e.newValue === "dark")) apply(e.newValue); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync); else sync();
})();
