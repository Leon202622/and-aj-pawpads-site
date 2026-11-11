/* ==========================================================
   and AJ paw-pads — t1 "Ribbon Story"
   1) 共有データから商品・ギャラリーを描画（GSAP なしでも動く）
   2) GSAP + ScrollTrigger が読めたときだけ「織り上がる物語」の演出
   ========================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var BASE = '../../';
  var PRODUCTS = window.AJ_PRODUCTS || [];
  var CATS = window.AJ_CATEGORIES || {};
  var ARCHIVE = window.AJ_ARCHIVE || [];
  var CREEMA = 'https://www.creema.jp/c/and_aj_pawpads';
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

  /* ---------------------------------------------------------
     Collection（マット → ケープ枠 → 他カテゴリ）
     --------------------------------------------------------- */
  var ORDER = ['mat', 'cape', 'martingale', 'lead', 'memorial', 'chouchou', 'ribbon'];
  var STORY = {
    martingale: 'このサイトを縫うリボンの柄は、この首輪のジャカードリボンから生まれました。'
  };

  function cardHTML(p) {
    var color = p.color ? '<span class="card-color">' + esc(p.color) + '</span>' : '';
    return '<a class="card" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
      '<div class="card-img"><img src="' + BASE + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800"></div>' +
      color + '<p class="card-name">' + esc(p.name) + '</p>' +
      '<p class="card-price">' + yen(p.price) + '<small>税込</small></p></a>';
  }

  function renderCollection() {
    var track = $('#track');
    var cape = $('#cat-cape');
    var chips = $('#chips');
    if (!track || !cape) return;
    var no = 0;
    var afterCape = false;
    ORDER.forEach(function (key) {
      no++;
      var label = 'No. ' + (no < 10 ? '0' : '') + no;
      if (key === 'cape') {
        afterCape = true;
        $('.cat-no', cape).textContent = label;
        addChip(chips, 'cape', 'ケープ（準備中）', true);
        return;
      }
      var cat = CATS[key];
      var items = PRODUCTS.filter(function (p) { return p.category === key; });
      if (!cat || !items.length) { no--; return; }
      var prices = items.map(function (p) { return p.price; });
      var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
      var el = document.createElement('article');
      el.className = 'cat-panel';
      el.id = 'cat-' + key;
      el.setAttribute('data-cat', key);
      el.innerHTML =
        '<header class="cat-head">' +
          '<p class="cat-no">' + label + '</p>' +
          '<h3><span class="en">' + esc(cat.en) + '</span><span class="ja">' + esc(cat.ja) + '</span></h3>' +
          '<p class="cat-desc">' + esc(cat.desc) + '</p>' +
          '<p class="cat-meta">' + items.length + (items.length > 1 ? ' items' : ' item') + ' ・ ' +
            (min === max ? yen(min) : yen(min) + ' – ' + yen(max)) + '</p>' +
          (STORY[key] ? '<p class="cat-story">' + esc(STORY[key]) + '</p>' : '') +
        '</header>' +
        '<div class="cat-grid' + (items.length === 1 ? ' solo' : '') + '">' + items.map(cardHTML).join('') + '</div>';
      if (afterCape) track.appendChild(el); else track.insertBefore(el, cape);
      addChip(chips, key, cat.ja + '（' + items.length + '）', false);
    });
    var stat = $('#statOnSale');
    if (stat && PRODUCTS.length) { stat.textContent = PRODUCTS.length; stat.setAttribute('data-count', PRODUCTS.length); }
  }

  function addChip(wrap, key, text, soon) {
    if (!wrap) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (soon ? ' is-soon' : '');
    b.setAttribute('data-target', 'cat-' + key);
    b.textContent = text;
    wrap.appendChild(b);
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
     Signature（カフェマット 4 色）
     --------------------------------------------------------- */
  var MATS = [
    { en: 'Purple', ja: 'パープル', accent: '#b9a6dc', url: 'https://www.creema.jp/item/21012982/detail' },
    { en: 'Milky Pink', ja: 'ミルキーピンク', accent: '#f0c4bf', url: 'https://www.creema.jp/item/21012971/detail' },
    { en: 'White', ja: 'ホワイト', accent: '#cddcd8', url: 'https://www.creema.jp/item/21012962/detail' },
    { en: 'Rouge Pink', ja: 'ルージュピンク', accent: '#e46f7a', url: 'https://www.creema.jp/item/21012947/detail' }
  ];
  var matIndex = 0;
  var sigST = null;

  function setMat(i) {
    if (i === matIndex) return;
    matIndex = i;
    var m = MATS[i];
    var sig = $('#signature');
    sig.style.setProperty('--accent', m.accent);
    $$('.sig-photos img').forEach(function (img, k) { img.classList.toggle('is-active', k === i); });
    $$('.sw').forEach(function (b, k) {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
    var en = $('#sigEn'), ja = $('#sigJa'), no = $('#sigNo');
    var swap = function () { en.textContent = m.en; ja.textContent = m.ja; no.textContent = '0' + (i + 1); };
    if (hasGsap && !reduce) {
      gsap.timeline()
        .to([en, ja], { yPercent: -40, opacity: 0, duration: .22, ease: 'power2.in', onComplete: swap })
        .fromTo([en, ja], { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out', stagger: .06 });
    } else swap();
    $('#sigLink').href = m.url;
  }

  function bindSignature() {
    $$('.sw').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.getAttribute('data-i'));
        if (sigST && sigST.isActive !== undefined && root.classList.contains('pin-on')) {
          var y = sigST.start + (sigST.end - sigST.start) * (i / 3) + (i === 0 ? 2 : 0);
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        } else setMat(i);
      });
    });
  }

  /* ---------------------------------------------------------
     Nav / menu / sticky buy / 進捗リボン
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

    // カテゴリチップ（ピン留め時は横スクロール位置へ）
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var panel = document.getElementById(b.getAttribute('data-target'));
      if (!panel) return;
      if (colST && root.classList.contains('pin-on')) {
        var gutter = parseFloat(getComputedStyle($('#track')).paddingLeft) || 0;
        var y = colST.start + Math.max(0, Math.min(panel.offsetLeft - gutter, colST.end - colST.start));
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  /* ---------------------------------------------------------
     Motion（GSAP）
     --------------------------------------------------------- */
  var colST = null;

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
    var masks = $$('.bw-m');
    gsap.set(masks, { strokeDashoffset: 1 });
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .15 });
    tl.to(masks[0], { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' })
      .to([masks[1], masks[2]], { strokeDashoffset: 0, duration: .85, ease: 'power2.inOut' }, '-=.1')
      .from('.bw-knot', { scale: 0, rotate: -40, duration: .7, ease: 'back.out(2.2)' }, '-=.35')
      .to([masks[3], masks[4]], { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' }, '-=.45')
      .from('.hero-medal', { scale: .5, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, '-=1.0')
      .from('.hero-eyebrow', { y: 14, opacity: 0, duration: .7 }, '-=.6')
      .from(chars, { yPercent: 115, duration: 1, ease: 'power4.out', stagger: .045 }, '-=.55')
      .from('.hero-catch .ln > span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .14 }, '-=.75')
      .from('.hero-cta > *', { y: 20, opacity: 0, duration: .7, stagger: .1 }, '-=.6')
      .fromTo('.hero-float img', { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.3 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'power3.inOut', stagger: .2 }, .7)
      .from('.hero-float', { opacity: 0, duration: .01 }, .7);
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
    // パララックス
    $$('[data-speed]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-speed')) || .2;
      gsap.to(el, { yPercent: -s * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.to('.hero-loom', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-inner', { y: -70, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
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
    // Instagram のリボン帯
    var mq = $('.insta-marquee');
    if (mq) {
      mq.innerHTML += mq.innerHTML;
      gsap.fromTo(mq, { xPercent: -4 }, { xPercent: -36, ease: 'none', scrollTrigger: { trigger: '.insta', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  function pinnedScenes() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      root.classList.add('pin-on');

      /* --- Signature: 4 色がスクロールで切り替わる --- */
      var sig = $('#signature');
      var ring = $('.sig-ring');
      var prog = $('.sig-progress');
      sigST = ScrollTrigger.create({
        trigger: sig, pin: true, start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 2.4); },
        snap: { snapTo: [0, 1 / 3, 2 / 3, 1], duration: { min: .25, max: .7 }, delay: .12, ease: 'power2.inOut' },
        onUpdate: function (self) {
          setMat(Math.min(3, Math.round(self.progress * 3)));
          gsap.set(ring, { rotate: self.progress * 220 });
          prog.style.setProperty('--p', self.progress.toFixed(3));
        }
      });
      gsap.from('.sig-visual', { scale: .82, rotate: -12, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: sig, start: 'top 75%' } });
      gsap.from('.sig-text > *', { y: 30, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: sig, start: 'top 60%' } });

      /* --- Collection: 横スクロールでカテゴリを巡る --- */
      var col = $('#collection');
      var track = $('#track');
      var bar = $('.hs-bar');
      var chips = $$('.chip');
      var panels = $$('.cat-panel', track);
      var dist = function () { return Math.max(0, track.scrollWidth - root.clientWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: col, pin: true, start: 'top top', scrub: .6, invalidateOnRefresh: true,
          end: function () { return '+=' + dist(); },
          onUpdate: function (self) {
            bar.style.setProperty('--p', self.progress.toFixed(3));
            var x = self.progress * dist() + root.clientWidth * .45;
            var cur = 0;
            panels.forEach(function (p, k) { if (p.offsetLeft <= x) cur = k; });
            chips.forEach(function (c, k) { c.classList.toggle('is-active', k === cur); });
          }
        }
      });
      colST = tween.scrollTrigger;
      // カード写真がスライドインに合わせて寄ってくる
      $$('.card-img img, .cape-ph', track).forEach(function (img) {
        gsap.fromTo(img, { scale: 1.25, opacity: .3 }, {
          scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left 105%', end: 'left 65%', scrub: true }
        });
      });
      $$('.cat-head .en', track).forEach(function (en) {
        gsap.fromTo(en, { x: 80 }, { x: 0, ease: 'none', scrollTrigger: { trigger: en, containerAnimation: tween, start: 'left right', end: 'left 40%', scrub: true } });
      });

      ScrollTrigger.sort();
      return function () {
        root.classList.remove('pin-on');
        sigST = null; colST = null;
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  /* --- ページ全体を縫うリボン --- */
  function threadScene() {
    var svg = $('.thread');
    if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg';
    var layers = ['edge', 'body', 'inner', 'weave', 'gold'];
    svg.innerHTML =
      '<defs><mask id="th-mask" maskUnits="userSpaceOnUse"><path class="thread-mask"/></mask></defs>' +
      '<g mask="url(#th-mask)"><g class="rb">' + layers.map(function (c) { return '<path class="rb-' + c + '"/>'; }).join('') + '</g></g>' +
      '<circle class="thread-pearl" r="6" cx="-50" cy="-50"/>';
    var mask = $('#th-mask', svg), mpath = $('.thread-mask', svg), paths = $$('.rb path', svg), pearl = $('.thread-pearl', svg);
    var samples = [], L = 0, cur = 0, target = 0;

    function build() {
      svg.style.height = '0px';
      var W = root.clientWidth, H = root.scrollHeight, mobile = W < 900;
      svg.style.height = H + 'px';
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      ['x', 'y'].forEach(function (a) { mask.setAttribute(a, 0); });
      mask.setAttribute('width', W); mask.setAttribute('height', H);
      var pts = [];
      $$('[data-thread]').forEach(function (el) {
        var box = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
        var r = box.getBoundingClientRect(), top = r.top + window.scrollY;
        el.getAttribute('data-thread').split(/\s+/).forEach(function (s) {
          var v = s.split('@'), fx = parseFloat(v[0]), fy = parseFloat(v[1]);
          var x = fx * W;
          if (mobile) x = fx < .2 ? 13 : fx > .8 ? W - 13 : x;
          else x = Math.max(40, Math.min(W - 40, x));
          pts.push([x, top + fy * r.height]);
        });
      });
      pts.sort(function (a, b) { return a[1] - b[1]; });
      if (pts.length < 2) return;
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ' C' + [c1x, c1y, c2x, c2y, p2[0], p2[1]].map(function (n) { return n.toFixed(1); }).join(' ');
      }
      mpath.setAttribute('d', d);
      paths.forEach(function (p) { p.setAttribute('d', d); });
      L = mpath.getTotalLength();
      mpath.style.strokeDasharray = L + ' ' + (L + 10);
      samples = [];
      var n = Math.max(200, Math.round(L / 18)), maxY = -Infinity;
      for (var k = 0; k <= n; k++) {
        var l = L * k / n, pt = mpath.getPointAtLength(l);
        maxY = Math.max(maxY, pt.y);
        samples.push({ l: l, x: pt.x, y: maxY, px: pt.y });
      }
      cur = target = lengthAt(tipY());
      render(true);
    }
    function tipY() { return window.scrollY + window.innerHeight * .74; }
    function lengthAt(y) {
      if (!samples.length) return 0;
      if (y <= samples[0].y) return 0;
      var lo = 0, hi = samples.length - 1;
      if (y >= samples[hi].y) return L;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (samples[mid].y < y) lo = mid; else hi = mid; }
      var a = samples[lo], b = samples[hi], t = (y - a.y) / ((b.y - a.y) || 1);
      return a.l + (b.l - a.l) * t;
    }
    function pointAt(l) {
      var i = Math.min(samples.length - 1, Math.round(l / L * (samples.length - 1)));
      return samples[i] || { x: -50, px: -50 };
    }
    function render(force) {
      mpath.style.strokeDashoffset = (L - cur).toFixed(1);
      var p = pointAt(cur);
      pearl.setAttribute('cx', p.x.toFixed(1));
      pearl.setAttribute('cy', p.px.toFixed(1));
      pearl.style.opacity = cur > 4 && cur < L - 4 ? 1 : 0;
    }
    gsap.ticker.add(function () {
      target = lengthAt(tipY());
      var diff = target - cur;
      if (Math.abs(diff) < .4) return;
      cur += diff * .14;
      render();
    });
    ScrollTrigger.addEventListener('refresh', build);
    build();
  }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.remove('js-pending'); // 以降は GSAP が初期状態を管理
    pinnedScenes();
    heroIntro();
    scrollReveals();
    threadScene();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* --------------------------------------------------------- */
  try { renderCollection(); } catch (e) { console.warn(e); }
  try { renderGallery(); } catch (e) { console.warn(e); }
  try { bindSignature(); bindChrome(); } catch (e) { console.warn(e); }

  if (hasGsap && !reduce) {
    try { initMotion(); }
    catch (e) {
      console.warn('motion disabled:', e);
      root.classList.remove('js-pending', 'pin-on');
      if (window.gsap) gsap.globalTimeline.clear();
    }
  } else {
    root.classList.remove('js-pending');
  }
})();
