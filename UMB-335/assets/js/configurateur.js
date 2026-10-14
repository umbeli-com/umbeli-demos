/* ============================================================
   AMAZONIA — Configurateur 3D de vitrine
   Unités de la scène : 1 unité = 1 pied.
   Façade de brique (centre-ville québécois), vitrine aux vraies
   dimensions, intérieur du commerce, ciel nocturne avec aurore
   boréale, neige, jour/nuit, et fiche projet calculée en direct.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Données ---------- */
  var FT = 0.3048;
  var TECH = { led: 'LED transparent', suspendu: 'Écran suspendu', rollup: 'Roll-up numérique', film: 'Film intelligent' };
  var EXPO = { N: { l: 'Nord', nits: 2500 }, E: { l: 'Est', nits: 3500 }, S: { l: 'Plein sud', nits: 5000 }, O: { l: 'Ouest', nits: 4500 } };
  var ROLL = { pliable: 'Pliable', '3volets': 'Dépliable 3 volets', exterieur: 'Extérieur' };
  var PROG = { brand: 'Image de marque', promo: 'Promotion', menu: 'Menu du jour', event: 'Événement' };

  var state = {
    tech: 'led', W: 12, H: 8, pitch: 7.8, size: 65, roll: 'pliable', film: false, frost: false, expo: 'S',
    name: '', prog: 'brand', night: true, snow: true, monet: false, ads: 4, rate: 150, view: 'rue'
  };
  var qs = new URLSearchParams(location.search);
  if (TECH[qs.get('tech')]) state.tech = qs.get('tech');
  if (qs.get('monetiser')) state.monet = true;

  var ftIn = function (f) { var ft = Math.floor(f + 1e-6), i = Math.round((f - ft) * 12); if (i === 12) { ft++; i = 0; } return ft + '′ ' + i + '″'; };
  var meters = function (f) { return (f * FT).toFixed(2).replace('.', ',') + ' m'; };
  var nb = function (n) { return Math.round(n).toLocaleString('fr-CA'); };
  var dec = function (n) { return String(n).replace('.', ','); };
  var displayName = function () { return (state.name || 'VOTRE COMMERCE').toUpperCase(); };

  /* ============================================================
     Scène 3D
     ============================================================ */
  var three = null;
  try { three = init3D(); } catch (e) {
    console.error(e);
    $('#loading').innerHTML = 'Aperçu 3D indisponible sur cet appareil — la fiche projet reste active.';
  }

  function init3D() {
    if (!window.THREE || !window.AmzLED) throw new Error('Three.js non chargé');
    var canvas = $('#cfg-canvas'), stage = $('#stage');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.3, 1200);
    camera.position.set(30, 30, 90);
    var controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.screenSpacePanning = true;

    var DAY_H = new THREE.Color(0.80, 0.86, 0.92), NIGHT_H = new THREE.Color(0.035, 0.06, 0.11);
    scene.fog = new THREE.Fog(NIGHT_H.clone(), 70, 320);

    /* ---------- Ciel : jour / nuit + aurore boréale ---------- */
    var skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uNight: { value: 1 }, uTime: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: [
        'uniform float uNight, uTime; varying vec3 vDir;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);',
        '  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }',
        'void main(){',
        '  vec3 d = normalize(vDir); float h = d.y;',
        '  vec3 day = mix(vec3(0.80,0.86,0.92), vec3(0.30,0.50,0.80), smoothstep(-0.02, 0.5, h));',
        '  vec3 night = mix(vec3(0.035,0.06,0.11), vec3(0.004,0.008,0.025), smoothstep(-0.02, 0.45, h));',
        '  vec2 p = d.xz / max(h + 0.15, 0.05);',
        '  float n = noise(p * 0.9 + vec2(uTime * 0.03, 0.0));',
        '  float curtain = sin(p.x * 1.3 + n * 5.0 + uTime * 0.12);',
        '  float a = smoothstep(0.5, 1.0, curtain) * smoothstep(0.03, 0.2, h) * (1.0 - smoothstep(0.32, 0.7, h));',
        '  float rays = 0.55 + 0.45 * noise(vec2(p.x * 7.0, uTime * 0.25));',
        '  vec3 aur = mix(vec3(0.22, 1.0, 0.68), vec3(0.55, 0.40, 1.0), smoothstep(0.1, 0.42, h));',
        '  night += aur * a * rays * 0.65;',
        '  vec2 sp = vec2(atan(d.z, d.x) * 140.0, h * 260.0);',
        '  float s = step(0.996, hash(floor(sp))) * smoothstep(0.04, 0.25, h);',
        '  night += vec3(s) * 0.85;',
        '  gl_FragColor = vec4(mix(day, night, uNight), 1.0);',
        '}'].join('\n')
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), skyMat));

    /* ---------- Lumières ---------- */
    var hemi = new THREE.HemisphereLight(0xcfe3ff, 0x2a2420, 0.2);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1dc, 0.2);
    scene.add(sun);
    scene.add(sun.target);

    /* ---------- Sol : trottoir, rue, bancs de neige ---------- */
    var streetMat = new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 0.95 });
    var street = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.y = -0.5;
    scene.add(street);
    var walkMat = new THREE.MeshStandardMaterial({ color: 0x6d7076, roughness: 0.9 });
    var walk = new THREE.Mesh(new THREE.BoxGeometry(900, 0.5, 13), walkMat);
    walk.position.set(0, -0.25, 6.5);
    scene.add(walk);
    var lineMat = new THREE.MeshBasicMaterial({ color: 0xd9b34a });
    for (var li = -40; li < 40; li++) {
      var ln = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.35), lineMat);
      ln.rotation.x = -Math.PI / 2;
      ln.position.set(li * 12, -0.48, 30);
      scene.add(ln);
    }

    /* ---------- Textures procédurales ---------- */
    function brickTexture(tint) {
      var c = document.createElement('canvas'); c.width = c.height = 512;
      var x = c.getContext('2d');
      x.fillStyle = tint.mortar; x.fillRect(0, 0, 512, 512);
      var cols = 6, rows = 18, bw = 512 / cols, bh = 512 / rows;
      for (var r = 0; r < rows; r++) {
        var off = (r % 2) * bw / 2;
        for (var i = -1; i <= cols; i++) {
          var k = Math.random();
          x.fillStyle = 'rgb(' + Math.round(tint.r + k * tint.v) + ',' + Math.round(tint.g + k * tint.v * 0.45) + ',' + Math.round(tint.b + k * tint.v * 0.3) + ')';
          x.fillRect(i * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
        }
      }
      var img = x.getImageData(0, 0, 512, 512), d = img.data;
      for (var p = 0; p < d.length; p += 4) { var g = (Math.random() - 0.5) * 22; d[p] += g; d[p + 1] += g; d[p + 2] += g; }
      x.putImageData(img, 0, 0);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(0.25, 0.25);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }
    var brickMat = new THREE.MeshStandardMaterial({ map: brickTexture({ mortar: '#3b302b', r: 118, g: 50, b: 36, v: 46 }), roughness: 0.92 });
    var stoneMat = new THREE.MeshStandardMaterial({ map: brickTexture({ mortar: '#55585e', r: 128, g: 128, b: 130, v: 30 }), roughness: 0.9 });
    var paintMat = new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.85 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.8 });
    var alu = new THREE.MeshStandardMaterial({ color: 0x0d1018, metalness: 0.8, roughness: 0.35 });
    var snowMatS = new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.85 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x0b0e15, roughness: 0.5, metalness: 0.3 });
    [brickMat, stoneMat, paintMat, trimMat, alu, snowMatS, darkMat].forEach(function (m) { m.userData.shared = true; });

    /* ---------- Contenus diffusés ---------- */
    function makeTex(content) {
      var t = new THREE.CanvasTexture(content.canvas);
      t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      return t;
    }
    var mainContent = AmzLED.createContent({ w: 640, h: 427, program: state.prog });
    var mainTex = makeTex(mainContent);
    var screenContent = AmzLED.createContent({ w: 640, h: 360, program: state.prog });
    var screenTex = makeTex(screenContent);
    var portraitContent = AmzLED.createContent({ w: 270, h: 844, program: 'rollup' });
    var portraitTex = makeTex(portraitContent);

    function resizeMainContent() {
      var h = Math.round(Math.max(200, Math.min(1280, 640 * state.H / state.W)));
      if (mainContent.canvas.height === h) return;
      mainContent.canvas.height = h;
      mainTex.dispose();
      mainTex = makeTex(mainContent);
      glassMat.uniforms.uTex.value = mainTex;
    }

    /* ---------- Vitre / LED ---------- */
    var glassMat = AmzLED.createMaterial(THREE, { texture: mainTex, cols: 96, rows: 64, aspect: 1.5, bright: 1.25 });
    var GU = glassMat.uniforms;
    glassMat.userData.shared = true;

    /* ---------- Groupes reconstruits ---------- */
    var world = new THREE.Group(); scene.add(world);
    var facade = new THREE.Group(); world.add(facade);
    var product = new THREE.Group(); world.add(product);
    var snowCover = new THREE.Group(); world.add(snowCover);
    var dims = new THREE.Group(); world.add(dims);
    var L = {};
    var upperWins = [], interiorLights = [], lamp = null, lampLight = null, glass = null, signMat = null, signLight = null, toque = null;

    function disposeGroup(g) {
      while (g.children.length) {
        var o = g.children.pop();
        o.traverse(function (n) {
          if (n.geometry) n.geometry.dispose();
          (Array.isArray(n.material) ? n.material : [n.material]).forEach(function (m) { if (m && !m.userData.shared) m.dispose(); });
        });
      }
    }

    function layout() {
      var W = state.W, H = state.H;
      L.sill = 1.5;
      L.wx = -2.2;
      L.x0 = L.wx - W / 2; L.x1 = L.wx + W / 2;
      L.doorW = 3.4; L.doorH = 7.4;
      L.doorX = L.x1 + 1.4 + L.doorW / 2;
      L.signY0 = L.sill + H + 0.8; L.signH = 2.2;
      L.upY = L.signY0 + L.signH + 1.8;
      L.FH = L.upY + 5 + 2.6;
      L.left = L.x0 - 6; L.right = L.doorX + L.doorW / 2 + 5;
      L.FW = L.right - L.left;
      L.IH = Math.max(L.sill + H + 1.6, L.doorH + 1.2);
      L.px = L.x0 - 3.2; L.pz = 4.2;
    }

    function signTexture(w, h) {
      var c = document.createElement('canvas');
      c.width = 1024; c.height = Math.max(96, Math.round(1024 * h / w));
      var x = c.getContext('2d');
      var g = x.createLinearGradient(0, 0, 0, c.height);
      g.addColorStop(0, '#0b1120'); g.addColorStop(1, '#05070d');
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = 'rgba(51,240,255,0.35)'; x.lineWidth = 4;
      x.strokeRect(10, 10, c.width - 20, c.height - 20);
      var name = displayName();
      var size = c.height * 0.5;
      x.font = '800 ' + size + 'px Archivo, Arial, sans-serif';
      if ('fontStretch' in x) x.fontStretch = 'expanded';
      var tw = x.measureText(name).width, maxW = c.width * 0.86;
      if (tw > maxW) { size *= maxW / tw; x.font = '800 ' + size + 'px Archivo, Arial, sans-serif'; }
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = 'rgba(51,240,255,0.9)'; x.shadowBlur = 28;
      x.fillStyle = '#ffffff';
      x.fillText(name, c.width / 2, c.height * 0.52);
      x.shadowBlur = 0;
      var ug = x.createLinearGradient(c.width * 0.3, 0, c.width * 0.7, 0);
      ug.addColorStop(0, '#3DFFB4'); ug.addColorStop(0.5, '#33F0FF'); ug.addColorStop(1, '#8B6CFF');
      x.fillStyle = ug; x.fillRect(c.width * 0.3, c.height * 0.82, c.width * 0.4, 4);
      var t = new THREE.CanvasTexture(c);
      t.anisotropy = 8;
      return t;
    }

    function box(w, h, d, mat, x, y, z, parent) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      (parent || facade).add(m);
      return m;
    }

    function rectHole(x0, y0, x1, y1) {
      var p = new THREE.Path();
      p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0);
      return p;
    }

    /* ---------- Façade + intérieur ---------- */
    function buildFacade() {
      disposeGroup(facade); disposeGroup(snowCover);
      upperWins = []; interiorLights = [];
      var W = state.W, H = state.H;

      // Mur de brique percé (vitrine, porte, fenêtres de l'étage)
      var s = new THREE.Shape();
      s.moveTo(L.left, 0); s.lineTo(L.right, 0); s.lineTo(L.right, L.FH); s.lineTo(L.left, L.FH); s.lineTo(L.left, 0);
      s.holes.push(rectHole(L.x0, L.sill, L.x1, L.sill + H));
      s.holes.push(rectHole(L.doorX - L.doorW / 2, 0, L.doorX + L.doorW / 2, L.doorH));
      var n = Math.max(2, Math.floor((L.FW - 4) / 6.5));
      var step = (L.FW - 4) / n, wins = [];
      for (var i = 0; i < n; i++) {
        var cx = L.left + 2 + step * (i + 0.5);
        s.holes.push(rectHole(cx - 1.5, L.upY, cx + 1.5, L.upY + 5));
        wins.push(cx);
      }
      var wall = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false }), brickMat);
      wall.position.z = -1.2;
      facade.add(wall);

      // fenêtres de l'étage (allumées au hasard la nuit)
      wins.forEach(function (cx, k) {
        var lit = (k * 7 + 3) % 3 !== 0;
        var mat = new THREE.MeshStandardMaterial({ color: 0x0a0f18, emissive: lit ? 0xffb86b : 0x1a2440, emissiveIntensity: 0, roughness: 0.3 });
        var pane = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), mat);
        pane.position.set(cx, L.upY + 2.5, -0.9);
        facade.add(pane);
        upperWins.push({ mat: mat, lit: lit });
        box(3.6, 0.3, 0.6, trimMat, cx, L.upY - 0.15, 0.1);
        box(3.4, 0.35, 0.3, trimMat, cx, L.upY + 5.2, 0.05);
        var sn = box(3.6, 0.18, 0.6, snowMatS, cx, L.upY + 0.08, 0.1, snowCover);
        sn.scale.y = 1;
      });

      // corniche + soubassement
      box(L.FW + 0.8, 0.9, 1.8, trimMat, (L.left + L.right) / 2, L.FH - 0.45, -0.3);
      box(L.FW + 1.2, 0.25, 2.2, snowMatS, (L.left + L.right) / 2, L.FH + 0.1, -0.3, snowCover);
      box(W + 0.8, 0.28, 0.7, trimMat, L.wx, L.sill - 0.14, 0.15);
      box(W + 0.8, 0.22, 0.7, snowMatS, L.wx, L.sill + 0.11, 0.15, snowCover);

      // cadre aluminium de la vitrine
      box(W + 0.4, 0.3, 0.6, alu, L.wx, L.sill + H + 0.05, -0.3);
      box(W + 0.4, 0.3, 0.6, alu, L.wx, L.sill - 0.05, -0.3);
      box(0.3, H, 0.6, alu, L.x0 + 0.05, L.sill + H / 2, -0.3);
      box(0.3, H, 0.6, alu, L.x1 - 0.05, L.sill + H / 2, -0.3);

      // vitre / écran LED
      glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, H - 0.2), glassMat);
      glass.position.set(L.wx, L.sill + H / 2, -0.45);
      glass.renderOrder = 10;
      facade.add(glass);

      // porte
      var dx0 = L.doorX - L.doorW / 2, dx1 = L.doorX + L.doorW / 2;
      box(L.doorW + 0.3, 0.3, 0.6, alu, L.doorX, L.doorH, -0.3);
      box(0.3, L.doorH, 0.6, alu, dx0, L.doorH / 2, -0.3);
      box(0.3, L.doorH, 0.6, alu, dx1, L.doorH / 2, -0.3);
      var dg = new THREE.Mesh(new THREE.PlaneGeometry(L.doorW - 0.3, L.doorH - 0.2), new THREE.MeshStandardMaterial({ color: 0x0b1422, metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.5 }));
      dg.position.set(L.doorX, L.doorH / 2, -0.5);
      facade.add(dg);
      box(0.12, 2.2, 0.12, new THREE.MeshStandardMaterial({ color: 0xd9b26b, metalness: 0.9, roughness: 0.25 }), dx1 - 0.6, 3.6, -0.2);

      // enseigne lumineuse
      var signW = (dx1 + 0.6) - (L.x0 - 0.6), signCX = ((dx1 + 0.6) + (L.x0 - 0.6)) / 2;
      if (signMat && signMat.map) signMat.map.dispose();
      signMat = new THREE.MeshBasicMaterial({ map: signTexture(signW, L.signH), toneMapped: false });
      var sign = new THREE.Mesh(new THREE.BoxGeometry(signW, L.signH, 0.35), [darkMat, darkMat, darkMat, darkMat, signMat, darkMat]);
      sign.position.set(signCX, L.signY0 + L.signH / 2, 0.18);
      facade.add(sign);
      box(signW + 0.2, 0.2, 0.55, snowMatS, signCX, L.signY0 + L.signH + 0.1, 0.18, snowCover);
      signLight = new THREE.PointLight(0x9fdcff, 0, 22, 1.5);
      signLight.position.set(signCX, L.signY0 - 0.4, 2.5);
      facade.add(signLight);

      // bâtiments voisins
      var lW = 20, rW = 18;
      var st = stoneMat.map.clone();
      st.repeat.set(lW / 4, (L.FH + 4) / 4);
      st.needsUpdate = true;
      box(lW, L.FH + 4, 3, new THREE.MeshStandardMaterial({ map: st, roughness: 0.9 }), L.left - lW / 2 - 0.1, (L.FH + 4) / 2, -1.6);
      box(rW, L.FH - 2.5, 3, paintMat, L.right + rW / 2 + 0.1, (L.FH - 2.5) / 2, -1.6);
      [[L.left - 6, L.upY + 1], [L.left - 14, L.upY + 1], [L.left - 6, 4], [L.left - 14, 4], [L.right + 5, L.upY], [L.right + 12, L.upY], [L.right + 9, 3.5]].forEach(function (p, k) {
        var lit = k % 3 !== 1;
        var mat = new THREE.MeshStandardMaterial({ color: 0x0a0f18, emissive: lit ? 0xffc27a : 0x14203a, emissiveIntensity: 0 });
        var pn = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.6), mat);
        pn.position.set(p[0], p[1] + 2.3, -0.08);
        facade.add(pn);
        upperWins.push({ mat: mat, lit: lit });
      });

      // intérieur du commerce
      var ix0 = L.x0 - 1, ix1 = dx1 + 1, iw = ix1 - ix0, icx = (ix0 + ix1) / 2, depth = 14;
      var roomMat = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.9 });
      var zc = -1.2 - depth / 2;
      [[iw, L.IH, icx, L.IH / 2, -1.2 - depth, 0, 0],
       [depth, L.IH, ix0, L.IH / 2, zc, 0, Math.PI / 2],
       [depth, L.IH, ix1, L.IH / 2, zc, 0, -Math.PI / 2],
       [iw, depth, icx, L.IH, zc, Math.PI / 2, 0]].forEach(function (w) {
        var pl = new THREE.Mesh(new THREE.PlaneGeometry(w[0], w[1]), roomMat);
        pl.position.set(w[2], w[3], w[4]);
        pl.rotation.set(w[5], w[6], 0);
        facade.add(pl);
      });
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(iw, depth), new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.6 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(icx, 0.02, -1.2 - depth / 2);
      facade.add(floor);
      // étagères murales + produits
      var shelfMat = new THREE.MeshStandardMaterial({ color: 0x15110e, roughness: 0.7 });
      var prodCols = [0x3dffb4, 0x33f0ff, 0x8b6cff, 0xd9b26b, 0xffffff];
      for (var sx = ix0 + 2.5; sx < ix1 - 2; sx += 5) {
        for (var sy = 2; sy < L.IH - 1.5; sy += 2.2) {
          box(4.2, 0.15, 1.2, shelfMat, sx, sy, -1.2 - depth + 0.7);
          for (var pp = 0; pp < 3; pp++) {
            var pc = prodCols[(Math.round(sx * 3 + sy * 5) + pp) % prodCols.length];
            box(0.7, 0.9, 0.6, new THREE.MeshStandardMaterial({ color: pc, roughness: 0.4, emissive: pc, emissiveIntensity: 0.08 }), sx - 1.3 + pp * 1.3, sy + 0.53, -1.2 - depth + 0.8);
          }
        }
      }
      // comptoir + plante
      box(5, 3.2, 2, new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.35 }), icx + iw * 0.18, 1.6, -9);
      box(5.2, 0.15, 2.2, new THREE.MeshStandardMaterial({ color: 0xd9b26b, metalness: 0.8, roughness: 0.3 }), icx + iw * 0.18, 3.25, -9);
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0xd8d2c4 }));
      pot.position.set(ix0 + 1.6, 0.7, -4); facade.add(pot);
      var leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshStandardMaterial({ color: 0x1f5a3a, roughness: 0.8, flatShading: true }));
      leaf.position.set(ix0 + 1.6, 2.6, -4); leaf.scale.y = 1.3; facade.add(leaf);
      // suspensions + lumières chaudes
      for (var k = 0; k < 3; k++) {
        var lx = ix0 + iw * (0.2 + k * 0.3);
        var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
        bulb.position.set(lx, L.IH - 1.6, -5.5);
        facade.add(bulb);
        box(0.03, 1.2, 0.03, darkMat, lx, L.IH - 0.8, -5.5);
        var pl = new THREE.PointLight(0xffc98a, 1, 26, 1.4);
        pl.position.set(lx, L.IH - 2.2, -5.5);
        facade.add(pl);
        interiorLights.push(pl);
      }

      // lampadaire
      var lampX = L.left + 0.5, lampZ = 11.8;
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 15, 12), alu);
      pole.position.set(lampX, 7.5, lampZ); facade.add(pole);
      box(0.18, 0.18, 3.4, alu, lampX, 14.8, lampZ - 1.6);
      lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.8), new THREE.MeshBasicMaterial({ color: 0xffe0a8 }));
      lamp.position.set(lampX, 14.55, lampZ - 3.2);
      facade.add(lamp);
      lampLight = new THREE.PointLight(0xffd59a, 0, 48, 1.2);
      lampLight.position.set(lampX, 13.5, lampZ - 3.2);
      facade.add(lampLight);

      // bancs de neige le long du trottoir
      for (var b = -12; b < 12; b++) {
        var bank = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), snowMatS);
        bank.scale.set(3.4 + (b * 37 % 5) * 0.3, 1.1 + (b * 13 % 4) * 0.25, 1.6);
        bank.position.set(L.wx + b * 6.2, 0, 12.6);
        snowCover.add(bank);
      }

      buildPerson();
    }

    /* ---------- Silhouette à l'échelle (5′9″) ---------- */
    var person = new THREE.Group(); world.add(person);
    function buildPerson() {
      disposeGroup(person);
      var pm = new THREE.MeshStandardMaterial({ color: 0x1d2538, roughness: 0.55, metalness: 0.15 });
      var cap = function (r, len, x, y, z, rz) {
        var c = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), pm);
        c.position.set(x, y, z); if (rz) c.rotation.z = rz; person.add(c);
      };
      cap(0.3, 2.3, -0.33, 1.45, 0); cap(0.3, 2.3, 0.33, 1.45, 0);
      cap(0.62, 1.35, 0, 3.75, 0);
      cap(0.2, 1.8, -0.9, 3.65, 0, 0.12); cap(0.2, 1.8, 0.9, 3.65, 0, -0.12);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), pm);
      head.position.y = 5.3; person.add(head);
      // tuque québécoise quand il neige
      toque = new THREE.Group();
      var tq = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc8202f, roughness: 0.9 }));
      tq.position.y = 5.36; toque.add(tq);
      var pom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 1 }));
      pom.position.y = 5.86; toque.add(pom);
      person.add(toque);
      person.position.set(L.px, 0, L.pz);
      person.rotation.y = -0.5;
    }

    /* ---------- Produit configuré ---------- */
    var activeContent = [];
    var backMat = new THREE.MeshStandardMaterial({ color: 0x2a3142, metalness: 0.5, roughness: 0.45 });
    backMat.userData.shared = true;
    function screenBox(w, h, d, tex) {
      var front = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [backMat, backMat, backMat, backMat, front, backMat]);
    }
    function buildProduct() {
      disposeGroup(product);
      activeContent = [];
      var W = state.W, H = state.H;
      GU.uLed.value = state.tech === 'led' ? 1 : 0;
      if (state.tech === 'led') {
        resizeMainContent();
        var cols = Math.round(Math.max(32, Math.min(220, W * 50 / state.pitch)));
        GU.uGrid.value.set(cols, Math.max(8, Math.round(cols * H / W)));
        GU.uAspect.value = W / H;
        activeContent.push([mainContent, function () { mainTex.needsUpdate = true; }]);
      }
      if (state.tech === 'suspendu') {
        var d = state.size, sw = d * 16 / Math.sqrt(337) / 12, sh = d * 9 / Math.sqrt(337) / 12;
        var k = Math.min(1, (W - 0.8) / sw, (H - 0.9) / sh);
        state.sizeFits = k >= 0.999;
        sw *= k; sh *= k;
        var scr = screenBox(sw, sh, 0.16, screenTex);
        var y = L.sill + H - 0.45 - sh / 2;
        scr.position.set(L.wx, y, -1.25);
        product.add(scr);
        var bez = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.12, sh + 0.12, 0.12), darkMat);
        bez.position.set(L.wx, y, -1.36);
        product.add(bez);
        var cableH = L.IH - (y + sh / 2);
        [-sw * 0.35, sw * 0.35].forEach(function (dx) {
          var c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, cableH, 6), alu);
          c.position.set(L.wx + dx, y + sh / 2 + cableH / 2, -1.3);
          product.add(c);
        });
        activeContent.push([screenContent, function () { screenTex.needsUpdate = true; }]);
      }
      if (state.tech === 'rollup') {
        var rw = 0.64 / FT, rh = 2.0 / FT;
        var totem = function (x, z, ry, outdoor) {
          var g = new THREE.Group();
          var s = screenBox(rw, rh, 0.14, portraitTex);
          s.position.y = rh / 2 + 0.3;
          g.add(s);
          var base = new THREE.Mesh(new THREE.BoxGeometry(rw + (outdoor ? 0.8 : 0.4), 0.3, outdoor ? 1.6 : 1.1), alu);
          base.position.y = 0.15;
          g.add(base);
          if (outdoor) {
            var hood = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.3, 0.25, 0.6), alu);
            hood.position.set(0, rh + 0.45, 0.1);
            g.add(hood);
          }
          g.position.set(x, 0, z); g.rotation.y = ry;
          product.add(g);
        };
        if (state.roll === 'pliable') totem(L.wx, -2.2, 0);
        if (state.roll === '3volets') { totem(L.wx - rw - 0.05, -2.0, 0.3); totem(L.wx, -2.3, 0); totem(L.wx + rw + 0.05, -2.0, -0.3); }
        if (state.roll === 'exterieur') totem(L.x1 - 1.2, 3.2, -0.35, true);
        activeContent.push([portraitContent, function () { portraitTex.needsUpdate = true; }]);
      }
      buildDims();
    }

    /* ---------- Cotes ---------- */
    var dimMat = new THREE.LineBasicMaterial({ color: 0x33f0ff, transparent: true, opacity: 0.9, depthTest: false });
    dimMat.userData.shared = true;
    function buildDims() {
      disposeGroup(dims);
      var H = state.H, y1 = L.sill + H + 0.4, xl = L.x0 - 0.7, z = 0.45;
      var pts = [
        L.x0, y1, z, L.x1, y1, z,
        L.x0, y1 - 0.3, z, L.x0, y1 + 0.3, z,
        L.x1, y1 - 0.3, z, L.x1, y1 + 0.3, z,
        xl, L.sill, z, xl, L.sill + H, z,
        xl - 0.3, L.sill, z, xl + 0.3, L.sill, z,
        xl - 0.3, L.sill + H, z, xl + 0.3, L.sill + H, z
      ];
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      var lines = new THREE.LineSegments(g, dimMat);
      lines.renderOrder = 40;
      dims.add(lines);
    }

    /* ---------- Neige ---------- */
    var N = 2600, spos = new Float32Array(N * 3), sseed = new Float32Array(N * 2);
    for (var si = 0; si < N; si++) {
      spos[si * 3] = (Math.random() - 0.5) * 110;
      spos[si * 3 + 1] = Math.random() * 46;
      spos[si * 3 + 2] = Math.random() * 60 - 14;
      sseed[si * 2] = 0.4 + Math.random() * 0.8;
      sseed[si * 2 + 1] = Math.random() * 6.28;
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    sg.setAttribute('aSeed', new THREE.BufferAttribute(sseed, 2));
    var snowPMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uAlpha: { value: 1 }, uDay: { value: 0 } },
      vertexShader: [
        'attribute vec2 aSeed; uniform float uTime, uPx; varying float vA;',
        'void main(){ vec3 p = position;',
        '  p.y = mod(p.y - uTime * aSeed.x * 2.2, 46.0);',
        '  p.x += sin(uTime * 0.6 + aSeed.y) * 1.2;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = (1.2 + aSeed.x * 1.6) * uPx * (60.0 / -mv.z);',
        '  vA = clamp(1.0 - (-mv.z) / 140.0, 0.2, 1.0); }'].join('\n'),
      fragmentShader: [
        'uniform float uAlpha, uDay; varying float vA;',
        'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d);',
        '  gl_FragColor = vec4(mix(vec3(0.85,0.92,1.0), vec3(1.0), uDay), a * 0.8 * vA * uAlpha); }'].join('\n'),
      transparent: true, depthWrite: false
    });
    var snow = new THREE.Points(sg, snowPMat);
    snow.frustumCulled = false;
    snow.renderOrder = 50;
    scene.add(snow);

    /* ---------- Bloom ---------- */
    var composer = null, bloom = null;
    if (THREE.EffectComposer && THREE.UnrealBloomPass) {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), 0.6, 0.45, 0.5);
      composer.addPass(bloom);
    }

    /* ---------- Caméra ---------- */
    var camAnim = null;
    function pose(v) {
      var H = state.H, W = state.W;
      var tgt = new THREE.Vector3(L.wx + 1.2, L.sill + H * 0.62, 0);
      var vf = THREE.MathUtils.degToRad(camera.fov / 2);
      var fitW = W + 24, fitH = L.FH * 0.9;
      var dist = Math.max((fitH / 2) / Math.tan(vf), (fitW / 2) / (Math.tan(vf) * camera.aspect)) * 1.04;
      tgt.y = Math.max(tgt.y, L.FH * 0.36);
      if (v === 'pieton') return { p: new THREE.Vector3(L.x0 - 1.5, 5.4, 9 + W * 0.25), t: new THREE.Vector3(L.wx + 1.5, L.sill + H * 0.5, -1) };
      if (v === 'interieur') return { p: new THREE.Vector3(L.wx + W * 0.45 + 1, 7.4, -12.5), t: new THREE.Vector3(L.wx - 1, L.sill + H * 0.45, 0) };
      return { p: new THREE.Vector3(tgt.x + dist * 0.28, tgt.y + dist * 0.1, dist * 0.95), t: tgt };
    }
    function goTo(v, instant) {
      var ps = pose(v);
      if (instant) { camera.position.copy(ps.p); controls.target.copy(ps.t); controls.update(); return; }
      camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: ps.p, t1: ps.t, k: 0, dur: v === 'intro' ? 2.4 : 1.3 };
    }

    /* ---------- Taille ---------- */
    function resize() {
      var r = stage.getBoundingClientRect();
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      if (composer) composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    /* ---------- Étiquettes projetées ---------- */
    var lblW = $('#lbl-w'), lblH = $('#lbl-h'), lblP = $('#lbl-p');
    var tmp = new THREE.Vector3();
    function place(el, x, y, z, rot) {
      tmp.set(x, y, z).project(camera);
      var vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      var r = canvas.getBoundingClientRect();
      var sx = (tmp.x * 0.5 + 0.5) * r.width, sy = (-tmp.y * 0.5 + 0.5) * r.height;
      el.style.transform = 'translate(' + sx + 'px,' + sy + 'px) translate(-50%,-50%)' + (rot ? ' rotate(-90deg)' : '');
      el.style.opacity = vis && state.view !== 'interieur' ? '1' : '0';
    }

    /* ---------- Interaction souris sur la vitrine LED ---------- */
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(-9, -9), hoverT = 0, uvT = new THREE.Vector2(0.5, 0.5);
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    });
    canvas.addEventListener('pointerleave', function () { ndc.set(-9, -9); });
    var downAt = 0;
    canvas.addEventListener('pointerdown', function () { downAt = performance.now(); });
    canvas.addEventListener('pointerup', function () {
      if (performance.now() - downAt > 250 || !glass || state.tech !== 'led') return;
      ray.setFromCamera(ndc, camera);
      var hit = ray.intersectObject(glass, false)[0];
      if (hit && hit.uv) GU.uClick.value.set(hit.uv.x, hit.uv.y, GU.uTime.value);
    });

    /* ---------- Boucle ---------- */
    var clock = new THREE.Clock(), time = 0, nightK = 1, snowK = 1, frostK = 0, lastC = 0, firstFrame = true;
    var expoDir = { S: [0.3, 1, 1], E: [1, 0.8, 0.6], O: [-1, 0.8, 0.6], N: [0.2, 1, -1] };

    function tick() {
      requestAnimationFrame(tick);
      if (document.hidden) { clock.getDelta(); return; }
      var dt = Math.min(clock.getDelta(), 0.05);
      time += dt;

      // transitions
      nightK += ((state.night ? 1 : 0) - nightK) * Math.min(1, dt * 2.5);
      snowK += ((state.snow ? 1 : 0) - snowK) * Math.min(1, dt * 3);
      var fT = state.frost && (state.tech === 'film' || state.film) ? 1 : 0;
      frostK += Math.sign(fT - frostK) * Math.min(dt / 1.1, Math.abs(fT - frostK));
      GU.uFrost.value = frostK;
      GU.uTime.value = time;

      skyMat.uniforms.uNight.value = nightK;
      skyMat.uniforms.uTime.value = time;
      scene.fog.color.copy(DAY_H).lerp(NIGHT_H, nightK);
      hemi.intensity = 0.95 + (0.26 - 0.95) * nightK;
      sun.intensity = 1.05 + (0.14 - 1.05) * nightK;
      sun.color.setRGB(1, 0.95 - 0.15 * nightK, 0.86 + 0.14 * nightK);
      var ed = expoDir[state.expo] || expoDir.S;
      sun.position.set(L.wx + ed[0] * 60, ed[1] * 70, ed[2] * 60);
      sun.target.position.set(L.wx, 0, 0);
      interiorLights.forEach(function (l) { l.intensity = 0.45 + 0.25 * nightK; });
      if (lampLight) lampLight.intensity = 0.75 * nightK;
      if (signLight) signLight.intensity = 0.4 * nightK;
      if (lamp) lamp.material.color.setRGB(0.35 + 0.65 * nightK, 0.33 + 0.55 * nightK, 0.3 + 0.36 * nightK);
      upperWins.forEach(function (u) { u.mat.emissiveIntensity = (u.lit ? 0.9 : 0.25) * nightK; });
      if (bloom) {
        bloom.strength = 0.2 + (0.62 - 0.2) * nightK;
        bloom.threshold = 0.85 + (0.5 - 0.85) * nightK;
      }

      // neige
      snowCover.visible = snowK > 0.05;
      snowCover.children.forEach(function (c) { c.scale.y = Math.max(0.001, snowK) * (c.userData.sy || (c.userData.sy = c.scale.y)); });
      snow.visible = snowK > 0.02;
      snowPMat.uniforms.uAlpha.value = snowK;
      snowPMat.uniforms.uTime.value = time;
      snowPMat.uniforms.uDay.value = 1 - nightK;
      var sb = 1 - 0.3 * nightK;
      walkMat.color.setRGB((0.43 + 0.42 * snowK) * sb, (0.44 + 0.44 * snowK) * sb, (0.46 + 0.47 * snowK) * sb);
      streetMat.color.setRGB(0.105 + 0.08 * snowK, 0.118 + 0.08 * snowK, 0.137 + 0.09 * snowK);
      if (toque) toque.visible = snowK > 0.5;

      // contenu des écrans (~30 i/s)
      if (time - lastC > 1 / 30) {
        lastC = time;
        activeContent.forEach(function (c) { c[0].update(time); c[1](); });
      }

      // survol de la grille LED
      if (glass && state.tech === 'led') {
        ray.setFromCamera(ndc, camera);
        var hit = ray.intersectObject(glass, false)[0];
        if (hit && hit.uv) { uvT.copy(hit.uv); hoverT = 1; } else hoverT = 0;
        GU.uMouse.value.lerp(uvT, 0.25);
        GU.uHover.value += (hoverT - GU.uHover.value) * 0.1;
      }

      // caméra
      if (camAnim) {
        camAnim.k = Math.min(1, camAnim.k + dt / camAnim.dur);
        var e = camAnim.k < 0.5 ? 4 * Math.pow(camAnim.k, 3) : 1 - Math.pow(-2 * camAnim.k + 2, 3) / 2;
        camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
        controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
        if (camAnim.k >= 1) camAnim = null;
      }
      controls.update();

      // étiquettes
      place(lblW, L.wx, L.sill + state.H + 0.4, 0.45);
      place(lblH, L.x0 - 0.7, L.sill + state.H / 2, 0.45, true);
      place(lblP, L.px, 6.5, L.pz);

      if (composer) composer.render(); else renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; $('#loading').classList.add('done'); }
    }

    function rebuildAll() {
      layout();
      buildFacade();
      buildProduct();
    }

    return {
      start: function () {
        rebuildAll();
        var ps = pose('rue');
        camera.position.set(ps.p.x + 30, ps.p.y + 26, ps.p.z + 60);
        controls.target.copy(ps.t);
        goTo('rue');
        tick();
      },
      rebuildAll: rebuildAll,
      rebuildProduct: buildProduct,
      goTo: goTo,
      setName: function () {
        [mainContent, screenContent, portraitContent].forEach(function (c) { c.set({ name: displayName() }); });
        if (signMat) {
          var old = signMat.map;
          var sign = facade.children.find(function (o) { return Array.isArray(o.material) && o.material[4] === signMat; });
          if (sign) { signMat.map = signTexture(sign.geometry.parameters.width, L.signH); signMat.needsUpdate = true; if (old) old.dispose(); }
        }
      },
      setProgram: function (p) { mainContent.set({ program: p }); screenContent.set({ program: p }); }
    };
  }

  /* ============================================================
     Interface
     ============================================================ */
  function pressed(group, v) {
    $$('button', group).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === String(v) ? 'true' : 'false'); });
  }
  function fillRange(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }

  var rebuildQueued = false;
  function queueRebuild(all) {
    if (!three) { updateFiche(); return; }
    if (rebuildQueued) return;
    rebuildQueued = true;
    requestAnimationFrame(function () {
      rebuildQueued = false;
      if (all) three.rebuildAll(); else three.rebuildProduct();
      updateFiche();
    });
  }

  function syncUI() {
    $$('#opt-tech .opt').forEach(function (o) { o.setAttribute('aria-checked', o.dataset.v === state.tech ? 'true' : 'false'); });
    $$('.opt-block').forEach(function (b) { b.hidden = b.dataset.for.split(' ').indexOf(state.tech) < 0; });
    var rw = $('#r-w'), rh = $('#r-h');
    rw.value = state.W; rh.value = state.H; fillRange(rw); fillRange(rh);
    $('#v-w').textContent = ftIn(state.W) + ' · ' + meters(state.W);
    $('#v-h').textContent = ftIn(state.H) + ' · ' + meters(state.H);
    $('#lbl-w').textContent = ftIn(state.W) + ' · ' + meters(state.W);
    $('#lbl-h').textContent = ftIn(state.H) + ' · ' + meters(state.H);
    pressed($('#seg-pitch'), state.pitch); $('#v-pitch').textContent = 'P' + dec(state.pitch);
    pressed($('#seg-size'), state.size); $('#v-size').textContent = state.size + ' po';
    pressed($('#seg-roll'), state.roll);
    pressed($('#seg-expo'), state.expo); $('#v-expo').textContent = EXPO[state.expo].l;
    pressed($('#seg-prog'), state.prog);
    pressed($('#seg-time'), state.night ? 'night' : 'day');
    pressed($('#seg-view'), state.view);
    $('#tg-snow').setAttribute('aria-pressed', state.snow ? 'true' : 'false');
    $('#c-film').checked = state.film;
    $('#c-monet').checked = state.monet;
    $('#monet').hidden = !state.monet;
    var fr = $('#tg-frost');
    fr.hidden = !(state.tech === 'film' || state.film);
    fr.classList.toggle('is-on', state.frost);
    fr.setAttribute('aria-checked', state.frost ? 'true' : 'false');
    fr.querySelector('.v').textContent = state.frost ? 'Film : intimité' : 'Film : transparent';
    $('#step-content').style.display = state.tech === 'film' ? 'none' : '';
    $('#hud-status').textContent = TECH[state.tech] + ' · ' + ftIn(state.W).replace(' 0″', '') + ' × ' + ftIn(state.H).replace(' 0″', '') +
      (state.tech === 'led' ? ' · P' + dec(state.pitch) : state.tech === 'suspendu' ? ' · ' + state.size + '″' : state.tech === 'rollup' ? ' · ' + ROLL[state.roll] : '');
    var ra = $('#r-ads'), rr = $('#r-rate');
    ra.value = state.ads; rr.value = state.rate; fillRange(ra); fillRange(rr);
    $('#v-ads').textContent = state.ads;
    $('#v-rate').textContent = nb(state.rate) + ' $';
    $('#v-month').textContent = nb(state.ads * state.rate) + ' $';
    $('#v-year').textContent = nb(state.ads * state.rate * 12) + ' $';
  }

  function ficheRows() {
    var W = state.W, H = state.H, area = W * H;
    var rows = [
      ['Technologie', TECH[state.tech]],
      ['Vitrine', ftIn(W) + ' × ' + ftIn(H)],
      ['Surface', nb(area) + ' pi² · ' + (area * FT * FT).toFixed(1).replace('.', ',') + ' m²']
    ];
    if (state.tech === 'led') {
      var wmm = W * 304.8, hmm = H * 304.8;
      rows.push(['Pas de pixel', 'P' + dec(state.pitch)]);
      rows.push(['Résolution', nb(Math.floor(wmm / state.pitch)) + ' × ' + nb(Math.floor(hmm / state.pitch)) + ' px']);
      rows.push(['Modules 1000 × 500', Math.ceil(wmm / 1000) + ' × ' + Math.ceil(hmm / 500) + ' = ' + (Math.ceil(wmm / 1000) * Math.ceil(hmm / 500))]);
      rows.push(['Lecture idéale', 'dès ≈ ' + Math.round(state.pitch) + ' m']);
    }
    if (state.tech === 'suspendu') {
      var d = state.size, sw = d * 16 / Math.sqrt(337), sh = d * 9 / Math.sqrt(337);
      rows.push(['Écran', d + '″ · ' + Math.round(sw) + ' × ' + Math.round(sh) + ' po']);
      rows.push(['Pose', state.sizeFits === false ? 'Trop grand — réduire' : 'Suspendu derrière la vitre']);
    }
    if (state.tech === 'rollup') {
      rows.push(['Version', ROLL[state.roll]]);
      rows.push(['Emplacement', state.roll === 'exterieur' ? 'Trottoir' : 'Derrière la vitre']);
    }
    if (state.tech !== 'film') {
      rows.push(['Luminosité conseillée', '≈ ' + nb(EXPO[state.expo].nits) + ' nits']);
      rows.push(['Contenu', PROG[state.prog]]);
    }
    if (state.tech === 'film' || state.film) {
      rows.push(['Film intelligent', nb(area) + ' pi² · ULc + CSA']);
      rows.push(['Mode clair', '92 % transparent']);
    }
    if (state.monet) rows.push(['Potentiel pub', nb(state.ads * state.rate) + ' $ / mois', true]);
    return rows;
  }

  function ref() {
    var s = JSON.stringify([state.tech, state.W, state.H, state.pitch, state.size, state.roll, state.film, state.expo]);
    var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'AMZ-' + String(h % 10000).padStart(4, '0');
  }

  function updateFiche() {
    var dl = $('#fiche-list');
    dl.innerHTML = '';
    ficheRows().slice(0, 8).forEach(function (r) {
      var d = document.createElement('div');
      d.innerHTML = '<dt></dt><dd></dd>';
      d.firstChild.textContent = r[0];
      d.lastChild.textContent = r[1];
      if (r[2]) d.lastChild.className = 'hl';
      dl.appendChild(d);
    });
    $('#fiche-ref').textContent = ref();
  }

  function summaryText() {
    var lines = ['Fiche projet ' + ref() + ' — Configurateur Amazonia', ''];
    ficheRows().forEach(function (r) { lines.push(r[0] + ' : ' + r[1]); });
    if (state.tech !== 'film') lines.push('Exposition : ' + EXPO[state.expo].l);
    if (state.name) lines.push('Commerce : ' + state.name);
    if (state.monet) lines.push('Réseau publicitaire : ' + state.ads + ' annonceurs × ' + state.rate + ' $/mois (simulation)');
    lines.push('', 'Valeurs indicatives, à valider par l’équipe Amazonia.');
    return lines.join('\n');
  }

  // ---- Liaisons ----
  $$('#opt-tech .opt').forEach(function (o) {
    o.addEventListener('click', function () {
      state.tech = o.dataset.v;
      if (state.tech !== 'film' && !state.film) state.frost = false;
      syncUI(); queueRebuild(false);
    });
  });
  $$('#presets .chip').forEach(function (c) {
    c.addEventListener('click', function () { state.W = +c.dataset.w; state.H = +c.dataset.h; syncUI(); queueRebuild(true); if (three) setTimeout(function () { three.goTo(state.view); }, 30); });
  });
  var reframeT = null;
  ['#r-w', '#r-h'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      state.W = +$('#r-w').value; state.H = +$('#r-h').value;
      syncUI(); queueRebuild(true);
      clearTimeout(reframeT);
      reframeT = setTimeout(function () { if (three) three.goTo(state.view); }, 450);
    });
  });
  function seg(id, key, cast, rebuild) {
    $$(id + ' button').forEach(function (b) {
      b.addEventListener('click', function () {
        state[key] = cast ? cast(b.dataset.v) : b.dataset.v;
        syncUI();
        if (rebuild) queueRebuild(false); else updateFiche();
      });
    });
  }
  seg('#seg-pitch', 'pitch', Number, true);
  seg('#seg-size', 'size', Number, true);
  seg('#seg-roll', 'roll', null, true);
  seg('#seg-expo', 'expo', null, false);
  $$('#seg-prog button').forEach(function (b) {
    b.addEventListener('click', function () { state.prog = b.dataset.v; if (three) three.setProgram(state.prog); syncUI(); updateFiche(); });
  });
  $$('#seg-time button').forEach(function (b) {
    b.addEventListener('click', function () { state.night = b.dataset.v === 'night'; syncUI(); });
  });
  $$('#seg-view button').forEach(function (b) {
    b.addEventListener('click', function () { state.view = b.dataset.v; syncUI(); if (three) three.goTo(state.view); });
  });
  $('#tg-snow').addEventListener('click', function () { state.snow = !state.snow; syncUI(); });
  $('#tg-frost').addEventListener('click', function () { state.frost = !state.frost; syncUI(); });
  $('#c-film').addEventListener('change', function (e) { state.film = e.target.checked; if (!state.film) state.frost = false; syncUI(); updateFiche(); });
  $('#c-monet').addEventListener('change', function (e) { state.monet = e.target.checked; syncUI(); updateFiche(); });
  ['#r-ads', '#r-rate'].forEach(function (id) {
    $(id).addEventListener('input', function () { state.ads = +$('#r-ads').value; state.rate = +$('#r-rate').value; syncUI(); updateFiche(); });
  });
  var nameT = null;
  $('#i-name').addEventListener('input', function (e) {
    state.name = e.target.value.trim();
    clearTimeout(nameT);
    nameT = setTimeout(function () { if (three) three.setName(); }, 160);
  });

  // ---- Modale soumission ----
  var modal = $('#modal'), lastFocus = null;
  function openModal() {
    lastFocus = document.activeElement;
    $('#q-summary').textContent = summaryText();
    modal.hidden = false;
    setTimeout(function () { $('#q-nom').focus(); }, 50);
  }
  function closeModal() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }
  $$('[data-open-quote]').forEach(function (b) { b.addEventListener('click', openModal); });
  $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  $('#quote-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var body = [
      'Nom : ' + $('#q-nom').value,
      'Courriel : ' + $('#q-mail').value,
      'Téléphone : ' + $('#q-tel').value,
      'Ville : ' + $('#q-ville').value,
      '',
      summaryText()
    ].join('\n');
    location.href = 'mailto:entrepriseamazonia@gmail.com?subject=' + encodeURIComponent('Soumission ' + ref() + ' — ' + TECH[state.tech]) + '&body=' + encodeURIComponent(body);
  });
  $('#copy-fiche').addEventListener('click', function (e) {
    var btn = e.currentTarget;
    (navigator.clipboard ? navigator.clipboard.writeText(summaryText()) : Promise.reject()).then(function () {
      btn.textContent = 'Fiche copiée ✓';
    }, function () { btn.textContent = 'Copie impossible'; });
    setTimeout(function () { btn.textContent = 'Copier la fiche'; }, 2200);
  });

  // ---- Démarrage ----
  syncUI();
  updateFiche();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    if (three) { three.setName(); three.setProgram(state.prog); three.start(); }
    updateFiche();
  });
})();
