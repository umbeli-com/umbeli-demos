/* ============================================================
   AMAZONIA — Interactions de la page d'accueil
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;

  /* ---------- Navigation ---------- */
  var nav = $('#nav'), burger = $('#burger');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- Apparition au défilement ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---------- Compteurs ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, t0 = performance.now();
      if (reduce) { el.textContent = to; return; }
      (function step(now) {
        var p = Math.min(1, (now - t0) / 1400), k = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * k);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- Halo du curseur ---------- */
  var glow = $('.cursor-glow');
  if (glow && fine) {
    var gx = 0, gy = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', function (e) { gx = e.clientX; gy = e.clientY; }, { passive: true });
    (function loop() {
      cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
      glow.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Cartes : inclinaison 3D + projecteur ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.style.transform = 'perspective(1000px) rotateX(' + ((0.5 - y) * 6) + 'deg) rotateY(' + ((x - 0.5) * 8) + 'deg) translateZ(0)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Mini-écrans LED (cartes + vitrines du réseau) ---------- */
  var minis = [];
  if (window.AmzLED) {
    $$('canvas[data-led]').forEach(function (c) {
      var portrait = c.dataset.src === 'portrait';
      var m = AmzLED.createMini(c, c.dataset.led, {
        cols: +c.dataset.cols || 48,
        bars: c.dataset.bars === '1',
        srcW: portrait ? 180 : 320,
        srcH: portrait ? 440 : (c.dataset.led === 'brand' ? 320 : 180)
      });
      var item = { el: c, mini: m, visible: false, offset: Math.random() * 10 };
      minis.push(item);
      new IntersectionObserver(function (en) { item.visible = en[0].isIntersecting; }, { rootMargin: '100px' }).observe(c);
    });
    window.addEventListener('resize', function () { minis.forEach(function (i) { i.mini.resize(); }); });
    var lastMini = 0;
    var startMinis = function () {
      (function loop(now) {
        requestAnimationFrame(loop);
        if (now - lastMini < 1000 / 30) return;
        lastMini = now;
        var t = now / 1000;
        minis.forEach(function (i) { if (i.visible) i.mini.draw((reduce ? t * 0.3 : t) + i.offset); });
      })(0);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(startMinis);
  }

  /* ---------- Film intelligent (démo) ---------- */
  var stage = $('#film-stage'), fsw = $('#film-switch');
  if (stage && fsw) {
    var busy = null;
    fsw.addEventListener('click', function () {
      var on = !stage.classList.contains('is-opaque');
      stage.classList.toggle('is-opaque', on);
      stage.classList.toggle('to-clear', !on);
      stage.classList.remove('animating'); void stage.offsetWidth; stage.classList.add('animating');
      clearTimeout(busy);
      busy = setTimeout(function () { stage.classList.remove('animating'); }, 1200);
      fsw.classList.toggle('is-on', on);
      fsw.setAttribute('aria-checked', on ? 'true' : 'false');
      $('#film-switch-txt').textContent = on ? 'Revenir en mode clair' : 'Basculer en mode intimité';
      $('#film-readout-txt').textContent = on ? 'Mode intimité · lumière préservée' : 'Mode clair · 92 % transparent';
    });
  }

  /* ---------- Plan animé (teaser configurateur) ---------- */
  var bp = $('#blueprint');
  if (bp) {
    var bc = bp.querySelector('canvas'), bx = bc.getContext('2d');
    var labels = { w: bp.querySelector('[data-bp="w"]'), h: bp.querySelector('[data-bp="h"]'), spec: bp.querySelector('[data-bp="spec"]') };
    var presets = [{ w: 12, h: 8, p: 7.8 }, { w: 16, h: 9, p: 3.9 }, { w: 8, h: 6, p: 10.4 }];
    var bpVisible = false, CYCLE = 9;
    new IntersectionObserver(function (en) { bpVisible = en[0].isIntersecting; }).observe(bp);
    var ftIn = function (f) { var ft = Math.floor(f), inch = Math.round((f - ft) * 12); return ft + '′ ' + inch + '″'; };
    var meters = function (f) { return (f * 0.3048).toFixed(2).replace('.', ',') + ' m'; };
    var bpSize = function () { var r = bp.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); bc.width = r.width * d; bc.height = r.height * d; bx.setTransform(d, 0, 0, d, 0, 0); };
    bpSize();
    window.addEventListener('resize', bpSize);
    var aur = function (x, t) {
      var k = (Math.sin(x * 4 + t) + 1) / 2;
      var a = [61, 255, 180], b = [51, 240, 255], c = [139, 108, 255];
      var m = k < 0.5 ? [a, b, k * 2] : [b, c, (k - 0.5) * 2];
      return 'rgb(' + m[0].map(function (v, i) { return Math.round(v + (m[1][i] - v) * m[2]); }).join(',') + ')';
    };
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!bpVisible) return;
      var t = now / 1000, W = bp.clientWidth, H = bp.clientHeight;
      var cyc = Math.floor(t / CYCLE) % presets.length, p = (t % CYCLE) / CYCLE;
      var pr = presets[cyc];
      bx.clearRect(0, 0, W, H);
      // grille de plan
      bx.strokeStyle = 'rgba(51,240,255,0.06)'; bx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 24) { bx.beginPath(); bx.moveTo(gx + 0.5, 0); bx.lineTo(gx + 0.5, H); bx.stroke(); }
      for (var gy = 0; gy < H; gy += 24) { bx.beginPath(); bx.moveTo(0, gy + 0.5); bx.lineTo(W, gy + 0.5); bx.stroke(); }
      // gabarit
      var maxW = W * 0.62, maxH = H * 0.46;
      var sc = Math.min(maxW / pr.w, maxH / pr.h);
      var ww = pr.w * sc, wh = pr.h * sc;
      var ground = H * 0.84;
      var wx = W * 0.44 - ww / 2, wy = ground - wh - H * 0.06;
      var fx = wx - W * 0.06, fw = ww + W * 0.24, fy = wy - H * 0.16;
      var draw = Math.min(1, p / 0.2);
      var fade = p > 0.9 ? 1 - (p - 0.9) / 0.1 : 1;
      bx.globalAlpha = fade;
      bx.strokeStyle = 'rgba(160,200,255,0.55)'; bx.lineWidth = 1.2;
      var path = function (pts) {
        var L = 0, i; for (i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        bx.setLineDash([L * draw, L]); bx.beginPath(); bx.moveTo(pts[0][0], pts[0][1]);
        for (i = 1; i < pts.length; i++) bx.lineTo(pts[i][0], pts[i][1]);
        bx.stroke(); bx.setLineDash([]);
      };
      path([[0, ground], [W, ground]]);
      path([[fx, ground], [fx, fy], [fx + fw, fy], [fx + fw, ground]]);
      path([[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh], [wx, wy]]);
      var dx = wx + ww + W * 0.04;
      path([[dx, ground], [dx, ground - wh * 0.95 - H * 0.06], [dx + W * 0.11, ground - wh * 0.95 - H * 0.06], [dx + W * 0.11, ground]]);
      path([[fx + 10, fy + 12], [fx + fw - 10, fy + 12], [fx + fw - 10, wy - 14], [fx + 10, wy - 14], [fx + 10, fy + 12]]);
      // diodes
      var fill = Math.max(0, Math.min(1, (p - 0.2) / 0.25));
      var cols = 34, rows = Math.max(6, Math.round(cols * pr.h / pr.w));
      var cw = ww / cols, ch = wh / rows, rr = Math.min(cw, ch) * 0.3;
      for (var y = 0; y < rows; y++) {
        if (y / rows > fill) break;
        bx.fillStyle = 'rgba(30,40,60,0.6)';
        bx.fillRect(wx, wy + y * ch + ch * 0.32, ww, ch * 0.36);
        for (var x = 0; x < cols; x++) {
          var u = x / cols, v = y / rows;
          var band = Math.sin(u * 5 + t * 1.2 + Math.sin(v * 3 + t) * 1.2) * 0.5 + 0.5;
          var on = band > 0.35 + v * 0.3;
          bx.fillStyle = on ? aur(u + v * 0.5, t) : 'rgba(60,80,110,0.35)';
          bx.beginPath(); bx.arc(wx + x * cw + cw / 2, wy + y * ch + ch / 2, rr, 0, 6.283); bx.fill();
        }
      }
      // cotes
      var dimA = Math.max(0, Math.min(1, (p - 0.15) / 0.15));
      bx.globalAlpha = fade * dimA;
      bx.strokeStyle = '#33F0FF'; bx.lineWidth = 1;
      bx.beginPath(); bx.moveTo(wx, wy - 28); bx.lineTo(wx + ww, wy - 28);
      bx.moveTo(wx, wy - 34); bx.lineTo(wx, wy - 22); bx.moveTo(wx + ww, wy - 34); bx.lineTo(wx + ww, wy - 22);
      bx.moveTo(wx - 22, wy); bx.lineTo(wx - 22, wy + wh);
      bx.moveTo(wx - 28, wy); bx.lineTo(wx - 16, wy); bx.moveTo(wx - 28, wy + wh); bx.lineTo(wx - 16, wy + wh);
      bx.stroke();
      // silhouette à l'échelle (5′9″)
      var ph = 5.75 * sc, px = wx - W * 0.035 - ph * 0.12;
      bx.globalAlpha = fade * 0.5;
      bx.fillStyle = '#A8B4CE';
      bx.beginPath(); bx.arc(px, ground - ph + ph * 0.07, ph * 0.065, 0, 6.283); bx.fill();
      bx.fillRect(px - ph * 0.09, ground - ph + ph * 0.15, ph * 0.18, ph * 0.45);
      bx.fillRect(px - ph * 0.07, ground - ph * 0.42, ph * 0.06, ph * 0.42);
      bx.fillRect(px + ph * 0.01, ground - ph * 0.42, ph * 0.06, ph * 0.42);
      bx.globalAlpha = 1;
      // étiquettes DOM
      var lblA = (fade * dimA).toFixed(2);
      labels.w.textContent = ftIn(pr.w) + ' · ' + meters(pr.w);
      labels.w.style.cssText = 'left:' + (wx + ww / 2) + 'px;top:' + (wy - 28) + 'px;transform:translate(-50%,-50%);opacity:' + lblA;
      labels.h.textContent = ftIn(pr.h) + ' · ' + meters(pr.h);
      labels.h.style.cssText = 'left:' + (wx - 22) + 'px;top:' + (wy + wh / 2) + 'px;transform:translate(-50%,-50%) rotate(-90deg);opacity:' + lblA;
      var px1 = Math.floor(pr.w * 304.8 / pr.p), py1 = Math.floor(pr.h * 304.8 / pr.p);
      labels.spec.textContent = 'P' + String(pr.p).replace('.', ',') + ' · ' + px1 + ' × ' + py1 + ' px';
      labels.spec.style.cssText = 'left:' + (wx + ww) + 'px;top:' + (wy + wh + 18) + 'px;transform:translate(-100%,0);opacity:' + (fade * fill).toFixed(2);
    })(0);
  }

  /* ---------- Réseau : onglets + carte ---------- */
  var tabs = $$('.tabs [role="tab"]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var sel = t === tab;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
      });
    });
  });
  function highlight(city) {
    $$('.map-pt').forEach(function (p) { p.classList.toggle('active', p.dataset.city === city); });
    $$('.vcard').forEach(function (v) { v.classList.toggle('active', v.dataset.city === city); });
  }
  $$('.vcard').forEach(function (v) {
    v.addEventListener('mouseenter', function () { highlight(v.dataset.city); });
    v.addEventListener('focus', function () { highlight(v.dataset.city); });
    v.addEventListener('click', function () {
      highlight(v.dataset.city);
      var sel = $('#f-projet'); if (sel) sel.value = 'Annoncer sur le réseau de vitrines';
      var msg = $('#f-msg'); if (msg && !msg.value) msg.value = 'Je souhaite annoncer sur : ' + v.querySelector('h4').textContent + '.';
      document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  $$('.map-pt').forEach(function (p) {
    p.addEventListener('mouseenter', function () { highlight(p.dataset.city); });
  });

  /* ---------- James ---------- */
  var JAMES = {
    ville: [
      { q: 'Quelle journée passe le recyclage dans ma rue?', l: 'FR', a: 'Dans votre secteur, la collecte du recyclage a lieu le mercredi matin. Je vous envoie le calendrier complet?', qr: 'Calendrier des collectes' },
      { q: 'À quelle heure ferme l’hôtel de ville?', l: 'FR', a: 'L’hôtel de ville ferme à 16 h 30 aujourd’hui. L’entrée principale est à deux minutes à pied, sur votre droite.', qr: 'Itinéraire vers l’hôtel de ville' },
      { q: 'Where can I park downtown?', l: 'EN', a: 'The closest public parking is two blocks north, on your left. Scan this QR code to get the route on your phone.', qr: 'Route to parking' }
    ],
    tourisme: [
      { q: 'Que faire avec des enfants s’il pleut cet après-midi?', l: 'FR', a: 'Trois idées à moins de 15 minutes : un centre d’interprétation interactif, une salle d’escalade intérieure et un café-jeux. Je vous envoie les itinéraires?', qr: '3 activités intérieures' },
      { q: '¿Dónde puedo probar comida típica de Quebec?', l: 'ES', a: '¡Claro! Le recomiendo una poutine o una tourtière. Hay dos restaurantes familiares abiertos a cinco minutos a pie.', qr: 'Mapa de restaurantes' },
      { q: 'Trouve-moi un restaurant familial ouvert ce soir.', l: 'FR', a: 'Deux restaurants familiaux sont ouverts ce soir à moins de 10 minutes, dont un avec menu pour enfants. Je vous affiche le plus proche?', qr: 'Restaurants ouverts ce soir' }
    ],
    clinique: [
      { q: 'Combien de temps dure une première évaluation?', l: 'FR', a: 'Une première évaluation dure environ 60 minutes. Les tarifs sont affichés à l’écran. Pour toute question sur votre santé, l’équipe clinique vous répondra directement.' },
      { q: 'How should I prepare for my appointment?', l: 'EN', a: 'Wear comfortable clothing, bring your health card and any medical reports, and arrive about 10 minutes early to check in.' },
      { q: 'Est-ce que je peux avoir un reçu pour mes assurances?', l: 'FR', a: 'Oui, un reçu vous est remis après chaque rendez-vous, à la réception ou par courriel.' }
    ],
    commerce: [
      { q: 'Avez-vous le panneau Portoro Oro en salle de montre?', l: 'FR', a: 'Oui! Le Portoro Oro est exposé en format 4′ × 8′. Il s’agence très bien avec les baguettes de finition or. Je vous le montre à l’écran?', qr: 'Fiche Portoro Oro' },
      { q: 'Le film intelligent, ça marche sur une porte d’entrée?', l: 'FR', a: 'Oui, sur un vitrage compatible. Il existe aussi une porte avec le film intégré en usine, offerte par nos partenaires. Je prends vos dimensions?' },
      { q: 'What are your wall panels made of?', l: 'EN', a: 'Our wall panels are moisture-resistant PVC — great for showers and bathrooms — in large 4′ × 8′ sheets with gold, silver or black trims.' }
    ]
  };
  var chat = $('#chat'), qWrap = $('#questions'), kiosk = $('#kiosk');
  var talking = false;

  function fakeQR() {
    var n = 21, s = '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" aria-hidden="true"><rect width="' + n + '" height="' + n + '" fill="#fff"/>';
    var finder = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#000"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#000"/>'; };
    s += finder(0, 0) + finder(14, 0) + finder(0, 14);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if (Math.random() > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#000"/>';
    }
    return s + '</svg>';
  }

  function renderQuestions(domain) {
    qWrap.innerHTML = '';
    JAMES[domain].forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'q';
      b.innerHTML = '<span>« ' + it.q + ' »</span><span class="flag">' + it.l + '</span>';
      b.addEventListener('click', function () { ask(it); });
      qWrap.appendChild(b);
    });
  }

  function ask(it) {
    if (talking) return;
    talking = true;
    $$('.q', qWrap).forEach(function (b) { b.disabled = true; });
    var me = document.createElement('div');
    me.className = 'bubble me';
    me.textContent = it.q;
    chat.appendChild(me);
    var typing = document.createElement('div');
    typing.className = 'bubble bot typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;
    setTimeout(function () {
      typing.remove();
      var bot = document.createElement('div');
      bot.className = 'bubble bot';
      bot.innerHTML = '<span class="lang">' + it.l + '</span><span class="txt"></span>';
      chat.appendChild(bot);
      kiosk.classList.add('speaking');
      var txt = bot.querySelector('.txt'), i = 0;
      var speed = reduce ? 0 : 16;
      (function type() {
        i += 2;
        txt.textContent = it.a.slice(0, i);
        chat.scrollTop = chat.scrollHeight;
        if (i < it.a.length) setTimeout(type, speed);
        else {
          if (it.qr) {
            var q = document.createElement('div');
            q.className = 'qr';
            q.innerHTML = fakeQR() + '<span>' + it.qr + '<br>Scannez avec votre cellulaire</span>';
            bot.appendChild(q);
            chat.scrollTop = chat.scrollHeight;
          }
          kiosk.classList.remove('speaking');
          talking = false;
          $$('.q', qWrap).forEach(function (b) { b.disabled = false; });
        }
      })();
    }, reduce ? 50 : 750);
  }

  if (chat && qWrap) {
    renderQuestions('ville');
    $$('.domain-tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.domain-tabs button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        renderQuestions(b.dataset.domain);
      });
    });
  }

  /* ---------- Revêtements : marbres procéduraux ---------- */
  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, oct) {
    var v = 0, a = 0.5, f = 1;
    for (var i = 0; i < oct; i++) { v += a * vnoise(x * f, y * f, s + i * 17); f *= 2.03; a *= 0.5; }
    return v;
  }
  var FINISHES = [
    { n: 'Portoro Oro', f: 'Marbre', base: [20, 20, 23], vein: [226, 186, 110], v2: [180, 140, 70], amt: 0.95, sharp: 9, freq: 3.2, turb: 7, ang: 0.6 },
    { n: 'Portoro Blanco', f: 'Marbre', base: [238, 236, 231], vein: [196, 160, 96], v2: [140, 140, 146], amt: 0.85, sharp: 10, freq: 3, turb: 7, ang: 0.5 },
    { n: 'Portoro Grigio', f: 'Marbre', base: [94, 96, 101], vein: [222, 188, 120], v2: [40, 40, 44], amt: 0.9, sharp: 9, freq: 3, turb: 6.5, ang: 0.7 },
    { n: 'Lucca', f: 'Marbre', base: [241, 240, 237], vein: [150, 152, 158], v2: [190, 190, 195], amt: 0.7, sharp: 6, freq: 2.4, turb: 5, ang: 0.9 },
    { n: 'Angelo', f: 'Marbre', base: [234, 228, 218], vein: [170, 140, 100], v2: [200, 185, 160], amt: 0.75, sharp: 7, freq: 2.6, turb: 6, ang: 0.4 },
    { n: 'Lorenzo', f: 'Marbre', base: [230, 232, 235], vein: [70, 74, 84], v2: [150, 152, 160], amt: 0.9, sharp: 5, freq: 2, turb: 5.5, ang: 1.1 },
    { n: 'Impérial', f: 'Marbre', base: [96, 64, 44], vein: [214, 194, 164], v2: [60, 38, 24], amt: 0.85, sharp: 7, freq: 4, turb: 8, ang: 0.8 },
    { n: 'Toscana', f: 'Marbre', base: [224, 207, 180], vein: [176, 146, 106], v2: [240, 228, 205], amt: 0.7, sharp: 6, freq: 2.8, turb: 5.5, ang: 0.3 },
    { n: 'Oro', f: 'Marbre', base: [243, 240, 233], vein: [214, 172, 92], v2: [170, 170, 172], amt: 0.9, sharp: 9, freq: 2.2, turb: 6, ang: 0.7 },
    { n: 'Bardiglio Oro', f: 'Marbre', base: [118, 127, 140], vein: [226, 192, 124], v2: [80, 88, 100], amt: 0.85, sharp: 8, freq: 3.4, turb: 6, ang: 0.2 },
    { n: 'Di Prato', f: 'Marbre', base: [22, 46, 37], vein: [196, 220, 204], v2: [10, 26, 20], amt: 0.8, sharp: 7, freq: 3.6, turb: 7.5, ang: 0.9 },
    { n: 'Fresque Blanco', f: 'Marbre · fresque', base: [236, 233, 226], vein: [205, 198, 186], v2: [250, 248, 244], amt: 0.5, sharp: 2, freq: 1.4, turb: 4, ang: 0.2, soft: 1 },
    { n: 'Fresque Roccia', f: 'Marbre · fresque', base: [160, 146, 130], vein: [118, 104, 90], v2: [196, 184, 168], amt: 0.55, sharp: 2, freq: 1.4, turb: 4, ang: 0.2, soft: 1 },
    { n: 'Béton Ivoire', f: 'Béton texturé', base: [214, 206, 190], concrete: 1 },
    { n: 'Béton Pierre', f: 'Béton texturé', base: [166, 158, 146], concrete: 1 },
    { n: 'Béton Brume', f: 'Béton texturé', base: [150, 156, 161], concrete: 1 },
    { n: 'Béton Graphite', f: 'Béton texturé', base: [62, 64, 69], concrete: 1 },
    { n: 'Marbre Mat', f: 'Pierre mate', base: [204, 201, 196], vein: [168, 164, 160], v2: [220, 218, 214], amt: 0.5, sharp: 4, freq: 2, turb: 5, ang: 0.6, matte: 1 }
  ];

  function renderFinish(canvas, F, w, h, seed, panels) {
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(w, h), d = img.data;
    var sc = 2.4, ca = Math.cos(F.ang || 0), sa = Math.sin(F.ang || 0);
    panels = panels || 1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var pi = Math.floor(x / w * panels);
        var nx = x / w * sc * panels + pi * 3.7, ny = y / w * sc * panels;
        var r, g, b, i = (y * w + x) * 4;
        if (F.concrete) {
          var q = fbm(nx * 1.6, ny * 1.6, seed, 5);
          var grain = hash(x, y, seed) - 0.5;
          var k = 0.82 + 0.36 * (q - 0.5) * 1.6;
          r = F.base[0] * k + grain * 16; g = F.base[1] * k + grain * 16; b = F.base[2] * k + grain * 16;
          if (hash(x * 3, y * 7, seed + 3) > 0.9965) { r *= 0.6; g *= 0.6; b *= 0.6; }
        } else {
          var q1 = fbm(nx, ny, seed, 5);
          var rr = fbm(nx + 4 * q1, ny + 4 * q1, seed + 50, 4);
          var s1 = Math.abs(Math.sin((nx * ca + ny * sa) * F.freq + rr * F.turb));
          var v1 = Math.pow(1 - s1, F.sharp);
          var s2 = Math.abs(Math.sin((nx * sa - ny * ca) * F.freq * 1.7 + rr * F.turb * 1.3 + 2));
          var v2 = Math.pow(1 - s2, F.sharp * 2.2) * 0.6;
          var cloud = 0.92 + 0.16 * (q1 - 0.5) * (F.soft ? 2.2 : 1);
          r = F.base[0] * cloud; g = F.base[1] * cloud; b = F.base[2] * cloud;
          r += (F.v2[0] - r) * v2; g += (F.v2[1] - g) * v2; b += (F.v2[2] - b) * v2;
          var va = v1 * F.amt;
          r += (F.vein[0] - r) * va; g += (F.vein[1] - g) * va; b += (F.vein[2] - b) * va;
          if (F.matte) { var gr = (hash(x, y, seed) - 0.5) * 10; r += gr; g += gr; b += gr; }
        }
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var wall = $('#wall'), wallCanvas = $('#wall-canvas'), sw = $('#swatches');
  if (wall && sw) {
    var current = 0, built = false;
    var setFinish = function (idx) {
      current = idx;
      var F = FINISHES[idx];
      $$('.swatch', sw).forEach(function (s, i) { s.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); });
      $('#finish-label').textContent = F.n;
      $('#wall-name').textContent = F.n;
      $('#wall-family').textContent = F.f + ' · panneau 4′ × 8′';
      wall.style.opacity = '.6';
      setTimeout(function () {
        renderFinish(wallCanvas, F, 480, 384, 11 + idx, 3);
        wall.style.opacity = '';
      }, 30);
    };
    var build = function () {
      if (built) return; built = true;
      FINISHES.forEach(function (F, i) {
        var b = document.createElement('button');
        b.className = 'swatch';
        b.setAttribute('aria-label', F.n + ' — ' + F.f);
        b.setAttribute('title', F.n);
        var c = document.createElement('canvas');
        b.appendChild(c);
        sw.appendChild(b);
        b.addEventListener('click', function () { setFinish(i); });
        setTimeout(function () { renderFinish(c, F, 72, 72, 11 + i, 1); }, i * 20);
      });
      setFinish(0);
    };
    wall.style.transition = 'opacity .3s';
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { build(); o.disconnect(); } }, { rootMargin: '400px' }).observe(wall);

    $$('.trim').forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.trim').forEach(function (o) { o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
        wall.style.setProperty('--trim', t.dataset.trim);
      });
    });
    wall.style.setProperty('--trim', $('.trim').dataset.trim);
    var ls = $('#led-switch');
    ls.addEventListener('click', function () {
      var on = wall.classList.toggle('led-on');
      ls.classList.toggle('is-on', on);
      ls.setAttribute('aria-checked', on ? 'true' : 'false');
      ls.querySelector('.v').textContent = on ? 'Éteindre l’éclairage' : 'Allumer l’éclairage';
    });
  }

  /* ---------- Ligne du temps ---------- */
  var tl = $('#timeline');
  if (tl) {
    var items = $$('.tl-item', tl);
    var tlUpdate = function () {
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      var mark = vh * 0.62;
      var p = Math.max(0, Math.min(r.height - 16, mark - r.top));
      tl.style.setProperty('--p', p + 'px');
      items.forEach(function (it) { it.classList.toggle('lit', it.getBoundingClientRect().top + 14 < mark); });
    };
    window.addEventListener('scroll', tlUpdate, { passive: true });
    window.addEventListener('resize', tlUpdate);
    tlUpdate();
  }

  /* ---------- Formulaire → courriel ---------- */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var body = [
        'Nom : ' + (f.get('nom') || ''),
        'Courriel : ' + (f.get('courriel') || ''),
        'Téléphone : ' + (f.get('telephone') || ''),
        'Ville : ' + (f.get('ville') || ''),
        'Projet : ' + (f.get('projet') || ''),
        '',
        f.get('message') || ''
      ].join('\n');
      location.href = 'mailto:entrepriseamazonia@gmail.com?subject=' + encodeURIComponent('Demande — ' + f.get('projet')) + '&body=' + encodeURIComponent(body);
    });
  }

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
