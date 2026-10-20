/* ============================================================
   TRCV ANIMAL — micro-interactions
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  requestAnimationFrame(function () { document.documentElement.classList.add('page-ready'); });

  /* ---------- Menu ---------- */
  var burger = $('#burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); closeDD(); }
    });
  }
  var dds = $$('.nav-dd');
  function closeDD(except) { dds.forEach(function (d) { if (d !== except) { d.dataset.open = 'false'; d.querySelector('.nav-a').setAttribute('aria-expanded', 'false'); } }); }
  dds.forEach(function (dd) {
    var btn = dd.querySelector('.nav-a'), t;
    var set = function (v) { dd.dataset.open = v ? 'true' : 'false'; btn.setAttribute('aria-expanded', v ? 'true' : 'false'); };
    btn.addEventListener('click', function () { var v = dd.dataset.open !== 'true'; closeDD(dd); set(v); });
    if (fine) {
      dd.addEventListener('mouseenter', function () { clearTimeout(t); closeDD(dd); set(true); });
      dd.addEventListener('mouseleave', function () { t = setTimeout(function () { set(false); }, 180); });
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-dd')) closeDD(); });

  /* ---------- Apparition au défilement ---------- */
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
  $$('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---------- Compteurs ---------- */
  var cio = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, t0 = performance.now();
      if (reduce) { el.textContent = to; return; }
      (function step(now) {
        var p = Math.min(1, (now - t0) / 1300);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- Ouvert / fermé (heure de Gatineau) ---------- */
  // Mar–Sam, 8 h à 16 h
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function nowGatineau() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { d: wd, h: (+o.hour % 24) + (+o.minute) / 60 };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours() + n.getMinutes() / 60 }; }
  }
  var isOpenDay = function (d) { return d >= 2 && d <= 6; };
  function status() {
    var n = nowGatineau();
    if (isOpenDay(n.d) && n.h >= 8 && n.h < 16) {
      var left = 16 - n.h;
      return { open: true, txt: left <= 1 ? 'Ouvert · ferme bientôt (16 h)' : 'Ouvert · jusqu’à 16 h' };
    }
    if (isOpenDay(n.d) && n.h < 8) return { open: false, txt: 'Fermé · ouvre à 8 h' };
    var d = (n.d + 1) % 7, k = 1;
    while (!isOpenDay(d)) { d = (d + 1) % 7; k++; }
    return { open: false, txt: 'Fermé · ouvre ' + (k === 1 ? 'demain' : DAYS[d]) + ' à 8 h' };
  }
  function paintStatus() {
    var s = status(), n = nowGatineau();
    $$('[data-open-status]').forEach(function (el) { el.textContent = s.txt; el.classList.toggle('closed', !s.open); });
    $$('[data-day]').forEach(function (r) { r.classList.toggle('today', +r.dataset.day === n.d); });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Bulles sur les boutons ---------- */
  if (fine && !reduce) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointerenter', function (e) {
        var r = b.getBoundingClientRect();
        for (var i = 0; i < 4; i++) {
          var s = document.createElement('span');
          s.className = 'btn-bubble';
          var size = 8 + Math.random() * 12;
          s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (10 + Math.random() * (r.width - 20)) + 'px;top:' + (r.height * 0.4) + 'px;--dx:' + ((Math.random() - 0.5) * 30) + 'px;animation-delay:' + (i * 0.07) + 's';
          b.appendChild(s);
          setTimeout(function (x) { x.remove(); }, 1300, s);
        }
      });
    });
  }

  /* ---------- Cœurs (petits effets) ---------- */
  var HEART = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  function hearts(container, x, y, n) {
    for (var i = 0; i < (n || 3); i++) {
      var h = document.createElement('span');
      h.className = 'heart-fx';
      h.innerHTML = HEART;
      h.style.left = x + 'px'; h.style.top = y + 'px';
      h.style.setProperty('--dx', ((Math.random() - 0.5) * 70) + 'px');
      h.style.setProperty('--rot', ((Math.random() - 0.5) * 40) + 'deg');
      h.style.animationDelay = (i * 0.08) + 's';
      container.appendChild(h);
      setTimeout(function (x) { x.remove(); }, 1300, h);
    }
  }
  function say(container, x, y, txt) {
    var s = document.createElement('span');
    s.className = 'say'; s.textContent = txt;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    container.appendChild(s);
    setTimeout(function () { s.remove(); }, 1200);
  }
  function localXY(container, el) {
    var c = container.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top };
  }

  /* ---------- Scène du bain (accueil) ---------- */
  var scene = $('#scene');
  if (scene) {
    var layer = scene.querySelector('.bubbles');
    var countEl = $('#pop-n'), counter = $('.pop-count'), popped = 0;
    var spawn = function (big) {
      var b = document.createElement('span');
      b.className = 'bubble';
      var size = big ? 46 + Math.random() * 34 : 18 + Math.random() * 40;
      var x = 18 + Math.random() * 64; // % de la largeur, au-dessus de la mousse
      b.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + '%;top:56%;--dur:' + (6 + Math.random() * 5) + 's;--w1:' + ((Math.random() - 0.5) * 50) + 'px;--w2:' + ((Math.random() - 0.5) * 50) + 'px';
      b.style.transformOrigin = 'center';
      var popIt = function (e) {
        if (b.classList.contains('pop')) return;
        e && e.stopPropagation();
        b.classList.add('pop');
        var r = b.getBoundingClientRect(), c = scene.getBoundingClientRect();
        var cx = r.left - c.left + r.width / 2, cy = r.top - c.top + r.height / 2;
        for (var i = 0; i < 6; i++) {
          var d = document.createElement('span');
          d.className = 'pop-dot';
          var a = i / 6 * Math.PI * 2;
          d.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + ['#EE6F95', '#8FD8C0', '#FFD877'][i % 3] + ';--dx:' + Math.cos(a) * 26 + 'px;--dy:' + Math.sin(a) * 26 + 'px';
          layer.appendChild(d);
          setTimeout(function (x) { x.remove(); }, 600, d);
        }
        popped++;
        if (countEl) { countEl.textContent = popped; counter.classList.add('bump'); setTimeout(function () { counter.classList.remove('bump'); }, 250); }
        if (popped === 10 || popped === 25 || popped === 50) say(scene, cx, cy - 30, popped === 10 ? 'Bravo !' : popped === 25 ? 'Champion·ne des bulles !' : 'Wouf wouf !!');
        setTimeout(function () { b.remove(); }, 340);
      };
      b.addEventListener('pointerdown', popIt);
      b.addEventListener('mouseenter', function (e) { if (e.buttons) popIt(e); });
      b.addEventListener('animationend', function (e) { if (e.animationName === 'rise') b.remove(); });
      layer.appendChild(b);
    };
    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(scene);
    if (!reduce) {
      for (var i = 0; i < 5; i++) setTimeout(spawn, i * 400);
      setInterval(function () { if (visible && !document.hidden && layer.childElementCount < 16) spawn(); }, 900);
    }
    // le chien
    var dog = scene.querySelector('.dog');
    if (dog) dog.addEventListener('click', function () {
      dog.classList.remove('wiggle'); void dog.getBBox(); dog.classList.add('wiggle');
      var p = localXY(scene, dog);
      hearts(scene, p.x, p.y + 30, 4);
      say(scene, p.x, p.y - 10, ['Wouf !', 'Encore des bulles !', 'Tout doux…', 'Je sens bon ?'][Math.floor(Math.random() * 4)]);
      for (var k = 0; k < 3; k++) setTimeout(function () { spawn(true); }, k * 120);
    });
    // le canard
    var duck = scene.querySelector('.duck');
    if (duck) duck.addEventListener('click', function () {
      duck.classList.remove('squeak'); void duck.getBBox(); duck.classList.add('squeak');
      var p = localXY(scene, duck);
      say(scene, p.x, p.y - 8, 'Couic !');
    });
  }

  /* ---------- Les yeux du chat suivent le curseur ---------- */
  var pupils = $$('.pupil');
  if (pupils.length && !reduce) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 3, raf = 0;
    var move = function () {
      raf = 0;
      pupils.forEach(function (p) {
        var svg = p.ownerSVGElement, eye = p.previousElementSibling;
        if (!svg || !eye) return;
        var r = eye.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        var k = Math.min(1, d / 220) * (+p.dataset.max || 4.5);
        p.setAttribute('transform', 'translate(' + (dx / d * k).toFixed(2) + ' ' + (dy / d * k).toFixed(2) + ')');
      });
    };
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
    move();
  }

  /* ---------- Mascottes cliquables ailleurs ---------- */
  $$('[data-pat]').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      var host = el.closest('[data-fx]') || el.parentElement;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var p = localXY(host, el);
      hearts(host, p.x, p.y + 20, 3);
      if (el.dataset.pat) say(host, p.x, p.y - 6, el.dataset.pat);
    });
  });

  /* ---------- Déroulé de la visite (chien qui marche) ---------- */
  var visit = $('#visit');
  if (visit) {
    var steps = $$('.step', visit), line = visit.querySelector('.visit-line');
    var upd = function () {
      var r = visit.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      line.style.setProperty('--p', (p * 100) + '%');
      visit.style.setProperty('--pp', p);
      steps.forEach(function (s, i) { s.classList.toggle('lit', p >= (i + 0.2) / steps.length); });
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ---------- Chien / chat ---------- */
  $$('.pet-switch').forEach(function (sw) {
    var btns = $$('button', sw);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        sw.dataset.pet = b.dataset.pet;
        btns.forEach(function (o) {
          var on = o === b;
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
          var panel = document.getElementById(o.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      });
    });
  });

  /* ---------- Avant / après ---------- */
  $$('.ba').forEach(function (ba) {
    var input = ba.querySelector('input');
    var set = function (v) { ba.style.setProperty('--x', v + '%'); };
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
    // petite démo au premier affichage
    if (!reduce) {
      var once = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        once.disconnect();
        var t0 = performance.now();
        (function anim(now) {
          var p = Math.min(1, (now - t0) / 1600);
          var v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
          input.value = v; set(v);
          if (p < 1) requestAnimationFrame(anim);
        })(t0);
      }, { threshold: 0.6 });
      once.observe(ba);
    }
  });

  /* ---------- Carte des secteurs ---------- */
  $$('[data-map]').forEach(function (map) {
    var setOn = function (id) {
      $$('.city', map).forEach(function (c) { c.classList.toggle('on', c.dataset.city === id); });
      $$('.route', map).forEach(function (r) { r.classList.toggle('on', r.dataset.city === id); });
      $$('.city-card[data-city]').forEach(function (c) { c.classList.toggle('on', c.dataset.city === id); });
    };
    $$('.city', map).forEach(function (c) {
      c.addEventListener('mouseenter', function () { setOn(c.dataset.city); });
      c.addEventListener('focus', function () { setOn(c.dataset.city); });
      c.addEventListener('click', function () { if (c.dataset.href) location.href = c.dataset.href; });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && c.dataset.href) location.href = c.dataset.href; });
    });
    $$('.city-card[data-city]').forEach(function (c) {
      c.addEventListener('mouseenter', function () { setOn(c.dataset.city); });
      c.addEventListener('focus', function () { setOn(c.dataset.city); });
    });
    if (map.dataset.map) setOn(map.dataset.map);
  });

  /* ---------- FAQ : une seule ouverte ---------- */
  $$('.faq').forEach(function (f) {
    var items = $$('details', f);
    items.forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; }); });
    });
  });

  /* ---------- Formulaire de rendez-vous ---------- */
  var form = $('#rdv-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      var done = $('#form-done');
      var name = (fd.get('prenom') || '').toString().trim();
      var pet = fd.get('animal') === 'chat' ? 'votre chat' : 'votre chien';
      var petName = (fd.get('nom_animal') || '').toString().trim();
      $('#done-title').textContent = 'Merci' + (name ? ' ' + name : '') + ' !';
      $('#done-txt').textContent = 'On a bien noté votre demande pour ' + (petName || pet) + '. Pour confirmer encore plus vite, appelez-nous au 819-682-6898.';
      done.hidden = false;
      var r = form.getBoundingClientRect();
      hearts(form, r.width / 2, r.height / 2 - 40, 8);
      done.querySelector('button').focus();
    });
    var again = $('#form-again');
    if (again) again.addEventListener('click', function () { $('#form-done').hidden = true; form.reset(); });
  }

  /* ---------- Haut de page + barre d'appel ---------- */
  var top = $('.totop'), bar = $('.callbar');
  var onScroll = function () {
    var y = window.scrollY;
    if (top) top.classList.toggle('show', y > 700);
    if (bar) bar.classList.toggle('show', y > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  var yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();
})();
