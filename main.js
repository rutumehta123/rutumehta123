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
