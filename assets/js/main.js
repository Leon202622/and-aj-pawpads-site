/* and AJ paw-pads — 商品グリッドの描画と動きの演出（ライブラリ不要） */
(function () {
  'use strict';
  var products = window.AJ_PRODUCTS || [];
  var cats = window.AJ_CATEGORIES || {};
  var archive = window.AJ_ARCHIVE || [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function yen(n) { return '¥' + n.toLocaleString('ja-JP'); }

  /* ── 写真マーキー ── */
  var track = document.querySelector('#marquee .marquee-track');
  if (track && products.length) {
    var picks = products.filter(function (p, i) { return p.category !== 'chouchou' || i % 3 === 0; })
      .sort(function (a, b) { return (b.category === 'mat') - (a.category === 'mat'); }).slice(0, 14);
    picks.concat(picks).forEach(function (p) {
      var img = el('img');
      img.src = p.img; img.alt = ''; img.loading = 'lazy'; img.width = 132; img.height = 132;
      track.appendChild(img);
    });
  }

  /* ── 商品グリッド + カテゴリタブ ── */
  var grid = $('productGrid'), tabs = $('filterTabs'), desc = $('filterDesc');
  var order = ['mat', 'memorial', 'martingale', 'lead', 'chouchou', 'ribbon'];
  function render(filter) {
    if (!grid) return;
    grid.textContent = '';
    var list = products.filter(function (p) { return filter === 'all' || p.category === filter; });
    list.sort(function (a, b) { return order.indexOf(a.category) - order.indexOf(b.category); });
    list.forEach(function (p, i) {
      var a = el('a', 'product-card');
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      a.style.setProperty('--i', Math.min(i, 12));
      var ph = el('div', 'product-photo');
      var img = el('img');
      img.src = p.img; img.alt = p.name; img.loading = 'lazy'; img.width = 800; img.height = 800;
      ph.appendChild(img);
      var info = el('div', 'product-info');
      info.appendChild(el('span', 'product-cat', (cats[p.category] || {}).en || ''));
      info.appendChild(el('span', 'product-name', p.name));
      var price = el('span', 'product-price', yen(p.price));
      price.appendChild(el('small', '', '税込'));
      info.appendChild(price);
      a.appendChild(ph); a.appendChild(info);
      grid.appendChild(a);
    });
    if (desc) {
      desc.textContent = filter === 'all'
        ? '現在 Creema で販売中の ' + products.length + ' 作品です。'
        : (cats[filter] || {}).desc || '';
    }
    if (tabs) {
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.filter === filter));
      });
    }
  }
  if (tabs && products.length) {
    [['all', 'すべて']].concat(order.map(function (k) { return [k, (cats[k] || {}).ja || k]; })).forEach(function (t) {
      var n = t[0] === 'all' ? products.length : products.filter(function (p) { return p.category === t[0]; }).length;
      if (!n) return;
      var b = el('button', 'filter-tab', t[1] + '（' + n + '）');
      b.type = 'button'; b.dataset.filter = t[0];
      b.addEventListener('click', function () { render(t[0]); });
      tabs.appendChild(b);
    });
    render('all');
  }
  Array.prototype.forEach.call(document.querySelectorAll('.feature[data-filter]'), function (f) {
    f.addEventListener('click', function (e) {
      e.preventDefault();
      render(f.dataset.filter);
      if (tabs) tabs.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ── 過去作ギャラリー ── */
  var ag = $('archiveGrid');
  if (ag) {
    archive.slice(0, 12).forEach(function (p) {
      var a = el('a', 'gallery-item');
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      var img = el('img');
      img.src = p.img; img.alt = p.name; img.loading = 'lazy'; img.width = 800; img.height = 800;
      a.appendChild(img);
      a.appendChild(el('span', 'gallery-cap', p.name));
      ag.appendChild(a);
    });
  }

  /* ── スクロール進捗リボン / ナビ ── */
  var bar = document.querySelector('.scroll-ribbon span');
  var nav = document.querySelector('.site-nav');
  var buy = document.querySelector('.sticky-buy');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40);
      if (buy) buy.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.8 && window.scrollY < max - 300);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── セクションのスクロール表示 + 数字カウントアップ ── */
  function countUp(b) {
    var to = +b.dataset.count, t0 = null;
    if (reduce || !to) return;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / 1200, 1);
      b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        Array.prototype.forEach.call(en.target.querySelectorAll('[data-count]'), countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(document.querySelectorAll('main section'), function (s) { io.observe(s); });
  }
})();
