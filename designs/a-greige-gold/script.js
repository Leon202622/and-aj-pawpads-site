/* and AJ paw-pads — Design A (Greige × Antique Gold) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var ROOT = '../../';
  var CREEMA = 'https://www.creema.jp/c/and_aj_pawpads';
  var ORDER = ['mat', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];
  var PRODUCTS = Array.isArray(window.AJ_PRODUCTS) ? window.AJ_PRODUCTS : [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = Array.isArray(window.AJ_ARCHIVE) ? window.AJ_ARCHIVE : [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = doc.classList.contains('anim');

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); }
  function cleanName(n) { return String(n).replace(/[❤️♡♪]/g, '').replace(/\s+/g, ' ').trim(); }

  /* ---------- Ornament (飾り罫) ---------- */
  var ORN = '<svg viewBox="0 0 240 28" aria-hidden="true" focusable="false">' +
    '<path pathLength="1" d="M2 14 H88"/><path pathLength="1" d="M238 14 H152"/>' +
    '<path pathLength="1" d="M88 14 C98 14 100 4 108 5 C114 6 113 13 107 12.5"/>' +
    '<path pathLength="1" d="M88 14 C98 14 100 24 108 23 C114 22 113 15 107 15.5"/>' +
    '<path pathLength="1" d="M152 14 C142 14 140 4 132 5 C126 6 127 13 133 12.5"/>' +
    '<path pathLength="1" d="M152 14 C142 14 140 24 132 23 C126 22 127 15 133 15.5"/>' +
    '<path pathLength="1" d="M120 4 L128 14 L120 24 L112 14 Z"/>' +
    '<circle class="fill" cx="120" cy="14" r="2.2"/><circle class="fill" cx="2" cy="14" r="1.6"/><circle class="fill" cx="238" cy="14" r="1.6"/></svg>';
  $$('.orn').forEach(function (el) { el.innerHTML = ORN; });

  /* ---------- Category panels: 件数と価格帯をデータから ---------- */
  $$('.panel[data-cat]').forEach(function (panel) {
    var cat = panel.getAttribute('data-cat');
    var list = PRODUCTS.filter(function (p) { return p.category === cat; });
    if (!list.length) return;
    var prices = list.map(function (p) { return p.price; });
    var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
    var priceEl = $('.panel__price', panel);
    priceEl.innerHTML = (min === max ? yen(min) : yen(min) + '〜' + Number(max).toLocaleString('ja-JP')) +
      '<small class="panel__count">（税込）・ ' + list.length + '点</small>';
  });

  /* ---------- Products grid ---------- */
  var grid = $('#grid'), tabs = $('#tabs'), moreBtn = $('#more'), total = $('#items-total');
  var state = { cat: 'all', expanded: false };
  var INITIAL = 12;
  var io; // reveal observer (set below)

  function cardHTML(p, i) {
    var cat = CATS[p.category] || {};
    var color = p.color ? '<span class="visually-hidden">（' + esc(p.color) + '）</span>' : '';
    return '<li class="card" data-reveal style="transition-delay:' + ((i % 4) * 90) + 'ms">' +
      '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" aria-label="' + esc(cleanName(p.name)) + ' ' + yen(p.price) + '（Creemaで見る）">' +
      '<div class="card__img"><img src="' + ROOT + esc(p.img) + '" alt="' + esc(cleanName(p.name)) + '" width="800" height="800" loading="lazy"></div>' +
      '<span class="card__cat">' + esc(cat.en || '') + '</span>' +
      '<p class="card__name">' + esc(cleanName(p.name)) + color + '</p>' +
      '<div class="card__foot"><span class="card__price">' + yen(p.price) + '</span><span class="card__buy">Creemaで購入 ↗</span></div>' +
      '</a></li>';
  }

  function renderGrid() {
    if (!grid || !PRODUCTS.length) return;
    var list = PRODUCTS.filter(function (p) { return state.cat === 'all' || p.category === state.cat; });
    list.sort(function (a, b) { return ORDER.indexOf(a.category) - ORDER.indexOf(b.category); });
    var limited = state.cat === 'all' && !state.expanded && list.length > INITIAL;
    var shown = limited ? list.slice(0, INITIAL) : list;
    grid.innerHTML = shown.map(cardHTML).join('');
    if (moreBtn) { moreBtn.hidden = !limited; moreBtn.textContent = 'すべての作品を表示（全' + list.length + '点）'; }
    if (total) total.textContent = '— ' + list.length + ' items';
    $$('.card', grid).forEach(function (c) { observe(c); });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function setCat(cat) {
    state.cat = cat; state.expanded = false;
    $$('.tab', tabs).forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-cat') === cat)); });
    renderGrid();
  }

  if (tabs && PRODUCTS.length) {
    var btns = [{ k: 'all', ja: 'すべて', n: PRODUCTS.length }].concat(ORDER.map(function (k) {
      return { k: k, ja: (CATS[k] && CATS[k].ja) || k, n: PRODUCTS.filter(function (p) { return p.category === k; }).length };
    }).filter(function (b) { return b.n; }));
    tabs.innerHTML = btns.map(function (b) {
      return '<button type="button" role="tab" class="tab" data-cat="' + b.k + '" aria-selected="' + (b.k === 'all') + '">' + esc(b.ja) + '</button>';
    }).join('');
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.tab'); if (t) setCat(t.getAttribute('data-cat'));
    });
  }
  if (moreBtn) moreBtn.addEventListener('click', function () { state.expanded = true; renderGrid(); });
  $$('[data-filter]').forEach(function (a) {
    a.addEventListener('click', function () { setCat(a.getAttribute('data-filter')); });
  });

  /* ---------- Gallery (archive) ---------- */
  var gal = $('#gal');
  if (gal && ARCHIVE.length) {
    gal.innerHTML = ARCHIVE.map(function (a, i) {
      return '<li data-reveal style="transition-delay:' + ((i % 3) * 120) + 'ms"><figure>' +
        '<div class="gal__img"><img src="' + ROOT + esc(a.img) + '" alt="' + esc(cleanName(a.name)) + '" width="800" height="800" loading="lazy"></div>' +
        '<figcaption>' + esc(cleanName(a.name)) + '</figcaption></figure></li>';
    }).join('');
  }

  /* ---------- Instagram strip (装飾) ---------- */
  var strip = $('#ig-strip');
  if (strip) {
    var pics = ['assets/images/archive/21012912.jpg', 'assets/images/products/21125816.jpg', 'assets/images/products/17282528.jpg', 'assets/images/archive/18364883.jpg',
      'assets/images/products/21012971.jpg', 'assets/images/products/18771002.jpg', 'assets/images/products/21125897.jpg', 'assets/images/archive/17940287.jpg',
      'assets/images/products/17300162.jpg', 'assets/images/archive/18647440.jpg', 'assets/images/products/21125553.jpg', 'assets/images/archive/16831604.jpg'];
    strip.innerHTML = pics.map(function (src) { return '<img src="' + ROOT + src + '" alt="" width="800" height="800" loading="lazy">'; }).join('');
  }

  /* ---------- Signature swatches ---------- */
  var sigImg = $('#sig-img'), sigBuy = $('#sig-buy'), sigColor = $('#sig-color');
  $$('.sw').forEach(function (sw) {
    sw.addEventListener('click', function () {
      var id = sw.getAttribute('data-id'), name = sw.getAttribute('data-name');
      var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
      $$('.sw').forEach(function (s) { s.classList.toggle('is-active', s === sw); s.setAttribute('aria-checked', String(s === sw)); });
      if (sigColor) sigColor.textContent = name;
      if (sigBuy) sigBuy.href = p ? p.url : 'https://www.creema.jp/item/' + id + '/detail';
      if (!sigImg) return;
      var src = ROOT + (p ? p.img : 'assets/images/products/' + id + '.jpg');
      sigImg.classList.add('is-switching');
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        setTimeout(function () {
          sigImg.src = src; sigImg.alt = 'パールフリル カフェマット（' + name + '）';
          sigImg.classList.remove('is-switching');
        }, reduce ? 0 : 250);
      };
      pre.src = src;
    });
  });

  /* ---------- Header / menu / floating CTA ---------- */
  var header = $('.header'), menuBtn = $('.menu-btn'), nav = $('#nav');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() {
    nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'メニューを開く'); document.body.style.overflow = '';
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      if (!open) return closeMenu();
      nav.classList.add('is-open'); menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'メニューを閉じる'); document.body.style.overflow = 'hidden';
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  var stamp = $('.stamp'), dock = $('.dock'), hero = $('.hero'), contact = $('#contact');
  if ('IntersectionObserver' in window && hero) {
    var vis = { hero: true, contact: false };
    var upd = function () {
      var show = !vis.hero && !vis.contact;
      if (stamp) stamp.classList.toggle('is-visible', show);
      if (dock) dock.classList.toggle('is-visible', !vis.hero);
    };
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { vis[en.target === hero ? 'hero' : 'contact'] = en.isIntersecting; });
      upd();
    }, { threshold: 0, rootMargin: '-35% 0px 0px 0px' });
    cio.observe(hero); if (contact) cio.observe(contact);
  } else {
    if (stamp) stamp.classList.add('is-visible');
    if (dock) dock.classList.add('is-visible');
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  function observe(el) {
    if (!anim) return;
    if (!io) return el.classList.add('is-in');
    // clip-path で完全に隠れた要素は IO が交差を検知しないため、親要素を監視する
    if (el.classList.contains('clip') && el.parentElement) {
      var host = el.parentElement;
      (host.__reveal = host.__reveal || []).push(el);
      io.observe(host);
    } else io.observe(el);
  }
  if (anim && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        if (t.__reveal) {
          t.__reveal.forEach(function (c) { c.classList.add('is-in'); });
          t.__reveal = null;
          if (!t.hasAttribute('data-reveal')) { io.unobserve(t); return; }
        }
        t.classList.add('is-in'); io.unobserve(t);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  renderGrid();
  $$('[data-reveal], .orn').forEach(observe);

  /* ---------- Hero split text ---------- */
  if (anim) {
    var h1 = $('#hero-title');
    if (h1) h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ''));
    var idx = 0;
    $$('.hero .split').forEach(function (el, n) {
      var text = el.textContent;
      el.textContent = '';
      el.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(text, function (ch) {
        var s = document.createElement('span');
        s.className = 'ch'; s.textContent = ch;
        s.style.setProperty('--i', idx++);
        s.style.setProperty('--d', n === 0 ? '200ms' : '300ms');
        el.appendChild(s);
      });
    });
  }

  /* ---------- Loader → hero intro ---------- */
  function countUp() {
    $$('.count').forEach(function (el) {
      var to = +el.getAttribute('data-to'), t0 = null, dur = 1800;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e);
        if (k < 1) requestAnimationFrame(step);
      }
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }
  function startIntro() {
    if (doc.classList.contains('hero-in')) return;
    doc.classList.remove('is-loading');
    setTimeout(function () {
      doc.classList.add('hero-in');
      setTimeout(countUp, 1500);
    }, 350);
  }
  if (anim) {
    var t0 = Date.now();
    var go = function () { setTimeout(startIntro, Math.max(0, 1700 - (Date.now() - t0))); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    setTimeout(startIntro, 3200); // 画像が遅くても待ちすぎない
  }

  /* ---------- GSAP: parallax / horizontal pin / line draw ---------- */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (anim && gsap && ST) {
    gsap.registerPlugin(ST);

    // スクロール進捗のゴールド罫線
    var bar = document.createElement('span');
    bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;left:0;top:0;height:2px;width:100%;background:linear-gradient(90deg,#c4a96f,#a88a55);transform-origin:left;transform:scaleX(0);z-index:60;pointer-events:none';
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

    // パララックス
    $$('[data-speed]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-speed')) || 0;
      var isImg = el.tagName === 'IMG';
      var trigger = isImg ? el.parentElement : el;
      var from = isImg ? { yPercent: s * 80 } : { y: s * 400 };
      var to = isImg ? { yPercent: -s * 80 } : { y: -s * 400 };
      to.ease = 'none';
      to.scrollTrigger = { trigger: trigger, start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo(el, from, to);
    });

    // 章タイトルの英字をゆっくり横に
    $$('.chapter__en').forEach(function (el) {
      gsap.fromTo(el, { letterSpacing: '0.12em' }, { letterSpacing: '0.02em', ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: true } });
    });

    // コレクションの横スクロール（PCのみピン留め）
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
      var hs = $('#hs'), track = $('#hs-track');
      if (!hs || !track) return;
      hs.classList.add('is-pinned');
      var line = document.createElement('span');
      line.className = 'hs__progress';
      line.style.cssText = 'position:absolute;left:var(--gutter);right:var(--gutter);bottom:6px;height:1px;background:#a88a55;transform-origin:left;transform:scaleX(0)';
      hs.style.position = 'relative';
      hs.appendChild(line);
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: hs, start: 'center center', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
        }
      });
      gsap.to(line, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: hs, start: 'center center', end: function () { return '+=' + dist(); }, scrub: 0.8, invalidateOnRefresh: true } });
      // パネル画像の微パララックス（横方向）
      $$('.panel__img img', track).forEach(function (img) {
        gsap.fromTo(img, { scale: 1.15, xPercent: -4 }, { scale: 1.02, xPercent: 4, ease: 'none', scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return function () { hs.classList.remove('is-pinned'); line.remove(); };
    });

    // マーキー：スクロール速度で少し加速
    var mq = $('.marquee__track');
    if (mq && mq.getAnimations) {
      var a = mq.getAnimations()[0];
      if (a) {
        var rate = 1;
        ST.create({ onUpdate: function (self) { rate = Math.max(rate, 1 + Math.min(4, Math.abs(self.getVelocity()) / 600)); } });
        gsap.ticker.add(function () { rate += (1 - rate) * 0.04; a.playbackRate = rate; });
      }
    }

    window.addEventListener('load', function () { ST.refresh(); });
  }

  window.AJ_READY = true;
})();
