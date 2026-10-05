document.documentElement.classList.replace('no-js', 'js');
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SALES_PHONE = '918291969925';
// When a lead API exists, set its URL here: forms will POST JSON to it and show the
// confirmation directly. Left empty, a submission opens WhatsApp with the details
// pre-filled for the visitor to send to the sales number (no backend needed).
const LEAD_ENDPOINT = '';

// Analytics hook: pushes to Google Tag Manager's dataLayer when present, otherwise a no-op.
const track = (event, params = {}) => { (window.dataLayer = window.dataLayer || []).push({ event, ...params }); };
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-cta]');
  if (el) track('cta_click', { cta: el.dataset.cta });
});

// ---- Floor plans: 1/2 BHK x floor/unit views, with price and area --------------
const PLANS = {
  '1': { floor: 'assets/floor-plan-1bhk.png', unit: 'assets/floor-plan-1bhk-unit.png', price: '₹99 Lakh*', area: '322 sq. ft.' },
  '2': { floor: 'assets/floor-plan-2bhk.png', unit: 'assets/floor-plan-2bhk-unit.png', price: '₹1.99 Crore*', area: 'On request' },
};
const plan = { bhk: '1', view: 'floor' };
const tabs = document.querySelectorAll('.plans__tabs [data-bhk]');
const planImg = document.getElementById('plan-img');
const planItems = document.querySelectorAll('.plans__item');
const label = (v) => `${plan.bhk} BHK ${v === 'floor' ? 'Floor' : 'Unit'} Plan`;

function renderPlan() {
  tabs.forEach((t) => {
    const on = t.dataset.bhk === plan.bhk;
    t.setAttribute('aria-selected', on);
    t.classList.toggle('btn--orange', on);
    t.classList.toggle('btn--outline', !on);
  });
  planItems.forEach((b) => {
    b.textContent = label(b.dataset.view);
    b.classList.toggle('is-active', b.dataset.view === plan.view);
  });
  document.getElementById('plan-price').textContent = PLANS[plan.bhk].price;
  document.getElementById('plan-area').textContent = PLANS[plan.bhk].area;
  document.querySelectorAll('[data-plan-cta]').forEach((b) => { b.dataset.cfg = `${plan.bhk} BHK`; });
  const src = PLANS[plan.bhk][plan.view];
  if (planImg.getAttribute('src') === src) return;
  const swap = () => {
    planImg.src = src;
    planImg.alt = label(plan.view);
    planImg.removeAttribute('height');
    planImg.decode?.().catch(() => {}).finally(() => planImg.classList.remove('is-swapping'));
  };
  if (REDUCE) return swap();
  planImg.classList.add('is-swapping');
  setTimeout(swap, 220);
}
tabs.forEach((t) => t.addEventListener('click', () => { plan.bhk = t.dataset.bhk; plan.view = 'floor'; renderPlan(); track('plan_view', { plan: label(plan.view) }); }));
planItems.forEach((b) => b.addEventListener('click', () => { plan.view = b.dataset.view; renderPlan(); track('plan_view', { plan: label(plan.view) }); }));
renderPlan();

