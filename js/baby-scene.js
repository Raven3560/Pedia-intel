/* BABYSCENE: the rendered preterm baby. The pictures in img/scene/ are path-traced from a 3D sculpt (see _build/render/);
   this file shows them live: a small WebGL shader adds breathing, abdominal distension, skin colour (jaundice, duskiness,
   flushing, rash), the pulse-oximeter glow and pointer parallax, and an SVG layer draws the organs, milk, gas, stools,
   spit-up and highlights on top. Same API as BABYFRONT, which stays as the painter for the settings that have no render yet.
   If WebGL or the pictures are unavailable the old painter is used instead. */
var BABYSCENE = (function () {
  var D = window.BABYSCENE_DATA || {};
  function f(n) { return Math.round(n * 100) / 100 }
  function lerp(a, b, t) { return a + (b - a) * t }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
  function el(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag) }
  function cr(P, closed) {
    var n = P.length, d = 'M' + f(P[0][0]) + ',' + f(P[0][1]), m = closed ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var p0 = P[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ',' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ',' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  var imgCache = {};
  function load(src) { return imgCache[src] || (imgCache[src] = new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i) }; i.onerror = no; i.src = src })) }

  var VS = 'attribute vec2 a; varying vec2 vP; void main(){ vP=a*.5+.5; vP.y=1.-vP.y; gl_Position=vec4(a,0.,1.); }';
  var FS = 'precision highp float; varying vec2 vP;' +
    'uniform sampler2D uWide,uTrunk,uAux,uCry; uniform vec4 uView,uTrunkR,uCryR; uniform vec3 uBelly,uChest; uniform vec2 uLedP,uPar;' +
    'uniform float uLod,uCryA,uDist,uBreath,uJaund,uDusk,uRed,uRash,uXray,uLed,uTime,uVig;' +
    'float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }' +
    'float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }' +
    'vec2 bulge(vec2 uv, vec3 c, float amt){ vec2 d=uv-c.xy; float w=1.-smoothstep(0.,1.,length(d)/c.z); return c.xy+d*(1.-amt*w*w); }' +
    'float inside(vec2 t){ return smoothstep(0.,.05,min(min(t.x,1.-t.x),min(t.y,1.-t.y))); }' +
    'void main(){ vec2 uv=uView.xy+vP*uView.zw;' +
    ' float dep=texture2D(uAux,uv).g; uv+=uPar*(dep-.2);' +
    ' uv=bulge(uv,uBelly,uDist*.15+uBreath*.014); uv=bulge(uv,uChest,uBreath*.02);' +
    ' vec3 col=texture2D(uWide,uv).rgb;' +
    ' vec2 t=(uv-uTrunkR.xy)/uTrunkR.zw; col=mix(col,texture2D(uTrunk,clamp(t,0.,1.)).rgb,inside(t)*uLod);' +
    ' vec2 c=(uv-uCryR.xy)/uCryR.zw; col=mix(col,texture2D(uCry,clamp(c,0.,1.)).rgb,inside(c)*uCryA);' +
    ' vec3 aux=texture2D(uAux,uv).rgb; float skin=aux.r, trunk=aux.b;' +
    ' float bw=1.-smoothstep(0.,1.,length(uv-uBelly.xy)/uBelly.z);' +
    ' col+=skin*bw*bw*uDist*vec3(.09,.07,.06);' +
    ' float vv=abs(vn(uv*46.+vec2(3.,7.)+.8*vn(uv*90.))-.5); col=mix(col,col*vec3(.7,.78,1.),skin*bw*(1.-smoothstep(0.,.03,vv))*smoothstep(.45,.9,uDist)*.55);' +
    ' col=mix(col,col*vec3(1.1,.8,.78),skin*uRed);' +
    ' col=mix(col,col*vec3(1.06,.95,.52)+vec3(.03,.025,0.),skin*uJaund*.8);' +
    ' float lum=dot(col,vec3(.3,.59,.11)); col=mix(col,mix(vec3(lum),col,.5)*vec3(.74,.78,.98),skin*uDusk*.85);' +
    ' float rn=smoothstep(.56,.8,vn(uv*70.))*smoothstep(.35,.6,vn(uv*17.+4.)); col=mix(col,col*vec3(1.12,.58,.58),skin*rn*uRash*.85);' +
    ' col=mix(col,(mix(vec3(lum),col,.55)*vec3(.42,.52,.62)),uXray*(.5+.25*skin));' +
    ' float ld=length(uv-uLedP); col+=vec3(1.,.12,.05)*uLed*(exp(-ld*ld*9000.)*.9+exp(-ld*ld*900.)*.25);' +
    ' vec2 q=vP-.5; col*=1.-uVig*dot(q,q)*1.5; col+=(h21(vP*913.+uTime)-.5)*.018;' +
    ' gl_FragColor=vec4(col,1.); }';

  /* organs: anatomical outlines in the old painter's units, placed over the trunk by the scene's matrix */
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
  var LABELS = [['Lungs', [254, 306], [206, 292], 'end'], ['Heart', [314, 320], [398, 300], 'start'], ['Liver', [258, 354], [206, 350], 'end'], ['Stomach', [344, 362], [398, 346], 'start'], ['Colon', [240, 398], [206, 404], 'end'], ['Small bowel', [326, 404], [398, 412], 'start'], ['Oesophagus', [302, 286], [398, 268], 'start']];
  var COLON_C = { normal: '#E5B08A', red: '#C0545A', pale: '#EADFCB' }, STOOL_C = { idle: '#EFE1C6', normal: '#D9A441', hard: '#7B4E27', watery: '#CDB46A', red: '#9B2226', pale: '#EEE6D2' };
  var SPITC = { milk: '#FFFAF0', vomit: '#E3CC7A', bile: '#86A73A' };
  var UID = 0;

  function can(o) { o = o || {}; return !!(D.nicu && (o.engine === 'nicu' || o.variant === 'preterm') && window.WebGLRenderingContext) }

  function create(host, o) {
    o = o || {}; var S = D.nicu, pre = 'bs' + (++UID) + '-', U = function (n) { return 'url(#' + pre + n + ')' };
    var st = { view: o.view || o.mode || 'outside', ins: 0, lod: 0, fill: o.fill == null ? .35 : o.fill, fillT: o.fill == null ? .35 : o.fill, dist: 0, distT: 0, stress: 0, stressT: 0, cry: 0, cryV: 0, gas: 0, gasT: 0, jit: 0,
      stool: 'idle', colour: 'normal', spit: 0, spitV: 0, spitCol: 'milk', rash: 0, rashT: 0, jaund: 0, jaundT: 0, dusk: 0, duskT: 0, sleepy: 0, feeding: !!o.feeding, scale: 1, scaleT: 1, flash: 0, flashT: 0, flashCol: '#22c55e', hl: null, hr: o.hr || 140, alarm: !!o.alarm };
    if (st.view === 'nicu') st.view = 'outside';
    var wrap = document.createElement('div'); wrap.className = 'bs'; wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', 'Preterm baby asleep in a positioning nest with monitoring leads, a feeding tube and a pulse-oximeter');
    var cv = document.createElement('canvas'); wrap.appendChild(cv);
    var svg = el('svg'); svg.setAttribute('class', 'bs-ov'); svg.setAttribute('preserveAspectRatio', 'none'); wrap.appendChild(svg);
    var glare = document.createElement('div'); glare.className = 'bs-glare'; wrap.appendChild(glare);
    host.appendChild(wrap);
    var M = S.organM, mt = 'matrix(' + M.join(' ') + ')';
    var bw = function (A) { return A.map(function (p) { return [300 + (p[0] - 300) * .8, p[1]] }) };
    var lungL = bw(LUNG_L), lungR = bw(LUNG_R), heart = bw(HEART), liver = bw(LIVER), stom = bw(STOM), spleen = bw(SPLEEN), colon = bw(COLON), eso = bw(ESO), si = bw(SI);
    var rg = function (id, a, b) { return '<radialGradient id="' + pre + id + '" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>' };
    var mouth = S.mouth, mx = mouth[0] * 1000, my = mouth[1] * 1000;
    svg.innerHTML = '<defs>' + rg('liver', '#C45B4B', '#6E231E') + rg('stom', '#F7B3B0', '#C3626A') + rg('lung', '#FBD0D6', '#E592A2') + rg('heart', '#E7606C', '#9E2236') +
      '<radialGradient id="' + pre + 'halo"><stop offset="0" stop-color="#22c55e" stop-opacity=".5"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + pre + 'back"><stop offset=".3" stop-color="#3A1418" stop-opacity=".62"/><stop offset="1" stop-color="#3A1418" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + pre + 'cS"><path d="' + cr(stom, true) + '"/></clipPath><filter id="' + pre + 'soft"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<ellipse data-k="halo" cx="' + f(S.belly[0] * 1000) + '" cy="' + f(S.belly[1] * 1000 - 40) + '" rx="330" ry="330" fill="' + U('halo') + '" opacity="0"/>' +
      '<g data-k="inner" opacity="0" transform="' + mt + '">' +
      '<ellipse cx="300" cy="352" rx="88" ry="104" fill="' + U('back') + '"/>' +
      '<path d="' + cr(lungL, true) + '" fill="' + U('lung') + '" opacity=".9"/><path d="' + cr(lungR, true) + '" fill="' + U('lung') + '" opacity=".9"/>' +
      '<g data-k="heartG"><path d="' + cr(heart, true) + '" fill="' + U('heart') + '"/></g>' +
      '<path d="' + cr(eso, false) + '" stroke="#C97C80" stroke-width="5" fill="none" stroke-linecap="round"/><path d="' + cr(eso, false) + '" stroke="#F0B2AE" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="' + cr(liver, true) + '" fill="' + U('liver') + '"/>' +
      '<path d="' + cr(spleen, true) + '" fill="#7A3552"/>' +
      '<g><path d="' + cr(stom, true) + '" fill="' + U('stom') + '"/><g clip-path="' + U('cS') + '"><path data-k="milk" d="" fill="#FFF6E2"/><path data-k="milkTop" d="" stroke="#fff" stroke-width=".9" fill="none" opacity=".85"/></g></g>' +
      '<path d="' + cr(colon, false) + '" stroke="#9E6446" stroke-width="13" fill="none" stroke-linecap="round"/><path data-k="colon" d="' + cr(colon, false) + '" stroke="#E5B08A" stroke-width="11.2" fill="none" stroke-linecap="round"/><path d="' + cr(colon, false) + '" stroke="#8E5539" stroke-opacity=".4" stroke-width="11.2" stroke-dasharray="1.3 7" fill="none"/>' +
      '<path d="' + cr(si, false) + '" stroke="#B9616A" stroke-width="7.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + cr(si, false) + '" stroke="#F1A496" stroke-width="5.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + cr(si, false) + '" stroke="#FFE6E0" stroke-opacity=".5" stroke-width="1.4" fill="none" transform="translate(-.8 -1)"/>' +
      '<g data-k="bubs"></g><g data-k="stools"></g><g data-k="feedDrops"></g>' +
      '<path d="' + cr(eso.concat([[322, 356]]), false) + '" stroke="#FFFBEF" stroke-width="1.4" fill="none" opacity=".9"/>' +
      '<g class="bs-lbl">' + LABELS.map(function (L) { var a = [300 + (L[1][0] - 300) * .8, L[1][1]]; return '<path d="M' + a[0] + ',' + a[1] + ' L' + L[2][0] + ',' + L[2][1] + '" stroke="#fff" stroke-opacity=".7" stroke-width=".6" fill="none"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="1.6" fill="#fff"/><text x="' + (L[2][0] + (L[3] === 'end' ? -3 : 3)) + '" y="' + (L[2][1] + 2) + '" text-anchor="' + L[3] + '">' + L[0] + '</text>' }).join('') + '</g></g>' +
      '<g data-k="spit" opacity="0" filter="' + U('soft') + '"><path d="M' + f(mx - 6) + ',' + f(my) + ' q-10,14 -22,22 q-8,10 -20,8 q6,-12 16,-18 q10,-8 18,-16Z"/><ellipse data-k="spitPud" cx="' + f(mx - 52) + '" cy="' + f(my + 34) + '" rx="34" ry="18" opacity="0"/></g>' +
      '<path data-k="feed" d="M' + S.tube.map(function (p) { return f(p[0] * 1000) + ',' + f(p[1] * 1000) }).join(' L') + '" stroke="#FFF4D6" stroke-width="2.6" stroke-dasharray="5 11" stroke-linecap="round" fill="none" opacity="0"/>' +
      '<g data-k="hl" opacity="0"><circle r="34" fill="#FFC94D" fill-opacity=".12" stroke="#FFC94D" stroke-width="3"/><circle r="48" fill="none" stroke="#FFC94D" stroke-opacity=".45" stroke-width="1.4"/></g>';
    var E = {}; svg.querySelectorAll('[data-k]').forEach(function (n) { E[n.getAttribute('data-k')] = n });
    var nap = document.createElement('div'); nap.className = 'bf-nap'; nap.hidden = true;
    nap.innerHTML = '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M8 18 Q60 4 112 18 L104 62 Q60 76 16 62Z" fill="#FBFCFC" stroke="#CBD6DB" stroke-width="1.5"/><path d="M20 22 Q60 12 100 22" stroke="#DDE6EA" stroke-width="3" fill="none"/><g class="bf-st"></g></svg><span></span>';
    host.appendChild(nap);
    function napDraw() {
      var show = st.stool !== 'idle' || st.colour !== 'normal'; nap.hidden = !show; if (!show) return;
      var g = nap.querySelector('.bf-st'), col = st.colour === 'pale' ? '#E9E1C8' : STOOL_C[st.stool] || '#D9A441', txt = [], s = '';
      if (st.stool === 'watery') { s += '<path d="M24 42 Q40 28 62 34 Q86 26 98 42 Q92 58 62 58 Q32 60 24 42Z" fill="' + col + '" opacity=".55"/><path d="M34 44 Q58 36 86 44 Q74 52 56 52 Q40 52 34 44Z" fill="' + col + '"/>'; txt.push('watery') }
      else if (st.stool === 'hard') { [[46, 42], [60, 46], [72, 40], [58, 36]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" fill="' + col + '"/>' }); txt.push('hard pellets') }
      else if (st.stool !== 'idle') { s += '<path d="M40 42 Q50 32 64 36 Q80 34 82 44 Q76 54 60 53 Q44 54 40 42Z" fill="' + col + '"/>' }
      if (st.colour === 'pale') txt.push('pale, clay-coloured');
      if (st.colour === 'red') { s += '<path d="M44 40 Q54 46 64 40 M58 48 Q68 52 78 46" stroke="#B3202A" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; txt.push('blood and mucus') }
      g.innerHTML = s; nap.querySelector('span').textContent = 'Nappy check' + (txt.length ? ': ' + txt.join(', ') : '');
    }
    function lut(d, n) { var p = el('path'); p.setAttribute('d', d); var L = p.getTotalLength(), out = []; for (var i = 0; i <= n; i++) { var q = p.getPointAtLength(L * i / n); out.push([q.x, q.y]) } return out }
    function at(T, t) { t = clamp(t, 0, .9999) * (T.length - 1); var i = Math.floor(t), u = t - i; return [lerp(T[i][0], T[i + 1][0], u), lerp(T[i][1], T[i + 1][1], u)] }
    var siL = lut(cr(si, false), 300), coL = lut(cr(colon, false), 240), esL = lut(cr(eso, false), 120);
    var bubs = [], stools = [], drops = [], i;
    for (i = 0; i < 24; i++) { var c = el('circle'); c.setAttribute('fill', '#F4FBFF'); c.setAttribute('fill-opacity', '.7'); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '.35'); E.bubs.appendChild(c); bubs.push({ el: c, t: Math.random(), sp: .02 + Math.random() * .03, r: 1.6 + Math.random() * 1.8, s: 0 }) }
    for (i = 0; i < 20; i++) { var e2 = el('ellipse'); e2.setAttribute('rx', 3.2); e2.setAttribute('ry', 2.5); E.stools.appendChild(e2); stools.push({ el: e2, t: i / 20, sp: .75 + Math.random() * .5 }) }
    for (i = 0; i < 8; i++) { var d2 = el('circle'); d2.setAttribute('r', 1.15); d2.setAttribute('fill', '#FFFBEF'); E.feedDrops.appendChild(d2); drops.push(d2) }
    function oldToUv(x, y) { return [(M[0] * x + M[2] * y + M[4]) / 1000, (M[1] * x + M[3] * y + M[5]) / 1000] }
    var ANCH = { stomach: oldToUv(332, 362), gut: oldToUv(300, 404), belly: oldToUv(300, 368), liver: oldToUv(262, 354), heart: oldToUv(308, 318), mouth: S.mouth, tube: S.tape, probe: S.led, monitor: S.pads, incubator: S.hat, pump: S.tube[S.tube.length - 2] };

    /* WebGL */
    var gl = null, prog = null, UL = {}, ready = false, alive = true, failed = false;
    function fail(e) { if (failed) return; failed = true; alive = false; if (o.onFail) o.onFail(e) }
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }) } catch (e) { }
    if (!gl) { setTimeout(function () { fail(new Error('no webgl')) }, 0) }
    function tex(unit, img) { var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t }
    if (gl) Promise.all([load(S.wide), load(S.trunk), load(S.aux), load(S.cry)]).then(function (im) {
      if (!alive) return;
      var sh = function (t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x };
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      im.forEach(function (img, k) { tex(k, img) });
      ['uWide', 'uTrunk', 'uAux', 'uCry'].forEach(function (n, k) { gl.uniform1i(gl.getUniformLocation(prog, n), k) });
      ['uView', 'uTrunkR', 'uCryR', 'uBelly', 'uChest', 'uLedP', 'uPar', 'uLod', 'uCryA', 'uDist', 'uBreath', 'uJaund', 'uDusk', 'uRed', 'uRash', 'uXray', 'uLed', 'uTime', 'uVig'].forEach(function (n) { UL[n] = gl.getUniformLocation(prog, n) });
      gl.uniform4fv(UL.uTrunkR, S.trunkRect); gl.uniform4fv(UL.uCryR, S.cryRect); gl.uniform2fv(UL.uLedP, S.led);
      ready = true; wrap.classList.add('ready'); if (o.onReady) o.onReady();
    }).catch(fail);
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); fail(new Error('context lost')) });

    /* camera: a rectangle of the picture, in picture coordinates */
    var W = 300, H = 300, vb = null, par = [0, 0], parT = [0, 0];
    function target() {
      var b = S.box[st.view] || S.box.outside, bw2 = (b[2] - b[0]) / st.scale, bh = (b[3] - b[1]) / st.scale, A = W / Math.max(1, H), w, h;
      if (bw2 / bh > A) { w = bw2; h = bw2 / A } else { h = bh; w = bh * A }
      if (w > 1) { h /= w; w = 1 } if (h > 1) { w /= h; h = 1 }
      var cx = clamp((b[0] + b[2]) / 2, w / 2, 1 - w / 2), cy = clamp((b[1] + b[3]) / 2, h / 2, 1 - h / 2); return [cx - w / 2, cy - h / 2, w, h];
    }
    function resize() { W = host.clientWidth || 300; H = host.clientHeight || 300; var d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * d); cv.height = Math.round(H * d); if (gl) gl.viewport(0, 0, cv.width, cv.height) }
    var ro = new ResizeObserver(resize); ro.observe(host); resize();
    var visible = true, io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting }); io.observe(host);
    function onMove(e) { var r = host.getBoundingClientRect(); parT = [clamp((e.clientX - r.left) / r.width - .5, -.6, .6), clamp((e.clientY - r.top) / r.height - .5, -.6, .6)] }
    function onLeave() { parT = [0, 0] }
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) { host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave) }

    var t0 = performance.now(), last = t0, napKey = '';
    function A(e, k, v) { if (e) e.setAttribute(k, v) }
    function step(now) {
      var dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now; var k = 1 - Math.pow(.02, dt);
      st.dist += (st.distT - st.dist) * k; st.stress += (st.stressT - st.stress) * k; st.fill += (st.fillT - st.fill) * k * .6; st.gas += (st.gasT - st.gas) * k;
      st.rash += (st.rashT - st.rash) * k; st.jaund += (st.jaundT - st.jaund) * k; st.dusk += (st.duskT - st.dusk) * k; st.scale += (st.scaleT - st.scale) * k;
      st.cryV += ((st.cry > 0 || st.stress > .8 ? 1 : 0) - st.cryV) * k * 1.5; st.spitV += (st.spit - st.spitV) * k;
      st.ins += ((st.view === 'outside' ? 0 : 1) - st.ins) * k; st.lod += ((st.view === 'outside' ? 0 : 1) - st.lod) * k;
      par[0] += (parT[0] - par[0]) * k * .6; par[1] += (parT[1] - par[1]) * k * .6;
      var tv = target(); if (!vb) vb = tv; for (var j = 0; j < 4; j++) vb[j] += (tv[j] - vb[j]) * k * .8;
      A(svg, 'viewBox', f(vb[0] * 1000) + ' ' + f(vb[1] * 1000) + ' ' + f(vb[2] * 1000) + ' ' + f(vb[3] * 1000));
      var rr = 46 + st.stress * 26 + st.cryV * 10, br = Math.sin(t * rr / 60 * Math.PI * 2), ph = (t * st.hr / 60) % 1, ins = st.ins;
      if (ready) {
        gl.uniform4fv(UL.uView, vb); gl.uniform3f(UL.uBelly, S.belly[0], S.belly[1], S.belly[2]); gl.uniform3f(UL.uChest, S.chest[0], S.chest[1], S.chest[2]);
        gl.uniform2f(UL.uPar, -par[0] * .012 * vb[2] * (1 - ins), -par[1] * .012 * vb[3] * (1 - ins));
        gl.uniform1f(UL.uLod, st.lod); gl.uniform1f(UL.uCryA, clamp(st.cryV, 0, 1) * (1 - ins)); gl.uniform1f(UL.uDist, st.dist); gl.uniform1f(UL.uBreath, br * .5 + .5);
        gl.uniform1f(UL.uJaund, st.jaund); gl.uniform1f(UL.uDusk, st.dusk); gl.uniform1f(UL.uRed, clamp(Math.max(st.cryV * .7, st.stress * .45), 0, 1)); gl.uniform1f(UL.uRash, st.rash);
        gl.uniform1f(UL.uXray, ins); gl.uniform1f(UL.uLed, .35 + .65 * Math.exp(-ph * 6)); gl.uniform1f(UL.uTime, t % 10); gl.uniform1f(UL.uVig, o.vignette == null ? .5 : o.vignette);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      glare.style.transform = 'translate(' + f(par[0] * -18) + 'px,' + f(par[1] * -12) + 'px)';
      /* overlay */
      A(E.inner, 'opacity', f(ins)); A(E.colon, 'stroke', COLON_C[st.colour] || COLON_C.normal);
      var sc = SPITC[st.spitCol] || SPITC.milk; A(E.spit, 'opacity', f(clamp(st.spitV, 0, 1) * (1 - ins))); A(E.spit, 'fill', sc); A(E.spitPud, 'opacity', f(clamp(st.spitV - 1, 0, 1)));
      A(E.feed, 'opacity', st.feeding ? f(.9 * (1 - ins * .6)) : 0); if (st.feeding) A(E.feed, 'stroke-dashoffset', f(t * 22));
      if (ins > .02) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; stom.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]) });
        var lvl = lerp(y1 - 1, y0 + 3, clamp(st.fill, 0, 1)), wv = Math.sin(t * 2.2) * 1.4;
        A(E.milk, 'd', 'M' + (x0 - 4) + ',' + f(lvl + wv) + ' Q' + f((x0 + x1) / 2) + ',' + f(lvl - wv) + ' ' + (x1 + 4) + ',' + f(lvl + wv) + ' V' + (y1 + 4) + ' H' + (x0 - 4) + 'Z');
        A(E.milkTop, 'd', 'M' + (x0 - 4) + ',' + f(lvl + wv) + ' Q' + f((x0 + x1) / 2) + ',' + f(lvl - wv) + ' ' + (x1 + 4) + ',' + f(lvl + wv));
        var g = st.gas + st.dist * 16; bubs.forEach(function (b, n) { b.t = (b.t + dt * b.sp * (1 + st.jit)) % 1; b.s += ((n < g ? 1 : 0) - b.s) * k; var p = at(siL, b.t); A(b.el, 'cx', f(p[0])); A(b.el, 'cy', f(p[1])); A(b.el, 'r', f(b.r * b.s)) });
        var spd = st.stool === 'watery' ? .12 : st.stool === 'hard' ? .02 : st.stool === 'idle' ? .015 : .05, scol = st.colour === 'pale' ? STOOL_C.pale : st.colour === 'red' && st.stool !== 'idle' ? '#A9473F' : STOOL_C[st.stool] || STOOL_C.normal;
        stools.forEach(function (s) { s.t = (s.t + dt * spd * s.sp) % 1; var p = at(coL, s.t); A(s.el, 'cx', f(p[0])); A(s.el, 'cy', f(p[1])); A(s.el, 'fill', scol); A(s.el, 'opacity', st.stool === 'watery' ? .6 : .9) });
        drops.forEach(function (dd, n) { var tt = (t * .45 + n / drops.length) % 1, p = at(esL, tt); A(dd, 'cx', f(p[0])); A(dd, 'cy', f(p[1])); A(dd, 'opacity', st.feeding ? f(Math.sin(tt * Math.PI)) : 0) });
        A(E.heartG, 'transform', 'translate(308 318) scale(' + f(1 + .05 * Math.exp(-ph * 7)) + ') translate(-308 -318)');
      }
      if (st.flash > 0) { st.flash = Math.max(0, 1 - (now - st.flashT) / 1400); var hs = svg.querySelector('#' + pre + 'halo'); for (var z = 0; z < hs.children.length; z++) hs.children[z].setAttribute('stop-color', st.flashCol); A(E.halo, 'opacity', f(st.flash)) } else A(E.halo, 'opacity', 0);
      var q = st.hl && ANCH[st.hl]; if (q) { A(E.hl, 'transform', 'translate(' + f(q[0] * 1000) + ' ' + f(q[1] * 1000) + ') scale(' + f((1 + .12 * Math.sin(t * 4)) * vb[2] * 1.6) + ')'); A(E.hl, 'opacity', 1) } else A(E.hl, 'opacity', 0);
      var nk = st.stool + '|' + st.colour; if (nk !== napKey) { napKey = nk; napDraw() }
    }
    function frame(now) { if (!alive) return; requestAnimationFrame(frame); if (!visible || document.hidden) { last = now; return } try { step(now) } catch (e) { console.error(e); fail(e) } }
    requestAnimationFrame(frame);
    function setView(v) { if (v === 'nicu') v = 'outside'; if (S.box[v]) st.view = v }
    var api = {
      set: function (p) {
        if (p.view) setView(p.view); if (p.mode) setView(p.mode);
        if (p.fill != null) st.fillT = p.fill; if (p.feeding != null) st.feeding = !!p.feeding; if (p.distension != null) st.distT = p.distension; if (p.stress != null) st.stressT = p.stress;
        if (p.cry != null) st.cry = p.cry; if (p.gas != null) st.gasT = p.gas; if (p.jitter != null) st.jit = p.jitter; if (p.stool) st.stool = p.stool; if (p.colour) st.colour = p.colour;
        if (p.spit != null) st.spit = p.spit; if (p.spitCol) st.spitCol = p.spitCol; if (p.rash != null) st.rashT = p.rash; if (p.jaundice != null) st.jaundT = p.jaundice; if (p.scale != null) st.scaleT = p.scale;
        if (p.hr != null) st.hr = p.hr; if (p.alarm != null) st.alarm = !!p.alarm; if (p.dusky != null) st.duskT = p.dusky; if (p.sleepy != null) st.sleepy = p.sleepy;
        if (p.highlight !== undefined) st.hl = p.highlight; return api;
      },
      now: function (p) { api.set(p); if (p.fill != null) st.fill = p.fill; if (p.distension != null) st.dist = p.distension; if (p.jaundice != null) st.jaund = p.jaundice; if (p.dusky != null) st.dusk = p.dusky; if (p.view || p.mode) { st.ins = st.lod = st.view === 'outside' ? 0 : 1; vb = null } return api },
      flash: function (kind) { st.flash = 1; st.flashT = performance.now(); st.flashCol = kind === 'bad' ? '#ff3b3b' : kind === 'warn' ? '#f59e0b' : '#22c55e'; return api },
      highlight: function (k) { st.hl = k; return api },
      view: function (v) { if (v) setView(v); return st.view },
      real: function () { return api }, ready: function () { return ready }, state: st,
      dispose: function () { alive = false; io.disconnect(); ro.disconnect(); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); var x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); wrap.remove(); nap.remove() }
    };
    api.now(o);
    return api;
  }
  return { create: create, can: can };
})();

