/* v11 interface touches: line-art age icons, age chips and "New" badge on case cards, and pointer-driven 3D tilt on the
   hero photograph and the case cards. Decoration only; the app works without this file. */
(function () {
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* line-art pictograms, drawn on with pathLength so every stroke animates the same way */
  var P = function (d) { return '<path pathLength="1" d="' + d + '"/>' }, C = function (x, y, r) { return '<circle pathLength="1" cx="' + x + '" cy="' + y + '" r="' + r + '"/>' };
  var ART = {
    all: P('M5 6h8v8H5z') + P('M19 6h8v8h-8z') + P('M5 18h8v8H5z') + P('M19 18h8v8h-8z'),
    nicu: P('M4 24h24') + P('M6 24v-7a10 10 0 0 1 20 0v7') + C(16, 17, 3) + P('M11 22c1-3 9-3 10 0'),
    opd: C(16, 9, 4.5) + P('M8 27c0-7 3-11 8-11s8 4 8 11') + P('M11 20l-4 3M21 20l4 3'),
    child: C(16, 6.5, 3.5) + P('M16 10v10') + P('M9 15l7-3 7 3') + P('M16 20l-4 8M16 20l4 8'),
    adult: C(13, 6, 3.2) + P('M13 9.5c2 4 1 7 0 11') + P('M7 14l6-3 6 4') + P('M13 20l-4 8M13 20l4 8') + P('M23 15v13M20 15h5')
  };
  var art = function (k) { return '<svg class="la" viewBox="0 0 32 32" aria-hidden="true">' + (ART[k] || ART.all) + '</svg>' };
  var AGE = { nicu: 'Neonatal unit', opd: 'Newborn and infant', child: 'Child and adolescent', adult: 'Adult' };
  function groupOf(c) { return c.engine === 'nicu' ? 'nicu' : (c.group === 'child' || c.group === 'adult') ? c.group : 'opd' }
  /* tilt an element toward the pointer; max is the angle in degrees at the edge */
  function tilt(el, max, rest) {
    if (!fine) return;
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.setProperty('--ry', (x * max * 2).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * max * 2).toFixed(2) + 'deg'); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px') });
    el.addEventListener('pointerleave', function () { if (rest) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry') } else { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') } });
  }
  function enhance() {
    document.querySelectorAll('.cl-bar .seg button[data-f]:not([data-la])').forEach(function (b) { b.dataset.la = 1; b.insertAdjacentHTML('afterbegin', art(b.dataset.f)) });
    document.querySelectorAll('.cc[data-id]:not([data-g])').forEach(function (el) {
      el.dataset.g = 1;
      var c = (window.CASES || []).find(function (x) { return x.id === el.dataset.id }); if (!c) return;
      var g = groupOf(c), age = c.pt && c.pt.tag ? ' · ' + c.pt.tag : '';
      el.insertAdjacentHTML('afterbegin', '<span class="cc-age">' + art(g) + AGE[g] + age + '</span>' + (c.added && Date.now() - Date.parse(c.added) < 14 * 864e5 ? '<span class="cc-new">New</span>' : ''));
      tilt(el, 3);
    });
    var h = document.querySelector('.h3-card:not([data-t])'); if (h) { h.dataset.t = 1; tilt(h.parentNode, 7, true); h.parentNode.addEventListener('pointermove', function () { h.style.setProperty('--rx', h.parentNode.style.getPropertyValue('--rx')); h.style.setProperty('--ry', h.parentNode.style.getPropertyValue('--ry')) }); h.parentNode.addEventListener('pointerleave', function () { h.style.removeProperty('--rx'); h.style.removeProperty('--ry') }) }
  }
  var lab = document.getElementById('viewLab');
  if (lab) { new MutationObserver(enhance).observe(lab, { childList: true, subtree: true }); enhance(); }
  if (/[?&]preview=1/.test(location.search)) document.body.insertAdjacentHTML('beforeend', '<div class="prev-bar"><i></i>Preview of an unpublished draft from the admin page. Visitors do not see this case.</div>');
})();
