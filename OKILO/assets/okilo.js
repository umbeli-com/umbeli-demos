/* ===================================================================
   CONGÉLO O KILO — JS partagé (Umbeli)
   Injecte l'en-tête / pied de page / panier, gère le catalogue,
   le panier et expose window.OKILO pour les pages.
   =================================================================== */
(function(){
"use strict";

/* ---------------- Catalogue ---------------- */
var IMG={
  poitrine:'https://okilo.ca/cdn/shop/files/IMG-1266_large.png?v=1780227827',
  tournedos:'https://okilo.ca/cdn/shop/files/IMG-1554_large.png?v=1780755353',
  kogo:'https://okilo.ca/cdn/shop/files/IMG-1461_large.png?v=1780280284',
  pizza:'https://okilo.ca/cdn/shop/files/IMG-1278_large.png?v=1780228391',
  viande:'https://okilo.ca/cdn/shop/files/untitled_Gemini_3_Nano_Banana_Pro__2026-03-01_06-15-37.png?v=1772345760',
  poisson:'https://okilo.ca/cdn/shop/files/untitled_Gemini_3_Nano_Banana_Pro__2026-03-01_06-21-16.png?v=1772346092',
  fruitleg:'https://okilo.ca/cdn/shop/files/untitled_Gemini_3_Nano_Banana_Pro__2026-03-01_06-17-27.png?v=1772345867',
  fruits:'https://okilo.ca/cdn/shop/files/fruits.jpg?v=1745789310',
  tournepoulet:'https://okilo.ca/cdn/shop/files/untitled_Gemini_3_Nano_Banana_Pro__2026-03-01_05-30-33.png?v=1772343064'
};
var CATS={viande:'Viande & porc',poulet:'Poulet',poisson:'Poisson & fruits de mer',pizza:'Pizza & repas',legumes:'Légumes',fruits:'Fruits'};
var PRODUCTS=[
  {id:'tournedos',cat:'viande',flag:'deal',flagT:'−17%',name:'Tournedos de bœuf & bacon',price:12.49,old:14.99,sub:'24,98 $/kg · 2 unités',rate:4.8,n:168,img:IMG.tournedos},
  {id:'kogo',cat:'viande',flag:'deal',flagT:'−20%',name:'Kogo porc / bœuf (2x)',price:9.98,old:12.49,sub:'2 unités · 320 g',rate:4.7,n:96,img:IMG.kogo},
  {id:'porc-effiloche',cat:'viande',name:'Rôti de porc effiloché',price:10.99,sub:'12,20 $/kg · 900 g',rate:4.6,n:52,img:IMG.viande},
  {id:'veau',cat:'viande',flag:'new',flagT:'Nouveau',name:'Médaillons de veau',price:14.49,sub:'28,98 $/kg · 500 g',rate:4.8,n:31,img:IMG.viande},
  {id:'poitrine',cat:'poulet',flag:'pop',flagT:'★ Top vente',name:'Poitrine de poulet farcie canard/porc/canneberge',price:7.79,sub:"l'unité · 12,99 $/kg",rate:4.9,n:212,img:IMG.poitrine},
  {id:'cuisses',cat:'poulet',flag:'deal',flagT:'−28%',name:'Cuisses de poulet marinées',price:6.49,old:8.99,sub:'6,49 $/kg · 1 kg',rate:4.7,n:118,img:IMG.viande},
  {id:'hauts-cuisse',cat:'poulet',name:'Hauts de cuisse désossés',price:8.29,sub:'8,29 $/kg · 1 kg',rate:4.6,n:74,img:IMG.poitrine},
  {id:'tournedos-poulet',cat:'poulet',flag:'new',flagT:'Nouveau',name:'Tournedos de poulet au bacon',price:9.49,sub:'18,98 $/kg · 2 unités',rate:4.8,n:44,img:IMG.tournepoulet},
  {id:'saumon',cat:'poisson',flag:'new',flagT:'Nouveau',name:"Filet de saumon de l'Atlantique",price:11.49,sub:'22,98 $/kg · 500 g',rate:4.8,n:74,img:IMG.poisson},
  {id:'crevettes',cat:'poisson',flag:'pop',flagT:'★ Top vente',name:'Crevettes nordiques décortiquées',price:13.99,sub:'27,98 $/kg · 500 g',rate:4.9,n:88,img:IMG.poisson},
  {id:'petoncles',cat:'poisson',name:'Pétoncles géants',price:16.99,sub:'42,48 $/kg · 400 g',rate:4.7,n:36,img:IMG.poisson},
  {id:'pizza',cat:'pizza',flag:'pop',flagT:'★ Top vente',name:'Pizza garnie 9″',price:8.99,sub:"l'unité · 480 g",rate:4.9,n:143,img:IMG.pizza},
  {id:'pizza-12',cat:'pizza',name:'Pizza toute garnie 12″',price:12.99,sub:"l'unité · 720 g",rate:4.7,n:61,img:IMG.pizza},
  {id:'legumes',cat:'legumes',name:'Mélange de légumes surgelés',price:4.99,sub:'4,99 $/kg · sac 1 kg',rate:4.6,n:88,img:IMG.fruitleg},
  {id:'brocoli',cat:'legumes',name:'Fleurons de brocoli',price:4.49,sub:'4,49 $/kg · sac 1 kg',rate:4.5,n:57,img:IMG.fruitleg},
  {id:'fruits',cat:'fruits',flag:'new',flagT:'Nouveau',name:'Fruits surgelés à smoothie',price:5.99,sub:'5,99 $/kg · sac 1 kg',rate:4.9,n:64,img:IMG.fruits},
  {id:'bleuets',cat:'fruits',name:'Bleuets sauvages',price:6.99,sub:'6,99 $/kg · sac 1 kg',rate:4.8,n:49,img:IMG.fruits}
];
var THRESHOLD=100, cart={};

/* ---------------- Utils ---------------- */
function money(v){return v.toFixed(2).replace('.',',')+' $';}
var STAR='<svg viewBox="0 0 24 24"><polygon points="12 2 15 9 22 9.3 16.5 13.9 18.5 21 12 16.8 5.5 21 7.5 13.9 2 9.3 9 9"/></svg>';
function byId(id){return PRODUCTS.find(function(p){return p.id===id;});}

/* ---------------- Cartes produit ---------------- */
function cartControl(p){
  var q=cart[p.id]?cart[p.id].qty:0;
  if(!q)return '<button class="c-add" data-add="'+p.id+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>Ajouter</button>';
  return '<div class="c-step"><button data-dec="'+p.id+'" aria-label="Retirer">−</button><span>'+q+'</span><button data-inc="'+p.id+'" aria-label="Ajouter">+</button></div>';
}
function cardHTML(p){
  return '<article class="card">'+
    '<div class="c-media">'+(p.flag?'<span class="c-flag '+p.flag+'">'+p.flagT+'</span>':'')+
      '<button class="c-fav" data-fav aria-label="Favori"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>'+
      '<a href="produit.html?p='+p.id+'"><img src="'+p.img+'" alt="'+p.name+'" loading="lazy" onerror="this.style.opacity=0"></a></div>'+
    '<div class="c-body"><div class="c-cat">'+(CATS[p.cat]||p.cat)+'</div>'+
      '<div class="c-name"><a href="produit.html?p='+p.id+'">'+p.name+'</a></div>'+
      '<div class="c-foot"><div class="etq"><div class="etq-price '+(p.old?'is-promo':'')+'">'+money(p.price)+(p.old?' <s>'+money(p.old)+'</s>':'')+'</div><div class="etq-sub">'+p.sub+'</div></div>'+
      '<div class="c-cart" data-cart="'+p.id+'">'+cartControl(p)+'</div></div>'+
    '</div></article>';
}
function renderGrid(container,list){
  var el=typeof container==='string'?document.querySelector(container):container;
  if(el)el.innerHTML=list.map(cardHTML).join('');
}
function syncGrid(){
  document.querySelectorAll('[data-cart]').forEach(function(el){var p=byId(el.dataset.cart);if(p)el.innerHTML=cartControl(p);});
}

/* ---------------- Panier ---------------- */
function addToCart(id,qty){qty=qty||1;var p=byId(id);if(!p)return;if(cart[id])cart[id].qty+=qty;else cart[id]={product:p,qty:qty};updateCart();toast(p.name.slice(0,34)+(p.name.length>34?'…':'')+' ajouté');}
function changeQty(id,d){if(!cart[id])return;cart[id].qty+=d;if(cart[id].qty<=0)delete cart[id];updateCart();}
function subtotal(){return Object.keys(cart).reduce(function(s,k){return s+cart[k].product.price*cart[k].qty;},0);}
function count(){return Object.keys(cart).reduce(function(s,k){return s+cart[k].qty;},0);}
function updateCart(){
  var s=subtotal(),c=count();
  syncGrid();
  var q=function(id){return document.getElementById(id);};
  if(q('cartTotalHd'))q('cartTotalHd').textContent=money(s);
  var cc=q('cartCount');if(cc){cc.textContent=c;cc.style.display=c?'flex':'none';}
  if(q('mbTotal'))q('mbTotal').textContent=money(s);
  var fs=q('okFreeship');if(fs)fs.classList.toggle('on',c>0);
  var pct=Math.min(100,s/THRESHOLD*100),rem=Math.max(0,THRESHOLD-s);
  var msg=rem<=0?'<b>Bravo !</b> Livraison <b>GRATUITE</b> débloquée.':'Plus que <b>'+money(rem)+'</b> pour la <b>livraison GRATUITE</b>.';
  ['fsFill','drFsFill','mbFill'].forEach(function(id){if(q(id))q(id).style.width=pct+'%';});
  ['fsMsg','drFsMsg'].forEach(function(id){if(q(id))q(id).innerHTML=msg;});
  if(q('mbMsg'))q('mbMsg').innerHTML=rem<=0?'<b>Livraison gratuite débloquée</b>':'Plus que <b>'+money(rem)+'</b> pour la livraison gratuite';
  var body=q('drBody');
  if(body){
    if(c===0){body.innerHTML='<div class="dr-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2 3h3l2.6 13.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/></svg><h4>Votre panier est vide</h4><p>Ajoutez vos surgelés préférés !</p></div>';q('drFoot').style.display='none';}
    else{body.innerHTML=Object.keys(cart).map(function(k){var i=cart[k];return '<div class="dr-item"><img src="'+i.product.img+'" alt="" onerror="this.style.opacity=0"><div class="dr-it-b"><div class="din">'+i.product.name+'</div><div class="dip">'+money(i.product.price)+'</div><div class="dr-qty"><button data-dec="'+i.product.id+'">−</button><span>'+i.qty+'</span><button data-inc="'+i.product.id+'">+</button></div></div><button class="dr-rm" data-rm="'+i.product.id+'">Retirer</button></div>';}).join('');q('drFoot').style.display='block';q('drSub').textContent=money(s);}
  }
}
function openCart(){document.getElementById('okDrawer').classList.add('on');document.getElementById('okOverlay').classList.add('on');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('okDrawer').classList.remove('on');document.getElementById('okOverlay').classList.remove('on');document.body.style.overflow='';}
var toastTimer;
function toast(m){var t=document.getElementById('okToast');document.getElementById('okToastMsg').innerHTML=m+' <a href="#" data-opencart>Voir le panier</a>';t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('on');},3000);}

