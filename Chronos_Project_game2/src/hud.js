// Tüm oyun yüzeylerinde aynı gerçek gemi kaynakları. Ekonomi kurallarını değiştirmez.
globalThis.CP = globalThis.CP || {};
(() => {
  const root = document.createElement('div');
  root.id = 'resourceHud'; root.hidden = true;
  root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Gemi kaynakları ve prototip ilerlemesi');
  const paths = {
    energy: '<path d="m13 2-8 11h6l-1 9 9-12h-6z"/>',
    sci: '<path d="M9 3h6M10 3v7l-5 9a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-9V3M8 15h8"/>',
    res: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
    edu: '<path d="m2 7 10-4 10 4-10 4zM6 9v8c4 3 8 3 12 0V9M22 7v9"/>',
    tech: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z"/>',
    eco: '<path d="M20 3C8 1 2 9 6 16s15 1 14-13ZM4 21l12-12M9 16v-5m0 5h5"/>',
    peace: '<path d="M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z"/><path d="M12 8v9m-4-3 4-3 4 3"/>',
  };
  const item = (key, name, tip, progress = false) => `<div class="hudItem" data-resource="${key}" title="${tip}"><svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]}</svg><div><dt>${name}</dt><dd data-hud-value="${key}">—</dd>${progress ? `<span class="hudMeter" aria-hidden="true"><i data-hud-meter="${key}"></i></span>` : ''}</div></div>`;
  root.innerHTML = `<div class="hudGroup hudEnergy"><span class="hudCaption" id="hudCycle">ÇEKİRDEK ENERJİSİ</span><dl>${item('energy', 'Enerji', 'Sıçramalarda harcanır; her sıçrama sonrası ikmalin bir kısmı geri gelir.', true)}</dl></div>
    <div class="hudGroup hudCrew"><span class="hudCaption">GEMİDEKİ UZMANLAR</span><dl>${item('sci', 'Bilim', 'Gemide kalan bilim insanları. En az biri gemideyse her sıçramada +1,5 teknoloji bonusu.')}${item('res', 'Araştırma', 'Gemide kalan alan araştırmacıları. Göreve gönderilen uzman geçmişte kalır.')}${item('edu', 'Eğitim', 'Gemide kalan eğitmenler. Okullar ve bilginin aktarılması için görevlendirilir.')}</dl></div>
    <div class="hudGroup hudPrototype"><span class="hudCaption">İKİNCİ PROTOTİP · ÜÇÜ DE %100</span><dl>${Object.entries(CP.TRACKS).map(([key, name]) => item(key, name, `${name} hedef kolunun gerçek ilerlemesi. Üç kolun da %100 olması gerekir.`, true)).join('')}</dl></div>`;
  document.body.append(root);
  let game = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const format = (v) => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  function render(G) {
    game = G;
    const values = { energy: G.energy, ...G.crew, ...CP.tracks(G) };
    for (const [key, value] of Object.entries(values)) {
      const node = root.querySelector(`[data-hud-value="${key}"]`);
      const text = format(value) + (['energy', ...Object.keys(CP.TRACKS)].includes(key) ? '%' : '');
      if (node.textContent !== text) {
        if (node.textContent !== '—' && !reduced) node.animate?.([{ color: '#fff4cd', textShadow: '0 0 14px #e8d1a5' }, { color: '#e9e2cd', textShadow: 'none' }], { duration: 600 });
        node.textContent = text;
      }
      const meter = root.querySelector(`[data-hud-meter="${key}"]`);
      if (meter) meter.style.width = CP.clamp(value) + '%';
      root.querySelector(`[data-resource="${key}"]`).dataset.empty = String(value === 0);
    }
    root.querySelector('#hudCycle').textContent = `ÇEKİRDEK · SIÇRAMA ${G.jumps}`;
    root.dataset.lowEnergy = String(G.energy < CP.minCost());
  }
  function attach(container) {
    const parent = container || document.querySelector('#cinema:not([hidden])') || document.querySelector('#modal:not(.hidden)') || document.body;
    if (root.parentNode !== parent) parent.append(root);
  }
  function setVisible(value) {
    root.hidden = !value;
    document.body.classList.toggle('hasResourceHud', value);
  }
  CP.hud = { render, attach, setVisible, refresh: () => { if (game) render(game); } };
})();
