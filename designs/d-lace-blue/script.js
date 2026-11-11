/* and AJ paw-pads — design D "Lace Blue"  (no library) */
(function () {
  'use strict';
  window.__ajReady = true;

  var root = document.documentElement;
  var ROOT = '../../';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); }

  /* ---- ロード後にヒーロー演出 ---- */
  var loadedOnce = false;
  function onLoaded() { if (loadedOnce) return; loadedOnce = true; requestAnimationFrame(function () { document.body.classList.add('loaded'); }); }
  if (document.readyState === 'complete') onLoaded(); else window.addEventListener('load', onLoaded);
  setTimeout(onLoaded, 2200); // フォントや画像が遅くても待たせすぎない

  /* ---- ヘッダー ---- */
  var header = $('.site-header');
  var nav = $('#hdrNav');
  var menuBtn = $('.hdr-menu');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      nav.classList.toggle('open', open);
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { menuBtn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); });
    });
  }

  /* ---- 追従する購入ボタン ---- */
  var hero = $('.hero');
  var buy = $('#buyFloat');
  var footer = $('.site-footer');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (buy && hero) {
      var past = y > hero.offsetHeight * 0.6;
      var nearFoot = footer ? footer.getBoundingClientRect().top < window.innerHeight - 40 : false;
      buy.classList.toggle('show', past && !nearFoot);
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---- スクロールで出現（レースのカーテン） ---- */
  var targets = $$('.menu, .reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- 商品データ ---- */
  var CATS = window.AJ_CATEGORIES || {};
  var PRODUCTS = window.AJ_PRODUCTS || [];
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var ORDER = ['mat', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];

  /* 主役: カフェマットのカラー切替 */
  (function matFeature() {
    var wrap = $('#matSwatches'), main = $('#matMain'), buyBtn = $('#matBuy');
    if (!wrap || !main) return;
    var mats = PRODUCTS.filter(function (p) { return p.category === 'mat'; });
    if (!mats.length) return;
    wrap.innerHTML = mats.map(function (p, i) {
      return '<button type="button" class="swatch" data-i="' + i + '" aria-pressed="' + (p.id === '21012962') + '">' +
        '<img src="' + ROOT + esc(p.img) + '" alt="" width="58" height="58" loading="lazy">' +
        '<span>' + esc(p.color || '') + '</span></button>';
    }).join('');
    wrap.addEventListener('click', function (ev) {
      var b = ev.target.closest('.swatch');
      if (!b) return;
      var p = mats[+b.getAttribute('data-i')];
      $$('.swatch', wrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var swap = function () {
        main.src = ROOT + p.img;
        main.alt = 'パールフリル カフェマット（' + (p.color || '') + '）';
        main.classList.remove('swap');
      };
      if (reduce) swap(); else { main.classList.add('swap'); setTimeout(swap, 260); }
      if (buyBtn) buyBtn.href = p.url;
      var label = buyBtn && buyBtn.querySelector('span');
      if (label) label.textContent = p.color + 'をCreemaで購入する';
    });
  })();

  /* カテゴリ切替つき商品一覧 */
  (function shop() {
    var tabs = $('#catTabs'), grid = $('#productGrid'), desc = $('#catDesc');
    if (!tabs || !grid) return;
    if (!PRODUCTS.length) {
      grid.outerHTML = '<p class="center">作品一覧は <a href="https://www.creema.jp/c/and_aj_pawpads" target="_blank" rel="noopener">Creema のショップページ</a> からご覧いただけます。</p>';
      return;
    }
    var keys = ORDER.filter(function (k) { return PRODUCTS.some(function (p) { return p.category === k; }); });
    tabs.innerHTML = keys.map(function (k, i) {
      var c = CATS[k] || { ja: k };
      var n = PRODUCTS.filter(function (p) { return p.category === k; }).length;
      return '<button type="button" role="tab" class="cat-tab" id="tab-' + k + '" data-cat="' + k + '" aria-selected="' + (i === 0) + '" aria-controls="productGrid" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(c.ja) + '<small>' + n + '</small></button>';
    }).join('');
    grid.setAttribute('role', 'tabpanel');

    function card(p, i) {
      return '<li style="--k:' + i + '"><a class="card" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
        '<span class="card-photo"><img src="' + ROOT + esc(p.img) + '" alt="' + esc(p.name) + '" width="800" height="800" loading="lazy"></span>' +
        '<span class="card-body"><span class="card-name">' + esc(p.name) + '</span>' +
        (p.color ? '<span class="card-color">' + esc(p.color) + '</span>' : '') +
        '<span class="card-price">' + yen(p.price) + '<small>税込</small></span>' +
        '<span class="card-go">Creemaで見る</span></span></a></li>';
    }
    function render(k) {
      var list = PRODUCTS.filter(function (p) { return p.category === k; });
      grid.innerHTML = list.map(card).join('');
      grid.setAttribute('aria-labelledby', 'tab-' + k);
      if (desc) { var c = CATS[k]; desc.textContent = c ? (c.en ? c.en + ' — ' : '') + (c.desc || '') : ''; }
    }
    var current = keys[0];
    render(current);
    function select(btn, focus) {
      var k = btn.getAttribute('data-cat');
      if (k === current) return;
      current = k;
      $$('.cat-tab', tabs).forEach(function (t) { var on = t === btn; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      if (reduce) { render(k); return; }
      grid.classList.add('switching');
      if (desc) desc.style.opacity = '0';
      setTimeout(function () {
        render(k);
        grid.classList.remove('switching');
        if (desc) desc.style.opacity = '';
      }, 280);
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.cat-tab'); if (b) select(b); });
    tabs.addEventListener('keydown', function (e) {
      var all = $$('.cat-tab', tabs), i = all.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
        select(n, true);
      }
    });
  })();

  /* アーカイブ（過去作） */
  (function gallery() {
    var ul = $('#gallery-list');
    if (!ul) return;
    if (!ARCHIVE.length) { ul.outerHTML = '<p class="sec-note">過去の作品は Instagram でご覧いただけます。</p>'; return; }
    ul.innerHTML = ARCHIVE.map(function (a) {
      return '<li><a class="g-card" href="' + esc(a.url) + '" target="_blank" rel="noopener"><figure>' +
        '<span class="g-photo"><img src="' + ROOT + esc(a.img) + '" alt="' + esc(a.name) + '" width="800" height="800" loading="lazy"></span>' +
        '<figcaption>' + esc(a.name) + '</figcaption></figure></a></li>';
    }).join('');
  })();
})();
