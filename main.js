// ---- Floor plans (prototype: Component 1 variants) -------------------------
// 1 BHK / 2 BHK tabs, each with a "Floor Plan" and a "Unit Plan" view.
const PLANS = {
  '1': { floor: 'assets/floor-plan-1bhk.png', unit: 'assets/floor-plan-1bhk-unit.png' },
  '2': { floor: 'assets/floor-plan-2bhk.png', unit: 'assets/floor-plan-2bhk-unit.png' },
};
const plan = { bhk: '1', view: 'floor' };
const tabs = document.querySelectorAll('.plans__tabs [data-bhk]');
const img = document.getElementById('plan-img');
const items = document.querySelectorAll('.plans__item');

function renderPlan() {
  tabs.forEach((t) => {
    const on = t.dataset.bhk === plan.bhk;
    t.setAttribute('aria-selected', on);
    t.classList.toggle('btn--orange', on);
    t.classList.toggle('btn--outline', !on);
  });
  const label = (v) => `${plan.bhk} BHK ${v === 'floor' ? 'Floor' : 'Unit'} Plan`;
  items.forEach((b) => {
    b.textContent = label(b.dataset.view);
    b.classList.toggle('is-active', b.dataset.view === plan.view);
  });
  img.src = PLANS[plan.bhk][plan.view];
  img.alt = label(plan.view);
  img.removeAttribute('height');
}
tabs.forEach((t) => t.addEventListener('click', () => { plan.bhk = t.dataset.bhk; plan.view = 'floor'; renderPlan(); }));
items.forEach((b) => b.addEventListener('click', () => { plan.view = b.dataset.view; renderPlan(); }));

// ---- Connectivity accordion: one open at a time ----------------------------
const acc = document.querySelectorAll('.acc details');
acc.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) acc.forEach((o) => { if (o !== d) o.open = false; });
}));

// ---- Modals (prototype: Book a Site Visit / Download Brochure) -------------
// There is no backend yet, so a valid submit opens the visitor's mail client with the
// details addressed to the sales inbox from the footer. Swap SALES_EMAIL / submit() for a
// real endpoint when one exists.
const SALES_EMAIL = 'sales@shivalikventures.com';
const dialogs = { visit: document.getElementById('modal-visit'), brochure: document.getElementById('modal-brochure') };

document.querySelectorAll('[data-modal]').forEach((btn) =>
  btn.addEventListener('click', () => dialogs[btn.dataset.modal].showModal()));

Object.values(dialogs).forEach((dlg) => {
  // click on the backdrop or the × closes (prototype: click the overlay returns to the page)
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form));
    const subject = form.dataset.kind === 'brochure' ? 'Brochure request - Gulmohar Avenue' : 'Site visit request - Gulmohar Avenue';
    const body = `Name: ${d.name}\nMobile: ${d.mobile}\nEmail: ${d.email || '-'}\nConfiguration: ${d.configuration}`;
    window.location.href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.reset();
    dlg.close();
  });
});

// ---- Hero scene: pinned, scroll-scrubbed parallax ---------------------------
// The scene is 300+ viewport heights tall with a sticky stage inside. Scroll progress p (0 to 1)
// drives every layer directly (no CSS transitions), so it scrubs both ways like the Figma
// Smart Animate reference: sky, ghost wordmark, building cutout and copy move at different
// speeds, a navy curtain rises, then the "Gulmohar Avenue" heading and price card take over.
(() => {
  const scene = document.querySelector('.scene');
  const nav = document.querySelector('.nav');
  if (!scene) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (k) => scene.querySelector(`[data-layer="${k}"]`);
  const L = Object.fromEntries(['sky','ghost','building','copy1','bar','curtain','copy2','chapter','head','card','cardinner','cardicon','cue']
    .map((k) => [k, $(k)]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);                // easeOutCubic
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));         // 0 to 1 between a and b
  let vh = innerHeight, vw = innerWidth, top = 0, span = 1, queued = false, mx = 0, my = 0;

  const measure = () => {
    vh = innerHeight; vw = innerWidth;
    top = scene.getBoundingClientRect().top + scrollY;
    span = Math.max(1, scene.offsetHeight - vh);
  };
  const set = (el, y = 0, s = 1, o = 1, x = 0) => {
    if (!el) return;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    el.style.opacity = o.toFixed(3);
  };
  const mobile = () => vw <= 1100;

  const render = () => {
    queued = false;
    const y = scrollY;
    nav?.classList.toggle('is-over-hero', y < top + span + vh - 100);
    if (reduce) return;
    const p = clamp((y - top) / span);
    const a = ease(seg(p, 0, 0.55));          // phase 1: parallax + curtain
    const c = ease(seg(p, 0.08, 0.52));       // curtain rise
    const b = seg(p, 0.40, 0.95);             // phase 2: heading + card
    const m = mobile();

    set(L.sky,      -a * 0.07 * vh,  1 + a * 0.10, 1, mx * -6);
    set(L.ghost,    -a * (m ? 0.30 : 0.55) * vh, 1 + a * 0.05, 1 - seg(a, 0.35, 0.95), mx * 14);
    set(L.building, -a * (m ? 0.16 : 0.22) * vh, 1 + a * 0.07, 1 - seg(p, 0.82, 1) * 0.35, mx * 8);
    set(L.copy1,    -a * 0.30 * vh, 1, 1 - seg(a, 0.05, 0.55));
    set(L.bar,       a * 0.10 * vh, 1, 1 - seg(a, 0.0, 0.45));
    set(L.cue,       0, 1, 1 - seg(p, 0, 0.08));
    // curtain slides up from below the fold
    const ch = L.curtain.offsetHeight;
    set(L.curtain, (1 - c) * (ch + 120), 1, 1);
    // phase 2
    const hy = (1 - ease(seg(b, 0, 0.45))) * 40;
    set(L.head, hy, 1, ease(seg(b, 0, 0.4)));
    set(L.chapter, (1 - ease(seg(b, 0.2, 0.9))) * 120, 1, ease(seg(b, 0.2, 0.7)), 0);
    // card: small pill that expands to the full price panel
    const g = ease(seg(b, 0.35, 0.85));
    const full = Math.min(780, vw * 0.9);
    const fullH = m ? 236 : 170;
    const card = L.card;
    card.style.width = `${lerp(120, full, g).toFixed(1)}px`;
    card.style.height = `${lerp(44, fullH, g).toFixed(1)}px`;
    card.style.opacity = ease(seg(b, 0.25, 0.5)).toFixed(3);
    L.cardinner.style.opacity = seg(g, 0.55, 1).toFixed(3);
    L.cardicon.style.opacity = (1 - seg(g, 0, 0.35)).toFixed(3);
    L.copy2.style.pointerEvents = b > 0.9 ? 'auto' : 'none';
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };

  measure(); render();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { measure(); queue(); });
  addEventListener('load', () => { measure(); queue(); });
  // gentle pointer-follow depth (desktop only, only while the hero is on screen)
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    scene.addEventListener('pointermove', (e) => { mx = (e.clientX / vw - 0.5) * 2; my = (e.clientY / vh - 0.5) * 2; queue(); });
    scene.addEventListener('pointerleave', () => { mx = my = 0; queue(); });
  }
})();
