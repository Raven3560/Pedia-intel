/* BABYFRONT: a front-facing, semi-reclined baby drawn as painted SVG, for the Case lab bedside and hero.
   The baby rests against a wedge pillow, either in a neonatal incubator (engine "nicu") or on an examination
   mattress (engine "home"). Shading uses layered fills and soft gradients rather than outlines, so the body reads
   with volume. Clinical detail follows what a clinician would see at the cot side: ECG pads and leads, an oral
   feeding tube taped to the cheek, a skin temperature probe, a pulse-oximeter on the foot, a cannula, an ID band,
   and a clamped umbilical stump in newborns.
   States: crying, stress, sleepiness, abdominal distension, duskiness, jaundice (skin and sclera), eczema rash,
   posseting and vomiting (milk, vomit, bile), feeding, stomach fill, bowel gas and stool (with a nappy-check inset).
   Views: outside, inside (translucent trunk with labelled organs) and gut (zoomed abdomen).
   API (same as BABYVIEW): create(host, opts) -> set(), now(), flash(), highlight(), view(), real(), ready(), dispose(). */
var BABYFRONT = (function () {
  var UID = 0;
  function f(n) { return Math.round(n * 100) / 100 }
  function lerp(a, b, t) { return a + (b - a) * t }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
  function cr(P, closed) {
    var n = P.length, d = 'M' + f(P[0][0]) + ',' + f(P[0][1]), m = closed ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var p0 = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ',' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ',' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function tube(S) {
    var n = S.length, L = [], R = [], t0, t1;
    for (var i = 0; i < n; i++) {
      var a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      if (i === 0) t0 = [tx, ty]; if (i === n - 1) t1 = [tx, ty];
      L.push([S[i][0] - ty * S[i][2], S[i][1] + tx * S[i][2]]); R.push([S[i][0] + ty * S[i][2], S[i][1] - tx * S[i][2]]);
    }
    function cap(p, t, s) { var r = p[2], nx = -t[1], ny = t[0]; return [[p[0] + (nx * .72 * s + t[0] * .72) * r, p[1] + (ny * .72 * s + t[1] * .72) * r], [p[0] + t[0] * r, p[1] + t[1] * r], [p[0] + (-nx * .72 * s + t[0] * .72) * r, p[1] + (-ny * .72 * s + t[1] * .72) * r]] }
    return cr(L.concat(cap(S[n - 1], t1, 1), R.reverse(), cap(S[0], [-t0[0], -t0[1]], -1)), true);
  }
  function mir(P) { return P.map(function (p) { var q = p.slice(); q[0] = 600 - q[0]; return q }) }
  function el(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag) }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

  function create(host, o) {
    o = o || {};
    var pre = 'bf' + (++UID) + '-', I = function (n) { return pre + n }, U = function (n) { return 'url(#' + pre + n + ')' };
    var PT = o.variant === 'preterm', NICU = o.engine === 'nicu' || PT, AGE = PT ? 'preterm' : (o.age || 'newborn'), INF = AGE === 'infant';
    var K = PT ? .8 : INF ? 1.06 : 1, LR = PT ? .66 : INF ? .86 : .8, BW = PT ? .8 : INF ? .9 : .87, COT = o.engine === 'cot', DEV = o.devices !== false && !COT;
    var st = { view: o.view || (o.mode === 'inside' || o.mode === 'gut' ? o.mode : 'outside'), ins: 0, fill: o.fill == null ? .35 : o.fill, fillT: o.fill == null ? .35 : o.fill,
      dist: 0, distT: 0, stress: 0, stressT: 0, cry: 0, cryV: 0, gas: 0, gasT: 0, jit: 0, stool: 'idle', colour: 'normal', spit: 0, spitV: 0, spitCol: 'milk', rash: 0, rashT: 0,
      jaund: 0, jaundT: 0, dusk: 0, duskT: 0, sleepy: 0, sleepyT: 0, feeding: !!o.feeding, scale: 1, scaleT: 1, flash: 0, flashT: 0, flashCol: '#22c55e', hl: null,
      hr: o.hr || 140, alarm: !!o.alarm, cpap: !!o.cpap, cpapV: 0 };
    if (st.view === 'nicu') st.view = 'outside';
    var SEAT = [300, 440];
    function B(x, y) { return [SEAT[0] + (x - SEAT[0]) * K, SEAT[1] + (y - SEAT[1]) * K] }

    /* ---------- palette ---------- */
    var P = PT ? { hi: '#FAE0D6', hi2: '#F5CDBF', base: '#F0B9A7', mid: '#E7A28E', mid2: '#DC8E78', sh: '#C77560', deep: '#A35745', lip: '#D77C74', lip2: '#E5968D' }
      : INF ? { hi: '#FCE8DA', hi2: '#F8D6C1', base: '#F2C3A6', mid: '#E8AE8D', mid2: '#DD9A79', sh: '#C98163', deep: '#A8634A', lip: '#D58479', lip2: '#E49C90' }
        : { hi: '#FBE8DE', hi2: '#F7D7CA', base: '#F2C7B5', mid: '#E8B19E', mid2: '#DD9D89', sh: '#C98671', deep: '#A86956', lip: '#D7837A', lip2: '#E59D92' };

    /* ---------- geometry (term newborn, world units) ---------- */
    var HEAD = [[300, 128], [336, 134], [361, 154], [372, 186], [371, 213], [364, 236], [348, 256], [325, 270], [300, 277], [275, 270], [252, 256], [236, 236], [229, 213], [228, 186], [239, 154], [264, 134]];
    if (PT) { HEAD = HEAD.map(function (p) { return [300 + (p[0] - 300) * 1.08, 210 + (p[1] - 210) * 1.08] }); }
    var EAR = [[235, 197], [228, 198], [224, 207], [224, 220], [228, 229], [235, 232]];
    if (PT) EAR = EAR.map(function (p) { return [300 + (p[0] - 300) * 1.08, 210 + (p[1] - 210) * 1.08] });
    var TORSO = [[300, 266], [338, 268], [368, 281], [380, 302], [380, 330], [381, 356], [379, 380], [370, 397], [342, 407], [300, 410], [258, 407], [230, 397], [221, 380], [219, 356], [220, 330], [220, 302], [232, 281], [262, 268]];
    TORSO = TORSO.map(function (p) { return [300 + (p[0] - 300) * BW, p[1]] });
    function scl(sp) { return sp.map(function (p) { return [p[0], p[1], p[2] * LR] }) }
    var ARM = scl([[246, 294, 18], [227, 309, 18], [208, 330, 15.5], [201, 354, 14.5], [204, 376, 13.5], [212, 392, 12.4]]);
    var FORE = ARM.slice(3);
    var LEG = scl([[270, 404, 29], [240, 417, 27], [212, 428, 24], [208, 446, 19.5], [226, 458, 16], [248, 463, 13.5]]);
    ARM = ARM.map(function (p) { return [300 + (p[0] - 300) * (BW + .04), p[1], p[2]] }); FORE = ARM.slice(3); LEG = LEG.map(function (p) { return [300 + (p[0] - 300) * (BW + .06), p[1], p[2]] });
    var armR = mir(ARM), foreR = mir(FORE), legR = mir(LEG);
    var HAND = [ARM[5][0] + 5, ARM[5][1] + 12], FOOT = [LEG[5][0] + 15, LEG[5][1] - 2];
    var DIAPER = [[224, 384], [262, 379], [300, 383], [338, 379], [376, 384], [383, 399], [364, 421], [336, 437], [300, 447], [264, 437], [236, 421], [217, 399]];
    DIAPER = DIAPER.map(function (p) { return [300 + (p[0] - 300) * BW, p[1]] });
    var EYE = PT ? 211 : 207, EX = PT ? 27 : 26, NOSE = EYE + 18, MOUTH = EYE + 37;

    /* organs (front view: the baby's right is on the viewer's left) */
    var LUNG_L = [[296, 280], [280, 276], [262, 282], [248, 300], [242, 322], [246, 338], [262, 342], [282, 336], [292, 322], [296, 300]];
    var LUNG_R = [[304, 280], [320, 276], [338, 282], [352, 300], [358, 322], [354, 338], [340, 342], [326, 340], [322, 330], [312, 322], [306, 300]];
    var HEART = [[294, 302], [306, 296], [322, 300], [332, 312], [330, 326], [318, 336], [304, 340], [294, 332], [290, 316]];
    var LIVER = [[226, 342], [240, 334], [264, 332], [292, 336], [314, 338], [330, 342], [318, 350], [300, 356], [284, 366], [266, 376], [248, 378], [234, 370], [226, 356]];
    var STOM = [[318, 344], [330, 338], [346, 340], [358, 350], [360, 364], [354, 376], [342, 384], [326, 386], [312, 382], [304, 374], [310, 368], [322, 370], [332, 364], [334, 352]];
    var SPLEEN = [[362, 348], [371, 356], [371, 370], [363, 377], [358, 362]];
    var COLON = [[246, 418], [238, 405], [236, 392], [242, 382], [258, 380], [280, 386], [300, 388], [320, 384], [340, 380], [356, 384], [363, 396], [363, 410], [355, 420], [337, 425], [322, 429], [308, 436]];
    var ESO = [[300, 256], [300, 280], [304, 310], [312, 330], [321, 344]];
    var SI = (function () {
      var Q = [[312, 388]], rows = [393, 399, 405, 411, 417], k = 0;
      rows.forEach(function (y, r) { var dir = r % 2 ? 1 : -1, x0 = dir < 0 ? 344 : 258, x1 = dir < 0 ? 258 : 344; for (var j = 0; j <= 9; j++) { Q.push([lerp(x0, x1, j / 9) + Math.sin(k * 1.9 + r) * 1.5, y + Math.sin(k * 2.7 + r * 1.3) * 2.6 * (j > 0 && j < 9 ? 1 : .3)]); k++ } });
      Q.push([252, 418]); return Q;
    })();
    [LUNG_L, LUNG_R, HEART, LIVER, STOM, SPLEEN, COLON, ESO, SI].forEach(function (A) { A.forEach(function (p) { p[0] = 300 + (p[0] - 300) * BW }) });

    /* ---------- painting helpers ---------- */
    var LX = -.34, LY = -.42;
    var LG = [], lgN = 0;
    function limb(sp, gid) {
      /* one smooth fill with a gradient running across the limb (lit from the upper left), plus a soft sheen along its length */
      var m = sp[Math.floor(sp.length / 2)], a = sp[0], b = sp[sp.length - 1], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
      if (nx * LX + ny * LY < 0) { nx = -nx; ny = -ny }
      var r = m[2] * 1.15, id = gid || 'lg' + (lgN++);
      if (gid) return '<path d="' + tube(sp) + '" fill="' + U(gid) + '"/>';
      LG.push('<linearGradient id="' + I(id) + '" gradientUnits="userSpaceOnUse" x1="' + f(m[0] + nx * r) + '" y1="' + f(m[1] + ny * r) + '" x2="' + f(m[0] - nx * r) + '" y2="' + f(m[1] - ny * r) + '"><stop offset="0" stop-color="' + P.mid + '"/><stop offset=".22" stop-color="' + P.hi2 + '"/><stop offset=".42" stop-color="' + P.base + '"/><stop offset=".75" stop-color="' + P.mid + '"/><stop offset="1" stop-color="' + P.sh + '"/></linearGradient>');
      var sheen = sp.map(function (p) { return [p[0] + nx * p[2] * .38, p[1] + ny * p[2] * .38, p[2] * .3] });
      return '<path d="' + tube(sp) + '" fill="' + U(id) + '"/>';
    }
    function crease(sp, i, dark, w) {
      var a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, p = sp[i], r = p[2] * (w || .8);
      var d = 'M' + f(p[0] - nx * r) + ',' + f(p[1] - ny * r) + ' Q' + f(p[0] + tx / l * 3) + ',' + f(p[1] + ty / l * 3) + ' ' + f(p[0] + nx * r) + ',' + f(p[1] + ny * r);
      return '<path d="' + d + '" stroke="' + P.deep + '" stroke-opacity="' + (dark || .4) + '" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="' + d + '" transform="translate(' + f(tx / l * 2) + ' ' + f(ty / l * 2) + ')" stroke="#FFF2EA" stroke-opacity=".45" stroke-width="1" fill="none" stroke-linecap="round"/>';
    }
    function blob(cx, cy, rx, ry, grad, op, rot) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + U(grad) + '"' + (op != null ? ' opacity="' + op + '"' : '') + (rot ? ' transform="rotate(' + rot + ' ' + f(cx) + ' ' + f(cy) + ')"' : '') + '/>' }
    function rg(id, c, a0, a1, cx, cy, r, mid) { return '<radialGradient id="' + I(id) + '" cx="' + (cx || .5) + '" cy="' + (cy || .5) + '" r="' + (r || .5) + '"><stop offset="' + (mid || 0) + '" stop-color="' + c + '" stop-opacity="' + a0 + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="' + a1 + '"/></radialGradient>' }
    function fist(cx, cy, s, flip) {
      var w = 12 * s * LR, h = 14 * s * LR, x = cx, y = cy, sg = flip ? -1 : 1;
      var body = 'M' + f(x - w) + ',' + f(y - h * .6) + ' C' + f(x - w * 1.15) + ',' + f(y + h * .3) + ' ' + f(x - w * .7) + ',' + f(y + h * 1.05) + ' ' + f(x) + ',' + f(y + h * 1.05) + ' C' + f(x + w * .75) + ',' + f(y + h * 1.05) + ' ' + f(x + w * 1.15) + ',' + f(y + h * .3) + ' ' + f(x + w) + ',' + f(y - h * .6) + ' C' + f(x + w * .6) + ',' + f(y - h * 1.1) + ' ' + f(x - w * .6) + ',' + f(y - h * 1.1) + ' ' + f(x - w) + ',' + f(y - h * .6) + 'Z';
      var s2 = '<path d="' + body + '" fill="' + U('skL') + '"/>' + blob(x, y + h * .55, w * .95, h * .55, 'flush', .7) + blob(x + sg * -w * .3, y - h * .25, w * .55, h * .5, 'hl', .5);
      for (var i = 0; i < 3; i++) { var fx = x - w * .55 + i * w * .55; s2 += '<path d="M' + f(fx) + ',' + f(y + h * .35) + ' q' + f(1.5 * sg) + ',' + f(h * .4) + ' 0,' + f(h * .62) + '" stroke="' + P.deep + '" stroke-opacity=".38" stroke-width="1" fill="none" stroke-linecap="round"/>' }
      s2 += '<path d="M' + f(x + sg * w * .95) + ',' + f(y - h * .1) + ' q' + f(-sg * w * .5) + ',' + f(h * .5) + ' ' + f(-sg * w * .9) + ',' + f(h * .45) + '" stroke="' + P.deep + '" stroke-opacity=".35" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
      return s2;
    }
    function foot(cx, cy, s, flip) {
      var sg = flip ? -1 : 1, rx = 13 * s * LR, ry = 18 * s * LR, rot = 24 * sg, out = '<g transform="rotate(' + rot + ' ' + f(cx) + ' ' + f(cy) + ')">';
      out += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + U('skL') + '"/>' + blob(cx, cy + ry * .2, rx * .9, ry * .7, 'flush', .55) + blob(cx - rx * .3, cy - ry * .2, rx * .5, ry * .5, 'hl', .45);
      for (var i = 0; i < 5; i++) { var a = -1 + i * .5, tx = cx + a * rx * .78, ty = cy - ry * .92 + Math.abs(a) * ry * .28, tr = (i === 0 ? 4.2 : 3.2 - Math.abs(a) * .5) * s * LR; out += '<circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + f(tr) + '" fill="' + U('skL') + '"/><circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + f(tr) + '" fill="' + U('flush') + '" opacity=".6"/>' }
      out += '<path d="M' + f(cx - rx * .6) + ',' + f(cy + ry * .1) + ' Q' + f(cx) + ',' + f(cy + ry * .3) + ' ' + f(cx + rx * .5) + ',' + f(cy - ry * .05) + '" stroke="' + P.deep + '" stroke-opacity=".25" stroke-width="1" fill="none"/>';
      return out + '</g>';
    }

    /* ---------- defs ---------- */
    var defs = [
      '<radialGradient id="' + I('skH') + '" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".45" stop-color="' + P.base + '"/><stop offset=".85" stop-color="' + P.mid + '"/><stop offset="1" stop-color="' + P.mid2 + '"/></radialGradient>',
      '<radialGradient id="' + I('skT') + '" cx=".42" cy=".34" r=".75"><stop offset="0" stop-color="' + P.hi + '"/><stop offset=".5" stop-color="' + P.base + '"/><stop offset=".86" stop-color="' + P.mid + '"/><stop offset="1" stop-color="' + P.mid2 + '"/></radialGradient>',
      '<radialGradient id="' + I('skL') + '" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="' + P.hi2 + '"/><stop offset=".6" stop-color="' + P.base + '"/><stop offset="1" stop-color="' + P.mid2 + '"/></radialGradient>',
      '<radialGradient id="' + I('ao') + '" cx=".5" cy=".45" r=".56"><stop offset=".62" stop-color="' + P.deep + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.deep + '" stop-opacity=".5"/></radialGradient>',
      rg('hl', '#FFF7F1', .75, 0), '<linearGradient id="' + I('hairM') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A6A52" stop-opacity="' + (INF ? .7 : .5) + '"/><stop offset=".45" stop-color="#9A785E" stop-opacity="' + (INF ? .35 : .2) + '"/><stop offset=".9" stop-color="#9A785E" stop-opacity="0"/></linearGradient>', rg('rim', '#DCEBFF', .45, 0), rg('flush', '#E8695C', .5, 0), rg('flush2', '#E35F55', .32, 0), rg('shade', P.deep, .45, 0), rg('shadeD', '#2B1810', .35, 0),
      rg('glowR', '#FF3B30', .9, 0), rg('halo', '#22c55e', .55, 0), rg('win', '#FFFFFF', .7, 0), rg('warm', '#FFE2BE', .55, 0), rg('veinG', '#7189B8', .0, 0),
      '<linearGradient id="' + I('scl') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFC3BE"/><stop offset=".45" stop-color="#F3EFEC"/><stop offset="1" stop-color="#FAF8F6"/></linearGradient>',
      '<radialGradient id="' + I('iris') + '" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#6A8295"/><stop offset=".55" stop-color="#43586A"/><stop offset=".9" stop-color="#2A3845"/><stop offset="1" stop-color="#1B242C"/></radialGradient>',
      '<radialGradient id="' + I('dia') + '" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F0F4F5"/><stop offset="1" stop-color="#D2DDE1"/></radialGradient>',
      '<linearGradient id="' + I('wall') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bf-wall1)"/><stop offset="1" stop-color="var(--bf-wall2)"/></linearGradient>',
      '<linearGradient id="' + I('sheet') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bf-sheet1)"/><stop offset="1" stop-color="var(--bf-sheet2)"/></linearGradient>',
      '<radialGradient id="' + I('pillow') + '" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="var(--bf-pil1)"/><stop offset=".8" stop-color="var(--bf-pil2)"/><stop offset="1" stop-color="var(--bf-pil3)"/></radialGradient>',
      '<linearGradient id="' + I('glass') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4FBFF" stop-opacity=".32"/><stop offset=".35" stop-color="#E8F5FC" stop-opacity=".05"/><stop offset=".7" stop-color="#E8F5FC" stop-opacity=".03"/><stop offset="1" stop-color="#E8F5FC" stop-opacity=".18"/></linearGradient>',
      '<linearGradient id="' + I('foil') + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F6F8"/><stop offset=".45" stop-color="#B9C2CB"/><stop offset=".6" stop-color="#EEF2F5"/><stop offset="1" stop-color="#9AA6B1"/></linearGradient>',
      '<radialGradient id="' + I('liver') + '" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#C45B4B"/><stop offset=".6" stop-color="#9B3A30"/><stop offset="1" stop-color="#6E231E"/></radialGradient>',
      '<radialGradient id="' + I('stom') + '" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#F7B3B0"/><stop offset=".7" stop-color="#E6878A"/><stop offset="1" stop-color="#C3626A"/></radialGradient>',
      '<radialGradient id="' + I('lung') + '" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#FBD0D6"/><stop offset="1" stop-color="#E592A2"/></radialGradient>',
      '<radialGradient id="' + I('heart') + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#E7606C"/><stop offset="1" stop-color="#9E2236"/></radialGradient>',
      '<clipPath id="' + I('cT') + '"><path d="' + cr(TORSO, true) + '"/><path d="' + cr(DIAPER, true) + '"/></clipPath>',
      '<clipPath id="' + I('cH') + '"><path d="' + cr(HEAD, true) + '"/></clipPath>',
      '<clipPath id="' + I('cS') + '"><path d="' + cr(STOM, true) + '"/></clipPath>'
    ].join('');
    function eyeClip(x) { return '<clipPath id="' + I('ce' + Math.round(x)) + '"><path d="' + almond(x) + '"/></clipPath>' }
    function eyePts(x) { var s = x < 300 ? 1 : -1; return { s: s, O: [x - s * 12, EYE + .6], I: [x + s * 12, EYE + 1.6], u1: [x - s * 7, EYE - 7.6], u2: [x + s * 5, EYE - 8.2], l1: [x + s * 6, EYE + 5.6], l2: [x - s * 6, EYE + 5.4] } }
    function almond(x) { var e = eyePts(x); return 'M' + e.O + ' C' + e.u1 + ' ' + e.u2 + ' ' + e.I + ' C' + e.l1 + ' ' + e.l2 + ' ' + e.O + 'Z' }
    defs += eyeClip(300 - EX) + eyeClip(300 + EX);

    /* ---------- scene parts ---------- */
    var room = '<rect x="-600" y="-600" width="1800" height="1800" fill="' + U('wall') + '"/>' +
      '<ellipse cx="120" cy="60" rx="260" ry="190" fill="' + U('win') + '" opacity=".75"/>' +
      '<rect x="-600" y="520" width="1800" height="700" fill="var(--bf-floor)"/>' +
      (COT ? '' : '<rect x="452" y="40" width="70" height="120" rx="8" fill="var(--bf-prop)" opacity=".5"/><rect x="460" y="52" width="54" height="34" rx="4" fill="var(--bf-prop2)" opacity=".55"/>') +
      (NICU ? '' : '<ellipse cx="300" cy="40" rx="240" ry="150" fill="' + U('warm') + '"' + (COT ? ' opacity=".6"' : '') + '/>');
    var bed = COT
      ? '<g opacity=".9">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var x = 70 + i * 42; return '<rect x="' + x + '" y="150" width="12" height="300" rx="6" fill="var(--bf-slat)"/>' }).join('') + '<rect x="52" y="132" width="496" height="22" rx="11" fill="var(--bf-rail)"/></g>' +
        '<rect x="44" y="430" width="512" height="80" rx="28" fill="var(--bf-mat)"/><path d="M64 432 Q300 418 536 432 L540 478 Q300 492 60 478Z" fill="' + U('sheet') + '"/>' +
        ''
      : NICU
      ? '<rect x="64" y="470" width="472" height="24" rx="9" fill="var(--bf-tray)" stroke="var(--bf-edge)" stroke-width="1.5"/>' +
        '<rect x="96" y="494" width="408" height="58" rx="11" fill="var(--bf-panel)" stroke="var(--bf-edge)" stroke-width="1.5"/>' +
        '<rect x="232" y="505" width="136" height="34" rx="6" fill="#0F2A33"/><text x="246" y="528" class="bf-lcd">36.8°C</text><text x="330" y="519" class="bf-lcd s">AIR</text><text x="330" y="531" class="bf-lcd s">55%</text>' +
        '<circle cx="140" cy="522" r="7" fill="#C8D3DA"/><circle cx="168" cy="522" r="7" fill="#C8D3DA"/><circle data-k="led" cx="458" cy="522" r="5" fill="#3CC28A"/><circle data-k="alarmLed" cx="436" cy="522" r="5" fill="#EF4444" opacity=".15"/>' +
        '<rect x="128" y="552" width="344" height="80" rx="6" fill="var(--bf-cab)"/>' +
        '<rect x="84" y="420" width="432" height="56" rx="20" fill="' + U('sheet') + '"/>'
      : '<rect x="40" y="440" width="520" height="70" rx="24" fill="var(--bf-vinyl)"/><rect x="40" y="500" width="520" height="16" rx="8" fill="var(--bf-vinyl2)"/>' +
        '<path d="M70 434 Q300 420 530 434 L536 476 Q300 490 64 476Z" fill="' + U('sheet') + '"/>' +
        '<path d="M120 470 Q200 462 260 474 M360 474 Q420 462 486 470" stroke="var(--bf-fold)" stroke-width="2" fill="none" stroke-linecap="round"/>';
    var pillows = '<rect x="170" y="196" width="260" height="250" rx="70" fill="' + U('pillow') + '"/>' +
      '<rect x="86" y="318" width="132" height="132" rx="40" fill="' + U('pillow') + '"/><rect x="382" y="318" width="132" height="132" rx="40" fill="' + U('pillow') + '"/>' +
      '<path d="M110 430 Q150 410 196 432 M404 432 Q450 410 490 430" stroke="var(--bf-fold)" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    var contact = '<ellipse cx="300" cy="460" rx="150" ry="26" fill="' + U('shadeD') + '"/><ellipse cx="300" cy="290" rx="110" ry="100" fill="' + U('shadeD') + '" opacity=".5"/>';

    /* body */
    var arms = '<g data-k="armL">' + limb(ARM) + crease(ARM, 2, .3) + '</g><g data-k="armR">' + limb(armR) + crease(armR, 2, .3) + '</g>';
    var torso = '<g data-k="torso"><path d="' + cr(TORSO, true) + '" fill="' + U('skT') + '"/><path d="' + cr(TORSO, true) + '" fill="' + U('ao') + '"/>' +
      '<g transform="translate(300 0) scale(' + BW + ' 1) translate(-300 0)">' + blob(282, 306, 34, 22, 'hl', .45) + blob(292, 360, 36, 22, 'hl', .38) + blob(374, 338, 12, 56, 'shade', .6) + blob(226, 338, 10, 54, 'shade', .4) +
      '<path d="M256 284 Q274 291 292 285 M308 285 Q326 291 344 284" stroke="' + P.deep + '" stroke-opacity=".16" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      blob(272, 312, 7, 6, 'flush', .6) + blob(328, 312, 7, 6, 'flush', .6) + '<ellipse cx="272" cy="312" rx="2.6" ry="2.2" fill="#C9816F" opacity=".75"/><ellipse cx="328" cy="312" rx="2.6" ry="2.2" fill="#C9816F" opacity=".75"/>' + '</g>' +
      '<g data-k="bulge" opacity="0"><ellipse cx="300" cy="368" rx="' + f(76 * BW) + '" ry="46" fill="' + U('skT') + '"/>' + blob(292, 356, 50, 26, 'hl', .7) + '<ellipse cx="300" cy="368" rx="' + f(76 * BW) + '" ry="46" fill="' + U('ao') + '" opacity=".7"/></g>' +
      '<g data-k="veins" opacity="0" stroke="#7D8FC0" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-opacity=".55"><path d="M262 352 Q272 362 268 378 M338 350 Q330 364 336 380 M286 340 Q292 352 288 366"/></g>' +
      '<g data-k="belDusk" opacity="0">' + blob(300, 372, 62, 34, 'veinG', 1) + '<ellipse cx="300" cy="372" rx="60" ry="32" fill="#6C6F96" opacity=".25"/></g>' +
      (AGE === 'infant' ? '<ellipse cx="300" cy="372" rx="3.4" ry="4.2" fill="' + P.deep + '" opacity=".45"/>' :
        '<g data-k="cord"><path d="M300 368 Q298 378 304 388" stroke="#B8955A" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M300 368 Q298 378 304 388" stroke="#D8BE84" stroke-width="3.5" fill="none" stroke-linecap="round" transform="translate(-1 -1)"/>' +
        '<rect x="295" y="383" width="20" height="7" rx="2" fill="#F3F6F8" stroke="#9FB4C2" stroke-width=".8" transform="rotate(14 305 386)"/><rect x="311" y="382" width="5" height="10" rx="1.5" fill="#4C8DD6" transform="rotate(14 305 386)"/></g>') +
      '</g>';
    var occl = '<g transform="translate(300 0) scale(' + BW + ' 1) translate(-300 0)">' + blob(232, 296, 8, 12, 'shade', .35) + blob(368, 296, 8, 12, 'shade', .35) + '</g>' + blob(300 - 70 * BW, 404, 20, 10, 'shade', .4) + blob(300 + 70 * BW, 404, 20, 10, 'shade', .4);
    var neck = blob(300, 272, 56, 13, 'shade', .85) + '<path d="M280 277 Q300 283 320 277" stroke="' + P.deep + '" stroke-opacity=".16" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    var legs = '<g data-k="legL">' + limb(LEG) + crease(LEG, 1, .35, .7) + crease(LEG, 3, .4, .75) + crease(LEG, 5, .45, .8) + '</g><g data-k="legR">' + limb(legR) + crease(legR, 1, .35, .7) + crease(legR, 3, .4, .75) + crease(legR, 5, .45, .8) + '</g>';
    var feet = foot(FOOT[0], FOOT[1], 1.02, false) + foot(600 - FOOT[0], FOOT[1], 1.02, true);
    var fore = '<g>' + limb(FORE, 'lg0') + crease(FORE, 2, .4, .8) + '</g><g>' + limb(foreR, 'lg1') + crease(foreR, 2, .4, .8) + '</g>' + fist(HAND[0], HAND[1], .95, false) + fist(600 - HAND[0], HAND[1], .95, true);
    var diaper = '<g data-k="diaper"><path d="' + cr(DIAPER, true) + '" fill="' + U('dia') + '"/><path d="' + cr(DIAPER, true) + '" fill="' + U('ao') + '" opacity=".35"/>' +
      '<g transform="translate(300 0) scale(' + BW + ' 1) translate(-300 0)">' + '<path d="' + cr([[226, 392], [262, 387], [300, 391], [338, 387], [374, 392]], false) + '" stroke="#DCE6EA" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="' + cr([[230, 396], [262, 391.5], [300, 395.5], [338, 391.5], [370, 396]], false) + '" stroke="#C6D5DB" stroke-width=".8" stroke-dasharray="1.2 2" fill="none"/>' +
      '<rect x="222" y="389" width="16" height="20" rx="5" fill="#9CCFE3"/><rect x="362" y="389" width="16" height="20" rx="5" fill="#9CCFE3"/>' +
      '<path d="M252 420 Q262 428 270 432 M348 420 Q338 428 330 432" stroke="#C9D6DB" stroke-width="1.4" fill="none" stroke-linecap="round"/>' + blob(286, 410, 30, 14, 'hl', .7) + '</g></g>';
    function ear(E2) { var x0 = E2[2][0], y0 = E2[0][1], y1 = E2[5][1], ym = (y0 + y1) / 2, dx = E2[0][0] - x0; return '<path d="' + cr(E2, true) + '" fill="' + U('skL') + '"/>' + blob(x0 + dx * .45, ym, Math.abs(dx) * .35, (y1 - y0) * .3, 'shade', .35) + blob(x0 + dx * .3, ym + 2, Math.abs(dx) * .4, (y1 - y0) * .35, 'flush', .45) + '<path d="M' + f(x0 + dx * .75) + ',' + f(y0 + 3) + ' Q' + f(x0 + dx * .15) + ',' + f(y0 + 8) + ' ' + f(x0 + dx * .25) + ',' + f(ym) + ' Q' + f(x0 + dx * .3) + ',' + f(y1 - 5) + ' ' + f(x0 + dx * .8) + ',' + f(y1 - 2) + '" stroke="' + P.deep + '" stroke-opacity=".22" stroke-width="1" fill="none" stroke-linecap="round"/>' }
    var ears = ear(EAR) + ear(mir(EAR));
    function hair() {
      if (PT) return '';
      var out = '<path d="M228 190 Q226 146 260 130 Q300 116 340 130 Q374 146 372 190 Q362 166 338 158 Q318 154 300 160 Q282 154 262 158 Q238 166 228 190Z" fill="' + U('hairM') + '"/>', n = INF ? 90 : 40, cx = 302, cy = 118;
      for (var i = 0; i < n; i++) {
        var x = 238 + rnd(i) * 124, y = 132 + rnd(i + 900) * (INF ? 50 : 40); if (Math.hypot((x - 300) / 70, (y - 196) / 66) > 1) continue;
        var dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, len = (INF ? 10 : 7) + rnd(i + 70) * (INF ? 8 : 6), cu = (rnd(i + 30) - .5) * 3, ux = dx / l, uy = dy / l, ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
        var ex = x + ux * len, ey = y + uy * len;
        out += '<path d="M' + f(x) + ',' + f(y) + ' Q' + f((x + ex) / 2 + uy * cu) + ',' + f((y + ey) / 2 - ux * cu) + ' ' + f(ex) + ',' + f(ey) + '" stroke="' + (rnd(i + 5) > .5 ? '#A88468' : '#86664F') + '" stroke-opacity="' + f(.05 + rnd(i + 9) * .08) + '" stroke-width="' + f(.5 + rnd(i + 50) * .4) + '" fill="none" stroke-linecap="round"/>';
      }
      return '<g clip-path="' + U('cH') + '">' + out + '</g>';
    }
    function cap() {
      if (!PT) return '';
      var c = '<path d="M222 196 Q220 148 258 128 Q300 110 342 128 Q380 148 378 196 Q300 180 222 196Z" fill="#8EC5BC"/>';
      for (var i = 0; i < 14; i++) { var x = 232 + i * 10.5; c += '<path d="M' + x + ',' + (192 - Math.sin(i / 13 * Math.PI) * 10) + ' Q' + (x + 2) + ',150 ' + (300 + (x - 300) * .3) + ',122" stroke="#7AB3AA" stroke-width="1.4" fill="none" opacity=".7"/>' }
      return c + '<path d="M220 196 Q300 178 380 196 L382 208 Q300 190 218 208Z" fill="#79B2A9"/>' + blob(276, 146, 40, 18, 'hl', .45);
    }
    function eyeOpen(x) {
      var e = eyePts(x), s2 = e.s, ce = U('ce' + Math.round(x)), side = x < 300 ? 'L' : 'R';
      var lid = 'M' + [e.O[0] - s2 * .6, e.O[1] + .2] + ' C' + [e.u1[0], e.u1[1] - .4] + ' ' + [e.u2[0], e.u2[1] - .4] + ' ' + e.I;
      return '<g data-k="eo' + side + '">' + blob(x, EYE - 4, 17, 9, 'shade', .2) + blob(x - s2, EYE - 9.5, 13, 4.2, 'hl', .55) +
        '<path d="' + almond(x) + '" fill="' + U('scl') + '"/><path data-k="sclJ' + side + '" d="' + almond(x) + '" fill="#E8C64A" opacity="0"/>' +
        '<g clip-path="' + ce + '"><circle cx="' + f(x + s2) + '" cy="' + f(EYE - .4) + '" r="6.5" fill="' + U('iris') + '"/><circle cx="' + f(x + s2) + '" cy="' + f(EYE - .4) + '" r="6.5" fill="none" stroke="#1B242C" stroke-opacity=".55" stroke-width=".9"/><circle cx="' + f(x + s2) + '" cy="' + f(EYE - .4) + '" r="2.7" fill="#0D1317"/>' +
        '<path d="' + almond(x) + '" fill="none" stroke="#6A4338" stroke-opacity=".28" stroke-width="3.4" transform="translate(0 -1.8)"/></g>' +
        '<ellipse cx="' + f(e.I[0] - s2 * 1.4) + '" cy="' + f(e.I[1] - .3) + '" rx="1.9" ry="1.3" fill="#E2A398"/>' +
        '<circle cx="' + f(x - 1.4) + '" cy="' + f(EYE - 3) + '" r="1.6" fill="#fff" opacity=".95"/><circle cx="' + f(x + 2.6) + '" cy="' + f(EYE + 1.6) + '" r=".7" fill="#fff" opacity=".5"/>' +
        '<path d="' + lid + '" stroke="#4A2F27" stroke-opacity=".62" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
        [0, 1, 2, 3].map(function (k) { var t = .1 + k * .12, px = lerp(e.O[0], x, t * 1.6), py = EYE - 2 - k * 1.6; return '<path d="M' + f(px) + ',' + f(py) + ' l' + f(-s2 * 1.2) + ',-1.5" stroke="#4A2F27" stroke-opacity=".4" stroke-width=".6" stroke-linecap="round"/>' }).join('') +
        '<path d="M' + f(x - s2 * 10) + ',' + f(EYE - 8.8) + ' Q' + f(x) + ',' + f(EYE - 13.2) + ' ' + f(x + s2 * 10) + ',' + f(EYE - 8.4) + '" stroke="' + P.deep + '" stroke-opacity=".13" stroke-width="1" fill="none"/>' +
        '<path d="M' + f(x - s2 * 9) + ',' + f(EYE + 5.4) + ' Q' + f(x) + ',' + f(EYE + 7.6) + ' ' + f(x + s2 * 10) + ',' + f(EYE + 3.6) + '" stroke="#C98A7C" stroke-opacity=".35" stroke-width=".8" fill="none"/>' + blob(x, EYE + 8.5, 11, 3, 'shade', .14) + '</g>';
    }
    function eyeShut(x, sq) {
      var e = eyePts(x), s2 = e.s, out = blob(x - s2, EYE - 5, 13, 5, 'hl', .5);
      out += '<path d="M' + e.O + ' Q' + f(x) + ',' + f(EYE + (sq ? 3.2 : 5.2)) + ' ' + e.I + '" stroke="#4A2F27" stroke-opacity=".85" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
      if (sq) out += '<path d="M' + f(x - s2 * 9) + ',' + f(EYE - 4) + ' Q' + f(x) + ',' + f(EYE - .4) + ' ' + f(x + s2 * 9) + ',' + f(EYE - 4.4) + ' M' + f(e.O[0] - s2 * 2) + ',' + f(EYE + 2) + ' l' + f(-s2 * 4.5) + ',2.2 M' + f(x - 7) + ',' + f(EYE + 7.5) + ' Q' + f(x) + ',' + f(EYE + 10) + ' ' + f(x + 7) + ',' + f(EYE + 7.5) + '" stroke="' + P.deep + '" stroke-opacity=".4" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
      else out += [-.6, -.3, 0, .3, .6].map(function (t) { var px = x + t * 18, py = EYE + 4.6 - Math.abs(t) * 2.4; return '<path d="M' + f(px) + ',' + f(py) + ' l' + f(t * 1.5) + ',1.8" stroke="#4A2F27" stroke-opacity=".45" stroke-width=".6" stroke-linecap="round"/>' }).join('');
      return out;
    }
    var M = MOUTH, N = NOSE;
    var face = blob(264, EYE + 26, 19, 13, 'flush2', .7) + blob(336, EYE + 26, 19, 13, 'flush2', .7) + blob(268, EYE + 15, 13, 7, 'hl', .45) + blob(332, EYE + 15, 13, 7, 'hl', .45) +
      '<g data-k="brows"><path data-k="browL" d="M' + (300 - EX - 11) + ',' + (EYE - 15) + ' Q' + (300 - EX) + ',' + (EYE - 18.5) + ' ' + (300 - EX + 11) + ',' + (EYE - 15.5) + '" stroke="#C29A84" stroke-opacity=".28" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path data-k="browR" d="M' + (300 + EX - 11) + ',' + (EYE - 15.5) + ' Q' + (300 + EX) + ',' + (EYE - 18.5) + ' ' + (300 + EX + 11) + ',' + (EYE - 15) + '" stroke="#C29A84" stroke-opacity=".28" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
      '<g data-k="knit" opacity="0" stroke="' + P.deep + '" stroke-opacity=".4" stroke-width="1.1" fill="none" stroke-linecap="round"><path d="M293 ' + (EYE - 14) + ' Q296 ' + (EYE - 10.5) + ' 298 ' + (EYE - 14) + ' M302 ' + (EYE - 14) + ' Q304 ' + (EYE - 10.5) + ' 307 ' + (EYE - 14) + ' M296 ' + (EYE - 18) + ' Q300 ' + (EYE - 15.5) + ' 304 ' + (EYE - 18) + '"/></g>' +
      '<g data-k="eyesO">' + eyeOpen(300 - EX) + eyeOpen(300 + EX) + '</g>' +
      '<g data-k="eyesC" opacity="0">' + eyeShut(300 - EX) + eyeShut(300 + EX) + '</g>' +
      '<g data-k="eyesS" opacity="0">' + eyeShut(300 - EX, 1) + eyeShut(300 + EX, 1) + '</g>' +
      blob(300, EYE + 5, 3.2, 7, 'hl', .22) + blob(291.5, N + 1, 4, 6, 'shade', .3) + blob(308.5, N + 1, 4, 6, 'shade', .3) +
      '<ellipse cx="300" cy="' + N + '" rx="8" ry="6" fill="' + U('skL') + '" opacity=".55"/>' + blob(299, N - 1.5, 5, 3.6, 'hl', .7) +
      '<ellipse cx="291.6" cy="' + (N + 4.2) + '" rx="4" ry="3.2" fill="' + P.mid + '" opacity=".35"/><ellipse cx="308.4" cy="' + (N + 4.2) + '" rx="4" ry="3.2" fill="' + P.mid + '" opacity=".35"/>' +
      '<ellipse cx="295.3" cy="' + (N + 5.5) + '" rx="1.9" ry="1.05" fill="#8A4A3B" opacity=".55" transform="rotate(-20 295.3 ' + (N + 5.5) + ')"/><ellipse cx="304.7" cy="' + (N + 5.5) + '" rx="1.9" ry="1.05" fill="#8A4A3B" opacity=".55" transform="rotate(20 304.7 ' + (N + 5.5) + ')"/>' +
      blob(300, N + 8, 9, 2.4, 'shade', .32) + blob(300, M - 8, 2.2, 3.4, 'hl', .12) +
      '<path d="M297.6 ' + (N + 9) + ' Q297.2 ' + (M - 7) + ' 298 ' + (M - 4) + ' M302.4 ' + (N + 9) + ' Q302.8 ' + (M - 7) + ' 302 ' + (M - 4) + '" stroke="' + P.deep + '" stroke-opacity=".1" stroke-width="1" fill="none"/>' +
      '<g data-k="mN"><path d="M288 ' + (M - 1) + ' C292 ' + (M - 4) + ' 296 ' + (M - 4.6) + ' 300 ' + (M - 3.4) + ' C304 ' + (M - 4.6) + ' 308 ' + (M - 4) + ' 312 ' + (M - 1) + ' C306 ' + (M + .4) + ' 294 ' + (M + .4) + ' 288 ' + (M - 1) + 'Z" fill="' + P.lip + '"/>' +
      '<path d="M289.5 ' + (M - .4) + ' C293 ' + (M + 5.6) + ' 307 ' + (M + 5.6) + ' 310.5 ' + (M - .4) + ' C305 ' + (M + 1.2) + ' 295 ' + (M + 1.2) + ' 289.5 ' + (M - .4) + 'Z" fill="' + P.lip2 + '"/>' +
      '<path data-k="mLine" d="M288 ' + (M - .9) + ' Q300 ' + (M + .9) + ' 312 ' + (M - .9) + '" stroke="#93483F" stroke-opacity=".8" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      blob(300, M + 2.6, 4, 1.3, 'hl', .7) + blob(300, M - 5.2, 3, 1, 'hl', .45) + blob(287.6, M - .6, 1.6, 1.6, 'shade', .5) + blob(312.4, M - .6, 1.6, 1.6, 'shade', .5) + '</g>' +
      '<g data-k="mS" opacity="0">' + blob(270, EYE + 20, 12, 7, 'hl', .4) + blob(330, EYE + 20, 12, 7, 'hl', .4) +
      '<path d="M286 ' + (M - 1.5) + ' Q300 ' + (M + 1.5) + ' 314 ' + (M - 1.5) + ' Q309 ' + (M + 8.5) + ' 300 ' + (M + 9) + ' Q291 ' + (M + 8.5) + ' 286 ' + (M - 1.5) + 'Z" fill="#A2443F"/><ellipse cx="300" cy="' + (M + 5.6) + '" rx="6.5" ry="2.6" fill="#E2847C"/>' +
      '<path d="M285 ' + (M - 1.6) + ' C290 ' + (M - 4.6) + ' 296 ' + (M - 5) + ' 300 ' + (M - 3.8) + ' C304 ' + (M - 5) + ' 310 ' + (M - 4.6) + ' 315 ' + (M - 1.6) + ' C306 ' + (M + .2) + ' 294 ' + (M + .2) + ' 285 ' + (M - 1.6) + 'Z" fill="' + P.lip + '"/>' +
      '<path d="M287.5 ' + (M + 2.5) + ' Q300 ' + (M + 12.5) + ' 312.5 ' + (M + 2.5) + ' Q300 ' + (M + 10) + ' 287.5 ' + (M + 2.5) + 'Z" fill="' + P.lip2 + '"/></g>' +
      '<g data-k="mC" opacity="0"><ellipse data-k="mo" cx="300" cy="' + (M + 4) + '" rx="12" ry="9" fill="#6E2328" stroke="' + P.lip + '" stroke-width="2.6"/><ellipse data-k="tongue" cx="300" cy="' + (M + 8.5) + '" rx="7" ry="3.2" fill="#E07F78"/></g>' +
      '<g data-k="tears" opacity="0" fill="#E9F6FF" stroke="#BFD9EA" stroke-width=".5"><path d="M' + (300 - EX - 13) + ',' + (EYE + 4) + ' q-2,6 0,10 q3,-2 0,-10Z"/><path d="M' + (300 + EX + 13) + ',' + (EYE + 4) + ' q2,6 0,10 q-3,-2 0,-10Z"/></g>' +
      blob(300, M + 7.5, 8, 2.4, 'shade', .28) + blob(300, M + 16, 12, 5, 'hl', .35);
    var rash = '<g data-k="rash" opacity="0">' + [[255, 232, 12], [266, 244, 8], [345, 232, 12], [334, 244, 8], [286, 300, 10], [316, 306, 11], [300, 290, 7], [326, 292, 8], [276, 318, 7]].map(function (c) { return blob(c[0], c[1], c[2], c[2] * .8, 'flush', 1) + '<g fill="#C9474F" opacity=".35">' + [0, 1, 2, 3].map(function (k) { return '<circle cx="' + f(c[0] + (rnd(c[0] + k) - .5) * c[2]) + '" cy="' + f(c[1] + (rnd(c[1] + k) - .5) * c[2] * .8) + '" r="1.1"/>' }).join('') + '</g>' }).join('') + '</g>';
    var head = '<g data-k="head">' + ears + '<path d="' + cr(HEAD, true) + '" fill="' + U('skH') + '"/><path d="' + cr(HEAD, true) + '" fill="' + U('ao') + '" opacity=".85"/>' +
      '<g clip-path="' + U('cH') + '">' + blob(372, 214, 14, 52, 'rim', 1) + blob(300, 286, 70, 18, 'shade', .3) + '</g>' + blob(288, 164, 38, 22, 'hl', .55) + blob(300, 262, 34, 10, 'shade', .35) + face + hair() + cap() + '</g>';

    /* skin silhouettes for colour overlays (jaundice, duskiness) */
    var skinSil = '<path d="' + cr(HEAD, true) + '"/><path d="' + cr(EAR, true) + '"/><path d="' + cr(mir(EAR), true) + '"/><path d="' + cr(TORSO, true) + '"/><path d="' + tube(ARM) + '"/><path d="' + tube(armR) + '"/><path d="' + tube(LEG) + '"/><path d="' + tube(legR) + '"/>' +
      '<circle cx="' + HAND[0] + '" cy="' + (HAND[1] + 3) + '" r="15"/><circle cx="' + (600 - HAND[0]) + '" cy="' + (HAND[1] + 3) + '" r="15"/><circle cx="' + FOOT[0] + '" cy="' + FOOT[1] + '" r="17"/><circle cx="' + (600 - FOOT[0]) + '" cy="' + FOOT[1] + '" r="17"/>';
    var silB = '<path d="' + cr(TORSO, true) + '"/><path d="' + tube(ARM) + '"/><path d="' + tube(armR) + '"/><path d="' + tube(LEG) + '"/><path d="' + tube(legR) + '"/>';
    var silH = '<path d="' + cr(HEAD, true) + '"/><path d="' + cr(EAR, true) + '"/><path d="' + cr(mir(EAR), true) + '"/><path d="' + tube(FORE) + '"/><path d="' + tube(foreR) + '"/><circle cx="' + HAND[0] + '" cy="' + (HAND[1] + 3) + '" r="15"/><circle cx="' + (600 - HAND[0]) + '" cy="' + (HAND[1] + 3) + '" r="15"/><circle cx="' + FOOT[0] + '" cy="' + FOOT[1] + '" r="17"/><circle cx="' + (600 - FOOT[0]) + '" cy="' + FOOT[1] + '" r="17"/>';
    function tint(sil, sfx) { return '<g data-k="jaund' + sfx + '" opacity="0" fill="#F0C93C" style="mix-blend-mode:multiply">' + sil + '</g><g data-k="dusk' + sfx + '" opacity="0" fill="#7E8CB0" style="mix-blend-mode:multiply">' + sil + '</g>' }
    var tints = '<g data-k="redd" opacity="0" fill="#F08A7E" style="mix-blend-mode:multiply"><path d="' + cr(HEAD, true) + '"/></g>';

    /* clinical devices */
    var FR = [600 - FOOT[0], FOOT[1]], HR = [600 - HAND[0], HAND[1]];
    var pads = NICU ? [[260, 300], [340, 300], [276, 356]] : [];
    var devices = '';
    if (NICU) {
      devices += '<g data-k="leads" fill="none" stroke-linecap="round"><path d="' + cr([[260, 300], [222, 316], [160, 326], [40, 318], [-80, 320]], false) + '" stroke="#F4F6F7" stroke-width="2.4"/><path d="' + cr([[340, 300], [380, 312], [450, 306], [560, 296], [700, 290]], false) + '" stroke="#E46B6B" stroke-width="2.4"/><path d="' + cr([[276, 356], [236, 372], [170, 392], [60, 400], [-80, 404]], false) + '" stroke="#6DBF8C" stroke-width="2.4"/>' +
        pads.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#FBFCFC" stroke="#D3DBE0" stroke-width="1"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#AFC0CB"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="#61717B"/>' }).join('') + '</g>' +
        '<g data-k="tprobe"><path d="' + cr([[330, 354], [352, 372], [400, 380], [520, 372], [700, 380]], false) + '" stroke="#B8C2CA" stroke-width="2" fill="none"/><path d="M330 348 C325 342 318 345 320 352 C321 357 330 362 330 362 C330 362 339 357 340 352 C342 345 335 342 330 348Z" fill="' + U('foil') + '" stroke="#98A4AE" stroke-width=".6"/></g>' +
        '<g data-k="ogt"><path data-k="ogPath" d="' + cr([[305, MOUTH + 1], [318, MOUTH + 2], [334, MOUTH - 2], [362, MOUTH - 12], [420, MOUTH - 26], [520, MOUTH - 40], [700, MOUTH - 54]], false) + '" stroke="#E9E3D6" stroke-width="4" fill="none" stroke-linecap="round"/><path d="' + cr([[305, MOUTH + 1], [318, MOUTH + 2], [334, MOUTH - 2], [362, MOUTH - 12], [420, MOUTH - 26], [520, MOUTH - 40], [700, MOUTH - 54]], false) + '" stroke="#FFFDF7" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path data-k="ogMilk" d="' + cr([[305, MOUTH + 1], [318, MOUTH + 2], [334, MOUTH - 2], [362, MOUTH - 12], [420, MOUTH - 26], [520, MOUTH - 40], [700, MOUTH - 54]], false) + '" stroke="#FFF2CF" stroke-width="2.2" stroke-dasharray="3 7" fill="none" opacity="0"/>' +
        '<rect x="320" y="' + (MOUTH - 9) + '" width="24" height="13" rx="2.5" fill="#F4EBDA" opacity=".93" transform="rotate(-10 332 ' + (MOUTH - 3) + ')"/></g>' +
        '<g data-k="iv"><path d="' + cr([[HR[0] + 6, HR[1] + 2], [HR[0] + 40, HR[1] + 6], [470, HR[1] - 4], [700, HR[1] - 30]], false) + '" stroke="#D9E4EA" stroke-width="2.4" fill="none" opacity=".9"/><rect x="' + (HR[0] - 11) + '" y="' + (HR[1] - 12) + '" width="24" height="20" rx="4" fill="#EAF3F8" opacity=".55" stroke="#C6D6DF" stroke-width=".8"/><rect x="' + (HR[0] + 2) + '" y="' + (HR[1] - 3) + '" width="11" height="6" rx="2" fill="#F2C443"/></g>';
    }
    if (DEV) devices += '<g data-k="idb"><path d="M' + (ARM[5][0] - 13 * LR) + ',' + (ARM[5][1] - 2) + ' Q' + ARM[5][0] + ',' + (ARM[5][1] + 6) + ' ' + (ARM[5][0] + 13 * LR) + ',' + (ARM[5][1] - 1) + '" stroke="#FBFDFE" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M' + (ARM[5][0] - 4) + ',' + (ARM[5][1] + 1.6) + ' h8" stroke="#7FB0D8" stroke-width="3" stroke-linecap="round"/></g>';
    if (DEV) devices += '<g data-k="probe"><path d="' + cr([[FR[0] + 8, FR[1] + 10], [FR[0] + 40, FR[1] + 30], [470, 500], [700, 520]], false) + '" stroke="#5F6E78" stroke-width="2.4" fill="none"/><rect x="' + (FR[0] - 13) + '" y="' + (FR[1] - 4) + '" width="26" height="15" rx="6" fill="#F6F7F8" stroke="#C3CDD3" stroke-width=".8" transform="rotate(-24 ' + FR[0] + ' ' + FR[1] + ')"/><ellipse data-k="ledG" cx="' + FR[0] + '" cy="' + (FR[1] + 2) + '" rx="14" ry="10" fill="' + U('glowR') + '" opacity=".5"/></g>';
    devices += '<g data-k="cpap" opacity="0"><path d="M246 168 Q300 150 354 168" stroke="#E6EEF2" stroke-width="8" fill="none"/><path d="M288 ' + (EYE + 26) + ' Q300 ' + (EYE + 33) + ' 312 ' + (EYE + 26) + '" stroke="#C9D6DE" stroke-width="5" fill="none"/><path d="M312 ' + (EYE + 26) + ' Q350 ' + (EYE + 20) + ' 372 ' + (EYE - 10) + ' Q392 ' + (EYE - 48) + ' 460 ' + (EYE - 70) + '" stroke="#C9D6DE" stroke-width="7" fill="none"/></g>';

    /* spit and vomit */
    var spit = '<g data-k="spit" opacity="0"><path data-k="spitDrib" d="M311 ' + (MOUTH + 2) + ' Q314 ' + (MOUTH + 12) + ' 312 ' + (MOUTH + 22) + ' Q309 ' + (MOUTH + 26) + ' 307 ' + (MOUTH + 18) + ' Q307 ' + (MOUTH + 8) + ' 305 ' + (MOUTH + 2) + 'Z"/>' +
      '<g data-k="spitPud" opacity="0"><path d="M276 290 Q284 280 296 286 Q306 278 318 286 Q332 282 336 294 Q346 300 336 308 Q338 320 322 318 Q312 328 298 320 Q284 326 276 316 Q262 312 268 302 Q262 292 276 290Z" opacity=".9"/><circle cx="262" cy="324" r="3"/><circle cx="344" cy="320" r="2.4"/><circle cx="252" cy="306" r="2"/><ellipse cx="292" cy="294" rx="10" ry="4" fill="#fff" opacity=".45"/><ellipse cx="318" cy="306" rx="5" ry="2" fill="#fff" opacity=".35"/></g><path data-k="spitStr" d="M302 ' + (MOUTH + 4) + ' Q304 ' + (MOUTH + 20) + ' 300 288 Q298 ' + (MOUTH + 20) + ' 298 ' + (MOUTH + 4) + 'Z" opacity="0"/></g>';

    /* organs */
    var labels = [['Lungs', [254, 306], [212, 296], 'end'], ['Heart', [314, 320], [392, 300], 'start'], ['Liver', [258, 354], [212, 350], 'end'], ['Stomach', [344, 362], [392, 346], 'start'], ['Colon', [240, 398], [212, 404], 'end'], ['Small bowel', [326, 404], [392, 412], 'start'], ['Oesophagus', [302, 286], [392, 270], 'start']];
    labels.forEach(function (L) { L[1] = [300 + (L[1][0] - 300) * BW, L[1][1]] });
    var organs = '<g data-k="inner" opacity="0"><g clip-path="' + U('cT') + '">' +
      '<rect x="200" y="260" width="200" height="200" fill="#5E2E2B" opacity=".35"/>' +
      '<path d="' + cr(LUNG_L, true) + '" fill="' + U('lung') + '" opacity=".85"/><path d="' + cr(LUNG_R, true) + '" fill="' + U('lung') + '" opacity=".85"/>' +
      '<g data-k="heartG"><path d="' + cr(HEART, true) + '" fill="' + U('heart') + '"/><path d="M300 304 Q306 318 318 328" stroke="#7E1B2B" stroke-opacity=".5" stroke-width=".9" fill="none"/></g>' +
      '<path d="' + cr(ESO, false) + '" stroke="#C97C80" stroke-width="5" fill="none" stroke-linecap="round"/><path d="' + cr(ESO, false) + '" stroke="#F0B2AE" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="' + cr(LIVER, true) + '" fill="' + U('liver') + '"/><path d="M240 342 Q262 336 288 339" stroke="#fff" stroke-opacity=".25" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="270" cy="370" rx="4.6" ry="7" fill="#7FA03E" transform="rotate(20 270 370)"/>' +
      '<path d="' + cr(SPLEEN, true) + '" fill="#7A3552"/>' +
      '<g data-k="stomG"><path d="' + cr(STOM, true) + '" fill="' + U('stom') + '"/><g clip-path="' + U('cS') + '"><path data-k="milk" d="" fill="#FFF6E2"/><path data-k="milkTop" d="" stroke="#fff" stroke-width=".9" fill="none" opacity=".85"/></g></g>' +
      '<g data-k="colonG"><path d="' + cr(COLON, false) + '" stroke="#9E6446" stroke-width="13" fill="none" stroke-linecap="round"/><path data-k="colon" d="' + cr(COLON, false) + '" stroke="#E5B08A" stroke-width="11.2" fill="none" stroke-linecap="round"/><path d="' + cr(COLON, false) + '" stroke="#8E5539" stroke-opacity=".4" stroke-width="11.2" stroke-dasharray="1.3 7" fill="none"/></g>' +
      '<path d="' + cr(SI, false) + '" stroke="#B9616A" stroke-width="7.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path data-k="si" d="' + cr(SI, false) + '" stroke="#F1A496" stroke-width="5.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + cr(SI, false) + '" stroke="#FFE6E0" stroke-opacity=".5" stroke-width="1.4" fill="none" transform="translate(-.8 -1)"/>' +
      '<g data-k="bubs"></g><g data-k="stools"></g><g data-k="feedDrops"></g>' +
      '<ellipse cx="300" cy="430" rx="11" ry="8" fill="#F2DA8C" opacity=".8"/>' +
      (NICU ? '<path d="' + cr(ESO.concat([[328, 356]]), false) + '" stroke="#FFFBEF" stroke-width="1.4" fill="none" opacity=".9"/>' : '') +
      '<path d="' + cr(TORSO, true) + '" fill="' + P.base + '" opacity=".16"/></g>' +
      '<g class="bf-lbl">' + labels.map(function (L) { return '<path d="M' + L[1][0] + ',' + L[1][1] + ' L' + L[2][0] + ',' + L[2][1] + '" stroke="#0F3B3A" stroke-opacity=".55" stroke-width=".6" fill="none"/><circle cx="' + L[1][0] + '" cy="' + L[1][1] + '" r="1.5" fill="#0F3B3A"/><text x="' + (L[2][0] + (L[3] === 'end' ? -2 : 2)) + '" y="' + (L[2][1] + 1.8) + '" text-anchor="' + L[3] + '">' + L[0] + '</text>' }).join('') + '</g></g>';

    var hood = NICU ? '<g data-k="hood"><rect x="58" y="96" width="484" height="384" rx="40" fill="' + U('glass') + '" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="7"/><rect x="58" y="96" width="484" height="384" rx="40" fill="none" stroke="var(--bf-edge)" stroke-width="2"/>' +
      '<path d="M86 440 V150 Q86 122 116 120" stroke="#fff" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<path d="M150 104 L250 104" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/><path d="M120 300 L230 140" stroke="#fff" stroke-opacity=".12" stroke-width="26" stroke-linecap="round"/><path d="M180 330 L270 200" stroke="#fff" stroke-opacity=".08" stroke-width="12" stroke-linecap="round"/>' +
      [[138, 360], [462, 360]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="46" fill="#EAF6FC" fill-opacity=".06" stroke="#A9BAC4" stroke-width="7"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="46" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><rect x="' + (p[0] - 7) + '" y="' + (p[1] - 56) + '" width="14" height="12" rx="3" fill="#7E95A3"/>' }).join('') +
      '<rect x="530" y="230" width="10" height="70" rx="5" fill="#5B7383"/></g>' : '';

    defs += LG.join('');
    var svg = el('svg');
    svg.setAttribute('class', 'bf'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', PT ? 'Preterm baby resting in an incubator with monitoring leads and a feeding tube' : NICU ? 'Newborn baby resting in an incubator with monitoring' : 'Baby resting on an examination mattress');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = '<defs>' + defs + '</defs><g data-k="bg">' + room + bed + '</g>' + pillows +
      '<ellipse data-k="halo" cx="300" cy="330" rx="200" ry="200" fill="' + U('halo') + '" opacity="0"/>' +
      '<g data-k="baby"><g data-k="babyIn" transform="translate(' + f(SEAT[0] - SEAT[0] * K) + ' ' + f(SEAT[1] - SEAT[1] * K) + ') scale(' + K + ')">' + contact +
      arms + '<g data-k="trunk">' + torso + '</g>' + occl + neck + legs + tint(silB, 'B') + diaper + feet + fore + organs + head + tint(silH, 'H') + rash + tints + spit + devices + '</g></g>' + hood +
      '<g data-k="hl" opacity="0"><circle r="16" fill="#FFC94D" fill-opacity=".14" stroke="#F2A900" stroke-width="2.4"/><circle r="23" fill="none" stroke="#F2A900" stroke-opacity=".45" stroke-width="1"/></g>';
    host.appendChild(svg);
    var E = {}; svg.querySelectorAll('[data-k]').forEach(function (n) { E[n.getAttribute('data-k')] = n });

    /* nappy-check inset */
    var nap = document.createElement('div'); nap.className = 'bf-nap'; nap.hidden = true;
    nap.innerHTML = '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M8 18 Q60 4 112 18 L104 62 Q60 76 16 62Z" fill="#FBFCFC" stroke="#CBD6DB" stroke-width="1.5"/><path d="M20 22 Q60 12 100 22" stroke="#DDE6EA" stroke-width="3" fill="none"/><g class="bf-st"></g></svg><span></span>';
    host.appendChild(nap);
    function napDraw() {
      var show = st.stool !== 'idle' || st.colour !== 'normal'; nap.hidden = !show; if (!show) return;
      var g = nap.querySelector('.bf-st'), col = st.colour === 'pale' ? '#E9E1C8' : STOOL_C[st.stool] || '#D9A441', txt = [], s = '';
      if (st.stool === 'watery') { s += '<path d="M24 42 Q40 28 62 34 Q86 26 98 42 Q92 58 62 58 Q32 60 24 42Z" fill="' + col + '" opacity=".55"/><path d="M34 44 Q58 36 86 44 Q74 52 56 52 Q40 52 34 44Z" fill="' + col + '"/>'; txt.push('watery') }
      else if (st.stool === 'hard') { [[46, 42], [60, 46], [72, 40], [58, 36]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" fill="' + col + '"/>' }); txt.push('hard pellets') }
      else if (st.stool !== 'idle') { s += '<path d="M40 42 Q50 32 64 36 Q80 34 82 44 Q76 54 60 53 Q44 54 40 42Z" fill="' + col + '"/>' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<circle cx="' + (48 + k * 5) + '" cy="' + (42 + (k % 2) * 4) + '" r=".9" fill="#FFF6D8"/>' }).join('') }
      if (st.colour === 'pale') txt.push('pale, clay-coloured');
      if (st.colour === 'red') { s += '<path d="M44 40 Q54 46 64 40 M58 48 Q68 52 78 46" stroke="#B3202A" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M50 50 Q60 56 70 50" stroke="#EADFD0" stroke-width="3" fill="none" opacity=".8"/>'; txt.push('blood and mucus') }
      g.innerHTML = s; nap.querySelector('span').textContent = 'Nappy check' + (txt.length ? ': ' + txt.join(', ') : '');
    }

    /* path lookups */
    function lut(d, n) { var p = el('path'); p.setAttribute('d', d); var L = p.getTotalLength(), out = []; for (var i = 0; i <= n; i++) { var q = p.getPointAtLength(L * i / n); out.push([q.x, q.y]) } return out }
    function at(T, t) { t = clamp(t, 0, .9999) * (T.length - 1); var i = Math.floor(t), u = t - i; return [lerp(T[i][0], T[i + 1][0], u), lerp(T[i][1], T[i + 1][1], u)] }
    var siL = lut(cr(SI, false), 300), coL = lut(cr(COLON, false), 240), esL = lut(cr(ESO, false), 120);
    var bubs = [], stools = [], drops = [], i;
    for (i = 0; i < 24; i++) { var c = el('circle'); c.setAttribute('fill', '#F4FBFF'); c.setAttribute('fill-opacity', '.6'); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '.35'); E.bubs.appendChild(c); bubs.push({ el: c, t: Math.random(), sp: .02 + Math.random() * .03, r: 1.6 + Math.random() * 1.8, s: 0 }) }
    for (i = 0; i < 20; i++) { var e2 = el('ellipse'); e2.setAttribute('rx', 3.2); e2.setAttribute('ry', 2.5); E.stools.appendChild(e2); stools.push({ el: e2, t: i / 20, sp: .75 + Math.random() * .5 }) }
    for (i = 0; i < 8; i++) { var d2 = el('circle'); d2.setAttribute('r', 1.15); d2.setAttribute('fill', '#FFFBEF'); E.feedDrops.appendChild(d2); drops.push(d2) }
    var COLON_C = { normal: '#E5B08A', red: '#C0545A', pale: '#EADFCB' }, STOOL_C = { idle: '#EFE1C6', normal: '#D9A441', hard: '#7B4E27', watery: '#CDB46A', red: '#9B2226', pale: '#EEE6D2' };
    var SPITC = { milk: '#FFFAF0', vomit: '#E3CC7A', bile: '#86A73A' };

    /* camera */
    function bx(x0, y0, x1, y1) { var a = B(x0, y0), b = B(x1, y1); return [a[0], a[1], b[0], b[1]] }
    var BOX = { outside: NICU ? [40, 80, 560, 560] : COT ? [60, 110, 540, 530] : [70, 110, 530, 520], inside: bx(150, 200, 450, 470), gut: bx(160, 290, 440, 462) };
    var W = 300, H = 300, vb = null, padTop = o.padTop == null ? 40 : o.padTop, padBot = o.padBot == null ? 10 : o.padBot;
    function target() {
      var b = BOX[st.view] || BOX.outside, bw = b[2] - b[0], bh = b[3] - b[1], A = W / Math.max(1, H - padTop - padBot), w, h;
      if (bw / bh > A) { w = bw; h = bw / A } else { h = bh; w = bh * A }
      var sc = h / Math.max(1, H - padTop - padBot); h = H * sc; w = W * sc;
      var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2 - (padTop - padBot) / 2 * sc; return [cx - w / 2, cy - h / 2, w, h];
    }
    function resize() { W = host.clientWidth || 300; H = host.clientHeight || 300; if (!vb) vb = target() }
    var ro = new ResizeObserver(resize); ro.observe(host); resize();
    var ANCH = { stomach: function () { return B(340, 360) }, gut: function () { return B(300, 404) }, mouth: function () { return B(300, MOUTH + 2) }, belly: function () { return B(300, 368) },
      tube: function () { return B(334, MOUTH - 3) }, probe: function () { return B(FR[0], FR[1]) }, monitor: function () { return [436, 522] }, incubator: function () { return [300, 110] }, pump: function () { return B(520, MOUTH - 40) } };

    /* frame loop */
    var alive = true, visible = true, t0 = performance.now(), last = t0, blinkAt = t0 + 2500, errs = 0, napKey = '';
    var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting }); io.observe(host);
    function A(e, k, v) { if (e) e.setAttribute(k, v) }
    function step(now) {
      var dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
      var k = 1 - Math.pow(.02, dt);
      st.dist += (st.distT - st.dist) * k; st.stress += (st.stressT - st.stress) * k; st.fill += (st.fillT - st.fill) * k * .6; st.gas += (st.gasT - st.gas) * k;
      st.rash += (st.rashT - st.rash) * k; st.jaund += (st.jaundT - st.jaund) * k; st.dusk += (st.duskT - st.dusk) * k; st.sleepy += (st.sleepyT - st.sleepy) * k;
      st.scale += (st.scaleT - st.scale) * k; st.cryV += ((st.cry > 0 ? 1 : 0) - st.cryV) * k * 1.5; st.spitV += (st.spit - st.spitV) * k; st.cpapV += ((st.cpap ? 1 : 0) - st.cpapV) * k;
      st.ins += ((st.view === 'outside' ? 0 : 1) - st.ins) * k;
      var tv = target(); if (!vb) vb = tv; for (var j = 0; j < 4; j++) vb[j] += (tv[j] - vb[j]) * k * .8;
      svg.setAttribute('viewBox', vb.map(f).join(' '));
      /* breathing */
      var rr = 44 + st.stress * 26 + st.cryV * 10, br = Math.sin(t * rr / 60 * Math.PI * 2);
      A(E.babyIn, 'transform', 'translate(' + f(SEAT[0] - SEAT[0] * K * st.scale) + ' ' + f(SEAT[1] - SEAT[1] * K * st.scale) + ') scale(' + f(K * st.scale) + ')');
      A(E.trunk, 'transform', 'translate(300 410) scale(' + f(1 + br * .006) + ' ' + f(1 + br * .012) + ') translate(-300 -410)');
      var cj = st.cryV > .5 ? Math.sin(t * 9) * 1.2 * Math.min(3, st.cry) / 3 : 0;
      A(E.head, 'transform', 'translate(' + f(cj) + ' ' + f(br * .6) + ') rotate(' + f(Math.sin(t * .35) * 1.2 + cj * .4) + ' 300 260)');
      var aw = st.cryV * Math.sin(t * 6) * 4 + st.jit * Math.sin(t * 23) * 1.2;
      A(E.armL, 'transform', 'rotate(' + f(aw) + ' 244 286)'); A(E.armR, 'transform', 'rotate(' + f(-aw) + ' 356 286)');
      /* belly */
      var d = st.dist; A(E.bulge, 'opacity', f(clamp(d * 2.2, 0, 1))); E.bulge && E.bulge.setAttribute('transform', 'translate(300 370) scale(' + f(.8 + d * .35) + ' ' + f(.8 + d * .3) + ') translate(-300 -370)');
      A(E.veins, 'opacity', f(clamp((d - .45) * 2.2, 0, 1) * (1 - st.ins * .8)));
      A(E.belDusk, 'opacity', f(clamp(st.dusk * 1.2, 0, 1) * (1 - st.ins)));
      /* colour */
      A(E.jaundB, 'opacity', f(st.jaund * .5)); A(E.jaundH, 'opacity', f(st.jaund * .5)); A(E.sclJL, 'opacity', f(st.jaund * .55)); A(E.sclJR, 'opacity', f(st.jaund * .55));
      A(E.duskB, 'opacity', f(st.dusk * .5)); A(E.duskH, 'opacity', f(st.dusk * .5)); A(E.redd, 'opacity', f(Math.max(st.cryV * .4, st.stress * .2)));
      A(E.rash, 'opacity', f(st.rash));
      /* expression */
      var crying = st.cryV > .5; if (!crying && now > blinkAt + 140) blinkAt = now + 2600 + Math.random() * 3200;
      var blink = !crying && now > blinkAt && now < blinkAt + 140, open = clamp(1 - st.sleepy * .7 - st.dusk * .45 - st.stress * .25, .25, 1);
      A(E.eyesS, 'opacity', crying ? 1 : 0); A(E.eyesC, 'opacity', !crying && blink ? 1 : 0);
      A(E.eyesO, 'opacity', crying || blink ? 0 : 1); A(E.eyesO, 'transform', 'translate(0 ' + f(EYE + 3) + ') scale(1 ' + f(open) + ') translate(0 ' + f(-(EYE + 3)) + ')');
      var smile = o.smile && !crying && st.stress < .3 && st.spitV < .5 && st.dusk < .2;
      A(E.mS, 'opacity', smile ? 1 : 0); A(E.mN, 'opacity', crying || smile ? 0 : 1); A(E.mC, 'opacity', crying ? 1 : 0);
      if (crying) { var mo = .6 + .4 * Math.abs(Math.sin(t * 3.2)); A(E.mo, 'ry', f(6 + 6 * mo * Math.min(1, st.cry / 2))); }
      A(E.mLine, 'd', 'M288 ' + (MOUTH - .9) + ' Q300 ' + f(MOUTH + .9 - st.stress * 3) + ' 312 ' + (MOUTH - .9));
      A(E.knit, 'opacity', f(clamp(st.stress * 1.4 + st.cryV, 0, 1))); A(E.tears, 'opacity', st.cry >= 2 ? f(st.cryV) : 0);
      /* spit */
      var sc = SPITC[st.spitCol] || SPITC.milk; A(E.spit, 'opacity', f(clamp(st.spitV, 0, 1))); E.spit && E.spit.setAttribute('fill', sc);
      A(E.spitPud, 'opacity', f(clamp(st.spitV - 1, 0, 1))); A(E.spitStr, 'opacity', f(clamp(st.spitV - 1, 0, 1) * (.6 + .4 * Math.sin(t * 5))));
      /* devices */
      A(E.cpap, 'opacity', f(st.cpapV)); A(E.ogMilk, 'opacity', st.feeding ? .95 : 0); if (st.feeding) A(E.ogMilk, 'stroke-dashoffset', f(t * 16));
      var ph = (t * st.hr / 60) % 1; A(E.ledG, 'opacity', f(.25 + .55 * Math.exp(-ph * 6)));
      A(E.alarmLed, 'opacity', st.alarm ? f(.4 + .6 * (Math.sin(t * 8) > 0 ? 1 : 0)) : .15);
      /* inside view */
      var ins = st.ins; A(E.inner, 'opacity', f(ins)); A(E.diaper, 'opacity', f(1 - ins * .55)); A(E.cord, 'opacity', f(1 - ins)); ['leads', 'tprobe', 'iv', 'idb'].forEach(function (k2) { A(E[k2], 'opacity', f(1 - ins * .8)) });
      A(E.colon, 'stroke', st.colour === 'red' ? COLON_C.red : st.colour === 'pale' ? COLON_C.pale : COLON_C.normal);
      if (ins > .02) {
        var bb = Bbox(STOM), lvl = lerp(bb[3] - 1, bb[1] + 3, clamp(st.fill, 0, 1)), wv = Math.sin(t * 2.2) * 1.4;
        A(E.milk, 'd', 'M' + (bb[0] - 4) + ',' + f(lvl + wv) + ' Q' + f((bb[0] + bb[2]) / 2) + ',' + f(lvl - wv) + ' ' + (bb[2] + 4) + ',' + f(lvl + wv) + ' V' + (bb[3] + 4) + ' H' + (bb[0] - 4) + 'Z');
        A(E.milkTop, 'd', 'M' + (bb[0] - 4) + ',' + f(lvl + wv) + ' Q' + f((bb[0] + bb[2]) / 2) + ',' + f(lvl - wv) + ' ' + (bb[2] + 4) + ',' + f(lvl + wv));
        var g = st.gas; bubs.forEach(function (b, n) { b.t = (b.t + dt * b.sp * (1 + st.jit)) % 1; var on = n < g ? 1 : 0; b.s += (on - b.s) * k; var p = at(siL, b.t); A(b.el, 'cx', f(p[0])); A(b.el, 'cy', f(p[1])); A(b.el, 'r', f(b.r * b.s)) });
        var spd = st.stool === 'watery' ? .12 : st.stool === 'hard' ? .02 : st.stool === 'idle' ? .015 : .05, scol = st.colour === 'pale' ? STOOL_C.pale : st.colour === 'red' && st.stool !== 'idle' ? '#A9473F' : STOOL_C[st.stool] || STOOL_C.normal;
        stools.forEach(function (s) { s.t = (s.t + dt * spd * s.sp) % 1; var p = at(coL, s.t); A(s.el, 'cx', f(p[0])); A(s.el, 'cy', f(p[1])); A(s.el, 'fill', scol); A(s.el, 'opacity', st.stool === 'watery' ? .6 : .9) });
        drops.forEach(function (dd, n) { var tt = (t * .45 + n / drops.length) % 1, p = at(esL, tt); A(dd, 'cx', f(p[0])); A(dd, 'cy', f(p[1])); A(dd, 'opacity', st.feeding ? f(Math.sin(tt * Math.PI)) : 0) });
        A(E.heartG, 'transform', 'translate(310 318) scale(' + f(1 + .04 * Math.exp(-ph * 7)) + ') translate(-310 -318)');
      }
      /* flash and highlight */
      if (st.flash > 0) { st.flash = Math.max(0, 1 - (now - st.flashT) / 1400); var hs = svg.querySelector('#' + I('halo')); if (hs) for (var z = 0; z < hs.children.length; z++) hs.children[z].setAttribute('stop-color', st.flashCol); A(E.halo, 'opacity', f(st.flash * .9)) } else A(E.halo, 'opacity', 0);
      if (st.hl && ANCH[st.hl]) { var q = ANCH[st.hl](), pu = 1 + .12 * Math.sin(t * 4); A(E.hl, 'transform', 'translate(' + f(q[0]) + ' ' + f(q[1]) + ') scale(' + f(pu) + ')'); A(E.hl, 'opacity', 1) } else A(E.hl, 'opacity', 0);
      var nk = st.stool + '|' + st.colour; if (nk !== napKey) { napKey = nk; napDraw() }
    }
    function Bbox(Pp) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; Pp.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) }); return [x0, y0, x1, y1] }
    function frame(now) {
      if (!alive) return; requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return }
      try { step(now); errs = 0 } catch (e) { errs++; console.error(e); if (errs > 5) { alive = false; if (o.onFail) o.onFail(e) } }
    }
    requestAnimationFrame(frame);
    setTimeout(function () { if (alive && o.onReady) o.onReady() }, 0);
    function setView(v) { if (v === 'nicu') v = 'outside'; if (BOX[v]) st.view = v }
    var api = {
      set: function (p) {
        if (p.view) setView(p.view); if (p.mode) setView(p.mode);
        if (p.fill != null) st.fillT = p.fill; if (p.feeding != null) st.feeding = !!p.feeding; if (p.distension != null) st.distT = p.distension; if (p.stress != null) st.stressT = p.stress;
        if (p.cry != null) st.cry = p.cry; if (p.gas != null) st.gasT = p.gas; if (p.jitter != null) st.jit = p.jitter; if (p.stool) st.stool = p.stool; if (p.colour) st.colour = p.colour;
        if (p.spit != null) st.spit = p.spit; if (p.spitCol) st.spitCol = p.spitCol; if (p.rash != null) st.rashT = p.rash; if (p.jaundice != null) st.jaundT = p.jaundice; if (p.scale != null) st.scaleT = p.scale;
        if (p.hr != null) st.hr = p.hr; if (p.alarm != null) st.alarm = !!p.alarm; if (p.cpap != null) st.cpap = !!p.cpap; if (p.dusky != null) st.duskT = p.dusky; if (p.sleepy != null) st.sleepyT = p.sleepy;
        if (p.highlight !== undefined) st.hl = p.highlight; return api;
      },
      now: function (p) { api.set(p); if (p.fill != null) st.fill = p.fill; if (p.distension != null) st.dist = p.distension; if (p.rash != null) st.rash = p.rash; if (p.jaundice != null) st.jaund = p.jaundice; if (p.dusky != null) st.dusk = p.dusky; if (p.sleepy != null) st.sleepy = p.sleepy; if (p.gas != null) st.gas = p.gas; if (p.stress != null) st.stress = p.stress; if (p.view || p.mode) st.ins = st.view === 'outside' ? 0 : 1; return api },
      flash: function (kind) { st.flash = 1; st.flashT = performance.now(); st.flashCol = kind === 'bad' ? '#ff3b3b' : kind === 'warn' ? '#f59e0b' : '#22c55e'; return api },
      highlight: function (k) { st.hl = k; return api },
      view: function (v) { if (v) setView(v); return st.view },
      real: function () { return api }, ready: function () { return true }, state: st,
      dispose: function () { alive = false; io.disconnect(); ro.disconnect(); svg.remove(); nap.remove() }
    };
    if (o.ogt === false && E.ogt) E.ogt.style.display = 'none';
    api.now(o);
    return api;
  }
  return { create: create, supported: function () { return !!(window.SVGElement && window.ResizeObserver && window.IntersectionObserver) } };
})();