/* BABYFRONT keeps its name for the app: rendered scene where one exists, painted baby otherwise or if the scene fails. */
(function () {
  var painter = window.BABYFRONT; if (!painter) return;
  window.BABYFRONT = {
    supported: painter.supported,
    create: function (host, o) {
      if (!BABYSCENE.can(o)) return painter.create(host, o);
      var real, proxy = {}, userFail = o && o.onFail;
      var opts = Object.assign({}, o, { onFail: function () { var s = real.state, v = real.view(); try { real.dispose() } catch (e) { } real = painter.create(host, Object.assign({}, o, { view: v, onFail: userFail })); real.now({ distension: s.distT, jaundice: s.jaundT, dusky: s.duskT, fill: s.fillT, feeding: s.feeding, stool: s.stool, colour: s.colour, hr: s.hr }) } });
      real = BABYSCENE.create(host, opts);
      ['set', 'now', 'flash', 'highlight'].forEach(function (k) { proxy[k] = function (a) { real[k](a); return proxy } });
      proxy.view = function (v) { return real.view(v) }; proxy.real = function () { return proxy }; proxy.ready = function () { return real.ready() }; proxy.dispose = function () { real.dispose() };
      Object.defineProperty(proxy, 'state', { get: function () { return real.state } });
      return proxy;
    }
  };
})();
