/* and AJ paw-pads — Design C "Antique Blue"
   依存ライブラリなし（CDN 失敗の影響を受けない）。products.js のデータで描画。 */
(function () {
  'use strict';
  window.__AJ_READY = true;

  var root = document.documentElement;
  var ROOT = '../../';
  var PRODUCTS = window.AJ_PRODUCTS || [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 色名 → 英名・アクセントカラー */
  var COLORS = {
    'パープル': { en: 'Lavender Purple', c: '#b9a6d6' },
    'ミルキーピンク': { en: 'Milky Pink', c: '#efc4c0' },
    'ホワイト': { en: 'Pure White', c: '#e6ecef' },
    'ルージュピンク': { en: 'Rouge Pink', c: '#df5a60' },
    'ベージュ': { en: 'Beige', c: '#d6c39b' },
    'アイスブルー': { en: 'Ice Blue', c: '#a6c4d3' },
    'ロイヤルブルー': { en: 'Royal Blue', c: '#3a56b0' },
    'ディープピンク': { en: 'Deep Pink', c: '#c9497b' },
    'カーキグリーン': { en: 'Khaki Green', c: '#7b8257' },
    'グリーン×ブラック': { en: 'Green × Black', c: '#4a5634' }
  };
  var yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  };
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------
     1. カラースイッチャー（カフェマット / マーチンゲール）
     ------------------------------------------------------------ */
  var switchers = [];
  var MAT_ORDER = ['21012982', '21012971', '21012962', '21012947'];

  function buildSwitcher(section, items) {
    if (!items.length) return;
    var photos = $('[data-photos]', section);
    var sw = $('[data-swatches]', section);
    var en = $('[data-color-en]', section);
    var ja = $('[data-color-ja]', section);
    var count = $('[data-count]', section);
    var buy = $('[data-buy]', section);
    var colorBox = $('.switcher__color', section);
    var title = $('.switcher__title', section).textContent.replace(/\s+/g, '');

    photos.innerHTML = items.map(function (p, i) {
      return '<img src="' + ROOT + esc(p.img) + '" alt="' + esc(title + '（' + p.color + '）') + '" width="800" height="800"' +
        (i === 0 ? ' class="is-active"' : ' loading="lazy"') + '>';
    }).join('');
    sw.innerHTML = items.map(function (p, i) {
      var c = (COLORS[p.color] || {}).c || '#ccc';
      return '<button type="button" class="swatch" style="--c:' + c + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(p.color) + '" title="' + esc(p.color) + '"></button>';
    }).join('');

    var imgs = $$('img', photos);
    var btns = $$('.swatch', sw);
    var state = { section: section, n: items.length, index: -1, pinned: false };

    state.set = function (i) {
      if (i === state.index) return;
      state.index = i;
      var p = items[i];
      var meta = COLORS[p.color] || { en: p.color, c: '#b4c5cf' };
      imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      en.textContent = meta.en;
      ja.textContent = p.color;
      count.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + items.length).slice(-2);
      buy.href = p.url;
      section.style.setProperty('--accent', meta.c);
      colorBox.classList.remove('is-changing');
      void colorBox.offsetWidth;
      colorBox.classList.add('is-changing');
    };

    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (state.pinned) {
          // ピン留め中はその色の位置までスクロール
          var r = section.getBoundingClientRect();
          var range = section.offsetHeight - window.innerHeight;
          var y = window.pageYOffset + r.top + range * ((i + 0.5) / state.n);
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
        state.set(i);
      });
    });
    state.set(0);
    switchers.push(state);
  }

  var mats = MAT_ORDER.map(function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
  if (!mats.length) mats = PRODUCTS.filter(function (p) { return p.category === 'mat'; });
  buildSwitcher($('[data-switcher="mat"]'), mats);
  buildSwitcher($('[data-switcher="martingale"]'), PRODUCTS.filter(function (p) { return p.category === 'martingale'; }));

  var pinMQ = window.matchMedia('(min-width: 900px) and (min-height: 620px)');
  function setupPins() {
    switchers.forEach(function (s) {
      var on = pinMQ.matches && !reduce;
      s.pinned = on;
      s.section.classList.toggle('is-pinnable', on);
      s.section.style.setProperty('--pin-h', (100 + s.n * 55) + 'vh');
    });
  }
  setupPins();

  /* ------------------------------------------------------------
     2. Collection（カテゴリ別・価格付き）
     ------------------------------------------------------------ */
  var ORDER = ['mat', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];
  var list = $('[data-collection]');
  var filters = $('[data-filters]');
  if (list && PRODUCTS.length) {
    var html = '';
    var counts = {};
    ORDER.forEach(function (key) {
      var items = PRODUCTS.filter(function (p) { return p.category === key; });
      if (!items.length) return;
      counts[key] = items.length;
      var c = CATS[key] || { ja: key, en: '', desc: '' };
      html += '<section class="cat" data-cat="' + key + '" aria-labelledby="cat-' + key + '">' +
        '<header class="cat__head"><span class="cat__en">' + esc(c.en) + '</span>' +
        '<h3 class="cat__ja" id="cat-' + key + '">' + esc(c.ja) + '</h3>' +
        '<p class="cat__desc">' + esc(c.desc) + '</p></header><ul class="grid">' +
        items.map(function (p) {
          var col = p.color ? '<span class="card__color"><i style="--c:' + ((COLORS[p.color] || {}).c || '#ccc') + '"></i>' + esc((COLORS[p.color] || {}).en || p.color) + '</span>' : '';
          return '<li class="card"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
            '<div class="card__img"><img src="' + ROOT + esc(p.img) + '" alt="' + esc(p.name) + '" width="800" height="800" loading="lazy"></div>' +
            '<div class="card__body">' + col + '<p class="card__name">' + esc(p.name) + '</p>' +
            '<p class="card__foot"><span class="card__price">' + yen(p.price) + '</span><span class="card__go">Creemaで見る →</span></p></div></a></li>';
        }).join('') + '</ul></section>';
    });
    list.innerHTML = html;

    var total = PRODUCTS.length;
    filters.innerHTML = '<button type="button" class="filter" role="tab" aria-selected="true" data-f="all">すべて<small>' + total + '</small></button>' +
      ORDER.filter(function (k) { return counts[k]; }).map(function (k) {
        return '<button type="button" class="filter" role="tab" aria-selected="false" data-f="' + k + '">' + esc((CATS[k] || {}).ja || k) + '<small>' + counts[k] + '</small></button>';
      }).join('');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.filter');
      if (!b) return;
      var f = b.getAttribute('data-f');
      $$('.filter', filters).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      $$('.cat', list).forEach(function (cat) {
        cat.hidden = !(f === 'all' || cat.getAttribute('data-cat') === f);
        if (!cat.hidden) $$('.card', cat).forEach(function (c) { c.classList.add('is-in'); });
      });
      buildRibbon();
    });
  }

  /* ------------------------------------------------------------
     3. Gallery（archive）
     ------------------------------------------------------------ */
  var gal = $('[data-gallery]');
  if (gal && ARCHIVE.length) {
    gal.innerHTML = ARCHIVE.map(function (a) {
      return '<figure class="gitem"><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
        '<div class="gitem__img"><img src="' + ROOT + esc(a.img) + '" alt="' + esc(a.name) + '" width="800" height="800" loading="lazy"></div>' +
        '<figcaption>' + esc(a.name) + '</figcaption></a></figure>';
    }).join('');
  }

  /* ------------------------------------------------------------
     4. 出現アニメーション
     ------------------------------------------------------------ */
  var revealSel = '.reveal, .mask, .card, .gitem, [data-count-to]';
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // カードはグリッド内で少しずつ遅延
        if (el.classList.contains('card') || el.classList.contains('gitem')) {
          var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
          el.style.transitionDelay = (sib % 4) * 0.08 + 's';
        }
        el.classList.add('is-in');
        if (el.hasAttribute('data-count-to')) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$(revealSel).forEach(function (el) { io.observe(el); });
  } else {
    $$(revealSel).forEach(function (el) { el.classList.add('is-in'); });
  }
  // ヒーローは即座に
  requestAnimationFrame(function () {
    $$('.hero .mask, .hero .reveal').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-in'); }, 120 + i * 110);
    });
  });

  function countUp(el) {
    var to = +el.getAttribute('data-count-to');
    var t0 = performance.now(), dur = 1600;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ------------------------------------------------------------
     5. ページを縫うリボン（SVG path）
     ------------------------------------------------------------ */
  var main = $('#main');
  var ribbon = $('.ribbon');
  var rPaths = ribbon ? $$('path', ribbon) : [];   // [mask, shadow, band, stitch]
  var rMask = ribbon ? $('.ribbon__mask', ribbon) : null;
  var rLen = 0;

  function catmull(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function buildRibbon() {
    if (!ribbon || !main) return;
    var W = main.clientWidth, H = main.offsetHeight;
    ribbon.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    ribbon.style.height = H + 'px';
    var mk = $('mask', ribbon);
    if (mk) { mk.setAttribute('width', W + 100); mk.setAttribute('height', H + 100); }
    var small = W < 700;
    var L = small ? 7 : Math.max(18, W * 0.035), R = W - L, C = W / 2;
    var secs = $$(':scope > section', main);
    var pts = [[W * 0.62, 70]];
    secs.forEach(function (s, i) {
      var top = s.offsetTop, h = s.offsetHeight, side = i % 2 ? L : R;
      var wob = small ? 4 : W * 0.018;
      var steps = Math.max(2, Math.round(h / 650));
      for (var k = 1; k <= steps; k++) {
        var y = top + h * (k / (steps + 1));
        if (i === 0 && y < 140) continue;
        pts.push([side + (k % 2 ? 1 : -1) * wob * (side === L ? 1 : -1), y]);
      }
      if (i < secs.length - 1) pts.push([C + (i % 2 ? -1 : 1) * W * 0.06, top + h]);
    });
    pts.push([C, H - 30]);
    var d = catmull(pts);
    rPaths.forEach(function (p) { p.setAttribute('d', d); });
    rLen = rMask.getTotalLength();
    // mask のパスだけを伸ばして描画（band と stitch は一緒に現れる）
    if (!reduce) rMask.style.strokeDasharray = (rLen + 2) + ' ' + (rLen + 2);
    onScroll(true);
  }

  /* ------------------------------------------------------------
     6. スクロール連動（ヘッダー・進捗・章・追従ボタン・パララックス・リボン・ピン）
     ------------------------------------------------------------ */
  var header = $('.site-header');
  var bar = $('.read-progress span');
  var rail = $('.chapters__rail b');
  var chapLinks = $$('.chapters a');
  var chapSecs = $$('[data-chapter]');
  var dock = $('.dock');
  var hero = $('#hero');
  var footer = $('.footer');
  var parallax = reduce ? [] : $$('[data-speed]');
  var ticking = false;

  function onScroll(force) {
    if (ticking && force !== true) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset, vh = window.innerHeight;
      var docH = document.documentElement.scrollHeight - vh;
      var prog = docH > 0 ? Math.min(1, y / docH) : 0;

      header.classList.toggle('is-solid', y > 40);
      if (bar) bar.style.transform = 'scaleX(' + prog + ')';
      if (rail) rail.style.transform = 'scaleY(' + prog + ')';

      var cur = chapSecs[0];
      chapSecs.forEach(function (s) { if (s.getBoundingClientRect().top < vh * 0.45) cur = s; });
      var id = cur && cur.getAttribute('data-chapter');
      chapLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-ch') === id); });

      var fr = footer.getBoundingClientRect().top;
      var chapNav = document.querySelector('.chapters');
      if (chapNav) chapNav.classList.toggle('is-hidden', fr < vh * 0.9);
      if (dock) {
        dock.classList.toggle('is-shown', y > hero.offsetHeight * 0.55 && fr > vh - 40);
      }

      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var d = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-speed'));
        el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
      });

      if (rLen && !reduce) {
        var mTop = main.getBoundingClientRect().top + y;
        var p = (y + vh * 0.8 - mTop) / main.offsetHeight;
        p = Math.max(0, Math.min(1, p));
        rMask.style.strokeDashoffset = (rLen + 2) * (1 - p);
      }

      switchers.forEach(function (s) {
        if (!s.pinned) return;
        var r = s.section.getBoundingClientRect();
        var range = s.section.offsetHeight - vh;
        if (range <= 0) return;
        var t = Math.max(0, Math.min(0.9999, -r.top / range));
        s.set(Math.floor(t * s.n));
      });
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { setupPins(); buildRibbon(); }, 150);
  });
  window.addEventListener('load', buildRibbon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildRibbon);
  if ('ResizeObserver' in window && main) {
    var lastH = 0;
    new ResizeObserver(function () {
      if (Math.abs(main.offsetHeight - lastH) > 40) { lastH = main.offsetHeight; buildRibbon(); }
    }).observe(main);
  }
  buildRibbon();

  /* ------------------------------------------------------------
     7. メニュー
     ------------------------------------------------------------ */
  var mbtn = $('.menu-btn'), nav = $('#gnav');
  if (mbtn && nav) {
    mbtn.addEventListener('click', function () {
      var open = mbtn.getAttribute('aria-expanded') !== 'true';
      mbtn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { mbtn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });
  }
})();
