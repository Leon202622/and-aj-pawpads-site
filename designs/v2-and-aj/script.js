/* ==========================================================
   and AJ — v2
   1) 共有データから商品・ギャラリーを描画（GSAP なしでも動く）
   2) 色見本のクリック/タップ/キーボードで写真・色名・背景・リンクを切り替え
   3) GSAP + ScrollTrigger が読めたときだけ演出（ピン留め・スナップ・横スクロールは使わない）
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var BASE = '../../';
  var PRODUCTS = window.AJ_PRODUCTS || [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  };
  var yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------------------------------------------------------
     Collection（カテゴリごとに見出し＋グリッドを縦に並べる）
     --------------------------------------------------------- */
  var ORDER = ['mat', 'memorial', 'martingale', 'lead', 'chouchou', 'ribbon'];

  /* マーチンゲール首輪：色見本の色と英語名（商品データの color 名に対応） */
  var MG_COLORS = {
    'ベージュ': { en: 'Beige', sw: '#dcc9a6', accent: '#d9c39b' },
    'アイスブルー': { en: 'Ice Blue', sw: '#a9c8d4', accent: '#9fc0cd' },
    'ロイヤルブルー': { en: 'Royal Blue', sw: '#4f67b0', accent: '#7f93cc' },
    'ミルキーピンク': { en: 'Milky Pink', sw: '#f0cccb', accent: '#efc2c2' },
    'ディープピンク': { en: 'Deep Pink', sw: '#cf6b8b', accent: '#dc8aa3' },
    'カーキグリーン': { en: 'Khaki Green', sw: '#97a072', accent: '#aab38a' }
  };

  function cardHTML(p) {
    var color = p.color ? '<span class="card-color">' + esc(p.color) + '</span>' : '';
    return '<a class="card" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
      '<div class="card-img"><img src="' + BASE + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800"></div>' +
      color + '<p class="card-name">' + esc(p.name) + '</p>' +
      '<p class="card-price">' + yen(p.price) + '<small>税込</small></p></a>';
  }

  /* 色選びパネル（コレクション内で使う版）。カフェマット版は index.html に静的に書いてある */
  function pickerHTML(id, ringText, items) {
    var n = items.length;
    var first = items[0];
    return '<div class="pick pick--card" data-pick style="--accent:' + first.accent + '">' +
      '<div class="pick-visual">' +
        '<div class="pick-halo" aria-hidden="true"></div>' +
        '<svg class="pick-ring" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><defs><path id="ring-' + id + '" d="M200 200 m-182 0 a182 182 0 1 1 364 0 a182 182 0 1 1 -364 0"/></defs>' +
          '<text><textPath href="#ring-' + id + '">' + esc(ringText) + '</textPath></text></svg>' +
        '<div class="pick-photos">' + items.map(function (it, i) {
          return '<img' + (i === 0 ? ' class="is-active"' : '') + ' src="' + BASE + esc(it.img) + '" alt="' + esc(it.alt) + '" loading="lazy" width="800" height="800">';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="pick-text">' +
        '<div class="pick-color" aria-live="polite">' +
          '<span class="pick-no"><b data-no>01</b> / ' + pad(n) + '</span>' +
          '<span class="pick-en" data-en>' + esc(first.en) + '</span>' +
          '<span class="pick-ja" data-ja>' + esc(first.ja) + '</span>' +
        '</div>' +
        '<p class="pick-name" data-name>' + esc(first.name) + '</p>' +
        '<div class="pick-row">' +
          '<div class="pick-swatches" role="radiogroup" aria-label="カラーを選ぶ">' + items.map(function (it, i) {
            return '<button type="button" class="sw' + (i === 0 ? ' is-active' : '') + '" role="radio" aria-checked="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '"' +
              ' style="--c:' + it.sw + '" aria-label="' + esc(it.ja) + '"' +
              ' data-en="' + esc(it.en) + '" data-ja="' + esc(it.ja) + '" data-accent="' + it.accent + '"' +
              ' data-url="' + esc(it.url) + '" data-price="' + yen(it.price) + '" data-name="' + esc(it.name) + '"></button>';
          }).join('') + '</div>' +
          '<span class="pick-hint" aria-hidden="true">色を選ぶ</span>' +
        '</div>' +
        '<div class="pick-buy">' +
          '<p class="price"><span data-price>' + yen(first.price) + '</span><small>税込</small></p>' +
          '<a class="btn btn-solid" data-link href="' + esc(first.url) + '" target="_blank" rel="noopener">この色を Creema で見る</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCollection() {
    var wrap = $('#cats');
    var cape = $('#cat-cape');
    var chips = $('#chips');
    if (!wrap || !cape) return;
    var no = 0;
    ORDER.forEach(function (key) {
      var cat = CATS[key];
      var items = PRODUCTS.filter(function (p) { return p.category === key; });
      if (!cat || !items.length) return;
      no++;
      var prices = items.map(function (p) { return p.price; });
      var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
      var body;
      var mgItems = key === 'martingale' ? items.filter(function (p) { return MG_COLORS[p.color]; }) : [];
      if (mgItems.length === items.length && items.length > 1) {
        body = pickerHTML('mg', 'MARTINGALE COLLAR · ORIENTAL JACQUARD RIBBON · GOLD HARDWARE · HANDMADE ·', items.map(function (p) {
          var c = MG_COLORS[p.color];
          return { en: c.en, ja: p.color, sw: c.sw, accent: c.accent, url: p.url, img: p.img, price: p.price, name: p.name,
            alt: 'ジャカードリボンのマーチンゲール首輪（' + p.color + '）' };
        }));
      } else {
        body = '<div class="cat-grid' + (items.length === 1 ? ' solo' : '') + '">' + items.map(cardHTML).join('') + '</div>';
      }
      var el = document.createElement('article');
      el.className = 'cat';
      el.id = 'cat-' + key;
      el.innerHTML =
        '<header class="cat-head">' +
          '<p class="cat-no">No. ' + pad(no) + '</p>' +
          '<h3><span class="en">' + esc(cat.en) + '</span><span class="ja">' + esc(cat.ja) + '</span></h3>' +
          '<p class="cat-desc">' + esc(cat.desc) + '</p>' +
          '<p class="cat-meta">' + items.length + (items.length > 1 ? ' items' : ' item') + ' ・ ' +
            (min === max ? yen(min) : yen(min) + ' – ' + yen(max)) + '</p>' +
        '</header>' +
        '<div class="cat-body">' + body + '</div>';
      wrap.insertBefore(el, cape);
      addChip(chips, key, cat.ja + '（' + items.length + '）', false);
    });
    $('.cat-no', cape).textContent = 'No. ' + pad(no + 1);
    addChip(chips, 'cape', 'ケープ（準備中）', true);

    var stat = $('#statOnSale');
    if (stat && PRODUCTS.length) { stat.textContent = PRODUCTS.length; stat.setAttribute('data-count', PRODUCTS.length); }
  }

  /* カテゴリボタン＝ページ内ジャンプ（普通の縦スクロール） */
  function addChip(wrap, key, text, soon) {
    if (!wrap) return;
    var a = document.createElement('a');
    a.className = 'chip' + (soon ? ' is-soon' : '');
    a.href = '#cat-' + key;
    a.textContent = text;
    wrap.appendChild(a);
  }

  function watchChips() {
    if (!('IntersectionObserver' in window)) return;
    var chips = $$('#chips .chip');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        chips.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('#cats .cat').forEach(function (c) { io.observe(c); });
  }

  /* ---------------------------------------------------------
     Gallery（過去作）
     --------------------------------------------------------- */
  function renderGallery() {
    var grid = $('#galGrid');
    if (!grid || !ARCHIVE.length) return;
    var cols = [[], [], []];
    ARCHIVE.forEach(function (a, i) { cols[i % 3].push(a); });
    grid.innerHTML = cols.map(function (col) {
      return '<div class="gal-col">' + col.map(function (a) {
        return '<figure class="gal-item"><div class="ph"><img src="' + BASE + esc(a.img) + '" alt="' + esc(a.name) + '" loading="lazy" width="800" height="800"></div>' +
          '<figcaption>' + esc(a.name) + '</figcaption></figure>';
      }).join('') + '</div>';
    }).join('');
  }

  /* ---------------------------------------------------------
     色選び（色見本を押すと 写真・色名・背景色・リンク が一緒に変わる）
     --------------------------------------------------------- */
  function swapText(el, text) {
    if (!el || el.textContent === text) return;
    if (reduce || !el.animate) { el.textContent = text; return; }
    var token = (el._swap || 0) + 1;
    el._swap = token;
    var out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-30%)' }],
      { duration: 180, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    out.onfinish = function () {
      if (el._swap !== token) return;
      el.textContent = text;
      var inn = el.animate([{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'none' }],
        { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      inn.onfinish = function () { if (el._swap === token) { out.cancel(); inn.cancel(); } };
    };
  }

  function initPicker(pick) {
    var sws = $$('.sw', pick);
    var photos = $$('.pick-photos img', pick);
    var group = $('.pick-swatches', pick);
    var ring = $('.pick-ring', pick);
    var link = $('a[data-link]', pick);
    var accentTarget = pick.closest('.sig') || pick;
    var total = sws.length;
    var cur = 0, turns = 0;

    function select(i, focus) {
      i = (i + total) % total;
      if (focus) sws[i].focus();
      if (i === cur) return;
      cur = i;
      var d = sws[i].dataset;
      sws.forEach(function (b, k) {
        var on = k === i;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      photos.forEach(function (img, k) { img.classList.toggle('is-active', k === i); });
      accentTarget.style.setProperty('--accent', d.accent);
      turns++;
      if (ring) ring.style.setProperty('--ring', (turns * 60) + 'deg');
      $('b[data-no]', pick).textContent = pad(i + 1);
      swapText($('span[data-en]', pick), d.en);
      swapText($('span[data-ja]', pick), d.ja);
      if (d.price) swapText($('span[data-price]', pick), d.price);
      if (d.name) swapText($('p[data-name]', pick), d.name);
      if (link) {
        link.href = d.url;
        link.setAttribute('aria-label', d.ja + 'を Creema で見る（新しいタブ）');
      }
    }

    sws.forEach(function (b, k) {
      b.addEventListener('click', function () { pick.classList.add('is-touched'); select(k); });
    });
    group.addEventListener('keydown', function (e) {
      var map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var next = null;
      if (e.key in map) next = cur + map[e.key];
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = total - 1;
      if (next === null) return;
      e.preventDefault();
      pick.classList.add('is-touched');
      select(next, true);
    });
  }

  /* ---------------------------------------------------------
     Nav / menu / sticky buy / 進捗のジャカード帯
     --------------------------------------------------------- */
  function bindChrome() {
    var nav = $('#nav'), menu = $('#menu'), toggle = $('.nav-toggle'), buy = $('#stickyBuy');
    var edge = $('.edge-fill');
    var setMenu = function (open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

    buy.classList.add('is-hidden');
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      var y = window.scrollY, max = root.scrollHeight - window.innerHeight;
      nav.classList.toggle('is-scrolled', y > 40);
      buy.classList.toggle('is-hidden', y < window.innerHeight * 0.55 || document.body.classList.contains('menu-open'));
      edge.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     Motion（GSAP）— ピン留め・スナップ・横スクロールは使わない
     --------------------------------------------------------- */
  function splitTitle(h) {
    var out = [];
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      var text = node.textContent;
      var frag = document.createDocumentFragment();
      text.split('').forEach(function (c) {
        if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
        var m = document.createElement('span'); m.className = 'ch-m'; m.setAttribute('aria-hidden', 'true');
        var s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
        m.appendChild(s); frag.appendChild(m); out.push(s);
      });
      if (node.nodeType === 1) { node.textContent = ''; node.appendChild(frag); }
      else h.replaceChild(frag, node);
    });
    return out;
  }

  function heroIntro() {
    var chars = splitTitle($('.hero-title'));
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .15 });
    // ロゴのメダリオン：金の縁が描かれ、ロゴがふわっと現れる
    tl.fromTo('.mr-line', { strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
      .from('.mr-pearl', { opacity: 0, rotate: -40, transformOrigin: '50% 50%', duration: 1.6, ease: 'power2.out' }, .3)
      .from('.medal-face', { scale: .82, opacity: 0, filter: 'blur(10px)', duration: 1.4, ease: 'power3.out' }, .2)
      .from('.medal-face img', { scale: 1.6, duration: 2, ease: 'power3.out' }, .2)
      .from('.hero-eyebrow', { y: 14, opacity: 0, duration: .7 }, .9)
      .from(chars, { yPercent: 115, duration: 1, ease: 'power4.out', stagger: .06 }, 1.0)
      .from('.hero-tagline', { opacity: 0, letterSpacing: '.6em', duration: 1.2, ease: 'power2.out' }, 1.3)
      .from('.hero-catch .ln > span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .14 }, 1.4)
      .from('.hero-cta > *', { y: 20, opacity: 0, duration: .7, stagger: .1 }, 1.8)
      .fromTo('.hero-float img', { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.3 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'power3.inOut', stagger: .2 }, .6)
      .from('.hero-float', { opacity: 0, duration: .01 }, .6);
  }

  function scrollReveals() {
    // 見出しのマスクリビール
    $$('.mask-h').forEach(function (h) {
      if (h.classList.contains('hero-catch')) return;
      gsap.from($$('.ln > span', h), {
        yPercent: 110, duration: 1.15, ease: 'power4.out', stagger: .12,
        scrollTrigger: { trigger: h, start: 'top 86%' }
      });
    });
    // テキストのフェードアップ
    $$('[data-r]').forEach(function (el) {
      gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
    // 写真のクリップパス・リビール
    $$('.clip').forEach(function (fig) {
      var img = $('img', fig);
      gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 82%' } })
        .fromTo(img, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' })
        .from(img, { scale: 1.3, duration: 1.8, ease: 'power3.out' }, 0);
    });
    $$('.gal-item .ph').forEach(function (ph, i) {
      gsap.fromTo(ph, { clipPath: 'inset(0% 0% 100% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut', delay: (i % 3) * .08,
        scrollTrigger: { trigger: ph, start: 'top 90%' }
      });
    });
    // 色選びパネル：円がふわっと現れる
    $$('.pick').forEach(function (p) {
      gsap.from($('.pick-visual', p), { scale: .86, rotate: -10, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 78%' } });
    });
    // カテゴリ：見出しと商品カードが順に現れる
    $$('.cat').forEach(function (cat) {
      gsap.from($('.cat-head', cat), { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: cat, start: 'top 86%' } });
    });
    $$('.cat-grid').forEach(function (grid) {
      gsap.from($$('.card', grid), {
        y: 34, opacity: 0, duration: .9, ease: 'power3.out', stagger: { each: .06, grid: 'auto' },
        scrollTrigger: { trigger: grid, start: 'top 88%' }
      });
    });
    // 軽いパララックス
    $$('[data-speed]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-speed')) || .2;
      gsap.to(el, { yPercent: -s * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero-loom', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-inner', { y: -60, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } });
    var cols = $$('.gal-col');
    if (cols[1]) gsap.to(cols[1], { y: -90, ease: 'none', scrollTrigger: { trigger: '#galGrid', start: 'top bottom', end: 'bottom top', scrub: true } });
    if (cols[2]) gsap.to(cols[2], { y: -40, ease: 'none', scrollTrigger: { trigger: '#galGrid', start: 'top bottom', end: 'bottom top', scrub: true } });
    // 数字のカウントアップ
    $$('.count').forEach(function (el) {
      var target = Number(el.getAttribute('data-count')) || 0;
      var o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: target, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%' },
        onUpdate: function () { el.textContent = Math.round(o.v); }
      });
    });
  }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.remove('js-pending'); // 以降は GSAP が初期状態を管理
    heroIntro();
    scrollReveals();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* --------------------------------------------------------- */
  try { renderCollection(); watchChips(); } catch (e) { console.warn(e); }
  try { renderGallery(); } catch (e) { console.warn(e); }
  try { $$('[data-pick]').forEach(initPicker); } catch (e) { console.warn(e); }
  try { bindChrome(); } catch (e) { console.warn(e); }

  if (hasGsap && !reduce) {
    try { initMotion(); }
    catch (e) {
      console.warn('motion disabled:', e);
      root.classList.remove('js-pending');
      if (window.gsap) gsap.globalTimeline.clear();
    }
  } else {
    root.classList.remove('js-pending');
  }
})();