// ---- Connectivity accordion: animated, one open at a time --------------------
const acc = [...document.querySelectorAll('.acc details')];
acc.forEach((d) => {
  const summary = d.querySelector('summary');
  const body = d.querySelector('ul');
  summary.addEventListener('click', (e) => {
    if (REDUCE) return;                       // native toggle
    e.preventDefault();
    const opening = !d.open;
    if (opening) {
      acc.forEach((o) => { if (o !== d && o.open) o.querySelector('summary').click(); });
      d.open = true;
      body.animate([{ height: '0px', opacity: 0 }, { height: `${body.scrollHeight}px`, opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
    } else {
      body.animate([{ height: `${body.scrollHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 240, easing: 'ease-in' })
        .onfinish = () => { d.open = false; };
    }
  });
  if (REDUCE) d.addEventListener('toggle', () => { if (d.open) acc.forEach((o) => { if (o !== d) o.open = false; }); });
});

// ---- Lead modals ---------------------------------------------------------------
const dialogs = { visit: document.getElementById('modal-visit'), brochure: document.getElementById('modal-brochure') };
function openLead(kind, cfg, source) {
  const dlg = dialogs[kind];
  const form = dlg.querySelector('.lead-form');
  resetForm(form);
  if (cfg) {
    const r = form.querySelector(`input[name="configuration"][value="${cfg}"]`);
    if (r) r.checked = true;
  }
  form.dataset.source = source || '';
  dlg.showModal();
  closeMenu();
  track('lead_form_open', { kind, source: source || '' });
  setTimeout(() => form.querySelector('input[name="name"]').focus({ preventScroll: true }), 60);
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-modal]');
  if (!btn) return;
  e.preventDefault();
  openLead(btn.dataset.modal, btn.dataset.cfg, btn.dataset.cta);
});
Object.values(dialogs).forEach((dlg) => {
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
});

// ---- Lead forms: validation, submission, confirmation ---------------------------
const digits = (v) => { let d = v.replace(/\D/g, ''); if (d.length > 10 && d.startsWith('91')) d = d.slice(2); else if (d.length > 10 && d.startsWith('0')) d = d.slice(1); return d; };
const RULES = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name'),
  mobile: (v) => (/^[6-9]\d{9}$/.test(digits(v)) ? '' : 'Enter a valid 10-digit mobile number'),
  email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'That email looks incomplete'),
};
function setError(field, msg) {
  const wrap = field.closest('.field');
  wrap.classList.toggle('is-invalid', !!msg);
  wrap.querySelector('.field__err').textContent = msg;
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function validate(form) {
  let first = null;
  for (const [name, rule] of Object.entries(RULES)) {
    const f = form.elements[name];
    if (!f) continue;
    const msg = rule(f.value);
    setError(f, msg);
    if (msg && !first) first = f;
  }
  const cfg = form.querySelector('input[name="configuration"]:checked');
  const set = form.querySelector('.field--chips');
  set.classList.toggle('is-invalid', !cfg);
  set.querySelector('.field__err').textContent = cfg ? '' : 'Pick one so we send the right prices';
  if (!cfg && !first) first = form.querySelector('input[name="configuration"]');
  return first;
}
function resetForm(form) {
  form.querySelector('.lead-form__fields').hidden = false;
  form.querySelector('.lead-form__done').hidden = true;
  form.querySelectorAll('.field').forEach((w) => w.classList.remove('is-invalid'));
  form.querySelectorAll('.field__err').forEach((s) => { s.textContent = ''; });
}
function waLink(kind, d) {
  const ask = kind === 'brochure' ? 'Please send me the brochure and price sheet.' : 'I would like to book a site visit.';
  const text = `Hi, I'm ${d.name}. ${ask}\nInterested in: ${d.configuration}\nMobile: +91 ${d.mobile}${d.email ? `\nEmail: ${d.email}` : ''}\n(Gulmohar Avenue, Bandra East)`;
  return `https://wa.me/${SALES_PHONE}?text=${encodeURIComponent(text)}`;
}
async function submitLead(form) {
  const kind = form.dataset.kind;
  const d = Object.fromEntries(new FormData(form));
  d.name = d.name.trim(); d.mobile = digits(d.mobile);
  const btn = form.querySelector('button[type=submit]');
  const done = form.querySelector('.lead-form__done');
  const wa = waLink(kind, d);
  let sent = false;
  if (LEAD_ENDPOINT) {
    btn.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, kind, source: form.dataset.source || 'inline', page: location.href }) });
      sent = res.ok;
    } catch { sent = false; }
    btn.removeAttribute('aria-busy');
  }
  if (!sent) window.open(wa, '_blank', 'noopener');
  done.querySelector('[data-name]').textContent = d.name.split(' ')[0];
  done.querySelector('[data-done-msg]').textContent = sent
    ? `Our advisor will call you on +91 ${d.mobile} within 30 minutes (11 AM – 6 PM).`
    : 'We opened WhatsApp with your details filled in. Tap Send there and our advisor will reach you within 30 minutes (11 AM – 6 PM).';
  const again = done.querySelector('[data-wa-again]');
  again.href = wa; again.hidden = sent;
  form.querySelector('.lead-form__fields').hidden = true;
  done.hidden = false;
  done.focus();
  try { sessionStorage.setItem('ga_lead', '1'); } catch {}
  hideNudge();
  track('lead_submit', { kind, configuration: d.configuration, source: form.dataset.source || 'inline', channel: sent ? 'api' : 'whatsapp' });
}
document.querySelectorAll('.lead-form').forEach((form) => {
  const mobile = form.elements.mobile;
  mobile.addEventListener('input', () => {                 // keep only digits; drop a pasted +91 / 0
    const v = digits(mobile.value).slice(0, 10);
    if (mobile.value !== v) mobile.value = v;
  });
  ['name', 'mobile', 'email'].forEach((n) => {
    const f = form.elements[n];
    if (!f) return;
    f.addEventListener('blur', () => { if (f.value) setError(f, RULES[n](f.value)); });
    f.addEventListener('input', () => { if (f.closest('.field').classList.contains('is-invalid')) setError(f, RULES[n](f.value)); });
  });
  form.querySelectorAll('input[name="configuration"]').forEach((r) => r.addEventListener('change', () => {
    const set = form.querySelector('.field--chips'); set.classList.remove('is-invalid'); set.querySelector('.field__err').textContent = '';
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) { bad.focus(); track('lead_form_error', { kind: form.dataset.kind }); return; }
    submitLead(form);
  });
});

// ---- Price-sheet nudge: once per session, after the visitor has seen the plans ----
const nudge = document.querySelector('.nudge');
const seen = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
function hideNudge() { if (nudge) nudge.hidden = true; }
if (nudge && !seen('ga_lead') && !seen('ga_nudge')) {
  const target = document.getElementById('gallery');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    setTimeout(() => {
      if (seen('ga_lead') || document.querySelector('dialog[open]')) return;
      nudge.hidden = false;
      try { sessionStorage.setItem('ga_nudge', '1'); } catch {}
      track('nudge_shown');
    }, 1200);
  }, { threshold: 0.2 });
  io.observe(target);
  nudge.querySelector('.nudge__close').addEventListener('click', () => { hideNudge(); track('nudge_dismiss'); });
  nudge.querySelector('[data-modal]').addEventListener('click', hideNudge);
}

// ---- Mobile menu --------------------------------------------------------------
const burger = document.querySelector('.nav__burger');
const mnav = document.getElementById('mnav');
function closeMenu() { if (!mnav) return; mnav.hidden = true; burger?.setAttribute('aria-expanded', 'false'); }
burger?.addEventListener('click', () => {
  const open = mnav.hidden;
  mnav.hidden = !open;
  burger.setAttribute('aria-expanded', String(open));
});
mnav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

// ---- Scroll reveals + count-up --------------------------------------------------
(() => {
  const groups = [
    ['.about__text > *', 90], ['.about__image', 0, true], ['.amenities__head > *', 90], ['.strip figure', 80],
    ['.plans .eyebrow, .plans h2, .plans__tabs', 80], ['.plan-frame', 0], ['.plan-card', 120],
    ['.gallery .eyebrow, .gallery h2', 80], ['.g', 70, true], ['.connect__left > *', 80], ['.acc details', 70],
    ['.trust__item', 90], ['.band__inner > *', 100], ['.lead__copy > *', 90], ['.lead__card', 150], ['.contact > *', 70],
  ];
  const els = [];
  groups.forEach(([sel, step, img]) => {
    const list = [...document.querySelectorAll(sel)];
    list.forEach((el, i) => {
      el.classList.add('rv'); if (img) el.classList.add('rv-img');
      el.style.setProperty('--d', `${Math.min(i, 6) * step}ms`);
      els.push(el);
    });
  });
  const count = (el) => {
    const end = +el.dataset.count; const t0 = performance.now(); const dur = 1400;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  if (REDUCE || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    e.target.querySelectorAll('[data-count]').forEach(count);
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();

// ---- Amenity strip: arrows, progress bar, drag to scroll -------------------------
(() => {
  const strip = document.querySelector('.strip');
  if (!strip) return;
  const ui = document.createElement('div');
  ui.className = 'strip-ui';
  ui.innerHTML = '<button type="button" aria-label="Previous amenities">←</button><div class="strip-ui__bar" aria-hidden="true"><i></i></div><button type="button" aria-label="Next amenities">→</button>';
  strip.after(ui);
  const [prev, next] = ui.querySelectorAll('button');
  const bar = ui.querySelector('i');
  const step = () => strip.querySelector('figure').offsetWidth + 24;
  const update = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    const p = max > 0 ? strip.scrollLeft / max : 1;
    const vis = strip.clientWidth / strip.scrollWidth;
    bar.style.width = `${Math.max(vis, 0.12) * 100}%`;
    bar.style.transform = `translateX(${p * (1 / Math.max(vis, 0.12) - 1) * 100}%)`;
    prev.disabled = strip.scrollLeft <= 2; next.disabled = strip.scrollLeft >= max - 2;
  };
  prev.addEventListener('click', () => strip.scrollBy({ left: -step(), behavior: REDUCE ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => strip.scrollBy({ left: step(), behavior: REDUCE ? 'auto' : 'smooth' }));
  strip.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  let down = false, x0 = 0, s0 = 0, moved = false;
  strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = strip.scrollLeft; });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; strip.classList.add('is-dragging'); } strip.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; strip.classList.remove('is-dragging'); });
  strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
})();

// ---- Gallery lightbox ------------------------------------------------------------
(() => {
  const figs = [...document.querySelectorAll('.bento .g')];
  if (!figs.length) return;
  const lb = document.createElement('dialog');
  lb.className = 'lightbox';
  lb.setAttribute('aria-label', 'Gallery image');
  lb.innerHTML = '<button class="lightbox__close" type="button" aria-label="Close">×</button><button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">←</button><img alt=""><button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">→</button><p class="lightbox__cap">Artist impression / stock image · <button type="button" class="link-underline" data-modal="visit" data-cta="lightbox-visit" style="color:#fff">See it in person →</button></p>';
  document.body.appendChild(lb);
  const img = lb.querySelector('img');
  let i = 0;
  const show = (n) => { i = (n + figs.length) % figs.length; img.src = figs[i].querySelector('img').src; };
  figs.forEach((f, n) => {
    f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', `Open gallery image ${n + 1}`);
    const open = () => { show(n); lb.showModal(); track('gallery_open', { index: n + 1 }); };
    f.addEventListener('click', open);
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.querySelector('.lightbox__close').addEventListener('click', () => lb.close());
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(i - 1));
  lb.querySelector('.lightbox__nav--next').addEventListener('click', () => show(i + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  // the lightbox CTA opens the visit form, so close the lightbox first
  lb.querySelector('[data-modal]').addEventListener('click', () => lb.close());
})();

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

// ---- Hide the floating "Enquire Now" tab while the inline form is on screen ----------
(() => {
  const tab = document.querySelector('.enquire');
  const lead = document.getElementById('enquire');
  if (!tab || !lead) return;
  new IntersectionObserver(([e]) => tab.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.1 }).observe(lead);
})();
