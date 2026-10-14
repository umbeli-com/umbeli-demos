/* ============================================================
   AMAZONIA — Hero 3D
   Une vitrine LED transparente qui flotte dans la nuit boréale :
   on voit l'intérieur du commerce à travers la grille, l'écran
   réagit au curseur, un clic envoie une onde, le bouton « film »
   givre la vitre. Neige québécoise en avant-plan.
   ============================================================ */
(function () {
  'use strict';
  var canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE || !window.AmzLED) return;

  var gl;
  try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) { gl = null; }
  if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 860px)').matches;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));

  var scene = new THREE.Scene();
  var BG = 0x03050b;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 10, 26);

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.25, 9);

  // ---------- Contenu de l'écran ----------
  var content = AmzLED.createContent({ w: 640, h: 360, program: 'hero' });
  var tex = new THREE.CanvasTexture(content.canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  var W = 4.8, H = 2.7, FLOOR = -H / 2 - 0.55;
  var cols = small ? 84 : 128;
  var mat = AmzLED.createMaterial(THREE, { texture: tex, cols: cols, rows: Math.round(cols * H / W), aspect: W / H });
  var U = mat.uniforms;

  var rig = new THREE.Group();
  scene.add(rig);

  var pane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  pane.renderOrder = 10;
  rig.add(pane);

  // reflet du panneau sur le sol (miroir factice, fondu)
  var reflMat = AmzLED.createMaterial(THREE, { overrides: { uOpacity: 0.22, uFadeY: 1 } }, U);
  var refl = new THREE.Mesh(new THREE.PlaneGeometry(W, H), reflMat);
  refl.scale.y = -1;
  refl.position.y = 2 * FLOOR;
  refl.renderOrder = 9;
  rig.add(refl);

  // ---------- Cadre aluminium ----------
  var frameMat = new THREE.MeshStandardMaterial({ color: 0x141a28, metalness: 0.85, roughness: 0.32 });
  var t = 0.07, d = 0.16;
  [[W + t * 2, t, 0, H / 2 + t / 2], [W + t * 2, t, 0, -H / 2 - t / 2], [t, H, -W / 2 - t / 2, 0], [t, H, W / 2 + t / 2, 0]].forEach(function (b) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], d), frameMat);
    m.position.set(b[2], b[3], 0);
    rig.add(m);
  });
  // liseré lumineux sous la vitrine
  var strip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.92, 0.018, 0.02), new THREE.MeshBasicMaterial({ color: 0x33f0ff }));
  strip.position.set(0, -H / 2 - 0.16, 0.08);
  rig.add(strip);

  // ---------- Intérieur du commerce (vu à travers la grille) ----------
  var interior = new THREE.Group();
  interior.position.z = -1.6;
  rig.add(interior);

  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshStandardMaterial({ color: 0x0a0f1c, roughness: 0.9 }));
  backWall.position.set(0, 0.2, -1.9);
  interior.add(backWall);

  var pedMat = new THREE.MeshStandardMaterial({ color: 0x0e1424, roughness: 0.55, metalness: 0.3 });
  var glowG = new THREE.MeshBasicMaterial({ color: 0x3dffb4 });
  var glowV = new THREE.MeshBasicMaterial({ color: 0x8b6cff });
  var glowC = new THREE.MeshBasicMaterial({ color: 0x33f0ff });
  function pedestal(x, h, glow) {
    var p = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.9), pedMat);
    p.position.set(x, FLOOR + h / 2, 0);
    interior.add(p);
    var e = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.02, 0.92), glow);
    e.position.set(x, FLOOR + h + 0.01, 0);
    interior.add(e);
    return FLOOR + h;
  }
  var topC = pedestal(0, 0.9, glowG);
  var topL = pedestal(-1.7, 0.6, glowV);
  var topR = pedestal(1.7, 0.75, glowC);

  var ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: 0x3dffb4, wireframe: true }));
  ico.position.set(0, topC + 0.75, 0);
  interior.add(ico);
  var core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshStandardMaterial({ color: 0xd9b26b, metalness: 0.7, roughness: 0.25, emissive: 0x3a2a08 }));
  core.position.copy(ico.position);
  interior.add(core);

  var knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.26, 0.08, 120, 16), new THREE.MeshStandardMaterial({ color: 0x8b6cff, metalness: 0.4, roughness: 0.3, emissive: 0x24135e }));
  knot.position.set(-1.7, topL + 0.5, 0);
  interior.add(knot);

  var boxes = new THREE.Group();
  for (var i = 0; i < 3; i++) {
    var g = new THREE.BoxGeometry(0.42 - i * 0.08, 0.3, 0.42 - i * 0.08);
    var bx = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x33f0ff }));
    bx.position.y = i * 0.3;
    boxes.add(bx);
  }
  boxes.position.set(1.7, topR + 0.15, 0);
  interior.add(boxes);

  // colonnes lumineuses au fond
  for (i = -3; i <= 3; i++) {
    if (i === 0) continue;
    var col = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.6, 0.03), i % 2 ? glowV : glowC);
    col.position.set(i * 1.15, 0.2, -1.8);
    col.material = col.material.clone();
    col.material.transparent = true;
    col.material.opacity = 0.35;
    interior.add(col);
  }

  scene.add(new THREE.AmbientLight(0x2a3550, 0.9));
  var key = new THREE.PointLight(0x33f0ff, 2.2, 9);
  key.position.set(2, 2, 1);
  interior.add(key);
  var fill = new THREE.PointLight(0x8b6cff, 2, 9);
  fill.position.set(-2.5, 1, 0.5);
  interior.add(fill);
  var warm = new THREE.PointLight(0xffc77a, 1.4, 6);
  warm.position.set(0, 1.4, 1.2);
  interior.add(warm);

  // ---------- Sol : grille technique ----------
  var grid = new THREE.GridHelper(60, 120, 0x1b3358, 0x0c1a30);
  grid.position.y = FLOOR;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  // ---------- Neige ----------
  var N = small ? 450 : 900;
  var pos = new Float32Array(N * 3), seed = new Float32Array(N * 2);
  for (i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = Math.random() * 10 - 4;
    pos[i * 3 + 2] = (Math.random() - 0.3) * 12 - 2;
    seed[i * 2] = 0.25 + Math.random() * 0.6;
    seed[i * 2 + 1] = Math.random() * 6.28;
  }
  var sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  var snowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uAlpha: { value: 1 } },
    vertexShader: [
      'attribute vec2 aSeed; uniform float uTime, uPx; varying float vA;',
      'void main(){',
      '  vec3 p = position;',
      '  p.y = mod(p.y - uTime * aSeed.x * 0.6 + 4.0, 10.0) - 4.0;',
      '  p.x += sin(uTime * 0.5 + aSeed.y) * 0.35;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = (1.2 + aSeed.x * 2.2) * uPx * (9.0 / -mv.z);',
      '  vA = clamp(1.0 - (-mv.z - 4.0) / 18.0, 0.15, 1.0);',
      '}'].join('\n'),
    fragmentShader: [
      'uniform float uAlpha; varying float vA;',
      'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);',
      '  gl_FragColor = vec4(vec3(0.85, 0.93, 1.0), a * 0.75 * vA * uAlpha); }'].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  var snow = new THREE.Points(sg, snowMat);
  snow.renderOrder = 20;
  scene.add(snow);

  // ---------- Post-traitement : bloom ----------
  var composer = null, bloom = null;
  if (THREE.EffectComposer && THREE.UnrealBloomPass) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), small ? 0.75 : 0.95, 0.6, 0.18);
    composer.addPass(bloom);
  }

  // ---------- Mise en page responsive ----------
  var layout = { x: 0, y: 0 };
  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    var w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    var halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    var halfW = halfH * camera.aspect;
    if (camera.aspect > 1.15) {
      // desktop : la vitrine à droite, le texte à gauche
      var s = Math.min(1, (halfW * 0.92) / W);
      rig.scale.setScalar(s);
      layout.x = halfW * 0.5;
      layout.y = -0.1;
    } else {
      // mobile : vitrine en haut, texte dessous
      layout.x = 0;
      var s2 = Math.min(1, (halfW * 1.7) / W);
      rig.scale.setScalar(s2);
      layout.y = halfH * 0.46;
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Interaction ----------
  var mouse = new THREE.Vector2(0, 0), target = new THREE.Vector2(0, 0);
  var ndc = new THREE.Vector2(-9, -9);
  var ray = new THREE.Raycaster();
  var hoverTarget = 0, uvT = new THREE.Vector2(0.5, 0.5);
  var hero = canvas.closest('.hero') || canvas.parentElement;

  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    target.set(ndc.x, ndc.y);
  });
  hero.addEventListener('pointerleave', function () { target.set(0, 0); ndc.set(-9, -9); });

  function pick() {
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObject(pane, false)[0];
    return hit && hit.uv ? hit.uv : null;
  }

  canvas.addEventListener('click', function () {
    var uv = pick();
    if (uv) U.uClick.value.set(uv.x, uv.y, U.uTime.value);
  });

  // ---------- Film intelligent (bouton du hero) ----------
  var frost = 0, frostTarget = 0;
  var btn = document.getElementById('hero-film');
  if (btn) {
    btn.addEventListener('click', function () {
      frostTarget = frostTarget ? 0 : 1;
      btn.setAttribute('aria-checked', frostTarget ? 'true' : 'false');
      btn.classList.toggle('is-on', !!frostTarget);
      var lbl = btn.querySelector('[data-film-state]');
      if (lbl) lbl.textContent = frostTarget ? 'Intimité' : 'Transparent';
    });
  }

  // ---------- Boucle ----------
  var visible = true, clock = new THREE.Clock(), time = 0;
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) clock.getDelta(); });

  var lastContent = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.05);
    time += reduce ? dt * 0.35 : dt;

    // contenu de l'écran (~30 i/s suffit)
    if (time - lastContent > 1 / 30) {
      content.update(time);
      tex.needsUpdate = true;
      lastContent = time;
    }

    mouse.lerp(target, 0.06);
    var scrollK = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));

    camera.position.x = mouse.x * 0.55;
    camera.position.y = 0.25 + mouse.y * 0.3 + scrollK * 0.6;
    camera.position.z = 9 + scrollK * 2.2;
    camera.lookAt(0, layout.x ? layout.y * 0.5 : 0, 0);

    rig.position.x = layout.x;
    rig.position.y = layout.y;
    rig.rotation.y = -0.22 + mouse.x * 0.14;
    rig.rotation.x = -mouse.y * 0.05;

    var uv = pick();
    if (uv) { uvT.copy(uv); hoverTarget = 1; } else hoverTarget = 0;
    U.uMouse.value.lerp(uvT, 0.25);
    U.uHover.value += (hoverTarget - U.uHover.value) * 0.08;
    canvas.style.cursor = uv ? 'crosshair' : '';

    var step = dt / 1.2;
    frost += Math.sign(frostTarget - frost) * Math.min(step, Math.abs(frostTarget - frost));
    U.uFrost.value = frost;
    U.uTime.value = time;

    ico.rotation.y += dt * 0.35; ico.rotation.x += dt * 0.12;
    knot.rotation.y += dt * 0.6;
    boxes.rotation.y -= dt * 0.4;
    core.position.y = ico.position.y + Math.sin(time * 1.4) * 0.04;
    strip.material.color.setHSL(0.5 + Math.sin(time * 0.4) * 0.06, 1, 0.6);

    snowMat.uniforms.uTime.value = time;
    snowMat.uniforms.uAlpha.value = 1 - scrollK * 0.6;

    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  // Les polices doivent être prêtes avant de dessiner le texte de l'écran
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
    document.documentElement.classList.add('hero-ready');
    tick();
  });
})();
