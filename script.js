(() => {
  'use strict';

  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cards = Array.from(document.querySelectorAll('.card'));
  const order = cards.map((c) => c.dataset.variant);
  const nameEl = document.getElementById('variant-name');
  const priceEl = document.getElementById('variant-price');
  const spin = document.getElementById('spin');
  const pair = document.getElementById('pair');
  const sizes = Array.from(document.querySelectorAll('.size'));
  const addBtn = document.getElementById('add-btn');
  const cartBtn = document.getElementById('cart-btn');
  const cartCount = document.getElementById('cart-count');
  const toast = document.getElementById('toast');

  let current = body.dataset.variant;
  let busy = false;
  let cart = 0;
  let toastTimer = 0;

  /* ---------- Decorations ---------- */
  const DECOR = [
    { t: 'leaf',    x: 3,  y: 72, s: 64,  l: 'back',  dx: 14,  r: -25, op: 0.55 },
    { t: 'shell',   x: 42, y: 8,  s: 56,  l: 'back',  dx: -12, r: 12,  op: 0.5 },
    { t: 'leaf',    x: 88, y: 46, s: 120, l: 'back',  dx: -18, r: 40,  op: 0.28 },
    { t: 'shell',   x: 20, y: 80, s: 92,  l: 'back',  dx: 16,  r: -20, op: 0.3 },
    { t: 'sparkle', x: 60, y: 22, s: 26,  l: 'back',  dx: 8,   r: 0,   op: 0.9 },
    { t: 'shell',   x: 34, y: 28, s: 96,  l: 'front', dx: 16,  r: -18, op: 0.9 },
    { t: 'leaf',    x: 58, y: 70, s: 120, l: 'front', dx: -14, r: 30,  op: 0.85 },
    { t: 'sparkle', x: 30, y: 62, s: 34,  l: 'front', dx: 10,  r: 8,   op: 1 },
    { t: 'sparkle', x: 74, y: 30, s: 44,  l: 'front', dx: -10, r: -12, op: 1 },
    { t: 'leaf',    x: 46, y: 86, s: 70,  l: 'front', dx: 12,  r: -40, op: 0.8 },
    { t: 'shell',   x: 80, y: 60, s: 66,  l: 'front', dx: -10, r: 24,  op: 0.8 },
  ];

  const layers = {
    back: document.getElementById('decor-back'),
    front: document.getElementById('decor-front'),
  };
  const decorEls = DECOR.map((d, i) => {
    const el = document.createElement('div');
    el.className = 'decor';
    el.style.cssText =
      `left:${d.x}%;top:${d.y}%;--s:${d.s}px;--op:${d.op};--dx:${d.dx}px;--r0:${d.r}deg;` +
      `--dur:${6 + (i % 5) * 1.4}s;--delay:${-i * 0.9}s;`;
    el.innerHTML = `<svg viewBox="0 0 100 100"><use href="#${d.t}"/></svg>`;
    layers[d.l].appendChild(el);
    return el;
  });

  /* ---------- Colorway switching ---------- */
  function applyVariant(key) {
    const card = cards.find((c) => c.dataset.variant === key);
    body.dataset.variant = key;
    nameEl.textContent = card.dataset.name;
    priceEl.textContent = card.dataset.price;
    current = key;
  }

  function markCards(key) {
    cards.forEach((c) => {
      const on = c.dataset.variant === key;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    });
  }

  function selectVariant(key) {
    if (busy || key === current) return;
    markCards(key);

    if (reduced) {
      applyVariant(key);
      return;
    }

    busy = true;
    const anim = spin.animate(
      [
        { transform: 'rotate(0deg) scale(1)', filter: 'blur(0px)' },
        { transform: 'rotate(180deg) scale(0.82)', filter: 'blur(10px)', offset: 0.45 },
        { transform: 'rotate(360deg) scale(1)', filter: 'blur(0px)' },
      ],
      { duration: 1100, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }
    );
    window.setTimeout(() => applyVariant(key), 480);
    anim.onfinish = () => { busy = false; };

    decorEls.forEach((el, i) => {
      el.animate(
        [
          { scale: 1, opacity: 'var(--op)' },
          { scale: 0.1, opacity: 0, offset: 0.4 },
          { scale: 1, opacity: 'var(--op)' },
        ],
        { duration: 1000, delay: i * 25, easing: 'ease-in-out' }
      );
    });
  }

  function step(dir) {
    const next = (order.indexOf(current) + dir + order.length) % order.length;
    selectVariant(order[next]);
  }

  cards.forEach((c) => c.addEventListener('click', () => selectVariant(c.dataset.variant)));
  document.getElementById('prev').addEventListener('click', () => step(-1));
  document.getElementById('next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------- Sizes & cart ---------- */
  sizes.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizes.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  addBtn.addEventListener('click', () => {
    cart += 1;
    cartCount.textContent = String(cart);
    cartBtn.setAttribute('aria-label', `Cart, ${cart} item${cart === 1 ? '' : 's'}`);
    cartBtn.classList.remove('bump');
    void cartBtn.offsetWidth; // restart animation
    cartBtn.classList.add('bump');
    const size = document.querySelector('.size.active').textContent;
    showToast(`Added ${nameEl.textContent}, size ${size}`);
  });

  /* ---------- Pointer parallax ---------- */
  if (!reduced) {
    const mouse = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    });
    window.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; });

    const tick = () => {
      cur.x += (mouse.x - cur.x) * 0.06;
      cur.y += (mouse.y - cur.y) * 0.06;
      pair.style.transform =
        `perspective(1100px) rotateY(${cur.x * 22}deg) rotateX(${-cur.y * 14}deg)`;
      layers.front.style.transform = `translate(${cur.x * 60}px, ${cur.y * 60}px)`;
      layers.back.style.transform = `translate(${cur.x * -28}px, ${cur.y * -28}px)`;
      requestAnimationFrame(tick);
    };
    tick();

    /* ---------- Rising sparkles ---------- */
    const sparkles = document.getElementById('sparkles');
    window.setInterval(() => {
      if (document.hidden) return;
      const el = document.createElement('span');
      el.className = 'sparkle';
      const size = Math.random() * 12 + 8;
      const dur = Math.random() * 6 + 6;
      el.style.cssText =
        `left:${Math.random() * 100}%;--s:${size}px;--d:${dur}s;` +
        `--o:${(Math.random() * 0.4 + 0.25).toFixed(2)};--dx:${(Math.random() - 0.5) * 80}px;`;
      el.innerHTML = '<svg viewBox="0 0 100 100"><use href="#sparkle"/></svg>';
      sparkles.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }, 500);
  }
})();
