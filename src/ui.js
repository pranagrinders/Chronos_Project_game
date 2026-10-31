// ARAYUZ: harita, paneller, sicrama akisi, raporlar, oyun sonu
(() => {
  const $ = (s) => document.querySelector(s);
  const { MAP, REGIONS, ERAS, ROLES, GLOBALS, REGION_VIEW, BUDGETS, PROJECTS, CARDS, QUOTES, REAL, ENDINGS, CATA, YEARS } = CP;
  const REG = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const BCOL = { mil: '#e5534b', ind: '#8a97a0', agri: '#c8953c', env: '#49c97b', edu: '#4b8fe0' };
  let G, viewYear = 2070, sel = null, replaying = false, firstRun = true, seenIntro = false, compareTl = null, muted = false, lastKeys = new Set();

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

  // ---- Ses: dosya gerektirmez, tarayici sentezler ----
  let audio = null;
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.05, slide = 0) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* ses zorunlu degil */ }
  }
  const sfx = {
    click: () => tone(520, 0.05, 'triangle', 0.03),
    jump: () => tone(90, 1.3, 'sawtooth', 0.05, 900),
    good: () => { tone(523, 0.14); setTimeout(() => tone(784, 0.2), 110); },
    bad: () => { tone(196, 0.3, 'square', 0.03); setTimeout(() => tone(147, 0.4, 'square', 0.03), 160); },
    mile: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18), i * 90)),
  };
  document.addEventListener('click', (e) => { if (e.target.closest('button')) sfx.click(); });

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
      + `<defs><pattern id="stripe" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="7" fill="#7ff0ff"/></pattern></defs>`
      + REGIONS.map((r) => `<path class="curLayer" id="c_${r.id}" d="${MAP.paths[r.id]}"></path>`).join('')
      + REGIONS.map((r) => `<text class="regLabel" id="l_${r.id}" x="${MAP.center[r.id][0]}" y="${MAP.center[r.id][1]}"></text>`).join('')
      + REGIONS.map((r) => `<text class="deltaLabel" id="dl_${r.id}" x="${MAP.center[r.id][0]}" y="${MAP.center[r.id][1] - 13}"></text>`).join('')
      + '<g id="pins"></g>';
    for (const r of REGIONS) $(`#r_${r.id}`).onclick = () => openRegion(r.id);
  }
  function paintMap(y = viewYear) {
    const s = hist(y);
    for (const r of REGIONS) {
      const st = s.regions[r.id];
      $(`#r_${r.id}`).style.fill = colorOf(score(st));
      $(`#l_${r.id}`).textContent = CP.regionName(r.id, y);
      $(`#c_${r.id}`).style.opacity = (st.cur || 0) * 0.55;
      const lab = $(`#dl_${r.id}`);
      const o = compareTl && (compareTl.history.find((h) => h.y === y) || compareTl.final).regions[r.id];
      const d = o ? score(st) - score(o) : 0;
      lab.textContent = Math.abs(d) >= 1 ? (d > 0 ? '+' : '') + Math.round(d) : '';
      lab.setAttribute('class', 'deltaLabel ' + (d > 0 ? 'pos' : 'neg'));
    }
    const crisis = y === 2070 ? [...REGIONS].sort((a, b) => score(s.regions[a.id]) - score(s.regions[b.id])).slice(0, 3).map((r) => r.id) : [];
    for (const r of REGIONS) $(`#r_${r.id}`).classList.toggle('crisis', crisis.includes(r.id) && !replaying);
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
    $('#mapLegend').innerHTML = `${wars ? `<span class="dn">Aktif savaş bölgesi: ${wars}</span> · ` : ''}Karbon ${Math.round(s.global.ppm)} ppm · +${s.global.heat.toFixed(1)}°C · <span style="color:#ff9d6e">Parlayan kenar: en kritik 3 bölge</span>${REGIONS.some((r) => s.regions[r.id].cur > 0.05) ? ' · <span style="color:#7ff0ff">Çizgili: akım yayılıyor</span>' : ''}`;
  }

  function ticker(y = viewYear) {
    const pool = G.tl.log.filter((e) => e.y <= y && (e.kind === 'major' || e.kind === 'echo' || e.kind === 'legacy' || e.good));
    const fresh = pool.filter((e) => !lastKeys.has(e.y + e.text));
    const items = [...fresh.slice(-3).reverse(), ...pool.filter((e) => lastKeys.has(e.y + e.text)).slice(-3).reverse()].slice(0, 3);
    $('#ticker').innerHTML = items.map((e) => `<div class="${e.good ? 'good' : e.war || e.bad ? 'bad' : ''}"><i>${e.y}</i>${lastKeys.size && !lastKeys.has(e.y + e.text) ? '<b class="new">YENİ</b> ' : ''}${e.text}</div>`).join('') || '<div>Henüz kayda değer bir gelişme yok.</div>';
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
      return `<details class="pgroup" ${(open[gi] ?? false) ? 'open' : ''}><summary>${grp.title}${bar(health, badColor(health))}</summary>` + grp.items.map((it) => {
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
      + `<div style="margin-top:4px;color:var(--dim);font-size:11.5px">Sıçrama başına ikmal: +${(1 + s.renew * 0.05).toFixed(1)} (2070 temiz enerjisine bağlı)</div>`;
  }
  function renderDrops() {
    const arr = G.ivs.filter((i) => i.kind === 'drop');
    $('#drops').innerHTML = `<div class="ptitle"><b>GEÇMİŞTEKİ VAKIFLAR</b><span>${arr.length}</span></div>` + (arr.map((i) => {
      const dead = G.tl.log.find((e) => e.kind === 'legacy' && e.iv === i.id);
      const can = !i.extractedAt && !dead && G.energy >= CP.eraCost(G, i.year);
      return `<div class="dropRow ${dead ? 'dead' : i.extractedAt ? 'off' : ''}"><button data-x="${i.id}" ${can ? '' : 'disabled'} title="Üyeyi usta olarak geri al. Bedel: ${CP.eraCost(G, i.year)} enerji. Vakfın gücü %40 azalır.">Geri al</button>${CP.missionById(i.mission).name}<small>${ROLES[i.role].name} · ${i.year} · ${REG[i.region].name}${dead ? ` · ${dead.y}'de dağıldı` : i.extractedAt ? ' · üye döndü' : ''}</small></div>`;
    }).join('') || '<div style="color:var(--dim);font-size:12px">Henüz kimse bırakılmadı.</div>');
    document.querySelectorAll('[data-x]').forEach((b) => { b.onclick = () => doExtract(b.dataset.x); });
  }
  function renderProto() {
    const p = CP.proto(G), t = CP.tracks(G);
    $('#proto').innerHTML = `<div class="ptitle"><b>İKİNCİ PROTOTİP</b><span>Üçü de %100 olmalı</span></div><span class="big" id="protoVal">%${Math.round(p)}</span>`
      + Object.entries(CP.TRACKS).map(([k, n]) => `<div class="prow trackRow"><span>${n}</span>${bar(t[k], t[k] >= 100 ? 'var(--grn)' : 'var(--amb)')}<span class="val">%${Math.round(t[k])}</span></div>`).join('')
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
    if (G.tl.catastrophe) { g.innerHTML = '<b class="dn">Bu tarih kıyametle bitiyor.</b> Tarih Kitabı\'ndan felaketi seç ya da son bir sıçrama yap.'; return; }
    if (!CP.canAct(G)) {
      g.innerHTML = CP.extractable(G).length
        ? '<b class="dn">Gemide kimse kalmadı.</b> Sol panelden bir üyeyi <b>Geri al</b>, ya da kart oyna.'
        : '<b class="dn">Tim tükendi.</b>';
      return;
    }
    if (G.jumps === 0) g.innerHTML = '<b>1. adım:</b> Haritada parlayan kritik bölgelerden birine tıkla.';
    else if (G.jumps === 1) g.innerHTML = '<b>2. adım:</b> Üç kol da dolmalı: Teknoloji, Ekosistem, Barış. Hangisi geride, ona bak.';
    else if (G.jumps === 2) g.innerHTML = '<b>İpucu:</b> <b>Tarih Kitabı</b>\'ndaki felaketleri seçip önlemeye gidebilirsin.';
    else if (G.jumps === 3) g.innerHTML = '<b>İpucu:</b> Akımlar kendi kendine yayılır. Kültürü yüksek bölgelerden başlatmak daha hızlıdır.';
    else g.innerHTML = 'Hedef: <b>Üç kolu da %100\'e çıkar.</b> Enerjin ve timin bitmeden yetiştir.';
  }

  function renderAll() {
    paintMap(); ticker(); renderPool(); renderCrew(); renderCore(); renderDrops(); renderProto(); renderHand(); renderTimeline(); guide(); paintWindow();
    $('#btnJump').disabled = !CP.canAct(G) || G.energy < CP.minCost();
    $('#btnJump').textContent = CP.canAct(G) ? 'SIÇRAMA HAZIRLIĞI' : 'GEMİDE KİMSE YOK';
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
      <h3>Buradaki Görevler</h3>${drops.map((i) => `<div>${i.year}: ${CP.missionById(i.mission).name}</div>`).join('') || '<div style="color:var(--dim)">Yok</div>'}
      </div></div>
      <div class="mfoot"><button id="mClose">Kapat</button><button class="primary" id="mPlan" ${!CP.canAct(G) || G.energy < CP.minCost() ? 'disabled' : ''}>Buraya Sıçrama Planla</button></div>`);
    $('#mClose').onclick = closeModal;
    $('#mPlan').onclick = () => openEra(id);
  }

  // ---- Sicrama akisi: her ekranda tek soru ----
  let plan;
  const yr = (y) => (y < 1000 ? 'M.S. ' + y : y);
  const stepHead = (n, t) => `<div class="stepBar">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div><h2>${t}</h2>`;

  function openPlanner() {
    if (sel) return openEra(sel);
    const crisis = [...REGIONS].sort((a, b) => score(G.tl.final.regions[a.id]) - score(G.tl.final.regions[b.id])).slice(0, 3).map((r) => r.id);
    modal(`${stepHead(1, 'Hangi bölge?')}<div class="optGrid" style="grid-template-columns:repeat(4,1fr)">${REGIONS.map((r) => `<button class="opt ${crisis.includes(r.id) ? 'crit' : ''}" data-reg="${r.id}"><b>${r.name}</b>${r.arch}${crisis.includes(r.id) ? ' · <span class="dn">KRİTİK</span>' : ''}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Vazgeç</button></div>`);
    document.querySelectorAll('[data-reg]').forEach((b) => { b.onclick = () => openEra(b.dataset.reg); });
    $('#mClose').onclick = closeModal;
  }
  function openEra(region) {
    sel = region;
    document.querySelectorAll('.region').forEach((p) => p.classList.toggle('sel', p.id === 'r_' + region));
    modal(`${stepHead(2, `${REG[region].name}: Hangi çağa?`)}<div class="optGrid eraGrid">${ERAS.map((e) => `<button class="opt" data-era="${e.year}" ${G.energy >= e.cost ? '' : 'disabled'}><b>${yr(e.year)}</b><span class="costTag">${e.cost} enerji</span><br>${e.name}. ${e.desc}</button>`).join('')}</div>
      <div class="mfoot"><button id="mBack">Başka bölge</button><span style="color:var(--dim)">Çekirdek Enerjisi: %${Math.round(G.energy)}</span></div>`);
    document.querySelectorAll('[data-era]').forEach((b) => { b.onclick = () => openMissions(region, +b.dataset.era); });
    $('#mBack').onclick = () => { sel = null; openPlanner(); };
  }
  function missionCard(o, i, region) {
    const intel = G.crew.res > 0 ? CP.intel({ ...o, region }) : null;
    const name = o.current ? `Akım: ${o.current.name}` : o.event ? `Olayı Değiştir` : o.m.name;
    const desc = o.current ? `${o.current.desc} ${o.m.desc}` : o.event ? `<span class="dn">${o.event.y}: ${o.event.text}</span><br>${o.m.desc}` : CP.fill(o.m.desc, region, 2000);
    return `<button class="opt mission" data-m="${i}"><span class="roleTag ${o.role}">${ROLES[o.role].name}</span><b>${name}</b>${desc}
      ${intel ? `<div class="intel">Rapor: ${intel.list.join(' · ')}<br>Dağılma riski: ${intel.risk}</div>` : '<div class="intel">Gemide araştırmacı yok: Rapor alınamıyor.</div>'}</button>`;
  }
  function openMissions(region, year) {
    const offers = CP.offerMissions(G, region, year);
    modal(`${stepHead(3, `${yr(year)}, ${CP.regionName(region, year)}: Görevin ne?`)}<div class="optGrid missionGrid">${offers.map((o, i) => missionCard(o, i, region)).join('')}</div>
      <div class="mfoot"><button id="mBack">Başka çağ</button><span style="color:var(--dim)">Her sıçramada farklı görevler çıkar</span></div>`);
    document.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => startMission({ ...offers[+b.dataset.m], region }); });
    $('#mBack').onclick = () => openEra(region);
  }
  // Kitaptan dogrudan: felaketi onle
  function preventEvent(ev) {
    startMission({ m: CP.BLOCK_MISSION, role: CP.roleFor(G, CP.BLOCK_MISSION), event: ev, year: Math.max(430, ev.y - 10), region: ev.r });
  }
  function startMission(p) {
    plan = { ...p, choices: [], logs: [], vet: G.vets[p.role] > 0 };
    plan.stages = CP.stages(G, plan);
    sfx.jump();
    renderStage(0);
  }
  function optTags(o) {
    const t = [];
    if ((o.mult || 1) > 1) t.push('<i class="tg up">Güç +</i>');
    if ((o.mult || 1) < 1) t.push('<i class="tg dn">Güç -</i>');
    if ((o.hz || 0) < 0) t.push('<i class="tg up">Kalıcılık +</i>');
    if ((o.hz || 0) > 0) t.push('<i class="tg dn">Risk +</i>');
    if (o.grow) t.push('<i class="tg up">Zamanla büyür</i>');
    if (o.spread) t.push('<i class="tg up">Komşulara yayılır</i>');
    if (o.fx?.unrest > 0) t.push('<i class="tg dn">İsyan +</i>');
    if (o.fx?.unrest < 0) t.push('<i class="tg up">İsyan -</i>');
    return t.join('');
  }
  function renderStage(i) {
    const st = plan.stages[i];
    const img = plan.year === 430 ? '<img class="fieldImg" src="assets/era430.jpg" alt="M.S. 430 saha operasyonu">' : '';
    const labels = ['Geliş', 'Kriz', 'Ayrılık'];
    modal(`${stepHead(4, `${yr(plan.year)} · ${CP.regionName(plan.region, plan.year)}`)}${i === 0 ? img : ''}
      <p style="margin:0;color:var(--dim)">${i === 0 ? `Temporal Shift iniş yaptı. ${ROLES[plan.role].name} görevde: ${plan.m.name}.` : `Görev sürüyor: ${plan.m.name}.`} <b style="color:var(--cy)">Karar ${i + 1}/3: ${labels[i]}</b></p>
      <h3>${st.title}</h3><p class="lead">${st.text}</p>
      <div class="optGrid">${st.opts.map((o, k) => `<button class="opt" data-f="${k}"><b>${o.t}</b>${optTags(o)}</button>`).join('')}</div>`);
    document.querySelectorAll('[data-f]').forEach((b) => {
      b.onclick = () => {
        const o = st.opts[+b.dataset.f];
        plan.choices.push(o);
        plan.logs.push(CP.fill(o.log, plan.region, plan.year));
        if (i < 2) renderStage(i + 1); else runJump();
      };
    });
  }

  // ---- Tarih yeniden akiyor ----
  function runJump() {
    closeModal();
    lastKeys = new Set(G.tl.log.map((e) => e.y + e.text));
    const rep = CP.jump(G, plan);
    rep.logs = plan.logs; rep.mName = plan.current ? plan.current.name : plan.m.name;
    replay(rep, () => showReport(rep));
  }
  function doExtract(id) {
    if (replaying) return;
    lastKeys = new Set(G.tl.log.map((e) => e.y + e.text));
    const rep = CP.extract(G, id);
    if (rep) { rep.extracted = true; replay(rep, () => showReport(rep)); }
  }
  function replay(rep, done) {
    replaying = true;
    compareTl = rep.before;
    renderCrew(); renderCore(); renderDrops(); renderHand();
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
      else { replaying = false; viewYear = 2070; compareTl = rep.before; renderAll(); done(); setTimeout(() => { compareTl = null; paintMap(); }, 6000); }
    };
    requestAnimationFrame(tick);
  }

  // ---- Kelebek raporu ----
  // Ondalik yerine anlasilir buyukluk
  const mag = (d, invert) => {
    const a = Math.abs(d);
    if (a < 0.5) return '<span class="flat">değişmedi</span>';
    const up = d > 0, good = invert ? !up : up;
    const size = a < 3 ? 'Küçük' : a < 9 ? 'Orta' : 'Büyük';
    return `<span class="${good ? 'up' : 'dn'}">${size} ${up ? 'artış' : 'düşüş'}</span>`;
  };
  function deltaRow(k, label, invert, d, unit = '') {
    const x = d.global.find((g) => g.k === k);
    if (!x) return '';
    return `<div class="stat"><span>${label}</span><span>${Math.round(x.a)} → ${Math.round(x.b)}${unit} · ${mag(x.d, invert)}</span></div>`;
  }
  function localBlock(id, rep) {
    if (!id) return '';
    const a = rep.before.final.regions[id], b = rep.after.final.regions?.[id];
    if (!a || !b) return '';
    const rows = [['awareness', 'Bilinç'], ['renew', 'Temiz Enerji'], ['waste', 'Sıfır Atık'], ['bio', 'Yaban Hayatı'], ['water', 'Su'], ['soil', 'Toprak'], ['food', 'Gıda'], ['resilience', 'Kent Direnci'], ['unrest', 'İsyan Riski', true], ['military', 'Askeri Bütçe', true], ['consumption', 'Tüketim', true]]
      .map(([k, n, inv]) => ({ n, inv, a: a[k], b: b[k], d: b[k] - a[k] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 5);
    return `<h3>${REG[id].name}, 2070</h3>` + rows.map((r) => `<div class="stat big2"><span>${r.n}</span><span><b>${Math.round(r.a)} → ${Math.round(r.b)}</b> · ${mag(r.d, r.inv)}</span></div>`).join('');
  }
  const evLine = (p) => `<div class="${p.bad ? 'bad' : ''}"><i>${p.y}</i>${p.text}${p.cause ? `<small class="cause">${p.cause}</small>` : ''}</div>`;
  function reportBody(rep) {
    const d = rep.diff;
    const pts = [];
    if (rep.iv && rep.extracted) pts.push({ y: rep.iv.year, text: `${ROLES[rep.iv.role].name} görevden usta olarak geri alındı. Mirasın gücü azaldı.` });
    else if (rep.iv && rep.logs) {
      pts.push({ y: rep.iv.year, text: `${ROLES[rep.iv.role].name}, ${CP.regionName(rep.iv.region, rep.iv.year)} bölgesine indi. Görev: ${rep.mName}.` });
      rep.logs.forEach((t, i) => pts.push({ y: rep.iv.year + i * 2, text: `Tim ${t}.` }));
    }
    if (rep.card) pts.push({ y: rep.card.year || 2070, text: `${rep.card.name} kartı oynandı.` });
    rep.chain?.forEach((e) => pts.push(e));
    d.newEvents.filter((e) => e.iv == null && (e.kind === 'major' || e.good)).slice(0, 5).forEach((e) => pts.push({ ...e, bad: !e.good }));
    pts.sort((a, b) => a.y - b.y);
    const before = CP.tracks(G, rep.before), after = CP.tracks(G, rep.after);
    return `<div class="cols"><div><h3>Kelebek Zinciri</h3><div class="chain">${pts.map(evLine).join('') || '<div>Görünür bir zincir oluşmadı.</div>'}</div>
      ${d.newMilestones.length ? `<h3>Yeni Eşikler</h3>${d.newMilestones.slice(0, 4).map((m) => `<div class="mile">★ ${REG[m.r].name}: ${m.name}</div>`).join('')}` : ''}
      ${d.avoided.length ? `<h3>Önlenen Felaketler</h3>${d.avoided.slice(0, 3).map((e) => `<div class="up" style="font-size:13px">${e.y}: ${e.text}</div>`).join('')}` : ''}</div>
      <div>${localBlock(rep.iv?.region || rep.region, rep)}
      <h3>İkinci Prototip</h3><div class="stat big2"><span>Toplam</span><b style="color:var(--amb)">%${Math.round(rep.protoBefore)} → %${Math.round(rep.protoAfter)}</b></div>
      ${Object.entries(CP.TRACKS).map(([k, n]) => `<div class="stat"><span>${n}</span><span>%${Math.round(before[k])} → %${Math.round(after[k])} · ${mag(after[k] - before[k])}</span></div>`).join('')}
      <details class="more"><summary>Dünya geneli ayrıntılar</summary>
      ${deltaRow('ppm', 'Karbon', true, d, ' ppm')}${deltaRow('water', 'Tatlı Su', false, d)}${deltaRow('bio', 'Biyoçeşitlilik', false, d)}${deltaRow('food', 'Gıda Güvenliği', false, d)}${deltaRow('resilience', 'Kent Direnci', false, d)}${deltaRow('renew', 'Temiz Enerji', false, d)}${deltaRow('ocean', 'Okyanus Yükü', true, d)}${deltaRow('unrest', 'İsyan Riski', true, d)}
      <h3>En Çok Etkilenen Bölgeler</h3>${d.regions.filter((r) => Math.abs(r.d) >= 0.5).slice(0, 4).map((r) => `<div class="stat"><span>${REG[r.id].name}</span>${mag(r.d)}</div>`).join('')}
      </details></div></div>`;
  }
  function showReport(rep) {
    if (rep.diff.newMilestones.length) sfx.mile(); else if (rep.protoAfter > rep.protoBefore + 0.5) sfx.good(); else sfx.bad();
    if (G.over) { showEnd(rep); return; }
    const cards = G.offers.map((id) => CARDS.find((c) => c.id === id));
    modal(`<h2>Kelebek Raporu</h2>${reportBody(rep)}
      ${G.tl.catastrophe ? `<div class="warn"><b>Bu tarih ${G.tl.catastrophe.y} yılında kıyametle bitiyor:</b> ${CATA[G.tl.catastrophe.type]}. Son Seans başladı.</div>` : ''}
      ${rep.volunteer ? `<p class="up">Bilinçlenen dünyadan yeni bir gönüllü geldi: ${ROLES[rep.volunteer].name}.</p>` : ''}
      <h3>Bir kart seç ${G.hand.length >= 4 ? '(elin dolu)' : ''}</h3><div class="optGrid">${cards.map((c) => `<button class="card ${c.color}" data-off="${c.id}" ${G.hand.length >= 4 ? 'disabled' : ''}><b>${c.name}</b>${c.desc}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Kartsız devam</button></div>`);
    document.querySelectorAll('[data-off]').forEach((b) => { b.onclick = () => { CP.takeOffer(G, b.dataset.off); afterTurn(); }; });
    $('#mClose').onclick = () => { CP.takeOffer(G, null); afterTurn(); };
  }

  function afterTurn() {
    closeModal(); renderAll();
    const ctx = CP.nextLetter(G);
    if (ctx) showLetter(ctx);
  }
  // Vakiftan mektup
  function showLetter(ctx) {
    const m = CP.missionById(ctx.iv.mission);
    modal(`<h2>Geçmişten Bir Mektup</h2><p style="margin:0;color:var(--dim)">${yr(ctx.year)}, ${CP.regionName(ctx.iv.region, ctx.year)}. Kurduğun "${m.name}" görevinin mirasçılarından. Yanıtlamak sıçrama harcatmaz.</p>
      <h3>${ctx.letter.title}</h3><p class="lead">${ctx.letter.text}</p>
      <div class="optGrid">${ctx.letter.opts.map((o, i) => `<button class="opt" data-l="${i}"><b>${o.t}</b>${optTags(o)}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Mektubu yanıtsız bırak</button></div>`);
    document.querySelectorAll('[data-l]').forEach((b) => {
      b.onclick = () => {
        const o = ctx.letter.opts[+b.dataset.l];
        const rep = CP.answerLetter(G, ctx, o);
        renderAll();
        if (G.over) return showEnd();
        modal(`<h2>Mektuba Yanıt</h2><div class="chain"><div><i>${ctx.year}</i>${CP.fill(o.log, ctx.iv.region, ctx.year)}</div></div>
          ${localBlock(ctx.iv.region, rep)}<div class="mfoot"><button id="mClose">Devam</button></div>`);
        $('#mClose').onclick = closeModal;
      };
    });
    $('#mClose').onclick = () => { G.lastLetter = G.jumps; closeModal(); };
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
      if (rep.diff.newMilestones.length) sfx.mile(); else sfx.good();
      modal(`<h2>${c.name}</h2>${reportBody(rep)}<div class="mfoot"><button id="mClose">Tamam</button></div>`);
      $('#mClose').onclick = closeModal;
    };
    if (!c.target) return fire();
    modal(`<h2>${c.name}</h2><p class="lead">${c.desc}</p><div class="optGrid" style="grid-template-columns:repeat(4,1fr)">${REGIONS.map((r) => `<button class="opt" data-t="${r.id}"><b>${r.name}</b></button>`).join('')}</div><div class="mfoot"><button id="mClose">Vazgeç</button></div>`);
    document.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => fire(b.dataset.t); });
    $('#mClose').onclick = closeModal;
  }

  // ---- Tarih Kitabi (sair gozu) ----
  function chronicle(interactive) {
    const lines = [
      ...G.ivs.filter((i) => i.kind === 'drop').map((i) => ({ y: i.year, text: `${CP.regionName(i.region, i.year)}: Kimliği bilinmeyen bir ${ROLES[i.role].name.toLowerCase()} ortaya çıktı. Kayıtlar onu "uzaktan gelen" diye anıyor.`, good: true })),
      ...G.tl.log.filter((e) => e.kind !== 'minor' || e.good),
    ].sort((a, b) => a.y - b.y);
    return lines.map((e) => {
      const can = interactive && CP.canBlock(G, e);
      return `<div class="${e.good ? '' : 'bad'}"><i>${e.y}</i>${e.text}${can ? ` <button class="mini" data-ev="${e.y}|${e.r}|${e.id}">Önle (${CP.eraCost(G, Math.max(430, e.y - 10))} enerji)</button>` : ''}${e.cause ? `<small class="cause">${e.cause}</small>` : ''}</div>`;
    }).join('') || '<div>Tarih henüz sessiz.</div>';
  }
  function showBook() {
    modal(`<h2>Tarih Kitabı</h2><p style="color:var(--dim);margin:0">Bu zaman çizgisinin kroniği, her sıçramada yeniden yazılır. <b style="color:var(--cy)">Bir felaketi seçip önlemeye gidebilirsin.</b></p><div class="chain">${chronicle(!G.over)}</div><div class="mfoot"><button id="mClose">Kapat</button></div>`);
    $('#mClose').onclick = closeModal;
    document.querySelectorAll('[data-ev]').forEach((b) => {
      b.onclick = () => {
        const [y, r, id] = b.dataset.ev.split('|');
        const ev = G.tl.log.find((e) => e.y === +y && e.r === r && e.id === id);
        if (ev) preventEvent(ev);
      };
    });
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
      <div class="stat"><span>İkinci Prototip</span><b>%${Math.round(CP.proto(G))}</b></div>${Object.entries(CP.TRACKS).map(([k, n]) => `<div class="stat"><span>${n} kolu</span><b>%${Math.round(CP.tracks(G)[k])}</b></div>`).join('')}
      ${GLOBALS.flatMap((x) => x.items).map((it) => `<div class="stat"><span>${it.name}</span><b>${Math.round(g[it.key])}${it.unit || ''}</b></div>`).join('')}
      <div class="stat"><span>Küresel Sıcaklık Artışı</span><b>+${g.heat.toFixed(1)}°C</b></div></div>
      <div><h3>Gerçek Dünyada</h3>${bestReal.map((r) => `<p style="margin:0 0 6px">${r.text}</p>`).join('')}
      <h3>Bu Çizginin Tarihi</h3><div class="chain" style="max-height:280px;overflow:auto">${chronicle(false)}</div></div></div>
      <div class="mfoot"><span></span><button class="primary" id="mRe">YENİ DÖNGÜ</button></div>`);
    $('#mRe').onclick = () => start();
  }

  function intro() {
    modal(`<h2>Chronos Project: Son Döngü</h2>
    <p class="lead">Uzak gelecekte, zaman teknolojisini yasaklayan totaliter bir rejim insanlığı yok oluşa sürüklüyor. Fedakar bir kahraman, yasaklı tek prototipi kaçırıp 2070'e sığınıyor: Teknolojinin yeniden üretilebileceği son eşiğe.</p>
    <p class="lead">Sen, <b>Temporal Shift</b> gemisinin komutanısın. Bilim insanlarını, araştırmacıları ve eğitmenleri geçmişe bırak. Her sıçramada tarih yeniden akar ve 2070'in nasıl değiştiğini görürsün.</p>
    <p class="lead"><b>Hedef:</b> İkinci Prototip'in üç kolunu %100'e çıkarmak: Teknoloji, Ekosistem ve Barış. Çekirdek enerjin biterse her şey biter.</p>
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
    viewYear = 2070; sel = null; firstRun = false; lastKeys = new Set(); compareTl = null;
    renderAll(); closeModal();
    if (!seenIntro && !qs.has('skip')) intro();
  }
  CP.debug = { get G() { return G; }, renderAll, openPlanner, openRegion, showEnd, showBook, preventEvent, openEra, openMissions };

  $('#btnJump').onclick = () => openPlanner();
  $('#btnBook').onclick = showBook;
  $('#btnMute').onclick = () => { muted = !muted; $('#btnMute').textContent = muted ? 'Ses: Kapalı' : 'Ses: Açık'; };
  $('#btnEnd').onclick = () => { G.over = G.over || 'quit'; showEnd(); };
  void firstRun;
  buildMap(); resize(); start(); requestAnimationFrame(frame);
})();
