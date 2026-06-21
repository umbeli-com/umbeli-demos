/* CLOUTIER — interactions partagées */
(function () {
  'use strict';

  /* --- Header solid au scroll --- */
  var hdr = document.querySelector('.hdr');
  function onScroll() {
    if (!hdr) return;
    if (window.scrollY > 40) hdr.classList.add('solid');
    else hdr.classList.remove('solid');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Menu mobile --- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  /* --- Scroll reveal --- */
  var revs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && revs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('in'); });
  }

  /* --- Accordéon --- */
  document.querySelectorAll('.acc-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.acc-item');
      var a = item.querySelector('.acc-a');
      var open = item.classList.contains('open');
      item.parentElement.querySelectorAll('.acc-item.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.acc-a').style.maxHeight = null;
      });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* --- Compteurs animés --- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
        var dur = 1400, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          el.textContent = val.toLocaleString('fr-CA') + suf;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString('fr-CA') + suf;
        }
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* --- Formulaire (démo, pas d'envoi réel) --- */
  var form = document.querySelector('#soumission');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = form.querySelector('.form-ok');
      if (ok) ok.style.display = 'flex';
      form.querySelectorAll('input,select,textarea,button').forEach(function (f) { f.disabled = true; });
    });
  }

  /* --- Année footer --- */
  document.querySelectorAll('.year').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
