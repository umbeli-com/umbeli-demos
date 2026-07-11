/* Café Social · B Hive — interactions */
(function () {
  const root = document.documentElement;

  /* ---- Langue FR/EN ---- */
  const savedLang = (function(){ try { return localStorage.getItem('bhive-lang'); } catch(e){ return null; } })() || 'fr';
  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
    try { localStorage.setItem('bhive-lang', lang); } catch(e){}
  }
  setLang(savedLang);
  document.addEventListener('click', function (e) {
    const b = e.target.closest('.lang-toggle button');
    if (b) setLang(b.dataset.lang);
  });

  /* ---- Header scroll ---- */
  const nav = document.querySelector('header.nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    const prog = document.getElementById('progress');
    if (prog) {
      const h = document.body.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Burger ---- */
  const burger = document.querySelector('.burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open'); links.classList.remove('open');
    }));
  }

  /* ---- Reveal ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---- Spotlight curseur ---- */
  const spot = document.getElementById('spotlight');
  if (spot && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      spot.classList.add('on');
      spot.style.setProperty('--mx', e.clientX + 'px');
      spot.style.setProperty('--my', e.clientY + 'px');
    });
    window.addEventListener('mouseleave', () => spot.classList.remove('on'));
  }
})();