/* ---------------- Chrome (header / footer / panier) ---------------- */
var PAGES=[
  {k:'accueil',t:'Accueil',h:'index.html'},
  {k:'produits',t:'Produits',h:'boutique.html',sub:'produits'},
  {k:'cuisson',t:'Mode de cuisson',h:'mode-cuisson.html',sub:'cuisson'},
  {k:'apropos',t:'À propos',h:'#'},
  {k:'blogue',t:'Blogue',h:'#'},
  {k:'contact',t:'Contact',h:'#'}
];
var NAVCATS=[
  {t:'Tous les rayons',h:'boutique.html'},
  {t:'Viande & porc',h:'categorie.html?cat=viande'},
  {t:'Poulet',h:'categorie.html?cat=poulet'},
  {t:'Poisson & fruits de mer',h:'categorie.html?cat=poisson'},
  {t:'Pizza',h:'categorie.html?cat=pizza'},
  {t:'Fruits & légumes',h:'categorie.html?cat=legumes'}
];
var SUBS={
  produits:[
    {t:'Tous les rayons',h:'boutique.html'},
    {t:'Viande & porc',h:'categorie.html?cat=viande'},
    {t:'Poulet',h:'categorie.html?cat=poulet'},
    {t:'Poisson & fruits de mer',h:'categorie.html?cat=poisson'},
    {t:'Pizza & repas',h:'categorie.html?cat=pizza'},
    {t:'Légumes',h:'categorie.html?cat=legumes'},
    {t:'Fruits',h:'categorie.html?cat=fruits'},
    {t:'Meilleurs vendeurs',h:'boutique.html',right:true}
  ],
  cuisson:[
    {t:'Toutes les recettes',h:'mode-cuisson.html'},
    {t:'Viande',h:'mode-cuisson.html?f=viande'},
    {t:'Poulet',h:'mode-cuisson.html?f=poulet'},
    {t:'Poisson',h:'mode-cuisson.html?f=poisson'},
    {t:'Pizza & repas',h:'mode-cuisson.html?f=pizza'}
  ]
};
function headerHTML(page){
  var pages=PAGES.map(function(p){return '<a class="plink'+(p.sub?' has-sub':'')+(p.k===page?' on':'')+'" href="'+p.h+'"'+(p.sub?' data-sub="'+p.sub+'"':'')+'>'+p.t+'</a>';}).join('');
  return ''+
  '<header class="hd" id="okHd">'+
  '<div class="topbar"><div class="wrap"><span class="tb-x"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h11v8H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg> Livraison <b>GRATUITE</b> dès 100&nbsp;$ · rayon de 45&nbsp;km de Shawinigan</span></div></div>'+
  '<div class="wrap hd-main">'+
    '<button class="burger" id="okBurger" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>'+
    '<a href="index.html" class="logo" aria-label="Congélo O Kilo"><img src="https://okilo.ca/cdn/shop/files/Logo-Congelo_1d80c964-6744-49db-b65c-65167b1668e1_125x.png?v=1745788155" alt="Congélo O Kilo" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"><span class="lg-fallback">Congélo O Kilo</span></a>'+
    '<div class="search"><input type="search" placeholder="Rechercher : poulet, pizza, saumon…" aria-label="Rechercher"><svg class="s-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></div>'+
    '<div class="hd-actions"><a href="tel:8193702828" class="hd-tel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg><span>819-370-2828</span></a>'+
    '<button class="cart-btn" data-opencart><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2 3h3l2.6 13.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/></svg><span id="cartTotalHd">0,00&nbsp;$</span><span class="cart-count" id="cartCount" style="display:none">0</span></button></div>'+
  '</div>'+
  '<div class="msearch"><div class="msearch-in"><input type="search" placeholder="Rechercher un produit…" aria-label="Rechercher"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></div></div>'+
  '<nav class="hd-pages"><div class="wrap">'+pages+'</div></nav>'+
  '<div class="hd-sub" id="okHdSub"><div class="wrap" id="okHdSubInner"></div></div>'+
  '<div class="freeship" id="okFreeship"><div class="wrap"><span class="ic ic-green fs-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h11v8H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><div class="fs-body"><div class="fs-msg" id="fsMsg">Plus que <b>100,00&nbsp;$</b> pour la <b>livraison GRATUITE</b>.</div><div class="fs-track"><div class="fs-fill" id="fsFill"></div></div></div><span class="fs-tag">Objectif 100&nbsp;$</span></div></div>'+
  '</header>';
}
function footerHTML(){
  return '<footer><div class="wrap"><div class="foot-grid">'+
  '<div class="foot-brand"><a href="index.html"><img src="https://okilo.ca/cdn/shop/files/Logo-Congelo_1d80c964-6744-49db-b65c-65167b1668e1_125x.png?v=1745788155" alt="Congélo O Kilo" onerror="this.style.display=\'none\'"></a><p>Des produits surgelés de qualité, payés au poids, sans gaspillage. Fait avec amour au Québec, livré partout en Mauricie.</p><div class="foot-social"><a href="https://www.facebook.com/profile.php?id=61575644526483" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg></a><a href="https://www.tiktok.com/@congelookilo" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.2 1.6 3.9 3.8 4.2v2.6c-1.4 0-2.7-.4-3.8-1.1v6.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.7a3 3 0 1 0 2.1 2.9V3z"/></svg></a></div></div>'+
  '<div><h4>Nos rayons</h4><div class="foot-links"><a href="categorie.html?cat=viande">Viande / Porc / Veau</a><a href="categorie.html?cat=poulet">Poulet</a><a href="categorie.html?cat=poisson">Poisson & fruits de mer</a><a href="categorie.html?cat=pizza">Pizza & repas</a><a href="boutique.html">Tous les produits</a></div></div>'+
  '<div><h4>Aide & infos</h4><div class="foot-links"><a href="mode-cuisson.html">Mode de cuisson</a><a href="#">Politique d\'expédition</a><a href="#">Politique de retour</a><a href="#">Nous joindre</a></div></div>'+
  '<div><h4>Nous joindre</h4><div class="foot-contact">5634, Boul. des Forges<br>Trois-Rivières (Québec) G8Y 1X7<br><a href="tel:8193702828">819-370-2828</a><br><a href="mailto:congelookilo@hotmail.com">congelookilo@hotmail.com</a></div></div>'+
  '</div><div class="foot-bottom"><span>© 2026 Congélo O Kilo. Tous droits réservés.</span><span>Conception par <a href="https://umbeli.com" target="_blank" rel="noopener">Umbeli — Agence digitale</a></span></div></div></footer>';
}
function chromeHTML(page){
  var mpages=PAGES.map(function(p){return '<a href="'+p.h+'">'+p.t+'</a>';}).join('');
  var mcats=NAVCATS.slice(1).map(function(c){return '<a href="'+c.h+'">'+c.t+'</a>';}).join('');
  return ''+
  '<div class="mbar"><div class="mb-fs"><div class="m" id="mbMsg">Plus que <b>100,00&nbsp;$</b> pour la livraison gratuite</div><div class="t"><i id="mbFill"></i></div></div><button class="mb-cart" data-opencart><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2 3h3l2.6 13.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/></svg><span id="mbTotal">0,00&nbsp;$</span></button></div>'+
  '<div class="mmenu" id="okMmenu"><div class="mm-head"><span style="font-family:var(--fd);font-weight:800;color:var(--blue-ink)">Menu</span><button class="dr-close" id="okMmClose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div><div class="mm-links"><div class="mm-cap">Pages</div>'+mpages+'<div class="mm-cap">Rayons principaux</div>'+mcats+'</div></div>'+
  '<div class="overlay" id="okOverlay"></div>'+
  '<aside class="drawer" id="okDrawer" aria-label="Panier"><div class="dr-head"><h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1.6"/><circle cx="18" cy="21" r="1.6"/><path d="M2 3h3l2.6 13.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L22 7H6"/></svg>Mon panier</h3><button class="dr-close" id="okDrClose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>'+
  '<div class="dr-fs"><div class="fs-msg" id="drFsMsg">Plus que <b>100,00&nbsp;$</b> pour la <b>livraison GRATUITE</b>.</div><div class="fs-track"><div class="fs-fill" id="drFsFill"></div></div></div>'+
  '<div class="dr-body" id="drBody"></div>'+
  '<div class="dr-foot" id="drFoot" style="display:none"><div class="dr-sub"><span class="l">Sous-total</span><span class="v" id="drSub">0,00&nbsp;$</span></div><div class="dr-note">Taxes et livraison calculées au paiement. Minimum de commande : 25 $.</div><button class="btn btn-cta btn-block btn-lg">Passer à la caisse</button><div class="dr-trust"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Paiement 100% sécurisé · Visa, Mastercard, Apple Pay</div></div></aside>'+
  '<div class="toast" id="okToast"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg><span id="okToastMsg">Ajouté au panier</span></div>';
}

