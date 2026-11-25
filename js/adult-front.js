/* ADULTFRONT: a front-facing standing figure drawn as painted SVG, for Case lab patients older than 2 years.
   Body composition is the point of the drawing: limb and trunk girth follow muscle and fat, the lower legs swell with
   oedema, the posture stoops and a walking stick appears as weakness rises, and the skin pales with pallor.
   Builds: child, adult, older. Views: outside, inside (translucent body with muscle groups, heart, liver, stomach, bowel).
   Feeding routes: oral, ons (cup), tube (nasogastric tube), pn (line and bag).
   API matches BABYFRONT: create(host, opts) -> set(), now(), flash(), highlight(), view(), dispose(). */
var ADULTFRONT = (function () {
  var UID = 0, NUM = ['muscle', 'fat', 'oedema', 'pallor', 'stress', 'weak', 'fill', 'distension'];
  function f(n) { return Math.round(n * 10) / 10 }
  function lerp(a, b, t) { return a + (b - a) * t }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
  function mix(c1, c2, t) { var o = '#'; for (var i = 1; i < 6; i += 2) { var v = Math.round(lerp(parseInt(c1.substr(i, 2), 16), parseInt(c2.substr(i, 2), 16), t)); o += (v < 16 ? '0' : '') + v.toString(16) } return o }
  /* tapered capsule between two circles */
  function limb(x1, y1, r1, x2, y2, r2) {
    var a = Math.atan2(y2 - y1, x2 - x1), s = Math.sin(a), c = Math.cos(a);
    return 'M' + f(x1 + s * r1) + ',' + f(y1 - c * r1) + 'L' + f(x2 + s * r2) + ',' + f(y2 - c * r2) + 'A' + f(r2) + ',' + f(r2) + ' 0 0 1 ' + f(x2 - s * r2) + ',' + f(y2 + c * r2) +
      'L' + f(x1 - s * r1) + ',' + f(y1 + c * r1) + 'A' + f(r1) + ',' + f(r1) + ' 0 0 1 ' + f(x1 + s * r1) + ',' + f(y1 - c * r1) + 'Z';
  }
  function create(host, o) {
    o = o || {};
    var pre = 'af' + (++UID) + '-', U = function (n) { return 'url(#' + pre + n + ')' };
    var st = { view: o.view || 'outside', build: o.build || 'adult', muscle: 1, fat: .5, oedema: 0, pallor: 0, stress: 0, weak: 0, fill: .3, distension: 0, feeding: false }, hl = null, raf = 0, dead = false;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 600 780'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.setAttribute('role', 'img');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;box-sizing:border-box;padding:' + (o.padTop || 0) + 'px 0 ' + (o.padBot || 0) + 'px';
    host.appendChild(svg);
    function take(p) { for (var k in p) { if (k === 'mode') { if (p.mode === 'inside' || p.mode === 'gut') st.view = 'inside'; else st.view = 'outside'; } else if (k in st) st[k] = p[k]; } }
    take(o);

    function draw(s) {
      var child = s.build === 'child', old = s.build === 'older', ins = s.view === 'inside';
      var m = clamp(s.muscle, 0, 1), fa = clamp(s.fat, 0, 1), oe = clamp(s.oedema, 0, 1), wk = clamp(s.weak, 0, 1), di = clamp(s.distension, 0, 1);
      var skin = mix('#DDA680', '#EBD8C8', clamp(s.pallor, 0, 1) * .85), skin2 = mix('#B97D5B', '#CDB5A2', clamp(s.pallor, 0, 1) * .85);
      var SW = 78 + m * 14 + fa * 10, WA = 44 + fa * 46 + di * 16, HP = 56 + fa * 28;
      var rU = 11 + m * 9 + fa * 9, rF = 9 + m * 6 + fa * 5, rT = 20 + m * 13 + fa * 15, rC = 12 + m * 8 + fa * 6 + oe * 11, rA = 9 + fa * 3 + oe * 9;
      var cane = wk > .6, lean = wk * 7;
      var h = '<defs>' +
        '<linearGradient id="' + pre + 'sk" x1="0" x2="1"><stop offset="0" stop-color="' + skin2 + '"/><stop offset=".3" stop-color="' + skin + '"/><stop offset=".72" stop-color="' + skin + '"/><stop offset="1" stop-color="' + skin2 + '"/></linearGradient>' +
        '<linearGradient id="' + pre + 'mu" x1="0" x2="1"><stop offset="0" stop-color="#A93A3A"/><stop offset=".5" stop-color="#E06A5E"/><stop offset="1" stop-color="#A93A3A"/></linearGradient>' +
        '<linearGradient id="' + pre + 've" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4FAF8"/><stop offset="1" stop-color="#D5E8E2"/></linearGradient>' +
        '<radialGradient id="' + pre + 'fl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0B2A2A" stop-opacity=".28"/><stop offset="1" stop-color="#0B2A2A" stop-opacity="0"/></radialGradient>' +
        '<filter id="' + pre + 'so" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
        '</defs>';
      h += '<ellipse cx="300" cy="752" rx="' + f(150 + fa * 30) + '" ry="16" fill="' + U('fl') + '"/>';
      var bodyOp = ins ? .3 : 1, sk = 'fill="' + U('sk') + '" fill-opacity="' + bodyOp + '"' + (ins ? ' stroke="' + skin2 + '" stroke-width="1.5"' : '');
      var g0 = '<g transform="' + (child ? 'translate(300 752) scale(.8) translate(-300 -752)' : '') + '">';
      h += g0;
      /* legs */
      var L = '', muscleL = '';
      [-1, 1].forEach(function (d) {
        var hx = 300 + d * (26 + fa * 8), kx = 300 + d * (32 + fa * 4), ax = 300 + d * 34;
        L += '<path d="' + limb(hx, 452, rT, kx, 590, rT * .62) + '" ' + sk + '/><path d="' + limb(kx, 590, rC, ax, 716, rA) + '" ' + sk + '/>' +
          '<ellipse cx="' + (ax + d * 12) + '" cy="738" rx="' + f(26 + oe * 5) + '" ry="' + f(11 + oe * 3) + '" ' + sk + '/>';
        muscleL += '<path d="' + limb(hx, 462, 6 + m * 16, kx, 572, 4 + m * 8) + '" fill="' + U('mu') + '"/><path d="' + limb(kx - d * 2, 608, 4 + m * 10, ax, 690, 3 + m * 3) + '" fill="' + U('mu') + '"/>';
        if (oe > .15 && !ins) L += '<ellipse cx="' + ax + '" cy="700" rx="' + f(rA + 3) + '" ry="20" fill="#9CC3E8" opacity="' + f(oe * .35) + '"/>';
      });
      h += L;
      /* upper body leans forward with weakness */
      h += '<g transform="rotate(' + f(lean) + ' 300 452)">';
      var arms = '', muscleA = '';
      [-1, 1].forEach(function (d) {
        var sx = 300 + d * SW, ex = 300 + d * (SW + 16), ey = 330, wx = 300 + d * (SW + 20), wy = 432;
        if (d === 1 && cane) { ex = 300 + SW + 30; ey = 322; wx = 300 + SW + 52; wy = 410 }
        arms += '<path d="' + limb(sx, 214, rU + 2, ex, ey, rU * .8) + '" ' + sk + '/><path d="' + limb(ex, ey, rF + 1, wx, wy, rF * .7) + '" ' + sk + '/><circle cx="' + wx + '" cy="' + (wy + 12) + '" r="' + f(11 + fa * 2) + '" ' + sk + '/>';
        muscleA += '<path d="' + limb(sx, 224, 4 + m * 9, ex, ey - 12, 3 + m * 5) + '" fill="' + U('mu') + '"/><path d="' + limb(ex, ey + 8, 3 + m * 6, wx, wy - 12, 2 + m * 2) + '" fill="' + U('mu') + '"/>';
        if (d === 1 && cane) arms += '<path d="M' + (wx - 14) + ',' + (wy + 10) + 'h26" stroke="#6B4A2E" stroke-width="7" stroke-linecap="round"/><path d="M' + wx + ',' + (wy + 12) + 'L' + (wx + 26) + ',748" stroke="#7A5636" stroke-width="6" stroke-linecap="round" transform="rotate(' + f(-lean) + ' ' + wx + ' ' + (wy + 12) + ')"/>';
      });
      h += arms;
      /* trunk and neck */
      var trunk = 'M' + f(300 - SW) + ',196 C' + f(300 - SW - 6) + ',250 ' + f(300 - WA - 4) + ',300 ' + f(300 - WA) + ',350 C' + f(300 - WA) + ',400 ' + f(300 - HP) + ',420 ' + f(300 - HP) + ',462 L' + f(300 + HP) + ',462 C' + f(300 + HP) + ',420 ' + f(300 + WA) + ',400 ' + f(300 + WA) + ',350 C' + f(300 + WA + 4) + ',300 ' + f(300 + SW + 6) + ',250 ' + f(300 + SW) + ',196 C' + f(300 + SW - 20) + ',176 340,172 300,172 C260,172 ' + f(300 - SW + 20) + ',176 ' + f(300 - SW) + ',196Z';
      h += '<path d="M282,140h36v44h-36z" ' + sk + '/><path d="' + trunk + '" ' + sk + '/>';
      if (!ins) {
        h += '<path d="' + trunk + '" fill="' + U('ve') + '" clip-path="inset(0)" opacity=".96"/><path d="M' + f(300 - SW + 8) + ',190 C280,214 320,214 ' + f(300 + SW - 8) + ',190" fill="none" stroke="#B9D4CC" stroke-width="3"/>' +
          '<path d="M' + f(300 - HP) + ',430 L' + f(300 + HP) + ',430 L' + f(300 + HP + 4) + ',500 L304,500 L300,476 L296,500 L' + f(300 - HP - 4) + ',500Z" fill="#178E80"/><path d="M' + f(300 - HP) + ',430h' + f(HP * 2) + '" stroke="#0D6157" stroke-width="5"/>';
      } else {
        h += muscleA + '<path d="' + limb(300 - SW * .45, 214, 10 + m * 14, 300 - SW * .4, 250, 8 + m * 12) + '" fill="' + U('mu') + '" opacity=".85"/><path d="' + limb(300 + SW * .45, 214, 10 + m * 14, 300 + SW * .4, 250, 8 + m * 12) + '" fill="' + U('mu') + '" opacity=".85"/>';
        /* organs */
        var fill = clamp(s.fill, 0, 1);
        h += '<path d="M318,232c14,-12 34,2 26,20c-6,12 -22,22 -30,26c-10,-8 -22,-18 -22,-30c0,-14 18,-22 26,-16z" fill="#D9475B"/>' +
          '<path d="M246,292c26,-14 66,-10 78,2c-6,18 -30,30 -56,30c-16,0 -26,-14 -22,-32z" fill="#9A4B3C"/>' +
          '<path d="M322,300c22,-6 40,10 36,32c-4,20 -30,30 -48,22c-10,-6 -6,-16 2,-22c8,-6 6,-22 10,-32z" fill="#F2B7A6" stroke="#C97862" stroke-width="2"/>' +
          '<clipPath id="' + pre + 'sc"><path d="M322,300c22,-6 40,10 36,32c-4,20 -30,30 -48,22c-10,-6 -6,-16 2,-22c8,-6 6,-22 10,-32z"/></clipPath><rect x="300" y="' + f(360 - fill * 62) + '" width="70" height="70" fill="#F6E7B8" opacity=".9" clip-path="' + U('sc') + '"/>';
        var gw = 46 + di * 16, gut = '';
        for (var r = 0; r < 4; r++) gut += 'M' + f(300 - gw) + ',' + (372 + r * 16) + 'c' + f(gw * .5) + ',-12 ' + f(gw * .5) + ',12 ' + f(gw) + ',0s' + f(gw * .5) + ',12 ' + f(gw) + ',0';
        h += '<path d="' + gut + '" fill="none" stroke="#E7A08E" stroke-width="' + f(11 + di * 5) + '" stroke-linecap="round"/><path d="' + gut + '" fill="none" stroke="#F6C9BC" stroke-width="' + f(5 + di * 3) + '" stroke-linecap="round"/>';
      }
      /* head */
      var hr = child ? 1.16 : 1, face = '<g transform="translate(300 96) scale(' + hr + ')">';
      face += '<ellipse cx="0" cy="0" rx="42" ry="50" fill="' + U('sk') + '"/><ellipse cx="-43" cy="4" rx="6" ry="11" fill="' + skin2 + '"/><ellipse cx="43" cy="4" rx="6" ry="11" fill="' + skin2 + '"/>';
      face += '<path d="M-44,-8c-4,-44 30,-56 46,-54c26,2 46,18 42,54c-8,-22 -24,-30 -44,-30c-20,0 -36,8 -44,30z" fill="' + (old ? '#C9CDD0' : '#2B2320') + '"/>';
      var brow = s.stress * 5, mouth = s.stress > .5 ? 'M-12,28q12,-7 24,0' : 'M-12,25q12,' + f(7 - s.stress * 10) + ' 24,0';
      face += '<path d="M-24,' + f(-6 + brow) + 'q8,-5 16,' + f(-brow * .6) + 'M8,' + f(-6 - brow * .6 + brow * .6) + 'q8,-5 16,' + f(brow) + '" stroke="#3A2A22" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="-15" cy="4" rx="4" ry="' + f(4.6 - wk * 1.6) + '" fill="#2A1E1A"/><ellipse cx="15" cy="4" rx="4" ry="' + f(4.6 - wk * 1.6) + '" fill="#2A1E1A"/>' +
        '<path d="M-2,8q-4,8 2,12" stroke="' + skin2 + '" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="' + mouth + '" stroke="#8A3F38" stroke-width="3" fill="none" stroke-linecap="round"/>';
      if (o.sex === 'f') face = face.replace('<ellipse cx="0" cy="0"', '<path d="M-46,-14c-8,34 -6,58 4,74l10,-6c-8,-22 -8,-44 -4,-62zM46,-14c8,34 6,58 -4,74l-10,-6c8,-22 8,-44 4,-62z" fill="' + (old ? '#C9CDD0' : '#2B2320') + '"/><ellipse cx="0" cy="0"');
      if (old) face += '<path d="M-30,-16q10,-4 20,0M10,-16q10,-4 20,0M-22,16q4,3 8,2M14,18q4,1 8,-2" stroke="' + skin2 + '" stroke-width="1.6" fill="none" opacity=".8"/>';
      if (m < .5 || fa < .25) face += '<path d="M-30,10q4,14 12,22M30,10q-4,14 -12,22" stroke="' + skin2 + '" stroke-width="2.2" fill="none" opacity="' + f(.9 - m * .8) + '"/>';
      if (s.feeding === 'tube') face += '<path d="M-3,14C-20,10 -44,6 -52,30C-58,60 -40,90 -30,110" stroke="#E9B949" stroke-width="3" fill="none"/><rect x="-26" y="8" width="16" height="8" rx="2" fill="#fff" opacity=".9"/>';
      face += '</g>';
      h += face + '</g></g>';
      if (ins) h += '<g transform="' + (child ? 'translate(300 752) scale(.8) translate(-300 -752)' : '') + '">' + muscleL + '</g>';
      /* feeding route badges and lines */
      if (s.feeding === 'pn') h += '<path d="M468,150v70c0,60 -40,120 -78,150" stroke="#8FB8D8" stroke-width="3" fill="none"/><rect x="448" y="84" width="40" height="66" rx="8" fill="#F6E7B8" stroke="#C9A94C" stroke-width="2"/><path d="M468,84v-22" stroke="#7A8A88" stroke-width="3"/>';
      if (s.feeding === 'ons') h += '<g transform="translate(456 300)"><path d="M0,0h40l-5,54a6,6 0 0 1 -6,5h-18a6,6 0 0 1 -6,-5z" fill="#fff" stroke="#178E80" stroke-width="3"/><path d="M3,22h34l-3,32a6,6 0 0 1 -6,5h-16a6,6 0 0 1 -6,-5z" fill="#F6E7B8"/><path d="M26,0l10,-22" stroke="#178E80" stroke-width="4" stroke-linecap="round"/></g>';
      var FT = { oral: 'Oral diet', ons: 'Oral diet + ONS', tube: 'Tube feeding', pn: 'Parenteral nutrition' };
      /* inside labels */
      if (ins) {
        var lab = function (x, y, tx, ty, t) { return '<path d="M' + x + ',' + y + 'L' + tx + ',' + ty + '" stroke="currentColor" stroke-width="1" opacity=".5"/><circle cx="' + x + '" cy="' + y + '" r="3" fill="currentColor"/><text x="' + (tx + (tx > 300 ? 6 : -6)) + '" y="' + (ty + 5) + '" text-anchor="' + (tx > 300 ? 'start' : 'end') + '" font-size="17" font-weight="600" fill="currentColor">' + t + '</text>' };
        var k = child ? .8 : 1, Y = function (y) { return f(752 - (752 - y) * k) }, X = function (x) { return f(300 + (x - 300) * k) };
        h += lab(X(326), Y(250), 486, Y(226), 'Heart') + lab(X(270), Y(304), 110, Y(290), 'Liver') + lab(X(344), Y(326), 492, Y(318), 'Stomach') + lab(X(262), Y(396), 104, Y(396), 'Bowel') + lab(X(336), Y(520), 480, Y(520), 'Thigh muscle') + lab(X(262), Y(650), 110, Y(650), 'Calf muscle');
      }
      /* body-composition gauge */
      var bar = function (y, t, v, c) { return '<text x="24" y="' + y + '" font-size="15" font-weight="600" fill="currentColor" opacity=".8">' + t + '</text><rect x="24" y="' + (y + 8) + '" width="120" height="9" rx="4.5" fill="currentColor" opacity=".14"/><rect x="24" y="' + (y + 8) + '" width="' + f(120 * clamp(v, .04, 1)) + '" height="9" rx="4.5" fill="' + c + '"/>' };
      h += bar(34, 'Muscle', m, m < .5 ? '#D9653F' : '#178E80') + bar(78, 'Fat', fa, fa > .75 || fa < .25 ? '#C98A1E' : '#178E80') + (oe > .1 ? bar(122, 'Oedema', oe, '#2F80ED') : '');
      if (s.feeding) h += '<g transform="translate(24 ' + (oe > .1 ? 168 : 124) + ')"><rect width="' + (FT[s.feeding].length * 8.6 + 24) + '" height="30" rx="15" fill="#178E80" opacity=".14"/><text x="12" y="20" font-size="15" font-weight="600" fill="currentColor">' + FT[s.feeding] + '</text></g>';
      /* highlight ring */
      var HL = { muscle: [336, 520, 60], stomach: [334, 328, 44], gut: [300, 396, 62], heart: [320, 250, 38], liver: [280, 304, 46] };
      if (hl && HL[hl]) { var q = HL[hl], kk = child ? .8 : 1; h += '<circle class="af-hl" cx="' + f(300 + (q[0] - 300) * kk) + '" cy="' + f(752 - (752 - q[1]) * kk) + '" r="' + f(q[2] * kk) + '" fill="none" stroke="#E3A13A" stroke-width="4" stroke-dasharray="6 8"><animateTransform attributeName="transform" type="rotate" from="0 ' + f(300 + (q[0] - 300) * kk) + ' ' + f(752 - (752 - q[1]) * kk) + '" to="360 ' + f(300 + (q[0] - 300) * kk) + ' ' + f(752 - (752 - q[1]) * kk) + '" dur="9s" repeatCount="indefinite"/></circle>'; }
      svg.innerHTML = h;
      svg.setAttribute('aria-label', (s.build === 'child' ? 'Child' : s.build === 'older' ? 'Older adult' : 'Adult') + ' patient, ' + (ins ? 'inside view with muscle and organs' : 'outside view'));
    }

    var shown = {}; NUM.forEach(function (k) { shown[k] = st[k] });
    function frame() { var s = {}; for (var k in st) s[k] = st[k]; NUM.forEach(function (k) { s[k] = shown[k] }); draw(s) }
    function tween() {
      cancelAnimationFrame(raf);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { NUM.forEach(function (k) { shown[k] = st[k] }); frame(); return }
      (function step() {
        if (dead) return; var moving = false;
        NUM.forEach(function (k) { var d = st[k] - shown[k]; if (Math.abs(d) > .004) { shown[k] += d * .09; moving = true } else shown[k] = st[k] });
        frame(); if (moving) raf = requestAnimationFrame(step);
      })();
    }
    frame();
    requestAnimationFrame(function () { if (!dead && o.onReady) o.onReady() });
    return {
      set: function (p) { take(p || {}); tween() },
      now: function (p) { take(p || {}); NUM.forEach(function (k) { shown[k] = st[k] }); frame() },
      flash: function (kind) { if (!svg.animate) return; var c = kind === 'ok' ? '#2E8A57' : kind === 'warn' ? '#BF7D17' : '#C23B30'; svg.animate([{ filter: 'drop-shadow(0 0 0 ' + c + ')' }, { filter: 'drop-shadow(0 0 26px ' + c + ')' }, { filter: 'drop-shadow(0 0 0 ' + c + ')' }], { duration: 1100, easing: 'ease-out' }) },
      highlight: function (k) { hl = k || null; frame() },
      view: function (v) { st.view = v; frame() },
      dispose: function () { dead = true; cancelAnimationFrame(raf); if (svg.parentNode) svg.parentNode.removeChild(svg) }
    };
  }
  return { create: create, supported: function () { return !!window.SVGElement } };
})();
