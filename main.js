// Floor plan tabs. Only the 1 BHK plan exists in the design; swap in the 2 BHK
// image here (PLANS['2 BHK'].src) once it is available.
const PLANS = {
  '1 BHK': { src: 'assets/floor-plan.png' },
  '2 BHK': { src: 'assets/floor-plan.png' },
};

const tabs = document.querySelectorAll('.plans__tabs [data-cfg]');
const img = document.getElementById('plan-img');
const title = document.getElementById('plan-title');
const unit = document.getElementById('plan-unit');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const cfg = tab.dataset.cfg;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.classList.toggle('btn--orange', on);
      t.classList.toggle('btn--outline', !on);
    });
    img.src = PLANS[cfg].src;
    img.alt = `${cfg} floor plan`;
    title.textContent = `${cfg} Floor Plan`;
    unit.textContent = `${cfg} Unit Plan`;
  });
});

// Connectivity accordion: one open at a time.
const items = document.querySelectorAll('.acc details');
items.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) items.forEach((o) => { if (o !== d) o.open = false; });
}));