/* ---------------- Init ---------------- */
function init(){
  var page=document.body.getAttribute('data-page')||'';
  document.body.insertAdjacentHTML('afterbegin',headerHTML(page));
  document.body.insertAdjacentHTML('beforeend',footerHTML()+chromeHTML(page));

  // délégation clics panier (fonctionne sur toutes les grilles + tiroir)
  document.addEventListener('click',function(e){
    var t=e.target;
    var oc=t.closest('[data-opencart]'); if(oc){e.preventDefault();openCart();return;}
    var add=t.closest('[data-add]'); if(add){addToCart(add.dataset.add,1);return;}
    var inc=t.closest('[data-inc]'); if(inc){changeQty(inc.dataset.inc,1);return;}
    var dec=t.closest('[data-dec]'); if(dec){changeQty(dec.dataset.dec,-1);return;}
    var rm=t.closest('[data-rm]'); if(rm){changeQty(rm.dataset.rm,-9999);return;}
    var fav=t.closest('[data-fav]'); if(fav){fav.classList.toggle('on');return;}
  });
  document.getElementById('okDrClose').addEventListener('click',closeCart);
  document.getElementById('okOverlay').addEventListener('click',closeCart);
  document.getElementById('okBurger').addEventListener('click',function(){document.getElementById('okMmenu').classList.add('on');});
  document.getElementById('okMmClose').addEventListener('click',function(){document.getElementById('okMmenu').classList.remove('on');});
  document.querySelectorAll('#okMmenu a').forEach(function(a){a.addEventListener('click',function(){document.getElementById('okMmenu').classList.remove('on');});});

  // ---- Menu hybride : sous-menu contextuel + repli au scroll ----
  var hd=document.getElementById('okHd'), subEl=document.getElementById('okHdSub'), subInner=document.getElementById('okHdSubInner');
  var defaultSub=(page==='cuisson')?'cuisson':'produits';
  function fillSub(key){var items=SUBS[key]||[];subInner.innerHTML=items.map(function(it){return '<a class="sublink'+(it.right?' right':'')+'" href="'+it.h+'">'+it.t+'</a>';}).join('');}
  function markActive(key){var ps=document.querySelectorAll('.plink[data-sub]');for(var i=0;i<ps.length;i++)ps[i].classList.toggle('active-sub',ps[i].getAttribute('data-sub')===key);}
  function openSub(key){fillSub(key);subEl.classList.add('open');markActive(key);}
  function closeSub(){subEl.classList.remove('open');markActive(null);}
  function atTop(){return window.scrollY<50;}
  var hovering=false;
  hd.addEventListener('mouseenter',function(){hovering=true;});
  hd.addEventListener('mouseleave',function(){hovering=false;if(atTop())openSub(defaultSub);else closeSub();});
  var pls=document.querySelectorAll('.plink[data-sub]');
  for(var pi=0;pi<pls.length;pi++){pls[pi].addEventListener('mouseenter',function(){openSub(this.getAttribute('data-sub'));});}
  window.addEventListener('scroll',function(){hd.classList.toggle('scr',window.scrollY>10);if(hovering)return;if(atTop())openSub(defaultSub);else closeSub();});
  if(atTop())openSub(defaultSub);

  updateCart();
  if(window.OKILO_READY)window.OKILO_READY();
}

window.OKILO={PRODUCTS:PRODUCTS,CATS:CATS,cardHTML:cardHTML,renderGrid:renderGrid,addToCart:addToCart,changeQty:changeQty,openCart:openCart,money:money,byId:byId,updateCart:updateCart,STAR:STAR};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
