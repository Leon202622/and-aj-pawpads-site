/* and AJ paw-pads — t3 "Atelier Play"
   ライブラリ無し: CSS animation / Web Animations API / IntersectionObserver /
   View Transitions API（対応ブラウザのみ）/ scroll-driven animations（非対応は JS） */
(function () {
  'use strict';

  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  var PRODUCTS = window.AJ_PRODUCTS || [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var BASE = '../../';
  var CREEMA = 'https://www.creema.jp/c/and_aj_pawpads';
  var ORDER = ['mat', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var safe = function (name, fn) { try { fn(); } catch (e) { console.error('[t3] ' + name, e); } };

  /* 色見本（写真の色味に合わせたアクセント） */
  var SWATCHES = {
    mat: [
      { id: '21012982', ja: 'パープル',       en: 'Purple',      c: '#a796cf', ink: '#66559a' },
      { id: '21012971', ja: 'ミルキーピンク', en: 'Milky Pink',  c: '#efbcb3', ink: '#a35f55' },
      { id: '21012962', ja: 'ホワイト',       en: 'White',       c: '#e2ddd2', ink: '#6f6658' },
      { id: '21012947', ja: 'ルージュピンク', en: 'Rouge Pink',  c: '#e0565f', ink: '#ad333d' }
    ],
    martingale: [
      { id: '21125913', ja: 'ベージュ',       en: 'Beige',       c: '#d4bd8f', ink: '#80653a' },
      { id: '21125897', ja: 'アイスブルー',   en: 'Ice Blue',    c: '#9cc0cf', ink: '#3d6c80' },
      { id: '21125826', ja: 'ロイヤルブルー', en: 'Royal Blue',  c: '#4a5bbd', ink: '#33429a' },
      { id: '21125816', ja: 'ミルキーピンク', en: 'Milky Pink',  c: '#e3b4b0', ink: '#9d5c56' },
      { id: '21125803', ja: 'ディープピンク', en: 'Deep Pink',   c: '#cf6f8b', ink: '#a03f5c' },
      { id: '21125553', ja: 'カーキグリーン', en: 'Khaki Green', c: '#6f7c45', ink: '#4b5630' }
    ]
  };
  var DEFAULT_ACCENT = { c: '#d9b979', ink: '#8a6a2e' };

  /* ── Reveal（IntersectionObserver） ── */
  var revealIO = null;
  function observeReveal(el) {
    if (revealIO) revealIO.observe(el); else el.classList.add('in');
  }
  safe('reveal', function () {
    if (!('IntersectionObserver' in window) || reduce) {
      $$('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('.reveal').forEach(observeReveal);
  });
  window.AJ_BOOTED = true;

  /* ── セクションごとの背景トーン ── */
  safe('tone', function () {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) root.setAttribute('data-tone', e.target.getAttribute('data-tone')); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    $$('[data-tone]').forEach(function (el) { if (el !== root) io.observe(el); });
  });

  /* ── スクロール: ヘッダー / 追従購入ボタン / 進捗リボン（scroll-timeline 非対応時） ── */
  safe('scroll', function () {
    var head = $('#siteHead'), buy = $('#stickyBuy'), rail = $('.rail');
    var hero = $('.hero');
    var cssTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()') && !reduce;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      head.classList.toggle('scrolled', y > 30);
      buy.classList.toggle('show', y > (hero ? hero.offsetHeight * .6 : 400));
      if (!cssTimeline) {
        var max = d.documentElement.scrollHeight - innerHeight;
        rail.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      }
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  });

  /* ── モバイルメニュー ── */
  safe('menu', function () {
    var btn = $('#menuBtn'), nav = $('#siteNav');
    function set(open) {
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.menu-txt').textContent = open ? 'Close' : 'Menu';
    }
    btn.addEventListener('click', function () { set(!root.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { set(false); btn.focus(); } });
  });

  /* ── カスタムカーソル（PC のみ） ── */
  safe('cursor', function () {
    if (!finePointer || reduce) return;
    var cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    root.classList.add('has-cursor');
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (!shown) { shown = true; rx = mx; ry = my; cur.classList.remove('is-hidden'); }
    }, { passive: true });
    d.addEventListener('mouseleave', function () { shown = false; cur.classList.add('is-hidden'); });
    addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    (function loop() {
      rx += (mx - rx) * .2; ry += (my - ry) * .2;
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
    d.addEventListener('mouseover', function (e) {
      var t = e.target.closest('[data-cursor], a, button, summary, .ccard');
      var text = '';
      if (t) {
        text = t.getAttribute('data-cursor') || '';
        if (!text && t.tagName === 'A' && /creema\.jp/.test(t.href)) text = 'Buy';
        if (!text && t.tagName === 'A' && /instagram\.com/.test(t.href)) text = 'Follow';
      }
      label.textContent = text;
      cur.classList.toggle('is-label', !!text);
      cur.classList.toggle('is-hover', !!t && !text);
    });
  });

  /* ── 磁石ボタン ── */
  safe('magnetic', function () {
    if (!finePointer || reduce) return;
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * .32;
        var y = (e.clientY - (r.top + r.height / 2)) * .42;
        el.style.transition = 'translate .25s cubic-bezier(.2,.8,.2,1), background-color .35s, color .35s, box-shadow .35s';
        el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = '';
        el.style.translate = '0px 0px';
      });
    });
  });

  /* ── ヒーロー: 写真コラージュ ── */
  safe('collage', function () {
    var col = $('#collage');
    if (!col) return;
    var cards = $$('.ccard', col);
    var order = cards.slice().sort(function (a, b) { return a.dataset.slot - b.dataset.slot; });
    var layout = function () { order.forEach(function (c, i) { c.dataset.slot = i; }); };

    function sendBack(card, dir) {
      var i = order.indexOf(card);
      if (i < 0) return;
      if (reduce) { order.splice(i, 1); order.push(card); layout(); return; }
      card.style.setProperty('--dx', (dir * col.offsetWidth * .7) + 'px');
      card.style.setProperty('--dy', (-col.offsetHeight * .12) + 'px');
      card.style.setProperty('--dr', (dir * 22) + 'deg');
      setTimeout(function () {
        order.splice(order.indexOf(card), 1); order.push(card); layout();
        card.style.setProperty('--dx', '0px'); card.style.setProperty('--dy', '0px'); card.style.setProperty('--dr', '0deg');
      }, 300);
    }
    function bringFront(card) {
      order.splice(order.indexOf(card), 1); order.unshift(card); layout();
    }

    /* ドラッグ／スワイプ */
    cards.forEach(function (card) {
      var sx = 0, sy = 0, dx = 0, dy = 0, active = false, moved = false, pid = null;
      card.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        active = true; moved = false; pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = dy = 0;
      });
      card.addEventListener('pointermove', function (e) {
        if (!active || e.pointerId !== pid) return;
        dx = e.clientX - sx; dy = e.clientY - sy;
        if (!moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * .8) {
          moved = true; card.classList.add('dragging');
          try { card.setPointerCapture(pid); } catch (err) { /* noop */ }
        }
        if (moved) {
          card.style.setProperty('--dx', dx + 'px');
          card.style.setProperty('--dy', dy * .6 + 'px');
          card.style.setProperty('--dr', (dx * .06).toFixed(2) + 'deg');
        }
      });
      function end(e) {
        if (!active || (e && e.pointerId !== pid)) return;
        active = false;
        if (!moved) return;
        card.classList.remove('dragging');
        if (Math.abs(dx) > Math.min(110, col.offsetWidth * .22)) {
          sendBack(card, dx > 0 ? 1 : -1);
        } else {
          card.style.setProperty('--dx', '0px'); card.style.setProperty('--dy', '0px'); card.style.setProperty('--dr', '0deg');
        }
        card.dataset.justDragged = '1';
        setTimeout(function () { delete card.dataset.justDragged; }, 50);
      }
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', function (e) {
        end(e);
        card.classList.remove('dragging');
        card.style.setProperty('--dx', '0px'); card.style.setProperty('--dy', '0px'); card.style.setProperty('--dr', '0deg');
      });
      card.addEventListener('click', function () {
        if (card.dataset.justDragged) return;
        if (order[0] === card) sendBack(card, 1); else bringFront(card);
      });
    });
    $('#collageNext').addEventListener('click', function () { sendBack(order[0], 1); });

    /* マウスに合わせてふわり（奥行きごとに差をつける） */
    if (reduce || !finePointer) return;
    var hero = $('.hero');
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1;
      ty = (e.clientY - r.top) / r.height * 2 - 1;
      if (!running) { running = true; requestAnimationFrame(tick); }
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    function tick() {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      cards.forEach(function (c) {
        var depth = parseFloat(getComputedStyle(c).getPropertyValue('--depth')) || 10;
        var inner = c.firstElementChild;
        inner.style.setProperty('--px', (cx * depth).toFixed(2) + 'px');
        inner.style.setProperty('--py', (cy * depth).toFixed(2) + 'px');
      });
      if (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) requestAnimationFrame(tick); else running = false;
    }
  });

  /* ── マーキーの写真 ── */
  safe('marquee', function () {
    var track = $('#mqPhotos');
    if (!track || !PRODUCTS.length) return;
    var ids = ['21012982', '21125897', '17431639', '21012971', '21127748', '18771002', '21125803', '21012947', '17278642', '21125826', '21012962', '17278403', '21125913'];
    var html = ids.filter(function (id) { return byId[id]; }).map(function (id) {
      return '<img src="' + BASE + byId[id].img + '" alt="" loading="lazy" width="800" height="800">';
    }).join('');
    track.innerHTML = html + html;
  });

  /* ── 実績のカウントアップ ── */
  safe('count', function () {
    var onSale = $('#statOnSale');
    if (onSale && PRODUCTS.length) { onSale.dataset.count = PRODUCTS.length; onSale.textContent = PRODUCTS.length; }
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1800;
        (function step(now) {
          var k = Math.min(1, (now - t0) / dur);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .6 });
    $$('.count').forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight) { el.textContent = '0'; io.observe(el); }
    });
  });

  /* ── 色を選ぶ ── */
  var setAccent = function (c, ink) {
    root.style.setProperty('--accent', c);
    root.style.setProperty('--accent-ink', ink);
  };
  safe('colors', function () {
    var wrap = $('#swatches'), img = $('#cpImg'), frame = $('#cpFrame');
    if (!wrap || !PRODUCTS.length) return;
    var tabs = $$('.cp-tab');
    var state = { set: 'mat', idx: { mat: 0, martingale: 1 } };
    var busy = false;

    function renderSwatches() {
      wrap.innerHTML = SWATCHES[state.set].map(function (s, i) {
        return '<button class="sw" type="button" data-i="' + i + '" style="--c:' + s.c + '" aria-pressed="' + (i === state.idx[state.set]) + '" aria-label="' + s.ja + '（' + s.en + '）">' +
          '<i aria-hidden="true"></i><span aria-hidden="true">' + s.ja + '</span></button>';
      }).join('');
    }
    function info(s, p) {
      $('#cpCat').textContent = CATS[p.category] ? CATS[p.category].en : '';
      $('#cpName').textContent = s.ja;
      $('#cpPrice').innerHTML = yen(p.price) + ' <small>税込</small>';
      $('#cpBuy').href = p.url;
      $('#cpCap').textContent = s.en;
      frame.setAttribute('data-shape', state.set === 'mat' ? 'circle' : 'arch');
    }
    function apply(withAccent) {
      var s = SWATCHES[state.set][state.idx[state.set]];
      var p = byId[s.id];
      if (!p || busy) return;
      $$('.sw', wrap).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === state.idx[state.set])); });
      var src = BASE + p.img;
      var alt = (CATS[p.category] ? CATS[p.category].ja : '') + '（' + s.ja + '）';
      var swap = function () {
        img.src = src; img.alt = alt; info(s, p);
        if (withAccent) setAccent(s.c, s.ink);
      };
      var pre = new Image(); pre.src = src;
      var ready = pre.decode ? pre.decode().catch(function () {}) : Promise.resolve();
      if (reduce) { ready.then(swap); return; }
      busy = true;
      ready.then(function () {
        if (d.startViewTransition) {
          var vt = d.startViewTransition(swap);
          vt.finished.finally(function () { busy = false; });
        } else {
          var a = img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.05)' }], { duration: 260, easing: 'ease-in' });
          a.onfinish = function () {
            swap();
            img.animate([{ opacity: 0, transform: 'scale(.94) rotate(-4deg)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
            busy = false;
          };
        }
      });
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.sw');
      if (!b || busy) return;
      state.idx[state.set] = +b.dataset.i;
      apply(true);
    });
    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $('#cpPanel').setAttribute('aria-labelledby', tab.id);
      if (focus) tab.focus();
      if (state.set === tab.dataset.set) return;
      state.set = tab.dataset.set;
      renderSwatches();
      apply(true);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
        }
      });
    });
    $('#cpReset').addEventListener('click', function () { setAccent(DEFAULT_ACCENT.c, DEFAULT_ACCENT.ink); });
    renderSwatches();
  });

  /* ── コレクション ── */
  var openQV = function () {};
  safe('collection', function () {
    var grid = $('#grid'), filters = $('#filters'), desc = $('#filterDesc');
    if (!grid || !PRODUCTS.length) return;
    var current = 'all';
    var counts = {};
    PRODUCTS.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var cats = ORDER.filter(function (c) { return counts[c]; });
    var sorted = PRODUCTS.slice().sort(function (a, b) { return ORDER.indexOf(a.category) - ORDER.indexOf(b.category); });

    /* マット・マーチンゲールは「別カラー」の写真にめくれる */
    var altOf = {};
    ['mat', 'martingale'].forEach(function (cat) {
      var list = PRODUCTS.filter(function (p) { return p.category === cat; });
      list.forEach(function (p, i) { if (list.length > 1) altOf[p.id] = list[(i + 1) % list.length]; });
    });

    filters.innerHTML = [['all', 'すべて', PRODUCTS.length]].concat(cats.map(function (c) { return [c, CATS[c] ? CATS[c].ja : c, counts[c]]; }))
      .map(function (f) {
        return '<button class="chip" type="button" data-cat="' + f[0] + '" aria-pressed="' + (f[0] === current) + '">' + esc(f[1]) + '<sup>' + f[2] + '</sup></button>';
      }).join('');

    function cardHTML(p, k) {
      var alt = altOf[p.id];
      var cat = CATS[p.category] || { en: '', ja: '' };
      return '<li class="card" style="--k:' + k + ';view-transition-name:c' + p.id + '">' +
        '<button class="card-media' + (alt ? ' has-alt' : '') + '" type="button" data-qv="' + p.id + '" data-cursor="View" aria-haspopup="dialog" aria-label="' + esc(p.name) + ' の詳細を開く">' +
          '<img class="card-img" src="' + BASE + p.img + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800">' +
          (alt ? '<img class="card-alt" src="' + BASE + alt.img + '" alt="" aria-hidden="true" loading="lazy" width="800" height="800">' : '') +
          '<span class="card-tag" aria-hidden="true">Quick view' + (alt && alt.color ? ' · ' + esc(alt.color) + 'も' : '') + '</span>' +
        '</button>' +
        '<div class="card-body"><p class="card-cat">' + esc(cat.en) + '</p>' +
          '<h3 class="card-name"><a href="' + esc(p.url) + '" target="_blank" rel="noopener" data-cursor="Buy">' + esc(p.name) + '</a></h3>' +
          '<p class="card-price">' + yen(p.price) + '<small>税込</small></p></div>' +
      '</li>';
    }
    function setDesc() {
      if (current === 'all') {
        desc.innerHTML = '<b>All pieces</b>現在 Creema で販売中の ' + PRODUCTS.length + ' 作品。カフェマットから順に並んでいます。';
      } else {
        var c = CATS[current];
        desc.innerHTML = '<b>' + esc(c.en) + '</b>' + esc(c.desc);
      }
    }
    function render() {
      var items = current === 'all' ? sorted : sorted.filter(function (p) { return p.category === current; });
      grid.innerHTML = items.map(cardHTML).join('');
      setDesc();
      $$('.chip', filters).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === current)); });
    }
    function change(cat) {
      if (cat === current) return;
      current = cat;
      if (reduce) { render(); return; }
      if (d.startViewTransition) {
        grid.classList.add('no-anim');
        d.startViewTransition(render);
      } else {
        grid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).onfinish = function () {
          grid.classList.remove('no-anim');
          render();
        };
      }
    }
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (b) change(b.dataset.cat);
    });
    $$('[data-filter-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        change(b.getAttribute('data-filter-jump'));
        filters.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-qv]');
      if (b) openQV(b.dataset.qv, b);
    });

    render();
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { grid.classList.add('ready'); io.disconnect(); }
      }, { rootMargin: '0px 0px -10% 0px' });
      io.observe(grid);
    } else {
      grid.classList.add('ready');
    }
  });

  /* ── クイックビュー（dialog + FLIP） ── */
  safe('quickview', function () {
    var qv = $('#qv');
    if (!qv || typeof qv.showModal !== 'function') {
      /* dialog 非対応: Creema へ直接 */
      openQV = function (id) { var p = byId[id]; if (p) window.open(p.url, '_blank', 'noopener'); };
      return;
    }
    var img = $('#qvImg'), inner = $('.qv-inner', qv), body = $('.qv-body', qv), sibs = $('#qvSibs');
    var opener = null, closing = false;

    function fill(p) {
      var cat = CATS[p.category] || { en: '', ja: '', desc: '' };
      img.src = BASE + p.img; img.alt = p.name;
      $('#qvCat').textContent = cat.en + ' — ' + cat.ja;
      $('#qvName').textContent = p.name;
      $('#qvPrice').innerHTML = yen(p.price) + '<small>税込</small>';
      $('#qvDesc').textContent = cat.desc || '';
      $('#qvBuy').href = p.url;
      var list = PRODUCTS.filter(function (x) { return x.category === p.category; });
      $('.qv-sibs-wrap', qv).hidden = list.length < 2;
      $('#qvSibsLabel').textContent = p.category === 'mat' || p.category === 'martingale' ? 'ほかのカラー' : '同じシリーズの作品';
      sibs.innerHTML = list.map(function (x) {
        return '<button class="qv-sib" type="button" data-id="' + x.id + '" aria-pressed="' + (x.id === p.id) + '" aria-label="' + esc(x.color || x.name) + '">' +
          '<img src="' + BASE + x.img + '" alt="" loading="lazy" width="800" height="800"></button>';
      }).join('');
    }
    sibs.addEventListener('click', function (e) {
      var b = e.target.closest('.qv-sib');
      if (!b) return;
      var p = byId[b.dataset.id];
      if (!p) return;
      if (reduce) { fill(p); return; }
      img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = function () {
        fill(p);
        img.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
        var nb = sibs.querySelector('[data-id="' + p.id + '"]'); if (nb) nb.focus();
      };
    });

    openQV = function (id, btn) {
      var p = byId[id];
      if (!p) return;
      opener = btn || null;
      closing = false;
      fill(p);
      root.classList.add('qv-open');
      qv.showModal();
      if (reduce) return;
      var from = btn && btn.querySelector('img');
      qv.classList.add('animating');
      inner.animate([{ backgroundColor: 'rgba(255,250,241,0)', boxShadow: '0 0 0 rgba(0,0,0,0)' }, { backgroundColor: 'rgba(255,250,241,1)' }], { duration: 420, easing: 'ease-out' });
      body.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 160, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      $('.qv-close', qv).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 300, fill: 'backwards' });
      var done = function () { qv.classList.remove('animating'); };
      if (from) {
        var a = from.getBoundingClientRect(), b = img.getBoundingClientRect();
        var anim = img.animate([
          { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / b.width) + ',' + (a.height / b.height) + ')', borderRadius: '3px' },
          { transform: 'none' }
        ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' });
        anim.onfinish = done; anim.oncancel = done;
      } else {
        setTimeout(done, 600);
      }
    };

    function closeQV() {
      if (closing || !qv.open) return;
      closing = true;
      var finish = function () { qv.close(); };
      if (reduce) { finish(); return; }
      var a = inner.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(24px) scale(.98)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = function () { finish(); a.cancel(); };
    }
    qv.addEventListener('cancel', function (e) { e.preventDefault(); closeQV(); });
    qv.addEventListener('close', function () {
      closing = false;
      root.classList.remove('qv-open');
      qv.classList.remove('animating');
      if (opener && d.contains(opener)) opener.focus({ preventScroll: true });
    });
    $('#qvClose').addEventListener('click', closeQV);
    qv.addEventListener('click', function (e) { if (e.target === qv) closeQV(); });
  });

  /* ── ギャラリー（過去作） ── */
  safe('archive', function () {
    var ul = $('#archive');
    if (!ul || !ARCHIVE.length) return;
    ul.innerHTML = ARCHIVE.map(function (a) {
      var name = a.name.replace(/[【】《》]/g, ' ').replace(/\s+/g, ' ').trim();
      return '<li class="reveal"><figure><img src="' + BASE + a.img + '" alt="' + esc(name) + '" loading="lazy" width="800" height="800"><figcaption>' + esc(name) + '</figcaption></figure></li>';
    }).join('');
    $$('li', ul).forEach(function (li, i) { li.style.transitionDelay = (i % 6) * 70 + 'ms'; observeReveal(li); });
  });

  /* ── FAQ: なめらかなアコーディオン ── */
  safe('faq', function () {
    if (reduce) return;
    $$('.qa').forEach(function (det) {
      var sum = det.querySelector('summary'), ans = det.querySelector('.qa-a'), anim = null;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (anim) anim.cancel();
        if (!det.open) {
          det.open = true;
          var h = ans.scrollHeight;
          anim = ans.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
          anim.onfinish = function () { anim = null; };
        } else {
          var h2 = ans.offsetHeight;
          anim = ans.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' });
          anim.onfinish = function () { det.open = false; anim = null; };
        }
      });
    });
  });
})();
