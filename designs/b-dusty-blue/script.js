/* and AJ paw-pads — Design B "Antique Dusty Blue" */
(function () {
  'use strict';
  window.__AJ_READY = true;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var BASE = '../../';
  var CREEMA = 'https://www.creema.jp/c/and_aj_pawpads';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var yen = function (n) { return '¥' + Number(n).toLocaleString('ja-JP'); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- Header / menu ---------- */
  var header = $('#header');
  var menuBtn = $('#menuBtn');
  var nav = $('#nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var floatCta = $('#floatCta');
  var hero = $('.hero');
  var footer = $('#contact');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    var pastHero = y > hero.offsetHeight * 0.75;
    var nearFooter = footer.getBoundingClientRect().top < window.innerHeight * 0.85;
    floatCta.classList.toggle('is-show', pastHero && !nearFooter);
    drawRibbon();
  }

  /* ---------- Reveal ---------- */
  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function observe(els) {
    els.forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); });
  }
  observe($$('[data-reveal]'));

  /* ---------- Count-up（ヒーローの実績数字） ---------- */
  if (!reduce) {
    $$('[data-count]').forEach(function (el) {
      var to = +el.getAttribute('data-count');
      var t0 = null;
      el.textContent = '0';
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1600);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      setTimeout(function () { requestAnimationFrame(step); }, 500);
    });
  }

  /* ---------- Hero: マウスに軽く反応 ---------- */
  var heroVisual = $('#heroVisual');
  if (heroVisual && finePointer && !reduce) {
    var layers = $$('[data-depth]', heroVisual);
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = +l.getAttribute('data-depth');
        l.style.transform = 'translate3d(' + (cx * 26 * d).toFixed(2) + 'px,' + (cy * 22 * d).toFixed(2) + 'px,0)' +
          (l.classList.contains('hero__stage') ? ' rotate(' + (cx * 4).toFixed(2) + 'deg)' : '');
      });
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(tick) : null;
    }
  }

  /* ---------- Hero: 雪のように舞うパール ---------- */
  var cv = $('#pearls');
  if (cv && cv.getContext && !reduce) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), pearls = [], running = true;
    function resize() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(34, W / 40));
      pearls = [];
      for (var i = 0; i < n; i++) pearls.push(mk(true));
    }
    function mk(any) {
      return {
        x: Math.random() * W, y: any ? Math.random() * H : -10,
        r: 1.4 + Math.random() * 3.2, vy: 0.18 + Math.random() * 0.4,
        sw: Math.random() * Math.PI * 2, ss: 0.004 + Math.random() * 0.01,
        a: 0.35 + Math.random() * 0.5, gold: Math.random() < 0.25
      };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pearls.length; i++) {
        var p = pearls[i];
        p.y += p.vy; p.sw += p.ss; p.x += Math.sin(p.sw) * 0.35;
        if (p.y > H + 10) pearls[i] = mk(false);
        var g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(255,255,255,' + p.a + ')');
        g.addColorStop(1, p.gold ? 'rgba(200,180,138,' + p.a * 0.8 + ')' : 'rgba(181,199,210,' + p.a * 0.8 + ')');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); }
        running = vis;
      }).observe(hero);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Concept: リボンがスクロールで描かれる ---------- */
  var ribbon = $('#ribbonPath');
  var ribbonLen = 0;
  if (ribbon && ribbon.getTotalLength) {
    ribbonLen = ribbon.getTotalLength();
    ribbon.style.setProperty('--len', ribbonLen);
    ribbon.style.setProperty('--off', reduce ? 0 : ribbonLen);
  }
  function drawRibbon() {
    if (!ribbonLen || reduce) return;
    var sec = ribbon.closest('section').getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh - sec.top) / (sec.height + vh * 0.2);
    p = Math.max(0, Math.min(1, p * 1.25));
    ribbon.style.setProperty('--off', (ribbonLen * (1 - p)).toFixed(1));
  }

  /* ---------- Featured mat: カラー切替 ---------- */
  var matImg = $('#matImg'), matBuy = $('#matBuy'), matLabel = $('#matBuyLabel'), matName = $('#matColorName');
  $$('.swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      if (sw.classList.contains('is-active')) return;
      $$('.swatch').forEach(function (s) { s.classList.remove('is-active'); s.setAttribute('aria-checked', 'false'); });
      sw.classList.add('is-active'); sw.setAttribute('aria-checked', 'true');
      matBuy.href = sw.getAttribute('data-url');
      matLabel.textContent = sw.getAttribute('data-ja') + 'をCreemaで見る';
      matName.textContent = sw.getAttribute('data-en');
      var src = sw.getAttribute('data-img'), alt = 'パールフリル カフェマット（' + sw.getAttribute('data-ja') + '）';
      if (reduce) { matImg.src = src; matImg.alt = alt; return; }
      matImg.classList.add('is-swapping');
      var pre = new Image();
      pre.onload = pre.onerror = function () {
        setTimeout(function () {
          matImg.src = src; matImg.alt = alt;
          requestAnimationFrame(function () { matImg.classList.remove('is-swapping'); });
        }, 260);
      };
      pre.src = src;
    });
  });

  /* ---------- Collection ---------- */
  var CATS = window.AJ_CATEGORIES || {};
  var PRODUCTS = (window.AJ_PRODUCTS || []).slice();
  var ORDER = ['mat', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];
  PRODUCTS.sort(function (a, b) { return ORDER.indexOf(a.category) - ORDER.indexOf(b.category); });
  var grid = $('#grid'), filters = $('#filters'), desc = $('#catDesc'), moreBtn = $('#moreBtn');
  var ALL_LIMIT = 12, current = 'all', expanded = false;

  function cardHTML(p) {
    var cat = CATS[p.category] || {};
    return '<li class="card"><a class="card__link" href="' + esc(p.url) + '" target="_blank" rel="noopener" aria-label="' + esc(p.name) + '（' + yen(p.price) + '）をCreemaで見る">' +
      '<div class="card__media"><img src="' + esc(BASE + p.img) + '" alt="' + esc(p.name) + '" width="800" height="800" loading="lazy" decoding="async">' +
      '<span class="card__cat">' + esc(cat.en || '') + '</span></div>' +
      '<div class="card__body"><p class="card__name">' + esc(p.name) + '</p>' +
      '<div class="card__row"><p class="card__price">' + yen(p.price) + '<small>税込</small></p>' +
      '<span class="card__buy">Creemaで見る<svg class="ico"><use href="#i-arrow"/></svg></span></div></div></a></li>';
  }

  function list() {
    return current === 'all' ? PRODUCTS : PRODUCTS.filter(function (p) { return p.category === current; });
  }

  function render(animate) {
    var items = list();
    var shown = (current === 'all' && !expanded) ? items.slice(0, ALL_LIMIT) : items;
    grid.innerHTML = shown.map(cardHTML).join('');
    var cards = $$('.card', grid);
    if (animate && !reduce) {
      cards.forEach(function (c, i) {
        c.style.setProperty('--i', Math.min(i, 12) * 0.05 + 's');
        c.classList.add('is-enter');
        c.addEventListener('animationend', function () { c.classList.remove('is-enter'); }, { once: true });
      });
    }
    var hidden = items.length - shown.length;
    moreBtn.hidden = hidden <= 0;
    moreBtn.textContent = 'すべての作品を見る（全' + items.length + '点）';
    bindTilt(cards);
  }

  function setDesc(text) {
    if (reduce) { desc.textContent = text; return; }
    desc.classList.add('is-out');
    setTimeout(function () { desc.textContent = text; desc.classList.remove('is-out'); }, 220);
  }

  function select(key) {
    if (key === current) return;
    current = key; expanded = false;
    $$('.filter', filters).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-filter') === key ? 'true' : 'false'); });
    setDesc(key === 'all' ? '首輪・リード・カフェマット・メモリアルマットまで、販売中の全作品です。' : (CATS[key] && CATS[key].desc) || '');
    var old = $$('.card', grid);
    if (reduce || !old.length) { render(false); return; }
    old.forEach(function (c, i) { c.style.animationDelay = Math.min(i, 8) * 0.02 + 's'; c.classList.add('is-leave'); });
    setTimeout(function () { render(true); }, 300);
  }

  if (grid && PRODUCTS.length) {
    var counts = {};
    PRODUCTS.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var btns = [{ k: 'all', ja: 'すべて', n: PRODUCTS.length }];
    ORDER.forEach(function (k) { if (counts[k]) btns.push({ k: k, ja: (CATS[k] && CATS[k].ja) || k, n: counts[k] }); });
    filters.innerHTML = btns.map(function (b) {
      return '<button type="button" class="filter" role="tab" data-filter="' + b.k + '" aria-selected="' + (b.k === 'all') + '">' + esc(b.ja) + '<small>' + b.n + '</small></button>';
    }).join('');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.filter');
      if (b) select(b.getAttribute('data-filter'));
    });
    desc.textContent = '首輪・リード・カフェマット・メモリアルマットまで、販売中の全作品です。';
    moreBtn.addEventListener('click', function () {
      var before = $$('.card', grid).length;
      expanded = true;
      var items = list();
      grid.insertAdjacentHTML('beforeend', items.slice(before).map(cardHTML).join(''));
      var added = $$('.card', grid).slice(before);
      if (!reduce) added.forEach(function (c, i) {
        c.style.setProperty('--i', Math.min(i, 12) * 0.04 + 's'); c.classList.add('is-enter');
        c.addEventListener('animationend', function () { c.classList.remove('is-enter'); }, { once: true });
      });
      bindTilt(added);
      moreBtn.hidden = true;
    });
    render(false);
    // 初回は出現アニメ
    if (io) {
      var first = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { first.disconnect(); render(true); }
      }, { threshold: 0.05 });
      first.observe(grid);
    }
  } else if (grid) {
    grid.innerHTML = '<li class="noscript"><a href="' + CREEMA + '" target="_blank" rel="noopener">Creemaのショップページで作品をご覧ください</a></li>';
  }

  /* ---------- Tilt（ホバーで少し傾く） ---------- */
  function bindTilt(cards) {
    if (!finePointer || reduce) return;
    cards.forEach(function (c) {
      var link = c.querySelector('.card__link');
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        link.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        link.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () { link.style.setProperty('--ry', '0deg'); link.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- Gallery ---------- */
  var gal = $('#gal');
  if (gal && window.AJ_ARCHIVE) {
    gal.innerHTML = window.AJ_ARCHIVE.map(function (a, i) {
      return '<li data-reveal="pop" style="--d:' + ((i % 4) * 0.08) + 's"><figure class="gal__item" tabindex="0">' +
        '<img src="' + esc(BASE + a.img) + '" alt="' + esc(a.name) + '" width="800" height="800" loading="lazy" decoding="async">' +
        '<figcaption>' + esc(a.name) + '</figcaption></figure></li>';
    }).join('');
    observe($$('[data-reveal]', gal));
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', drawRibbon);
  onScroll();
})();
