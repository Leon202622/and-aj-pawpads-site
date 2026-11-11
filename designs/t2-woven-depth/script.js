/* ============================================================
   and AJ paw-pads — Design T2 "Woven Depth"
   - Hero: Three.js の布（ジャカード柄 CanvasTexture）＋風に揺れるリボン
   - CSS 3D: 傾くカード / カフェマットの 3D カルーセル
   - パララックス、布がめくれる clip-path、パールの粒
   どれかが失敗しても内容は表示される（index.html のフェイルセーフ参照）
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mqReduce.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData;
  var isSmall = function () { return window.innerWidth <= 860; };

  var PRODUCTS = window.AJ_PRODUCTS || [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var CREEMA = 'https://www.creema.jp/c/and_aj_pawpads';
  var BASE_PATH = '../../';

  function yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = $('#nav'), btn = $('#navMenu');
    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 80); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    $$('#navLinks a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---------- Collection (products.js) ---------- */
  // マーチンゲール首輪とリードはおそろいで選ぶことが多いので 1 ブロックにまとめる
  var CAT_ORDER = [['martingale', 'lead'], ['memorial'], ['chouchou'], ['ribbon']];
  var CAT_LIMIT = { chouchou: 8 };

  function cardHTML(p) {
    var tag = p.color ? '<span class="card__tag">' + esc(p.color) + '</span>' : '';
    return '<a class="card rv" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
      '<div class="tilt" data-tilt><div class="tilt__inner">' + tag +
      '<img src="' + BASE_PATH + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800" />' +
      '<span class="tilt__glare" aria-hidden="true"></span></div></div>' +
      '<div class="card__body"><span class="card__name">' + esc(p.name) + '</span>' +
      '<span class="card__meta"><span class="card__price">' + yen(p.price) + '</span><span class="card__go">Creema ↗</span></span></div></a>';
  }

  function renderCollection() {
    var box = $('#cats');
    if (!box || !PRODUCTS.length) return;
    var html = '';
    CAT_ORDER.forEach(function (keys) {
      var key = keys[0];
      var items = PRODUCTS.filter(function (p) { return keys.indexOf(p.category) > -1; })
        .sort(function (a, b) { return keys.indexOf(a.category) - keys.indexOf(b.category); });
      if (!items.length) return;
      var cs = keys.map(function (k) { return CATS[k] || { ja: k, en: '', desc: '' }; });
      var c = {
        ja: cs.map(function (x) { return x.ja; }).join('・'),
        en: cs.map(function (x) { return x.en; }).join(' & '),
        desc: cs.map(function (x) { return x.desc; }).join(' ')
      };
      var prices = items.map(function (p) { return p.price; });
      var lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
      var range = lo === hi ? yen(lo) : yen(lo) + '〜' + yen(hi);
      var limit = CAT_LIMIT[key] || 999;
      html += '<section class="cat" id="cat-' + key + '" aria-labelledby="cat-' + key + '-h">' +
        '<header class="cat__head rv"><p class="cat__en">' + esc(c.en) + ' — ' + range + '</p>' +
        '<h3 class="cat__ja" id="cat-' + key + '-h">' + esc(c.ja) + '</h3>' +
        '<p class="cat__desc">' + esc(c.desc) + '</p>' +
        (key === 'martingale' ? '<p class="cat__origin">このサイトのジャカード柄は、マーチンゲール首輪のオリエンタル柄リボンから生まれました。</p>' : '') +
        '</header><div class="grid">';
      items.forEach(function (p, i) {
        var h = cardHTML(p);
        if (i >= limit) h = h.replace('class="card rv"', 'class="card rv is-hidden"');
        html += h;
      });
      html += '</div>';
      if (items.length > limit) {
        html += '<div class="more"><button type="button" data-more="' + key + '" aria-expanded="false">すべて見る（' + items.length + '点）</button></div>';
      }
      html += '</section>';
    });
    box.innerHTML = html;
    $$('[data-more]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var sec = b.closest('.cat');
        $$('.card.is-hidden', sec).forEach(function (c) { c.classList.remove('is-hidden'); c.classList.add('is-in'); });
        b.parentNode.remove();
      });
    });
    var live = $('#statLive');
    if (live) { live.textContent = PRODUCTS.length; live.setAttribute('data-count', PRODUCTS.length); }
  }

  /* ---------- Gallery (archive) ---------- */
  var galCols = 0;
  function renderGallery() {
    var box = $('#gal');
    if (!box || !ARCHIVE.length) return;
    var n = isSmall() ? 2 : 3;
    if (n === galCols) return;
    galCols = n;
    var cols = [];
    var depths = n === 3 ? [0.05, -0.09, 0.12] : [0.03, -0.05];
    for (var i = 0; i < n; i++) cols.push('');
    ARCHIVE.forEach(function (a, i) {
      var tall = (i % 3 === 1) ? ' tall' : '';
      cols[i % n] += '<figure class="gal__item rv' + tall + '"><img src="' + BASE_PATH + esc(a.img) + '" alt="' + esc(a.name) + '" loading="lazy" width="800" height="800" /><figcaption>' + esc(a.name) + '</figcaption></figure>';
    });
    box.innerHTML = cols.map(function (c, i) {
      return '<div class="gal__col" data-depth="' + (reduced ? 0 : depths[i]) + '">' + c + '</div>';
    }).join('');
    observeReveal(box);
    collectParallax();
  }

  /* ---------- Reveal ---------- */
  var io = null;
  function observeReveal(scope) {
    var els = $$('.rv:not(.is-in)', scope);
    if (!io || reduced) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    els.forEach(function (e) { io.observe(e); });
  }
  function initReveal() {
    if ('IntersectionObserver' in window && !reduced) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    observeReveal(document);
  }

  /* ---------- Count up ---------- */
  function initCounts() {
    var els = $$('.stats b');
    if (reduced || !('IntersectionObserver' in window)) return;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, to = +(el.getAttribute('data-count') || el.textContent), t0 = performance.now();
        (function step(t) {
          var k = clamp((t - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * e);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (e) { cio.observe(e); });
  }

  /* ---------- Tilt cards ---------- */
  function initTilt() {
    if (!finePointer || reduced) return;
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('[data-tilt]');
      if (!t) return;
      var r = t.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      var max = t.classList.contains('tilt--round') ? 10 : 9;
      t.classList.add('is-tilting');
      t.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
      t.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
      t.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      t.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      t.style.setProperty('--sweep', (px * 60).toFixed(1));
      t.style.setProperty('--glare', '.85');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest && e.target.closest('[data-tilt]');
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      t.classList.remove('is-tilting');
      ['--rx', '--ry', '--glare'].forEach(function (p) { t.style.removeProperty(p); });
    });
  }

  /* ---------- Café mat 3D carousel ---------- */
  var SWATCH = { 'パープル': '#c9b6e4', 'ミルキーピンク': '#f3d3d6', 'ホワイト': '#f7f4ee', 'ルージュピンク': '#e9686f' };
  function initCarousel() {
    var car = $('#matCarousel'), ring = $('#matRing');
    if (!car || !ring) return;
    var items = $$('.mat', ring);
    var N = items.length; if (!N) return;
    var byId = {};
    PRODUCTS.forEach(function (p) { byId[p.id] = p; });
    var data = items.map(function (el) {
      var p = byId[el.getAttribute('data-id')] || {};
      return { el: el, color: p.color || el.textContent.trim(), price: p.price || 5300, url: p.url || el.href };
    });
    var matCat = CATS.mat;
    if (matCat && matCat.desc) {
      var parts = matCat.desc.split('。');
      $('#matSize').textContent = parts.slice(1).join('。');
    }

    var sw = $('#matSwatches');
    data.forEach(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch';
      b.style.setProperty('--sw', SWATCH[d.color] || '#fff');
      b.setAttribute('aria-label', d.color + '（' + yen(d.price) + '）');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { goTo(i); pause(8000); });
      sw.appendChild(b);
      d.sw = b;
    });

    var step = 360 / N, rot = 0, tgt = 0, current = -1;
    var W = 0, mat = 300, rx = 200, rz = 300;
    car.classList.add('is-3d');

    function layout() {
      W = ring.clientWidth;
      mat = Math.round(clamp(W * 0.5, 160, 320));
      ring.style.setProperty('--mat', mat + 'px');
      rx = (W - mat * 0.72) / 2;
      rz = mat * 0.9;
    }
    function apply() {
      for (var i = 0; i < N; i++) {
        var a = (i * step - rot) * Math.PI / 180;
        var c = Math.cos(a), s = Math.sin(a);
        var x = s * rx, z = (c - 1) * rz;
        var depth = (c + 1) / 2;
        var el = data[i].el;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + (-(1 - depth) * 18).toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + (a * 180 / Math.PI * 0.45).toFixed(1) + 'deg) rotateX(' + ((1 - depth) * 8).toFixed(1) + 'deg)';
        el.style.opacity = (0.28 + 0.72 * depth).toFixed(3);
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.filter = depth > 0.95 ? '' : 'saturate(' + (0.6 + 0.4 * depth).toFixed(2) + ') brightness(' + (0.72 + 0.28 * depth).toFixed(2) + ')';
      }
      var idx = ((Math.round(rot / step) % N) + N) % N;
      if (idx !== current) select(idx);
    }
    function select(idx) {
      current = idx;
      var d = data[idx];
      $('#matColor').textContent = d.color;
      $('#matPrice').textContent = yen(d.price);
      var link = $('#matLink');
      link.href = d.url;
      link.innerHTML = d.color + 'を Creema で見る <span aria-hidden="true">↗</span>';
      data.forEach(function (o, i) {
        o.sw.setAttribute('aria-pressed', String(i === idx));
        o.el.setAttribute('tabindex', i === idx ? '0' : '-1');
        o.el.setAttribute('aria-hidden', String(i !== idx));
      });
    }
    function goTo(i) {
      // 最短方向で回す
      var base = Math.round(tgt / step);
      var curIdx = ((base % N) + N) % N;
      var diff = i - curIdx;
      if (diff > N / 2) diff -= N;
      if (diff < -N / 2) diff += N;
      tgt = (base + diff) * step;
      kick();
    }

    var pausedUntil = 0, hovering = false, inView = false, raf = 0, last = 0, lastAuto = performance.now();
    function pause(ms) { pausedUntil = performance.now() + ms; }
    function frame(t) {
      raf = 0;
      var dt = Math.min(64, t - (last || t)); last = t;
      if (!reduced && !hovering && !dragging && t > pausedUntil && inView && t - lastAuto > 4200) {
        tgt = Math.round(tgt / step) * step + step; lastAuto = t;
      }
      var k = reduced ? 1 : 1 - Math.pow(1 - 0.085, dt / 16.7);
      rot += (tgt - rot) * k;
      if (Math.abs(tgt - rot) < 0.01) rot = tgt;
      apply();
      if (inView || Math.abs(tgt - rot) > 0.01) kick();
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    // drag
    var dragging = false, sx = 0, srot = 0, moved = 0;
    ring.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = 0; sx = e.clientX; srot = tgt;
      car.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { tgt = srot - dx * (180 / Math.max(W, 300)); rot = tgt; kick(); }
    }, { passive: true });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false; car.classList.remove('is-drag');
      tgt = Math.round(tgt / step) * step; pause(8000); lastAuto = performance.now(); kick();
    });
    data.forEach(function (d, i) {
      d.el.addEventListener('click', function (e) {
        if (moved > 6) { e.preventDefault(); moved = 0; return; }
        if (i !== current) { e.preventDefault(); goTo(i); pause(8000); }
      });
      d.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
    $('#matPrev').addEventListener('click', function () { tgt = Math.round(tgt / step) * step - step; pause(8000); kick(); });
    $('#matNext').addEventListener('click', function () { tgt = Math.round(tgt / step) * step + step; pause(8000); kick(); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { tgt = Math.round(tgt / step) * step - step; pause(8000); kick(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { tgt = Math.round(tgt / step) * step + step; pause(8000); kick(); e.preventDefault(); }
    });
    var stage = $('#matStage');
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
    stage.addEventListener('pointerleave', function () { hovering = false; lastAuto = performance.now(); });
    stage.addEventListener('focusin', function () { hovering = true; });
    stage.addEventListener('focusout', function () { hovering = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView) { lastAuto = performance.now(); kick(); } }, { threshold: 0.25 }).observe(car);
    }
    window.addEventListener('resize', function () { layout(); apply(); });
    layout(); apply();
  }

  /* ---------- Parallax / edge ribbon / fold ---------- */
  var pxEls = [];
  function collectParallax() {
    pxEls = reduced ? [] : $$('[data-depth]').map(function (el) { return { el: el, d: parseFloat(el.getAttribute('data-depth')) || 0 }; });
    requestScroll();
  }
  var folds = [];
  function initFolds() {
    if (reduced || !window.CSS || !CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%)')) return;
    folds = $$('.fold').map(function (sec) {
      var edge = document.createElement('div');
      edge.className = 'fold__edge'; edge.setAttribute('aria-hidden', 'true');
      sec.insertBefore(edge, sec.firstChild);
      return { sec: sec, edge: edge, done: false };
    });
  }
  var ticking = false;
  function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } }
  function onScrollFrame() {
    ticking = false;
    var vh = window.innerHeight, sy = window.scrollY;
    if (!reduced) root.style.setProperty('--rib-y', (sy * 0.45).toFixed(1) + 'px');
    // read
    var reads = pxEls.map(function (o) {
      var r = o.el.getBoundingClientRect();
      return (r.bottom < -200 || r.top > vh + 200) ? null : (r.top + r.height / 2 - vh / 2);
    });
    // write
    pxEls.forEach(function (o, i) {
      if (reads[i] === null) return;
      o.el.style.setProperty('--py', (reads[i] * -o.d).toFixed(1) + 'px');
    });
    folds.forEach(function (f) {
      var top = f.sec.getBoundingClientRect().top;
      var p = clamp((vh - top) / (vh * 0.8), 0, 1);
      if (p >= 1) {
        if (f.sec.style.clipPath) { f.sec.style.clipPath = ''; f.sec.classList.remove('is-folding'); }
        return;
      }
      var w = f.sec.clientWidth;
      var L = p * vh * 1.25;           // 左側が先にめくれる
      var R = Math.max(0, L - vh * 0.4);
      f.sec.style.clipPath = 'polygon(0 0, 100% 0, 100% ' + R.toFixed(0) + 'px, 0 ' + L.toFixed(0) + 'px)';
      f.sec.classList.toggle('is-folding', p > 0);
      var ang = Math.atan2(R - L, w * 1.2) * 180 / Math.PI;
      f.edge.style.transform = 'translateY(' + ((L + R) / 2 - 120).toFixed(0) + 'px) rotate(' + ang.toFixed(2) + 'deg)';
    });
    // buy button
    var buy = $('#buy');
    if (buy) buy.classList.toggle('is-on', sy > vh * 0.7 && (document.body.scrollHeight - sy - vh) > 160);
  }

  /* ---------- Pearls (canvas) ---------- */
  function initPearls() {
    var cv = $('#pearls');
    if (!cv || reduced || saveData) { if (cv) cv.style.display = 'none'; return; }
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W, H, parts = [];
    function sprite(inner, outer, size) {
      var c = document.createElement('canvas'); c.width = c.height = size;
      var g = c.getContext('2d'), r = size / 2;
      var grd = g.createRadialGradient(r * 0.75, r * 0.7, 0, r, r, r);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.25, inner);
      grd.addColorStop(0.55, outer);
      grd.addColorStop(1, 'rgba(255,250,241,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
      return c;
    }
    var pearl = sprite('rgba(255,250,241,.95)', 'rgba(230,222,210,.35)', 64);
    var gold = sprite('rgba(240,214,160,.95)', 'rgba(217,185,121,.3)', 64);
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = W < 700 ? 9 : 16;
      while (parts.length < n) parts.push(spawn(true));
      parts.length = n;
    }
    function spawn(any) {
      return {
        x: Math.random() * W, y: any ? Math.random() * H : H + 20,
        r: 2 + Math.random() * 4.5, vy: 6 + Math.random() * 12, sway: 10 + Math.random() * 24,
        ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.45, g: Math.random() < 0.25
      };
    }
    var raf = 0, last = 0, lastSy = window.scrollY, drift = 0;
    function frame(t) {
      raf = 0;
      var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      var sy = window.scrollY; drift = (sy - lastSy) * 0.25; lastSy = sy;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy * dt + drift * (p.r / 6);
        p.ph += dt * 0.6;
        if (p.y < -20 || p.y > H + 40) { parts[i] = spawn(false); if (drift < 0) parts[i].y = -10; continue; }
        var x = p.x + Math.sin(p.ph) * p.sway;
        ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(p.ph * 2.3));
        var s = p.r * 2;
        ctx.drawImage(p.g ? gold : pearl, x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !raf) { last = 0; raf = requestAnimationFrame(frame); } });
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Hero: Three.js cloth ---------- */
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  function loadScript(src, timeout) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      var timer = setTimeout(function () { rej(new Error('timeout')); }, timeout || 10000);
      s.src = src; s.async = true;
      s.onload = function () { clearTimeout(timer); res(); };
      s.onerror = function () { clearTimeout(timer); rej(new Error('load error')); };
      document.head.appendChild(s);
    });
  }
  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // 既存サイトのジャカード柄（SVG パス）をそのまま canvas に描く
  var MOTIF = [
    'M90 14 C104 30 104 48 90 64 C76 48 76 30 90 14Z',
    'M90 166 C104 150 104 132 90 116 C76 132 76 150 90 166Z',
    'M14 90 C30 76 48 76 64 90 C48 104 30 104 14 90Z',
    'M166 90 C150 76 132 76 116 90 C132 104 150 104 166 90Z',
    'M90 58 C112 70 126 78 138 90 C126 102 112 110 90 122 C68 110 54 102 42 90 C54 78 68 70 90 58Z',
    'M56 56 C70 64 80 74 90 90 C100 74 110 64 124 56',
    'M56 124 C70 116 80 106 90 90 C100 106 110 116 124 124'
  ];
  function drawMotif(g, x, y, s, stroke, lw, dot) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = stroke; g.lineWidth = lw / s; g.lineCap = 'round'; g.lineJoin = 'round';
    MOTIF.forEach(function (d) { g.stroke(new Path2D(d)); });
    g.fillStyle = dot;
    [[90, 90, 7], [90, 14, 3], [90, 166, 3], [14, 90, 3], [166, 90, 3]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.283); g.fill(); });
    g.restore();
  }
  function clothCanvas(size) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var g = c.getContext('2d');
    g.fillStyle = '#7faba9'; g.fillRect(0, 0, size, size);
    // 織り目
    for (var i = 0; i < size; i += 3) {
      g.fillStyle = 'rgba(255,250,241,' + (i % 6 ? .035 : .06) + ')'; g.fillRect(0, i, size, 1);
      g.fillStyle = 'rgba(38,72,74,' + (i % 6 ? .03 : .05) + ')'; g.fillRect(i, 0, 1, size);
    }
    var t = size / 2, s = t / 180;
    for (var yy = 0; yy < 2; yy++) for (var xx = 0; xx < 2; xx++) {
      drawMotif(g, xx * t, yy * t, s, 'rgba(255,250,241,.5)', size / 200, 'rgba(240,220,170,.55)');
    }
    return c;
  }
  function ribbonCanvas() {
    var w = 128, h = 256;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, '#5f8f8c'); grd.addColorStop(.5, '#8bb8b6'); grd.addColorStop(1, '#5f8f8c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (var x = 0; x < w; x += 11) { g.fillStyle = 'rgba(255,250,241,.18)'; g.fillRect(x, 0, 2, h); g.fillStyle = 'rgba(53,97,95,.25)'; g.fillRect(x + 6, 0, 2, h); }
    for (var y = 0; y < h; y += 9) { g.fillStyle = 'rgba(255,250,241,.12)'; g.fillRect(0, y, w, 1); }
    drawMotif(g, 14, 14, 100 / 180, 'rgba(255,250,241,.85)', 2, 'rgba(240,214,160,.9)');
    drawMotif(g, 14, 142, 100 / 180, 'rgba(255,250,241,.85)', 2, 'rgba(240,214,160,.9)');
    // 金の耳（両端）
    g.fillStyle = '#d9b979'; g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
    g.fillStyle = 'rgba(255,250,241,.6)'; g.fillRect(8, 0, 2, h); g.fillRect(w - 10, 0, 2, h);
    return c;
  }

  var CLOTH_VS = [
    'uniform float uTime;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vView;',
    'float h(vec2 p){',
    '  return sin(p.x*0.55 + uTime*0.42)*0.34',
    '       + sin(p.y*0.75 + p.x*0.22 + uTime*0.31)*0.26',
    '       + sin((p.x*0.95 - p.y*0.6) + uTime*0.6)*0.08;',
    '}',
    'void main(){',
    '  vUv = uv; vec3 p = position; float e = 0.06;',
    '  float z = h(p.xy);',
    '  float zx = h(p.xy + vec2(e,0.0)); float zy = h(p.xy + vec2(0.0,e));',
    '  vec3 n = normalize(vec3(-(zx-z)/e, -(zy-z)/e, 1.0));',
    '  p.z += z;',
    '  vN = normalize(normalMatrix * n);',
    '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
    '  vView = mv.xyz;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var SHADE_FS = [
    'precision mediump float;',
    'uniform sampler2D uTex; uniform vec2 uRepeat; uniform vec3 uLight; uniform float uSpec; uniform float uFog;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vView;',
    'void main(){',
    '  vec3 tex = texture2D(uTex, vUv * uRepeat).rgb;',
    '  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;',
    '  vec3 L = normalize(uLight); vec3 V = normalize(-vView);',
    '  float diff = clamp(dot(n, L), 0.0, 1.0);',
    '  vec3 H = normalize(L + V);',
    '  float spec = pow(max(dot(n, H), 0.0), 36.0) * uSpec;',
    '  float sheen = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.22;',
    '  vec3 col = tex * (0.5 + 0.62 * diff) + vec3(1.0, 0.96, 0.88) * spec + vec3(0.62, 0.78, 0.77) * sheen;',
    '  if(!gl_FrontFacing) col *= 0.78;',
    '  float fog = smoothstep(9.0, 22.0, -vView.z) * uFog;',
    '  col = mix(col, vec3(0.19, 0.36, 0.355), fog);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');
  var RIBBON_VS = [
    'uniform float uTime; uniform float uPhase;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vView;',
    'void main(){',
    '  vUv = uv; vec3 p = position; float y = p.y; float t = uTime + uPhase;',
    '  float tw = sin(y*0.32 + t*0.55)*1.0 + y*0.06;',
    '  float c = cos(tw), s = sin(tw);',
    '  vec3 q = vec3(p.x*c, y, p.x*s);',
    '  q.x += sin(y*0.28 + t*0.45)*0.55;',
    '  q.z += sin(y*0.42 + t*0.62)*0.45;',
    '  vN = normalize(normalMatrix * vec3(-s, 0.0, c));',
    '  vec4 mv = modelViewMatrix * vec4(q,1.0);',
    '  vView = mv.xyz;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  function initHeroGL() {
    var hero = $('.hero'), canvas = $('#heroGL');
    if (!hero || !canvas) return;
    root.setAttribute('data-hero', 'static');
    if (reduced || saveData || !webglAvailable()) return;

    var go = function () {
      loadScript(THREE_URL, 10000).then(function () {
        if (!window.THREE) return;
        try { startGL(hero, canvas); } catch (e) { fallback(hero, e); }
      }).catch(function () { /* CDN 失敗 → CSS の静的ジャカードのまま */ });
    };
    // 省電力: バッテリー残量が少なく充電していないときは静的背景
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        if (!b.charging && b.level <= 0.2) return;
        go();
      }).catch(go);
    } else go();
  }
  function fallback(hero, err) {
    hero.classList.remove('gl-on');
    root.setAttribute('data-hero', 'static');
    if (err && window.console) console.warn('[hero] WebGL fallback:', err.message || err);
  }

  function startGL(hero, canvas) {
    var THREE = window.THREE;
    var small = isSmall();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: false, powerPreference: 'low-power' });
    var baseDpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
    var dpr = baseDpr;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x35615f, 1);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0, 0, 9);

    var maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
    var clothTex = new THREE.CanvasTexture(clothCanvas(small ? 256 : 512));
    clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping;
    clothTex.anisotropy = Math.min(4, maxAniso);
    var ribTex = new THREE.CanvasTexture(ribbonCanvas());
    ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping;
    ribTex.anisotropy = Math.min(4, maxAniso);

    var uniforms = { uTime: { value: 0 } };
    var group = new THREE.Group();
    scene.add(group);

    // 布（波打つ平面）
    var segX = small ? 36 : 84, segY = small ? 28 : 60;
    var clothGeo = new THREE.PlaneGeometry(24, 18, segX, segY);
    var clothMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: uniforms.uTime, uTex: { value: clothTex }, uRepeat: { value: new THREE.Vector2(9, 6.75) },
        uLight: { value: new THREE.Vector3(-0.45, 0.65, 0.75) }, uSpec: { value: 0.28 }, uFog: { value: 0.8 }
      },
      vertexShader: CLOTH_VS, fragmentShader: SHADE_FS
    });
    var cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.rotation.x = -0.42;
    cloth.position.set(0, 0.4, -2.2);
    group.add(cloth);

    // 風に揺れるジャカードリボン
    var ribbons = [];
    var ribDefs = small
      ? [{ x: 1.45, z: 1.2, rz: 0.22, ph: 0 }]
      : [{ x: 2.6, z: 1.1, rz: 0.36, ph: 0 }, { x: 4.4, z: -0.4, rz: 0.16, ph: 2.3 }, { x: -4.6, z: -0.8, rz: -0.28, ph: 4.1 }];
    ribDefs.forEach(function (d) {
      var geo = new THREE.PlaneGeometry(0.62, 16, 1, small ? 50 : 110);
      var mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: uniforms.uTime, uPhase: { value: d.ph }, uTex: { value: ribTex }, uRepeat: { value: new THREE.Vector2(1, 16 / 0.62 / 2) },
          uLight: { value: new THREE.Vector3(-0.35, 0.55, 0.8) }, uSpec: { value: 0.55 }, uFog: { value: 0.5 }
        },
        vertexShader: RIBBON_VS, fragmentShader: SHADE_FS, side: THREE.DoubleSide
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(d.x, 0, d.z);
      m.rotation.z = d.rz;
      m.userData.base = d;
      group.add(m);
      ribbons.push(m);
    });

    function resize() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      var narrow = camera.aspect < 0.9;
      ribbons.forEach(function (m) {
        var d = m.userData.base;
        m.position.x = narrow ? d.x * 0.6 : d.x * Math.min(1.25, camera.aspect / 1.6);
      });
      var s = Math.max(1, (camera.aspect / 1.6) * 1.05);
      cloth.scale.set(s, Math.max(1, 1 / camera.aspect * 0.9), 1);
    }
    window.addEventListener('resize', resize);
    resize();

    // 視点（マウス / ジャイロ）
    var aim = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      aim.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      aim.x = clamp(e.gamma / 30, -1, 1);
      aim.y = clamp((e.beta - 45) / 30, -1, 1);
    }, { passive: true });

    // 画面外・タブ非表示では止める
    var visible = true, running = false, raf = 0, t0 = performance.now(), last = 0, time = 0;
    var perf = { n: 0, sum: 0, checked: 0 };
    function loop(now) {
      raf = 0;
      if (!running) return;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      time += dt;
      uniforms.uTime.value = time;
      cam.x += (aim.x * 0.55 - cam.x) * 0.04;
      cam.y += (-aim.y * 0.32 - cam.y) * 0.04;
      var sp = clamp(window.scrollY / Math.max(1, hero.clientHeight), 0, 1);
      camera.position.set(cam.x, cam.y - sp * 0.6, 9 - sp * 1.2);
      camera.lookAt(0, -sp * 0.4, 0);
      renderer.render(scene, camera);

      // 重い端末では解像度を下げ、それでも重ければ静的背景へ
      if (perf.checked < 2) {
        perf.n++; perf.sum += dt;
        if (perf.n >= 90) {
          var avg = perf.sum / perf.n;
          perf.n = 0; perf.sum = 0; perf.checked++;
          if (avg > 0.045) {
            if (perf.checked === 1 && dpr > 0.6) { dpr = Math.max(0.6, dpr * 0.6); renderer.setPixelRatio(dpr); resize(); }
            else { stop(); fallback(hero, new Error('low fps')); dispose(); return; }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    function update() { (visible && !document.hidden) ? start() : stop(); }
    function dispose() {
      window.removeEventListener('resize', resize);
      clothGeo.dispose(); clothMat.dispose(); clothTex.dispose(); ribTex.dispose();
      ribbons.forEach(function (m) { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose();
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', update);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); fallback(hero, new Error('context lost')); });

    // 最初のフレームを描いてからフェードイン
    renderer.render(scene, camera);
    hero.classList.add('gl-on');
    root.setAttribute('data-hero', 'webgl');
    update();
  }

  /* ---------- Boot ---------- */
  function boot() {
    try { initNav(); } catch (e) { console.error(e); }
    try { renderCollection(); } catch (e) { console.error(e); }
    try { initReveal(); } catch (e) { console.error(e); }
    try { renderGallery(); } catch (e) { console.error(e); }
    try { initCounts(); } catch (e) { console.error(e); }
    try { initTilt(); } catch (e) { console.error(e); }
    try { initCarousel(); } catch (e) { console.error(e); }
    try { initFolds(); collectParallax(); } catch (e) { console.error(e); }
    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', function () { renderGallery(); requestScroll(); });
    root.classList.add('motion-ready');
    // ヒーロー最初の要素は即表示
    $$('.hero .rv').forEach(function (e) { e.classList.add('is-in'); });
    try { initPearls(); } catch (e) { console.error(e); }
    try { initHeroGL(); } catch (e) { console.error(e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
