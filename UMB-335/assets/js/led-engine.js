/* ============================================================
   AMAZONIA — Moteur LED partagé
   - Programmes de contenu (canvas 2D) : ce que « diffuse » l'écran
   - Matériau Three.js « LED grille transparente » (dot-matrix + film)
   Utilisé par le hero 3D, les cartes technologies et le configurateur.
   ============================================================ */
(function () {
  'use strict';

  var AURORA = ['#3DFFB4', '#33F0FF', '#8B6CFF'];
  var FONT = 'Archivo, "Helvetica Neue", Arial, sans-serif';

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function setFont(ctx, weight, size, stretch) {
    ctx.font = weight + ' ' + Math.round(size) + 'px ' + FONT;
    if ('fontStretch' in ctx) ctx.fontStretch = stretch || 'expanded';
  }

  // Taille de police qui fait tenir `text` dans `maxW`
  function fitText(ctx, text, weight, size, maxW, stretch) {
    setFont(ctx, weight, size, stretch);
    var w = ctx.measureText(text).width;
    if (w > maxW) { size = size * maxW / w; setFont(ctx, weight, size, stretch); }
    return size;
  }

  // ---------- Fonds ----------
  function aurora(ctx, w, h, t, k) {
    k = k == null ? 1 : k;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 3; i++) {
      var base = h * (0.25 + 0.22 * i) + Math.sin(t * 0.5 + i * 2.1) * h * 0.12;
      var thick = h * (0.32 + 0.08 * Math.sin(t * 0.7 + i));
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, hexA(AURORA[i], 0.0));
      g.addColorStop(0.3, hexA(AURORA[i], 0.55 * k));
      g.addColorStop(0.7, hexA(AURORA[(i + 1) % 3], 0.45 * k));
      g.addColorStop(1, hexA(AURORA[(i + 1) % 3], 0.0));
      ctx.fillStyle = g;
      ctx.beginPath();
      var steps = 28, x, y;
      ctx.moveTo(0, base);
      for (var s = 0; s <= steps; s++) {
        x = s / steps * w;
        y = base + Math.sin(s / steps * 5.5 + t * (0.6 + i * 0.25) + i) * h * 0.1;
        ctx.lineTo(x, y);
      }
      for (s = steps; s >= 0; s--) {
        x = s / steps * w;
        y = base + thick + Math.sin(s / steps * 4.2 - t * (0.5 + i * 0.2) + i * 3) * h * 0.08;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function vignette(ctx, w, h, a) {
    var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (a || 0.6) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function snowflakes(ctx, w, h, t, n) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < n; i++) {
      var sx = (i * 97.13 % 1) * w, sp = 0.3 + (i * 13.7 % 1) * 0.7;
      var x = (sx + Math.sin(t + i) * 8) % w;
      var y = ((i * 53.9 % 1) * h + t * 30 * sp) % h;
      ctx.fillRect(x, y, 2 + sp * 2, 2 + sp * 2);
    }
  }

  // ---------- Diapositives (texte + sous-texte) ----------
  function slide(ctx, w, h, title, sub, colorA, colorB, p) {
    // p : progression 0..1 de la diapo (entrée / sortie)
    var enter = Math.min(1, p / 0.12), exit = Math.max(0, (p - 0.88) / 0.12);
    var ease = function (x) { return 1 - Math.pow(1 - x, 3); };
    var dy = (1 - ease(enter)) * h * 0.5 - ease(exit) * h * 0.5;
    var alpha = Math.min(ease(enter), 1 - exit);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var size = fitText(ctx, title, 900, h * 0.42, w * 0.9);
    var g = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    ctx.fillStyle = g;
    ctx.fillText(title, w / 2, h * 0.44 + dy);
    if (sub) {
      fitText(ctx, sub, 600, h * 0.1, w * 0.86);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(sub, w / 2, h * 0.44 + size * 0.62 + h * 0.06 + dy);
    }
    ctx.restore();
  }

  function cycle(ctx, w, h, t, slides, dur) {
    var i = Math.floor(t / dur) % slides.length;
    var p = (t % dur) / dur;
    var s = slides[i];
    if (s.bg) s.bg(ctx, w, h, t); else aurora(ctx, w, h, t, 0.75);
    slide(ctx, w, h, s.t, s.s, s.a || '#FFFFFF', s.b || '#BFFBFF', p);
  }

  function warmBg(ctx, w, h, t) {
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#2a0600');
    g.addColorStop(0.5, '#ff4d1a');
    g.addColorStop(1, '#ffb800');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // bandes diagonales animées
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    var step = w / 8, off = (t * 40) % step;
    for (var x = -h - step; x < w + h; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + off, 0); ctx.lineTo(x + off + step / 2, 0);
      ctx.lineTo(x + off + step / 2 - h, h); ctx.lineTo(x + off - h, h);
      ctx.closePath(); ctx.fill();
    }
  }

  function iceBg(ctx, w, h, t) {
    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#02101f');
    g.addColorStop(1, '#0a3a5c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    snowflakes(ctx, w, h, t, 70);
  }

  function greenBg(ctx, w, h, t) {
    ctx.fillStyle = '#001a10';
    ctx.fillRect(0, 0, w, h);
    var r = (Math.sin(t * 2) * 0.5 + 0.5) * 0.4 + 0.3;
    var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    g.addColorStop(0, 'rgba(61,255,180,' + r + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function ticker(ctx, w, h, t, text, y, size, color) {
    setFont(ctx, 700, size);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    var tw = ctx.measureText(text).width + size * 2;
    var off = -(t * size * 2.2) % tw;
    ctx.fillStyle = color;
    for (var x = off; x < w; x += tw) ctx.fillText(text, x, y);
  }

  // ---------- Programmes ----------
  var programs = {
    hero: function (ctx, w, h, t) {
      cycle(ctx, w, h, t, [
        { t: 'AMAZONIA', s: 'OSEZ RÊVER GRAND', a: '#3DFFB4', b: '#8B6CFF' },
        { t: 'OUVERT', s: 'OPEN · 7 JOURS SUR 7', bg: greenBg, a: '#FFFFFF', b: '#3DFFB4' },
        { t: '−30 %', s: 'SOLDES D’HIVER · EN MAGASIN', bg: warmBg, a: '#FFFFFF', b: '#FFF2C2' },
        { t: '−12 °C', s: 'SHAWINIGAN · BONNE JOURNÉE', bg: iceBg, a: '#FFFFFF', b: '#9FE9FF' },
        { t: 'VOTRE PUB ICI', s: 'RÉSEAU VITRINES AMAZONIA', a: '#33F0FF', b: '#FFFFFF' }
      ], 3.4);
      vignette(ctx, w, h, 0.35);
    },
    brand: function (ctx, w, h, t, o) {
      aurora(ctx, w, h, t, 0.9);
      slide(ctx, w, h, (o && o.name) || 'AMAZONIA', 'OSEZ RÊVER GRAND', '#FFFFFF', '#BFFBFF', 0.5);
      vignette(ctx, w, h, 0.3);
    },
    promo: function (ctx, w, h, t, o) {
      warmBg(ctx, w, h, t);
      var pulse = 1 + Math.sin(t * 6) * 0.03;
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.scale(pulse, pulse); ctx.translate(-w / 2, -h / 2);
      slide(ctx, w, h, '−30 %', ((o && o.name) || 'VOTRE COMMERCE') + ' · SOLDES', '#FFFFFF', '#FFF2C2', 0.5);
      ctx.restore();
    },
    menu: function (ctx, w, h, t, o) {
      ctx.fillStyle = '#120a02';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffb547';
      ctx.fillRect(0, 0, w, h * 0.24);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitText(ctx, (o && o.name) || 'VOTRE COMMERCE', 900, h * 0.15, w * 0.9);
      ctx.fillStyle = '#120a02';
      ctx.fillText((o && o.name) || 'VOTRE COMMERCE', w / 2, h * 0.12);
      var items = [['POUTINE CLASSIQUE', '14,95 $'], ['SOUPE AUX POIS', '8,50 $'], ['TOURTIÈRE MAISON', '17,25 $']];
      var hi = Math.floor(t / 1.6) % items.length;
      for (var i = 0; i < items.length; i++) {
        var y = h * (0.38 + i * 0.17);
        ctx.fillStyle = i === hi ? '#ffffff' : 'rgba(255,214,150,0.75)';
        setFont(ctx, 800, h * 0.09);
        ctx.textAlign = 'left'; ctx.fillText(items[i][0], w * 0.07, y);
        ctx.textAlign = 'right'; ctx.fillText(items[i][1], w * 0.93, y);
      }
      ticker(ctx, w, h, t, 'TABLE D’HÔTE DU MIDI  ✦  APPORTEZ VOTRE VIN  ✦  ', h * 0.92, h * 0.075, '#3DFFB4');
    },
    event: function (ctx, w, h, t, o) {
      aurora(ctx, w, h, t * 1.6, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitText(ctx, 'SAM. 19 H', 900, h * 0.2, w * 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SAM. 19 H', w / 2, h * 0.36);
      fitText(ctx, 'SPECTACLE EN PLEIN AIR', 800, h * 0.1, w * 0.85);
      ctx.fillStyle = '#3DFFB4';
      ctx.fillText('SPECTACLE EN PLEIN AIR', w / 2, h * 0.58);
      ticker(ctx, w, h, t, ((o && o.name) || 'VOTRE COMMERCE') + '  ✦  BILLETS EN VENTE  ✦  ', h * 0.84, h * 0.08, '#ffffff');
    },
    rollup: function (ctx, w, h, t, o) { // portrait
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#05121f'); g.addColorStop(1, '#000');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h * 0.36);
      for (var i = 0; i < 3; i++) {
        ctx.rotate(t * 0.4 + i * 2.09);
        var rg = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
        rg.addColorStop(0, hexA(AURORA[i], 0)); rg.addColorStop(0.5, hexA(AURORA[i], 0.9)); rg.addColorStop(1, hexA(AURORA[i], 0));
        ctx.fillStyle = rg;
        ctx.fillRect(-w * 0.45, -w * 0.05, w * 0.9, w * 0.1);
      }
      ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, 'NOUVEAU', 900, w * 0.2, w * 0.86);
      ctx.fillStyle = '#fff'; ctx.fillText('NOUVEAU', w / 2, h * 0.66);
      fitText(ctx, (o && o.name) || 'SALON 2026', 700, w * 0.1, w * 0.86);
      ctx.fillStyle = '#33F0FF'; ctx.fillText((o && o.name) || 'SALON 2026', w / 2, h * 0.75);
      ticker(ctx, w, h, t, 'KIOSQUE 42  ✦  ', h * 0.9, w * 0.09, '#3DFFB4');
    },
    arena: function (ctx, w, h, t) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      setFont(ctx, 900, h * 0.42, 'normal');
      ctx.fillStyle = '#ff3b3b'; ctx.fillText('4', w * 0.22, h * 0.48);
      ctx.fillStyle = '#33F0FF'; ctx.fillText('2', w * 0.78, h * 0.48);
      setFont(ctx, 800, h * 0.11);
      ctx.fillStyle = '#ffffff'; ctx.fillText('3e PÉRIODE', w / 2, h * 0.3);
      var s = Math.max(0, 1200 - Math.floor(t * 10) % 1200);
      var mm = Math.floor(s / 60), ss = s % 60;
      setFont(ctx, 800, h * 0.18, 'normal');
      ctx.fillStyle = '#ffd34d'; ctx.fillText(mm + ':' + (ss < 10 ? '0' : '') + ss, w / 2, h * 0.58);
      ticker(ctx, w, h, t, 'ARÉNA MUNICIPAL  ✦  MERCI À NOS PARTENAIRES  ✦  ', h * 0.88, h * 0.08, '#3DFFB4');
    },
    grille: function (ctx, w, h, t) {
      aurora(ctx, w, h, t, 1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, 'VISIBLE', 900, h * 0.34, w * 0.86);
      ctx.fillStyle = '#ffffff';
      var x = w / 2 + Math.sin(t) * w * 0.04;
      ctx.fillText('VISIBLE', x, h * 0.5);
    }
  };

  // ---------- Contenu animé (canvas) ----------
  function createContent(opts) {
    var c = document.createElement('canvas');
    c.width = opts.w || 640;
    c.height = opts.h || 360;
    var ctx = c.getContext('2d');
    var state = { program: opts.program || 'hero', name: opts.name || '' };
    return {
      canvas: c,
      set: function (o) { for (var k in o) state[k] = o[k]; },
      get: function () { return state; },
      update: function (t) {
        var p = programs[state.program] || programs.hero;
        ctx.save();
        p(ctx, c.width, c.height, t, state);
        ctx.restore();
      }
    };
  }

  // ---------- Matériau LED grille transparente ----------
  var vert = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
  ].join('\n');

  var frag = [
    'precision highp float;',
    'uniform sampler2D uTex;',
    'uniform vec2 uGrid;',
    'uniform float uTime, uHover, uFrost, uLed, uOpacity, uFadeY, uBright, uAspect, uBars;',
    'uniform vec2 uMouse;',
    'uniform vec3 uClick;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }',
    'void main(){',
    '  vec2 cell = vUv * uGrid;',
    '  vec2 id = floor(cell);',
    '  vec2 f = fract(cell) - 0.5;',
    '  vec2 suv = (id + 0.5) / uGrid;',
    '  vec3 c = texture2D(uTex, suv).rgb * uBright;',
    // interaction curseur
    '  vec2 dm = (suv - uMouse) * vec2(uAspect, 1.0);',
    '  float hover = uHover * exp(-dot(dm,dm) * 30.0);',
    '  float rt = uTime - uClick.z;',
    '  vec2 dc = (suv - uClick.xy) * vec2(uAspect, 1.0);',
    '  float ring = step(0.0, rt) * exp(-pow((length(dc) - rt * 0.85) * 12.0, 2.0)) * exp(-rt * 1.4);',
    '  c += vec3(0.24, 0.94, 1.0) * (hover * 0.6 + ring * 1.1);',
    '  float lum = max(max(c.r, c.g), c.b);',
    // diodes + barres de la grille
    '  float d = length(f);',
    '  float r = 0.29 + 0.07 * hover + 0.08 * ring;',
    '  float dotM = smoothstep(r, r - 0.13, d) * uLed;',
    '  float bar = smoothstep(0.23, 0.17, abs(f.y)) * uLed * uBars;',
    '  vec3 offC = vec3(0.03, 0.04, 0.055);',
    '  vec3 led = offC + c;',
    '  vec3 col = mix(vec3(0.045, 0.05, 0.065), led, dotM);',
    '  float a = max(bar * 0.72, dotM * (0.55 + 0.45 * clamp(lum, 0.0, 1.0)));',
    '  float halo = exp(-d * d * 9.0) * clamp(lum, 0.0, 1.5) * uLed;',
    '  col += c * halo * 0.35;',
    '  a = max(a, halo * 0.35);',
    // reflet du verre
    '  float sheen = smoothstep(0.06, 0.0, abs(fract(vUv.x * 0.7 + vUv.y * 0.45 - uTime * 0.03) - 0.5) - 0.38);',
    '  col += vec3(0.6, 0.8, 1.0) * sheen * 0.05;',
    '  a = max(a, 0.05 + sheen * 0.04);',
    // film intelligent : volet de givrage gauche -> droite
    '  float front = uFrost * 1.3 - 0.15;',
    '  float n = noise(vUv * vec2(6.0, 18.0)) * 0.08;',
    '  float fm = 1.0 - smoothstep(front - 0.15, front, vUv.x + n);',
    '  fm *= step(0.001, uFrost);',
    '  float nn = noise(vUv * 340.0) * 0.06 + noise(vUv * 9.0 + uTime * 0.05) * 0.08;',
    '  vec3 frostC = vec3(0.78, 0.85, 0.95) * (0.5 + nn) + c * 0.18 * uLed;',
    '  col = mix(col, frostC, fm * 0.94);',
    '  a = mix(a, 0.94, fm);',
    '  float edge = exp(-pow((vUv.x + n - front + 0.075) * 30.0, 2.0)) * step(0.02, uFrost) * step(uFrost, 0.98);',
    '  col += vec3(0.24, 0.94, 1.0) * edge * 1.6;',
    '  a = max(a, edge);',
    // reflet au sol
    '  a *= uOpacity * mix(1.0, pow(1.0 - vUv.y, 3.0), uFadeY);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  function createMaterial(THREE, o, shared) {
    var uniforms = shared ? Object.assign({}, shared) : {
      uTex: { value: o.texture },
      uGrid: { value: new THREE.Vector2(o.cols || 96, o.rows || 54) },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uClick: { value: new THREE.Vector3(0.5, 0.5, -10) },
      uFrost: { value: 0 },
      uLed: { value: o.led == null ? 1 : o.led },
      uBars: { value: o.bars == null ? 1 : o.bars },
      uBright: { value: o.bright || 1.0 },
      uAspect: { value: o.aspect || 16 / 9 },
      uOpacity: { value: 1 },
      uFadeY: { value: 0 }
    };
    if (o && o.overrides) for (var k in o.overrides) uniforms[k] = { value: o.overrides[k] };
    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  // ---------- Rendu 2D dot-matrix (cartes, aperçus) ----------
  function createMini(canvas, program, opts) {
    opts = opts || {};
    var cols = opts.cols || 48;
    var src = createContent({ w: opts.srcW || 320, h: opts.srcH || 180, program: program, name: opts.name });
    var small = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var sctx = small.getContext('2d', { willReadFrequently: true });
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
    }
    resize();
    return {
      resize: resize,
      draw: function (t) {
        var W = canvas.width, H = canvas.height;
        var rows = Math.max(1, Math.round(cols * H / W));
        small.width = cols; small.height = rows;
        src.update(t);
        sctx.drawImage(src.canvas, 0, 0, cols, rows);
        var px = sctx.getImageData(0, 0, cols, rows).data;
        ctx.clearRect(0, 0, W, H);
        var cw = W / cols, ch = H / rows, rad = Math.min(cw, ch) * 0.34;
        if (opts.bars) {
          ctx.fillStyle = 'rgba(30,38,56,0.55)';
          for (var y0 = 0; y0 < rows; y0++) ctx.fillRect(0, y0 * ch + ch * 0.3, W, ch * 0.4);
        }
        for (var y = 0; y < rows; y++) {
          for (var x = 0; x < cols; x++) {
            var i = (y * cols + x) * 4;
            var r = px[i], g = px[i + 1], b = px[i + 2];
            var m = Math.max(r, g, b);
            if (m < 18) { ctx.fillStyle = 'rgba(40,52,74,0.35)'; }
            else ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.beginPath();
            ctx.arc(x * cw + cw / 2, y * ch + ch / 2, rad, 0, 6.2832);
            ctx.fill();
          }
        }
      }
    };
  }

  window.AmzLED = {
    programs: programs,
    createContent: createContent,
    createMaterial: createMaterial,
    createMini: createMini,
    AURORA: AURORA
  };
})();
