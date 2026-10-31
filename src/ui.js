// ARAYUZ: harita, paneller, sicrama akisi, raporlar, oyun sonu
(() => {
  const $ = (s) => document.querySelector(s);
  const { MAP, REGIONS, ERAS, ROLES, PATHS, GLOBALS, REGION_VIEW, BUDGETS, PROJECTS, CARDS, QUOTES, REAL, ENDINGS, CATA, YEARS } = CP;
  const REG = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const BCOL = { mil: '#e5534b', ind: '#8a97a0', agri: '#c8953c', env: '#49c97b', edu: '#4b8fe0' };
  let G, viewYear = 2070, sel = null, replaying = false, firstRun = true, seenIntro = false;

  const qs = new URLSearchParams(location.search);
  const FAST = qs.has('fast');

  const hist = (y) => { const h = G.tl.history; return h.find((s) => s.y === y) || h[h.length - 1]; };
  const score = (r) => (r.bio + r.water + r.soil + r.food + r.awareness * 0.5) / 4.5 - r.unrest * 0.25 - (r.war > 0 ? 18 : 0);

  function colorOf(v) {
    // kirmizi -> sari -> yesil
    const t = CP.clamp((v - 8) / 50, 0, 1);
    const c = t < 0.5
      ? [205 + 20 * t * 2, 50 + 110 * t * 2, 40]
      : [225 - 160 * (t - 0.5) * 2, 160 + 25 * (t - 0.5) * 2, 40 + 40 * (t - 0.5) * 2];
    return `rgb(${c.map(Math.round).join(',')})`;
  }

  // ---- Veri sisi: arastirmaci yoksa aralik gosterilir ----
  const known = (id, y) => G.ivs.some((i) => i.kind === 'drop' && i.role === 'res' && i.year <= y && i.region === id);
  function fuzzy(id, key, v, y) {
    if (known(id, y)) return Math.round(v) + '';
    const n = 7 + CP.hash01(G.seed, id, key) * 9;
    const c = v + (CP.hash01(G.seed, 'o', id, key) - 0.5) * n;
    return `~${Math.max(0, Math.round(c - n))}-${Math.min(100, Math.round(c + n))}`;
  }

  // ---- Harita ----
  function buildMap() {
    const svg = $('#map');
    svg.setAttribute('viewBox', `0 0 ${MAP.W} ${MAP.H}`);
    svg.innerHTML = REGIONS.map((r) => `<path class="region" id="r_${r.id}" d="${MAP.paths[r.id]}"><title>${r.name}</title></path>`).join('')
      + REGIONS.map((r) => `<text class="regLabel" id="l_${r.id}" x="${MAP.center[r.id][0]}" y="${MAP.center[r.id][1]}"></text>`).join('')
      + '<g id="pins"></g>';
    for (const r of REGIONS) $(`#r_${r.id}`).onclick = () => openRegion(r.id);
  }
  function paintMap(y = viewYear) {
    const s = hist(y);
    for (const r of REGIONS) {
      const st = s.regions[r.id];
      $(`#r_${r.id}`).style.fill = colorOf(score(st));
      $(`#l_${r.id}`).textContent = CP.regionName(r.id, y);
    }
    $('#pins').innerHTML = REGIONS.filter((r) => s.regions[r.id].war > 0).map((r) => {
      const [x, y2] = MAP.center[r.id];
      return `<circle class="pin" cx="${x}" cy="${y2 + 9}" r="6" fill="none" stroke="#ff5b52" stroke-width="2"><animate attributeName="r" values="4;11;4" dur="1.6s" repeatCount="indefinite"/></circle>`;
    }).join('') + G.ivs.filter((i) => i.kind === 'drop' && i.year <= y).map((i, n) => {
      const [x, y2] = MAP.center[i.region];
      const c = { sci: '#4fd1d9', res: '#e6b23c', edu: '#7fe39f' }[i.role];
      return `<rect class="pin" x="${x - 18 + n * 3 % 30}" y="${y2 + 3}" width="5" height="5" fill="${c}" stroke="#000"/>`;
    }).join('');
    $('#yearLabel').textContent = y < 1000 ? 'M.S. ' + y : y;
    const wars = s.global.wars;
    $('#mapLegend').innerHTML = `${wars ? `<span class="dn">Aktif savaş bölgesi: ${wars}</span> · ` : ''}Karbon ${Math.round(s.global.ppm)} ppm · +${s.global.heat.toFixed(1)}°C · Bir bölgeye tıkla`;
  }

  function ticker(y = viewYear) {
    const items = G.tl.log.filter((e) => e.y <= y && (e.kind === 'major' || e.kind === 'echo' || e.kind === 'legacy')).slice(-3).reverse();
    $('#ticker').innerHTML = items.map((e) => `<div class="${e.good ? 'good' : e.war || e.bad ? 'bad' : ''}"><i>${e.y}</i>${e.text}</div>`).join('') || '<div>Henüz kayda değer bir gelişme yok.</div>';
  }

  // ---- Paneller ----
  function bar(pct, color) { return `<div class="bar"><i style="width:${CP.clamp(pct)}%;background:${color}"></i></div>`; }
  const badColor = (good) => (good > 60 ? 'var(--grn)' : good > 35 ? 'var(--amb)' : 'var(--red)');

  function renderPool() {
    const s = hist(viewYear), base = G.base.history.find((h) => h.y === s.y) || G.base.final;
    const norm = (it, g) => {
      const v = g[it.key];
      const p = it.min != null ? ((v - it.min) / (it.max - it.min)) * 100 : v;
      return CP.clamp(p);
    };
    const open = [...document.querySelectorAll('#pool details')].map((d) => d.open);
    $('#pool').innerHTML = `<div class="ptitle"><b>KÜRESEL VERİ HAVUZU</b><span>15 parametre</span></div>` + GLOBALS.map((grp, gi) => {
      const health = grp.items.reduce((a, it) => a + (it.bad ? 100 - norm(it, s.global) : norm(it, s.global)), 0) / grp.items.length;
      return `<details class="pgroup" ${(open[gi] ?? true) ? 'open' : ''}><summary>${grp.title}${bar(health, badColor(health))}</summary>` + grp.items.map((it) => {
        const v = s.global[it.key], p = norm(it, s.global), good = it.bad ? 100 - p : p;
        const d = v - (base.global ? base.global[it.key] : v);
        const better = it.bad ? d < 0 : d > 0;
        const dT = Math.abs(d) >= (it.unit ? 2 : 0.5) ? `<span class="delta ${better ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${Math.round(d)}</span>` : '';
        return `<div class="prow"><span>${it.name}</span>${bar(p, badColor(good))}<span class="val">${Math.round(v)}${it.unit || ''} ${dT}</span></div>`;
      }).join('') + '</details>';
    }).join('') ;
  }

  function renderCrew() {
    $('#crew').innerHTML = `<div class="ptitle"><b>ÖZEL TİM</b><span>Gemide</span></div>` + Object.entries(ROLES).map(([k, r]) => {
      return `<div class="crewRow" title="${r.desc}"><div>${r.name}<small>${G.crew[k] > 0 ? r.onBase.replace('Üste kaldığında: ', '') : 'Gemide kimse yok, fayda yok.'}</small></div><span><span class="badge">${G.crew[k]}</span>${G.vets[k] ? ` <span class="badge vet">${G.vets[k]} usta</span>` : ''}</span></div>`;
    }).join('');
  }
  function renderCore() {
    const s = G.tl.final.global;
    const e = G.energy;
    $('#core').innerHTML = `<div class="ptitle"><b>ÇEKİRDEK ENERJİSİ</b><span>Sıçrama ${G.jumps}</span></div><span class="big">%${Math.round(e)}</span>${bar(e, e > 40 ? 'var(--cy)' : e > 18 ? 'var(--amb)' : 'var(--red)')}`
      + `<div style="margin-top:4px;color:var(--dim);font-size:11.5px">Sıçrama başına ikmal: +${(2 + s.renew * 0.12).toFixed(1)} (2070 temiz enerjisine bağlı)</div>`;
  }
  function renderDrops() {
    const arr = G.ivs.filter((i) => i.kind === 'drop');
    $('#drops').innerHTML = `<div class="ptitle"><b>GEÇMİŞTEKİ VAKIFLAR</b><span>${arr.length}</span></div>` + (arr.map((i) => {
      const dead = G.tl.log.find((e) => e.kind === 'legacy' && e.iv === i.id);
      const can = !i.extractedAt && !dead && G.energy >= CP.eraCost(G, i.year);
      return `<div class="dropRow ${dead ? 'dead' : i.extractedAt ? 'off' : ''}"><button data-x="${i.id}" ${can ? '' : 'disabled'} title="Üyeyi usta olarak geri al. Bedel: ${CP.eraCost(G, i.year)} enerji. Vakfın gücü %40 azalır.">Geri al</button>${ROLES[i.role].name}<small>${i.year} · ${REG[i.region].name}${dead ? ` · ${dead.y}'de dağıldı` : i.extractedAt ? ' · üye döndü' : ''}</small></div>`;
    }).join('') || '<div style="color:var(--dim);font-size:12px">Henüz kimse bırakılmadı.</div>');
    document.querySelectorAll('[data-x]').forEach((b) => { b.onclick = () => doExtract(b.dataset.x); });
  }
  function renderProto() {
    const p = CP.proto(G);
    $('#proto').innerHTML = `<div class="ptitle"><b>İKİNCİ PROTOTİP</b><span>Kazanma şartı</span></div><span class="big" id="protoVal">%${Math.round(p)}</span>${bar(p, 'var(--amb)')}`
      + (G.tl.catastrophe ? `<div class="warn">${CATA[G.tl.catastrophe.type]} (${G.tl.catastrophe.y}). <b>Son Seans:</b> Bir sıçramayla bunu önlemezsen oyun biter.</div>` : '');
  }
  function renderHand() {
    $('#hand').innerHTML = `<div class="ptitle"><b>KARAR KARTLARI</b><span>${G.hand.length}/4</span></div><div class="cards">` + (G.hand.map((id, i) => {
      const c = CARDS.find((x) => x.id === id);
      return `<button class="card ${c.color}" data-c="${i}"><b>${c.name}</b>${c.desc}</button>`;
    }).join('') || '<span style="color:var(--dim);font-size:12px">Sıçrama sonrası kart seçersin.</span>') + '</div>';
    document.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => useCard(+b.dataset.c); });
  }
  function renderTimeline() {
    const span = YEARS.end - YEARS.start;
    // Tarih olcegi: gozle gorulebilir olsun diye esit aralikli duraklar
    const stops = [...ERAS.map((e) => e.year), 2070];
    const pos = (y) => {
      for (let i = 0; i < stops.length - 1; i++) if (y <= stops[i + 1]) return ((i + (y - stops[i]) / (stops[i + 1] - stops[i])) / (stops.length - 1)) * 100;
      return 100;
    };
    $('#tlBar').innerHTML = `<div class="ln"></div><div class="now" style="width:${pos(viewYear)}%"></div>`
      + G.ivs.filter((i) => i.kind === 'drop').map((i) => `<i class="dropDot" style="left:${pos(i.year)}%;background:${{ sci: '#4fd1d9', res: '#e6b23c', edu: '#7fe39f' }[i.role]}"></i>`).join('')
      + stops.map((y) => `<button class="tick ${y === viewYear ? 'on' : ''}" data-y="${y}" style="left:${pos(y)}%"><b></b><small>${y === 430 ? 'M.S. 430' : y}</small></button>`).join('');
    document.querySelectorAll('[data-y]').forEach((b) => { b.onclick = () => { viewYear = +b.dataset.y; renderAll(); }; });
    void span;
  }

  function guide() {
    const g = $('#guide');
    if (replaying) return;
    if (G.tl.catastrophe) { g.innerHTML = '<b class="dn">Bu tarih kıyametle bitiyor.</b> Son bir sıçramayla önle.'; return; }
    if (G.jumps === 0) g.innerHTML = '<b>1. adım:</b> Haritadaki kızıllığa bak, kritik bir bölgeye tıkla. Sonra <b>Sıçrama Hazırlığı</b>.';
    else if (G.jumps === 1) g.innerHTML = '<b>2. adım:</b> Etkiler vakıf kurulduktan yıllar sonra büyür. Erken çağ güçlü ama riskli, yakın çağ zayıf ama kesin.';
    else if (G.jumps === 2) g.innerHTML = '<b>İpucu:</b> Araştırmacı bırakmadığın bölgelerin değerleri tahminidir (~). Gemide kalan tim de fayda sağlar.';
    else g.innerHTML = 'Hedef: <b>İkinci Prototip %100</b>. Teknoloji, temiz enerji, ekosistem ve barış onu besler. Enerjin bitmeden yetiştir.';
  }

  function renderAll() {
    paintMap(); ticker(); renderPool(); renderCrew(); renderCore(); renderDrops(); renderProto(); renderHand(); renderTimeline(); guide(); paintWindow();
    $('#btnJump').disabled = !CP.canAct(G) || G.energy < CP.minCost();
  }

  // ---- Modal ----
  const modal = (html) => { $('#modalBox').innerHTML = html; $('#modal').classList.remove('hidden'); $('#modalBox').scrollTop = 0; };
  const closeModal = () => $('#modal').classList.add('hidden');

  // ---- Bolge paneli ----
  function openRegion(id) {
    sel = id;
    document.querySelectorAll('.region').forEach((p) => p.classList.toggle('sel', p.id === 'r_' + id));
    const y = viewYear, st = hist(y).regions[id], def = REG[id];
    const k = known(id, y);
    const rows = REGION_VIEW.map((grp) => `<h3>${grp.title}</h3>` + grp.items.map((it) => {
      const v = st[it.key];
      const col = it.neutral ? 'var(--cy)' : badColor(it.bad ? 100 - v : v);
      return `<div class="prow"><span>${it.name}</span>${bar(v, col)}<span class="val">${fuzzy(id, it.key, v, y)}</span></div>`;
    }).join('')).join('');
    const pf = 0.05 + 0.95 / (1 + Math.exp(-(y - 1975) / 32));
    const organic = def.pop * pf * st.waste * 62, plastic = def.pop * pf * st.consumption * (1 - st.waste / 110) * 9;
    const proj = PROJECTS.map((p) => {
      const pct = Math.min(100, (st[p.key] / p.at) * 100);
      return `<div class="proj"><span>${p.name}</span><span class="${pct >= 100 ? 'up' : ''}">${pct >= 100 ? 'Tamam' : '%' + Math.round(pct)}</span></div>`;
    }).join('');
    const drops = G.ivs.filter((i) => i.kind === 'drop' && i.region === id);
    modal(`<h2>${CP.regionName(id, y)} <small style="font-size:13px;color:var(--dim)">${y} · ${def.arch}</small></h2>
      ${k ? '<p class="up" style="margin:0">Saha araştırmacısı var: veriler kesin.</p>' : '<p style="margin:0;color:var(--amb)">Araştırmacı yok: değerler tahmini aralıktır.</p>'}
      <div class="cols"><div>${rows}</div><div>
      <h3>Yatırım Dağılımı</h3><div class="budget">${Object.keys(BUDGETS).map((b) => `<i style="width:${st.budget[b]}%;background:${BCOL[b]}"></i>`).join('')}</div>
      <div class="legend">${Object.keys(BUDGETS).map((b) => `<span><b style="background:${BCOL[b]}"></b>${BUDGETS[b]} ${k ? '%' + Math.round(st.budget[b]) : ''}</span>`).join('')}</div>
      ${st.war > 0 ? '<div class="warn">Bu bölge bir savaş koalisyonunun parçası.</div>' : ''}
      <h3>Günlük Rakamlar (tahmini)</h3>
      <div class="stat"><span>Geri dönüştürülen organik atık</span><b>${Math.round(organic).toLocaleString('tr-TR')} ton/gün</b></div>
      <div class="stat"><span>Doğaya karışan plastik</span><b class="dn">${Math.round(plastic).toLocaleString('tr-TR')} ton/gün</b></div>
      <h3>Çevre Projeleri</h3>${proj}
      <h3>Buradaki Vakıflar</h3>${drops.map((i) => `<div>${i.year}: ${ROLES[i.role].name}</div>`).join('') || '<div style="color:var(--dim)">Yok</div>'}
      </div></div>
      <div class="mfoot"><button id="mClose">Kapat</button><button class="primary" id="mPlan" ${!CP.canAct(G) || G.energy < CP.minCost() ? 'disabled' : ''}>Buraya Sıçrama Planla</button></div>`);
    $('#mClose').onclick = closeModal;
    $('#mPlan').onclick = () => openPlanner({ region: id });
  }

  // ---- Sicrama planlayici ----
  let plan;
  function openPlanner(init = {}) {
    plan = { role: null, year: null, region: init.region || sel || null, path: [null, null, null], vet: false };
    renderPlanner();
  }
  function renderPlanner() {
    const canPrev = G.crew.res > 0;
    const ready = plan.role && plan.year && plan.region && plan.path.every(Boolean);
    let prev = '';
    if (ready && canPrev) {
      const fe = CP.fieldEvent(G, plan.role, plan.year);
      const pv = CP.preview(G, { ...plan, fieldId: fe?.i, field: null });
      const noise = 1 + (CP.hash01(G.seed, 'pv', G.jumps, plan.year, plan.region) - 0.5) * 0.5;
      const ppm = pv.d.global.find((x) => x.k === 'ppm').d * noise;
      prev = `<div class="stat"><span>Tahmini etki (araştırmacı raporu)</span><b>Prototip ${pv.proto * noise >= 0 ? '+' : ''}${(pv.proto * noise).toFixed(1)} · Karbon ${ppm > 0 ? '+' : ''}${Math.round(ppm)} ppm${pv.cata ? ' · <span class="dn">KIYAMET RİSKİ</span>' : ''}</b></div>`;
    } else if (!canPrev) prev = '<div style="color:var(--dim);font-size:12px">Gemide araştırmacı kalmadığı için tahmini etki gösterilemiyor.</div>';
    const cost = plan.year ? CP.eraCost(G, plan.year) : 0;
    modal(`<h2>Sıçrama Hazırlığı</h2>
    <h3>Kim gidecek?</h3><div class="optGrid">${Object.entries(ROLES).map(([k, r]) => `<button class="opt ${plan.role === k ? 'sel' : ''}" data-role="${k}" ${G.crew[k] > 0 ? '' : 'disabled'}><b>${r.name} (${G.crew[k]})</b>${r.desc}</button>`).join('')}</div>
    <h3>Hangi çağ?</h3><div class="optGrid">${ERAS.map((e) => `<button class="opt ${plan.year === e.year ? 'sel' : ''}" data-era="${e.year}" ${G.energy >= e.cost ? '' : 'disabled'}><b>${e.year === 430 ? 'M.S. 430' : e.year} · ${e.cost} enerji</b>${e.name}. ${e.desc}</button>`).join('')}</div>
    <h3>Hangi bölge?</h3><div class="optGrid" style="grid-template-columns:repeat(6,1fr)">${REGIONS.map((r) => `<button class="opt ${plan.region === r.id ? 'sel' : ''}" data-reg="${r.id}"><b style="font-size:12px;margin:0">${r.name}</b>${r.arch}</button>`).join('')}</div>
    ${PATHS.map((p, i) => `<h3>${i + 1}. ${p.title}</h3><div class="optGrid">${p.opts.map((o) => `<button class="opt ${plan.path[i] === o.id ? 'sel' : ''}" data-p="${i}" data-o="${o.id}"><b>${o.name}</b>${o.desc}</button>`).join('')}</div>`).join('')}
    ${G.vets[plan.role] > 0 ? `<label style="display:block;margin-top:8px"><input type="checkbox" id="vet" ${plan.vet ? 'checked' : ''}> Usta üyeyi gönder (etki +%25)</label>` : ''}
    <div style="margin-top:10px">${prev}</div>
    <div class="mfoot"><button id="mClose">Vazgeç</button><span style="color:var(--dim)">${plan.year ? `Bedel: ${cost} enerji. Kalan: ${Math.round(G.energy - cost)}` : ''}</span><button class="primary" id="mGo" ${ready ? '' : 'disabled'}>SIÇRA</button></div>`);
    const st = $('#modalBox').scrollTop;
    document.querySelectorAll('[data-role]').forEach((b) => { b.onclick = () => { plan.role = b.dataset.role; plan.vet = false; keep(st); }; });
    document.querySelectorAll('[data-era]').forEach((b) => { b.onclick = () => { plan.year = +b.dataset.era; keep(st); }; });
    document.querySelectorAll('[data-reg]').forEach((b) => { b.onclick = () => { plan.region = b.dataset.reg; keep(st); }; });
    document.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { plan.path[+b.dataset.p] = b.dataset.o; keep(st); }; });
    const v = $('#vet'); if (v) v.onchange = () => { plan.vet = v.checked; };
    $('#mClose').onclick = closeModal;
    $('#mGo').onclick = openField;
  }
  function keep() { const top = $('#modalBox').scrollTop; renderPlanner(); $('#modalBox').scrollTop = top; }

  // ---- Gecmis cag: saha olayi (ikinci katman) ----
  function openField() {
    const fe = CP.fieldEvent(G, plan.role, plan.year);
    const era = ERAS.find((e) => e.year === plan.year);
    const img = plan.year === 430 ? '<img class="fieldImg" src="assets/era430.jpg" alt="M.S. 430 saha operasyonu">' : '';
    modal(`<h2>${plan.year === 430 ? 'M.S. 430' : plan.year} · ${CP.regionName(plan.region, plan.year)}</h2>${img}
      <p style="margin:0;color:var(--dim)">Temporal Shift gemisi inişte. ${ROLES[plan.role].name} görevde. Çağ: ${era.name}.</p>
      <h3>${fe.title}</h3><p class="lead">${fe.text}</p>
      <div class="optGrid">${fe.opts.map((o, i) => `<button class="opt" data-f="${i}"><b>${o.t}</b></button>`).join('')}</div>`);
    document.querySelectorAll('[data-f]').forEach((b) => {
      b.onclick = () => { plan.fieldId = fe.i; plan.field = +b.dataset.f; runJump(fe.opts[+b.dataset.f]); };
    });
  }

  // ---- Tarih yeniden akiyor ----
  function runJump(opt) {
    closeModal();
    const rep = CP.jump(G, plan);
    rep.fieldLog = opt?.log;
    replay(rep, () => showReport(rep));
  }
  function doExtract(id) {
    if (replaying) return;
    const rep = CP.extract(G, id);
    if (rep) { rep.extracted = true; replay(rep, () => showReport(rep)); }
  }
  function replay(rep, done) {
    replaying = true;
    const steps = G.tl.history;
    const start = Math.max(0, steps.findIndex((s) => s.y >= (rep.iv?.year || 1970)));
    $('#guide').innerHTML = '<b>Tarih yeniden yazılıyor...</b> Kelebeğin kanat çırpışını izle.';
    const dur = FAST ? 50 : 6000;
    const t0 = performance.now();
    const seq = steps.slice(start);
    const tick = (now) => {
      const i = Math.max(0, Math.min(seq.length - 1, Math.floor(((now - t0) / dur) * seq.length)));
      viewYear = seq[i].y;
      paintMap(viewYear); ticker(viewYear); paintWindow(seq[i].global); renderTimeline();
      if (i < seq.length - 1) requestAnimationFrame(tick);
      else { replaying = false; viewYear = 2070; renderAll(); done(); }
    };
    requestAnimationFrame(tick);
  }

  // ---- Kelebek raporu ----
  function deltaRow(k, label, unit, invert, d) {
    const x = d.global.find((g) => g.k === k);
    if (!x) return '';
    const good = invert ? x.d < 0 : x.d > 0;
    const n = Math.abs(x.d) < 5 ? 1 : 0;
    return `<div class="stat"><span>${label}</span><b class="${Math.abs(x.d) < 0.05 ? '' : good ? 'up' : 'dn'}">${x.a.toFixed(n)} → ${x.b.toFixed(n)}${unit}</b></div>`;
  }
  function localBlock(rep) {
    const id = rep.iv?.region;
    if (!id) return '';
    const a = rep.before.final.regions[id], b = rep.after.final.regions?.[id];
    if (!b) return '';
    const rows = [['awareness', 'Bilinç'], ['renew', 'Temiz Enerji'], ['waste', 'Sıfır Atık'], ['bio', 'Yaban Hayatı'], ['water', 'Su'], ['food', 'Gıda']]
      .map(([k, n]) => ({ n, a: a[k], b: b[k], d: b[k] - a[k] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 3);
    return `<h3>${REG[id].name}, 2070</h3>` + rows.map((r) => `<div class="stat"><span>${r.n}</span><b class="${r.d > 0 ? 'up' : 'dn'}">${Math.round(r.a)} → ${Math.round(r.b)}</b></div>`).join('');
  }
  function reportBody(rep) {
    const d = rep.diff;
    const pts = [];
    if (rep.iv) pts.push({ y: rep.iv.year, text: rep.extracted ? `${ROLES[rep.iv.role].name} görevden usta olarak geri alındı. Vakfın gücü azaldı.` : `${ROLES[rep.iv.role].name}, ${CP.regionName(rep.iv.region, rep.iv.year)} bölgesine bırakıldı${rep.fieldLog ? ' ve ' + rep.fieldLog : ''}.` });
    rep.chain?.forEach((e) => pts.push({ y: e.y, text: e.text, bad: e.bad }));
    const fresh = d.newEvents.filter((e) => e.iv == null && (e.kind === 'major' || e.good)).slice(0, 4);
    fresh.forEach((e) => pts.push({ y: e.y, text: e.text, bad: !e.good }));
    pts.sort((a, b) => a.y - b.y);
    return `<div class="cols"><div><h3>Kelebek Zinciri</h3><div class="chain">${pts.map((p) => `<div class="${p.bad ? 'bad' : ''}"><i>${p.y}</i>${p.text}</div>`).join('')}</div>
      ${d.avoided.length ? `<h3>Önlenen Felaketler</h3>${d.avoided.slice(0, 3).map((e) => `<div class="up" style="font-size:13px">${e.y}: ${e.text}</div>`).join('')}` : ''}</div>
      <div><h3>2070'e Yansıması</h3>
      <div class="stat"><span>İkinci Prototip</span><b style="color:var(--amb)">%${Math.round(rep.protoBefore)} → %${Math.round(rep.protoAfter)}</b></div>
      ${deltaRow('ppm', 'Karbon', ' ppm', true, d)}${deltaRow('water', 'Tatlı Su', '', false, d)}${deltaRow('bio', 'Biyoçeşitlilik', '', false, d)}${deltaRow('food', 'Gıda Güvenliği', '', false, d)}${deltaRow('resilience', 'Kent Direnci', '', false, d)}${deltaRow('renew', 'Temiz Enerji', '', false, d)}${deltaRow('ocean', 'Okyanus Yükü', '', true, d)}${deltaRow('unrest', 'İsyan Riski', '', true, d)}
      ${localBlock(rep)}<h3>En Çok Etkilenen Bölgeler</h3>${d.regions.filter((r) => Math.abs(r.d) >= 0.1).slice(0, 3).map((r) => `<div class="stat"><span>${REG[r.id].name}</span><b class="${r.d > 0 ? 'up' : 'dn'}">${r.d > 0 ? '+' : ''}${r.d.toFixed(1)}</b></div>`).join('')}</div></div>`;
  }
  function showReport(rep) {
    if (G.over) { showEnd(rep); return; }
    const cards = G.offers.map((id) => CARDS.find((c) => c.id === id));
    modal(`<h2>Kelebek Raporu</h2>${reportBody(rep)}
      ${G.tl.catastrophe ? `<div class="warn"><b>Bu tarih ${G.tl.catastrophe.y} yılında kıyametle bitiyor:</b> ${CATA[G.tl.catastrophe.type]}. Son Seans başladı.</div>` : ''}
      ${rep.volunteer ? `<p class="up">Bilinçlenen dünyadan yeni bir gönüllü geldi: ${ROLES[rep.volunteer].name}.</p>` : ''}
      <h3>Bir kart seç ${G.hand.length >= 4 ? '(elin dolu)' : ''}</h3><div class="optGrid">${cards.map((c) => `<button class="card ${c.color}" data-off="${c.id}" ${G.hand.length >= 4 ? 'disabled' : ''}><b>${c.name}</b>${c.desc}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Kartsız devam</button></div>`);
    document.querySelectorAll('[data-off]').forEach((b) => { b.onclick = () => { CP.takeOffer(G, b.dataset.off); closeModal(); renderAll(); }; });
    $('#mClose').onclick = () => { CP.takeOffer(G, null); closeModal(); renderAll(); };
  }

  // ---- Kartlar ----
  function useCard(i) {
    if (replaying) return;
    const c = CARDS.find((x) => x.id === G.hand[i]);
    const fire = (region) => {
      const rep = CP.playCard(G, i, region);
      closeModal();
      if (!rep) return;
      renderAll();
      if (G.over) return showEnd(rep);
      modal(`<h2>${c.name}</h2>${reportBody(rep)}<div class="mfoot"><button id="mClose">Tamam</button></div>`);
      $('#mClose').onclick = closeModal;
    };
    if (!c.target) return fire();
    modal(`<h2>${c.name}</h2><p class="lead">${c.desc}</p><div class="optGrid" style="grid-template-columns:repeat(4,1fr)">${REGIONS.map((r) => `<button class="opt" data-t="${r.id}"><b>${r.name}</b></button>`).join('')}</div><div class="mfoot"><button id="mClose">Vazgeç</button></div>`);
    document.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => fire(b.dataset.t); });
    $('#mClose').onclick = closeModal;
  }

  // ---- Tarih Kitabi (sair gozu) ----
  function chronicle() {
    const lines = [
      ...G.ivs.filter((i) => i.kind === 'drop').map((i) => ({ y: i.year, text: `${CP.regionName(i.region, i.year)}: Kimliği bilinmeyen bir ${ROLES[i.role].name.toLowerCase()} ortaya çıktı. Kayıtlar onu "uzaktan gelen" diye anıyor.`, good: true })),
      ...G.tl.log.filter((e) => e.kind !== 'minor'),
    ].sort((a, b) => a.y - b.y);
    return lines.map((e) => `<div class="${e.good ? '' : 'bad'}"><i>${e.y}</i>${e.text}</div>`).join('') || '<div>Tarih henüz sessiz.</div>';
  }
  function showBook() {
    modal(`<h2>Tarih Kitabı</h2><p style="color:var(--dim);margin:0">Bu zaman çizgisinin kroniği. Her sıçramada yeniden yazılır.</p><div class="chain">${chronicle()}</div><div class="mfoot"><button id="mClose">Kapat</button></div>`);
    $('#mClose').onclick = closeModal;
  }

  // ---- Oyun sonu ----
  function showEnd() {
    const e = ENDINGS[G.over] || ENDINGS.energy;
    const q = QUOTES[Math.floor(CP.hash01(G.seed, 'q', G.jumps) * QUOTES.length)];
    const g = G.tl.final.global;
    const bestReal = REAL.map((r) => r).sort((a, b) => (CP.hash01(G.seed, a.key) - CP.hash01(G.seed, b.key))).slice(0, 2);
    modal(`<h2 style="font-size:26px;${G.over === 'win' ? 'color:var(--amb)' : 'color:var(--red)'}">${e.title}</h2><p class="lead">${e.text}</p>
      <div class="quote">"${q}"<small>Bu çizgide yaşamış, adı unutulmuş bir düşünür</small></div>
      <div class="cols"><div><h3>2070'in Son Hali (${G.jumps} sıçrama)</h3>
      <div class="stat"><span>İkinci Prototip</span><b>%${Math.round(CP.proto(G))}</b></div>
      ${GLOBALS.flatMap((x) => x.items).map((it) => `<div class="stat"><span>${it.name}</span><b>${Math.round(g[it.key])}${it.unit || ''}</b></div>`).join('')}
      <div class="stat"><span>Küresel Sıcaklık Artışı</span><b>+${g.heat.toFixed(1)}°C</b></div></div>
      <div><h3>Gerçek Dünyada</h3>${bestReal.map((r) => `<p style="margin:0 0 6px">${r.text}</p>`).join('')}
      <h3>Bu Çizginin Tarihi</h3><div class="chain" style="max-height:280px;overflow:auto">${chronicle()}</div></div></div>
      <div class="mfoot"><span></span><button class="primary" id="mRe">YENİ DÖNGÜ</button></div>`);
    $('#mRe').onclick = () => start();
  }

  function intro() {
    modal(`<h2>Chronos Project: Son Döngü</h2>
    <p class="lead">Uzak gelecekte, zaman teknolojisini yasaklayan totaliter bir rejim insanlığı yok oluşa sürüklüyor. Fedakar bir kahraman, yasaklı tek prototipi kaçırıp 2070'e sığınıyor: Teknolojinin yeniden üretilebileceği son eşiğe.</p>
    <p class="lead">Sen, <b>Temporal Shift</b> gemisinin komutanısın. Bilim insanlarını, araştırmacıları ve eğitmenleri geçmişe bırak. Her sıçramada tarih yeniden akar ve 2070'in nasıl değiştiğini görürsün.</p>
    <p class="lead"><b>Hedef:</b> Dünyayı, İkinci Prototip'i (%100) yapabilecek hale getirmek. Çekirdek enerjin biterse her şey biter.</p>
    <div class="mfoot"><span></span><button class="primary" id="mGo">KOMUTA MERKEZİNE GEÇ</button></div>`);
    $('#mGo').onclick = () => { seenIntro = true; closeModal(); };
  }

  // ---- Canli pencere (sanatci gozu): dunyanin durumu arka plani degistirir ----
  const cv = $('#window'), ctx = cv.getContext('2d');
  let windowHealth = 0.2, windowTarget = 0.2, drops = [];
  const buildings = Array.from({ length: 60 }, (_, i) => ({ x: i / 60, w: 0.012 + CP.hash01('w', i) * 0.03, h: 0.12 + CP.hash01('h', i) * 0.4, lit: CP.hash01('l', i) }));
  function paintWindow(g) {
    const gl = g || hist(viewYear).global;
    const eco = (gl.bio + gl.water + gl.soil) / 3;
    windowTarget = CP.clamp((eco - 25 + (500 - gl.ppm) / 15) / 55, 0, 1);
    const vt = $('#viewTxt');
    if (vt) vt.textContent = windowTarget < 0.25 ? 'Asit yağmuru, kapalı gökyüzü' : windowTarget < 0.55 ? 'Dumanlı ama yağmur seyrek' : windowTarget < 0.8 ? 'Bulutlar açılıyor' : 'Açık gökyüzü, temiz hava';
  }
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  addEventListener('resize', resize);
  function frame() {
    windowHealth += (windowTarget - windowHealth) * 0.03;
    const h = windowHealth, W = cv.width, H = cv.height;
    const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * h));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgb(${mix([34, 42, 54], [45, 110, 150])})`);
    g.addColorStop(0.7, `rgb(${mix([84, 56, 46], [190, 210, 190])})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const b of buildings) {
      const bw = b.w * W, bh = b.h * H, x = b.x * W;
      ctx.fillStyle = `rgb(${mix([9, 13, 18], [30, 66, 58])})`;
      ctx.fillRect(x, H - bh, bw, bh);
      if (b.lit < 0.6) { ctx.fillStyle = `rgba(${h > 0.5 ? '180,240,200' : '230,90,80'},.35)`; ctx.fillRect(x + bw * 0.3, H - bh + 8, bw * 0.3, 3); }
    }
    const rain = Math.round(160 * (1 - h));
    while (drops.length < rain) drops.push([Math.random() * W, Math.random() * H, 8 + Math.random() * 12]);
    drops.length = rain;
    ctx.strokeStyle = 'rgba(150,190,210,.22)'; ctx.beginPath();
    for (const d of drops) { ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0] - 2, d[1] + d[2]); d[1] += d[2]; if (d[1] > H) d[1] = -20; }
    ctx.stroke();
    requestAnimationFrame(frame);
  }

  function start() {
    const seed = qs.has('seed') ? +qs.get('seed') : undefined;
    G = CP.newGame(seed);
    viewYear = 2070; sel = null; firstRun = false;
    renderAll(); closeModal();
    if (!seenIntro && !qs.has('skip')) intro();
  }
  CP.debug = { get G() { return G; }, renderAll, openPlanner, openRegion, showEnd, showBook, runJumpPlan: (p) => { plan = p; const fe = CP.fieldEvent(G, p.role, p.year); plan.fieldId = fe.i; plan.field = 0; runJump(fe.opts[0]); } };

  $('#btnJump').onclick = () => openPlanner();
  $('#btnBook').onclick = showBook;
  $('#btnEnd').onclick = () => { G.over = G.over || 'quit'; showEnd(); };
  void firstRun;
  buildMap(); resize(); start(); requestAnimationFrame(frame);
})();
