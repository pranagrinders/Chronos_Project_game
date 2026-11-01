// ARAYUZ: harita, paneller, sicrama akisi, raporlar, oyun sonu
(() => {
  const $ = (s) => document.querySelector(s);
  const { MAP, REGIONS, ERAS, ROLES, GLOBALS, REGION_VIEW, BUDGETS, PROJECTS, CARDS, QUOTES, REAL, ENDINGS, CATA, YEARS } = CP;
  const REG = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const BCOL = { mil: '#e5534b', ind: '#8a97a0', agri: '#c8953c', env: '#49c97b', edu: '#4b8fe0' };
  let G, viewYear = 2070, sel = null, replaying = false, guidedStart = true, seenIntro = false, compareTl = null, muted = false, lastKeys = new Set(), tourSeen = false;
  let savedRun = { status: 'none' }, saveNotice = '';

  const qs = new URLSearchParams(location.search);
  const FAST = qs.has('fast');
  const CINEMA = CP.cinema && !qs.has('classic');
  document.body.classList.toggle('storyMode', !!CINEMA);
  // Anlatı düzeni: sağ kolon yok. Solda ekip lideri, kartlar ve seyir ekranı, sağda büyük harita.
  if (CINEMA) {
    const header = $('#app>header'), leader = document.createElement('div');
    leader.id = 'leader';
    leader.innerHTML = '<img src="assets/cinema/cem.png" alt="Dr. Cem Sönmez, kurmaca oyun karakteri"><div><b>Dr. Cem Sönmez</b><small>Ekip lideri · Temporal Shift</small></div>';
    leader.lastElementChild.append($('#guide'));
    header.append(leader);
    $('#left').append($('#cardDrawer'), $('#legacyDrawer'), $('#dataDrawer'), $('#view'));
    $('#view').prepend($('#window'));
    $('#view>span').textContent = 'SEYİR EKRANI';
    const hint = document.createElement('p');
    hint.id = 'mapHint'; hint.textContent = 'Sıçramak için haritadan bir bölge seç';
    $('#mapWrap').append(hint);
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hist = (y) => { const h = G.tl.history; return h.find((s) => s.y === y) || h[h.length - 1]; };
  const score = (r) => (r.bio + r.water + r.soil + r.food + r.awareness * 0.5) / 4.5 - r.unrest * 0.25 - (r.war > 0 ? 18 : 0);

  function colorOf(v) {
    // kirmizi -> sari -> yesil
    const t = CP.clamp((v - 8) / 50, 0, 1);
    if (CINEMA) return `rgb(${[41 + 31*t, 57 + 35*t, 58 + 13*t].map(Math.round).join(',')})`;
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
  const uiSound = name => { if (muted) return; CP.sceneAudio.play('bridge'); CP.sceneAudio.cue(name); };
  const sfx = {
    click: () => CINEMA ? uiSound('select') : tone(520, 0.05, 'triangle', 0.03),
    jump: () => CINEMA ? uiSound('travel') : tone(90, 1.3, 'sawtooth', 0.05, 900),
    good: () => { if (CINEMA) return uiSound('positive'); tone(523, 0.14); setTimeout(() => tone(784, 0.2), 110); },
    bad: () => { if (CINEMA) return uiSound('caution'); tone(196, 0.3, 'square', 0.03); setTimeout(() => tone(147, 0.4, 'square', 0.03), 160); },
    mile: () => { if (CINEMA) return uiSound('positive'); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18), i * 90)); },
  };
  document.addEventListener('click', (e) => { if (!e.composedPath().some((node) => node.id === 'cinema') && e.target.closest('button')) sfx.click(); });
  let lastHover = -Infinity;
  const navigationCue = e => {
    if (!CINEMA || muted || !CP.sceneAudio.initialized || document.hidden) return;
    const control = e.target.closest?.('button:not(:disabled),.region');
    if (!control || control.contains(e.relatedTarget) || performance.now() - lastHover < 90) return;
    lastHover = performance.now(); CP.sceneAudio.cue('hover');
  };
  document.addEventListener('pointerover', navigationCue);
  document.addEventListener('focusin', navigationCue);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && CINEMA && !muted && !CP.cinema.active && CP.sceneAudio.initialized) CP.sceneAudio.play('bridge'); });
  document.addEventListener('chronos-sound', (e) => {
    muted = e.detail.muted;
    $('#btnMute').textContent = muted ? 'Ses: Kapalı' : 'Ses: Açık';
  });

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
      + '<g id="pins"></g><g id="marks"></g>';
    for (const r of REGIONS) {
      const el = $(`#r_${r.id}`);
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', r.name);
      el.onclick = () => openRegion(r.id);
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRegion(r.id); } };
    }
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

  // Tarih akarken yeni olaylar bölgenin üstünde + / − olarak yükselir.
  function popMarks(y) {
    if (reducedMotion) return;
    G.tl.log.filter((e) => e.y === y && e.r && e.kind !== 'org' && !lastKeys.has(e.y + e.text)).slice(0, 3).forEach((e, i) => {
      const [x, y2] = MAP.center[e.r], good = !!e.good, mark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      mark.setAttribute('x', x + i * 12); mark.setAttribute('y', y2 - 6);
      mark.setAttribute('class', 'popMark ' + (good ? 'pos' : 'neg'));
      mark.textContent = good ? '+' : '−';
      $('#marks').append(mark);
      setTimeout(() => mark.remove(), 1500);
    });
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

  // Dünya Nabzı: hedefleri besleyen göstergeler sürekli görünür.
  let pulsePrev = {};
  function renderPulse() {
    const y = viewYear, s = hist(y).global, base = (G.base.history.find((h) => h.y === hist(y).y) || G.base.final).global;
    const fresh = {};
    $('#pulse').innerHTML = Object.entries(CP.PULSE).map(([track, items]) => `<div class="pulseGroup" data-track="${track}"><b>${CP.TRACKS[track]}</b><div>${items.map((it) => {
      const v = s[it.key], d = v - base[it.key], min = it.key === 'ppm' ? 3 : 1;
      const better = it.bad ? d < 0 : d > 0, org = CP.ORGS.find((o) => o.key === it.key);
      const founded = G.orgs[it.key] != null;
      const progress = founded ? 100 : CP.clamp((CP.orgProgress(G, it.key) / CP.orgQuota(org)) * 100);
      fresh[it.key] = v;
      const changed = y === 2070 && !replaying && pulsePrev[it.key] != null && Math.abs(pulsePrev[it.key] - v) >= min;
      return `<span class="pulseChip${changed ? ' flash' : ''}${founded ? ' founded' : ''}" title="${org.name}: ${founded ? 'kuruldu' : 'gösterge yeterince iyileşince kurulur'}"><small>${it.name}</small><em>${Math.round(v)}${Math.abs(d) >= min ? `<u class="${better ? 'up' : 'dn'}">${d > 0 ? '↑' : '↓'}</u>` : ''}</em><i style="width:${progress}%"></i></span>`;
    }).join('')}</div></div>`).join('');
    if (y === 2070 && !replaying) pulsePrev = fresh;
  }
  // Gemi Vardiyası: sıçrama düğmesinin hemen yanında.
  function renderShift() {
    const hidden = !CINEMA || G.jumps === 0 || !!G.over;
    document.querySelectorAll('.shiftBar').forEach((bar) => {
      bar.hidden = hidden;
      if (hidden) return;
      bar.innerHTML = `<span class="shiftTitle"><b>GEMİ VARDİYASI</b><small>${G.shift.length} / ${CP.SHIFT_SLOTS} iş · sonraki sıçramaya</small></span>${CP.SHIFTS.map((x) => {
        const on = G.shift.includes(x.id), can = CP.shiftAvailable(G, x);
        return `<button data-shift="${x.id}" class="${on ? 'on' : ''}" aria-pressed="${on}" title="${x.desc}" ${(!can && !on) || replaying ? 'disabled' : ''}><b>${x.name}</b><small>${can ? x.gain : `Gemide ${ROLES[x.role].name.toLocaleLowerCase('tr-TR')} yok`}</small></button>`;
      }).join('')}`;
      bar.querySelectorAll('[data-shift]').forEach((b) => { b.onclick = () => { if (CP.toggleShift(G, b.dataset.shift)) { renderShift(); if (CINEMA) CP.sceneAudio.cue('select'); } }; });
    });
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
    $('#legacyCount').textContent = arr.length;
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
    $('#cardCount').textContent = G.hand.length + '/4';
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
    document.querySelectorAll('[data-y]').forEach((b) => { b.disabled = replaying; b.onclick = () => { if (replaying || G.over) return; viewYear = +b.dataset.y; renderAll(); }; });
    void span;
  }

  function guide() {
    const g = $('#guide');
    if (replaying) return;
    if (G.tl.catastrophe) { g.innerHTML = '<b class="dn">Bu tarih kıyametle bitiyor.</b> Tarih Kitabı\'ndan felaketi seç ya da son bir sıçrama yap.'; return; }
    if (!CP.canAct(G)) {
      g.innerHTML = CP.extractable(G).length
        ? '<b class="dn">Gemide kimse kalmadı.</b> Sol panelden bir üyeyi <b>Geri al</b>, ya da kart oyna. Geri almak bir tur sayılır.'
        : '<b class="dn">Tim tükendi.</b>';
      return;
    }
    if (guidedStart && G.jumps === 0) g.innerHTML = '<b>İlk görev:</b> Anadolu’da suyun izini değiştir. Hazır olduğunda ilk göreve başla.';
    else if (G.jumps === 0) g.innerHTML = '<b>Bir bölge seç.</b> Sorunu gör, geçmişe bir görev planla.';
    else if (G.jumps === 1) { const focus = CP.nextFocus ? CP.nextFocus(G) : null; g.innerHTML = focus ? `<b>${focus.label}.</b> ${focus.message.split('. ')[0].replace(/\.$/, '')}.` : '<b>2. adım:</b> Üç kol da dolmalı: Teknoloji, Ekosistem, Barış. Hangisi geride, ona bak.'; }
    else if (G.jumps === 2) g.innerHTML = '<b>İpucu:</b> <b>Tarih Kitabı</b>\'ndaki felaketleri seçip önlemeye gidebilirsin.';
    else if (G.jumps === 3) g.innerHTML = '<b>İpucu:</b> Akımlar kendi kendine yayılır. Kültürü yüksek bölgelerden başlatmak daha hızlıdır.';
    else g.innerHTML = `Hedef: <b>Üç kolu da %100'e çıkar.</b> Yeni üye ${CP.recruitIn(G)} tur sonra.`;
  }

  function renderAll() {
    CP.hud?.render(G); CP.hud?.setVisible(seenIntro || qs.has('skip') || G.jumps > 0);
    if (CINEMA) { if (!CP.cinema.active && CP.sceneAudio.initialized && !muted && !document.hidden) CP.sceneAudio.play('bridge'); }
    paintMap(); ticker(); renderPool(); renderPulse(); renderShift(); renderCrew(); renderCore(); renderDrops(); renderProto(); renderHand(); renderTimeline(); guide(); paintWindow();
    $('#btnJump').disabled = replaying || !!G.over || !CP.canAct(G) || G.energy < CP.minCost();
    $('#btnJump').textContent = guidedStart && G.jumps === 0 ? 'İLK GÖREVE BAŞLA' : CP.canAct(G) ? (CINEMA ? 'LİSTEDEN BÖLGE SEÇ' : 'SIÇRAMA HAZIRLIĞI') : 'GEMİDE KİMSE YOK';
    if (CINEMA) $('#mapHint').hidden = replaying || !!G.over || !CP.canAct(G) || G.energy < CP.minCost();
    $(`#r_ana`).classList.toggle('tutorialTarget', guidedStart && G.jumps === 0);
    $('#btnBook').disabled = replaying;
    $('#btnAch').disabled = replaying;
    $('#btnAch').textContent = `Başarımlar ${(G.ach || []).length}/${CP.achList().length}`;
    $('#btnEnd').disabled = replaying;
    $('#btnBridge').hidden = !CINEMA; $('#btnBridge').disabled = replaying || !!G.over;
    $('#btnSave').disabled = replaying || !!G.over;
    $('#saveStatus').textContent = saveNotice;
    $('#legacyDrawer').open = !CP.canAct(G) && CP.extractable(G).length > 0 ? true : $('#legacyDrawer').open;
  }

  // ---- Modal ----
  let returnFocus = null;
  const modal = (html) => {
    if ($('#modal').classList.contains('hidden')) returnFocus = document.activeElement;
    const box = $('#modalBox');
    box.innerHTML = html; $('#modal').classList.remove('hidden'); box.scrollTop = 0;
    CP.hud?.refresh(); CP.hud?.attach($('#modal')); CP.story?.bindVoices(box);
    if (CINEMA && CP.sceneAudio.initialized && !muted) { CP.sceneAudio.play('bridge'); CP.sceneAudio.cue('open'); }
    const title = box.querySelector('h2');
    if (title) { title.id = 'dialogTitle'; box.setAttribute('aria-labelledby', title.id); $('#modal').setAttribute('aria-labelledby', title.id); }
    else { box.removeAttribute('aria-labelledby'); $('#modal').removeAttribute('aria-labelledby'); }
    box.focus();
  };
  const closeModal = () => {
    CP.story?.stopVoice();
    if (CINEMA && !$('#modal').classList.contains('hidden')) CP.sceneAudio.cue('back');
    $('#modal').classList.add('hidden');
    CP.hud?.attach();
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  document.addEventListener('keydown', (e) => {
    if ($('#modal').classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      const back = $('#mClose') || $('#mCancel');
      if (back) { e.preventDefault(); back.click(); }
    }
    if (e.key !== 'Tab') return;
    const nodes = [...$('#modalBox').querySelectorAll('button:not(:disabled), summary, [tabindex="0"]')];
    if (!nodes.length) { e.preventDefault(); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === $('#modalBox'))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || document.activeElement === $('#modalBox'))) { e.preventDefault(); first.focus(); }
  });

  // ---- Bolge paneli ----
  function openRegion(id) {
    openRegionDetails(id);
  }
  function openRegionDetails(id) {
    if (replaying || G.over) return;
    if (guidedStart && G.jumps === 0) return firstBriefing();
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
    $('#mClose').onclick = () => { if (CINEMA) { sel = null; document.querySelectorAll('.region.sel').forEach((p) => p.classList.remove('sel')); } closeModal(); };
    $('#mPlan').onclick = () => openEra(id);
  }

  // ---- Sicrama akisi: her ekranda tek soru ----
  let plan;
  const yr = (y) => (y < 1000 ? 'M.S. ' + y : y);
  const stepHead = (n, t) => `<div class="stepBar">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div><h2>${t}</h2>`;

  function openPlanner() {
    if (replaying || G.over) return;
    if (guidedStart && G.jumps === 0) return firstBriefing();
    if (sel && !CINEMA) return openEra(sel);
    const crisis = [...REGIONS].sort((a, b) => score(G.tl.final.regions[a.id]) - score(G.tl.final.regions[b.id])).slice(0, 3).map((r) => r.id);
    modal(`${stepHead(1, 'Hangi bölge?')}<div class="shiftBar"></div><div class="optGrid regionChoices">${REGIONS.map((r) => `<button class="opt ${crisis.includes(r.id) ? 'crit' : ''}" data-reg="${r.id}"><b>${r.name}</b>${r.arch}${crisis.includes(r.id) ? ' · <span class="dn">KRİTİK</span>' : ''}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Vazgeç</button></div>`);
    renderShift();
    document.querySelectorAll('[data-reg]').forEach((b) => { b.onclick = () => openEra(b.dataset.reg); });
    $('#mClose').onclick = closeModal;
  }
  function openEra(region) {
    if (replaying || G.over) return;
    sel = region;
    document.querySelectorAll('.region').forEach((p) => p.classList.toggle('sel', p.id === 'r_' + region));
    modal(`${stepHead(2, `${REG[region].name}: Hangi çağa?`)}<div class="shiftBar"></div><div class="optGrid eraGrid">${ERAS.map((e) => `<button class="opt" data-era="${e.year}" ${G.energy >= e.cost ? '' : 'disabled'}><b>${yr(e.year)}</b><span class="costTag">${e.cost} enerji</span><br>${e.name}. ${e.desc}</button>`).join('')}</div>
      <div class="mfoot"><button id="mBack">Başka bölge</button><span style="color:var(--dim)">Çekirdek Enerjisi: %${Math.round(G.energy)}</span></div>`);
    renderShift();
    document.querySelectorAll('[data-era]').forEach((b) => { b.onclick = () => openMissions(region, +b.dataset.era); });
    $('#mBack').onclick = () => { sel = null; openPlanner(); };
  }
  const sentOf = (role) => G.ivs.filter((i) => i.kind === 'drop' && i.role === role).length;
  function missionCard(o, i, region) {
    const intel = G.crew.res > 0 ? CP.intel({ ...o, region }) : null;
    const name = o.current ? `Akım: ${o.current.name}` : o.event ? `Olayı Değiştir` : o.m.name;
    const desc = o.current ? `${o.current.desc} ${o.m.desc}` : o.event ? `<span class="dn">${o.event.y}: ${o.event.text}</span><br>${o.m.desc}` : CP.fill(o.m.desc, region, o.year);
    const request = CP.story?.request(o, CP.story.crewMember(o.role, sentOf(o.role))), person = request && CP.story.cast[request.speaker];
    return `<button class="opt mission" data-m="${i}">${CINEMA && person ? `<span class="missionRequester"><img src="assets/cinema/${person.image}" alt="${person.name}"><span><strong>${person.name}</strong><small>${person.role}</small></span></span><span class="missionQuote">${CP.story.esc(CP.fill(request.line, region, o.year))}</span>` : ''}<span class="roleTag ${o.role}">${ROLES[o.role].name}</span><b>${name}</b><span class="missionDesc">${desc}</span>
      <span class="missionWhy"><strong>Neden bu görev?</strong>${CP.missionReason(G, o, region)}</span>
      ${intel ? `<div class="intel">Rapor: ${intel.list.join(' · ')}<br>Dağılma riski: ${intel.risk}</div>` : '<div class="intel">Gemide araştırmacı yok: Rapor alınamıyor.</div>'}</button>`;
  }
  function openMissions(region, year) {
    if (replaying || G.over) return;
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
  // Sıçrama hizalama: üç zamanlama denemesi. Isabetler yakıtı düşürür, atlamak ya da ıskalamak ceza vermez.
  function alignJump(p, done) {
    const box = document.createElement('div'), rounds = CP.ALIGN_ROUNDS, base = CP.jumpCost(G, { ...p, alignDiscount: 0 });
    box.id = 'align'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'alignTitle');
    box.innerHTML = `<div class="alignBox"><p class="eyebrow">${yr(p.year)} · ${CP.regionName(p.region, p.year)}</p><h2 id="alignTitle">Sıçrama hizalama</h2>
      <p id="alignText">Işık altın bölgeye girince <b>Hizala</b>’ya bas. Her isabet yakıtı %${Math.round(CP.TUNE.alignPerHit * 100)} düşürür.</p>
      <div class="alignPips">${rounds.map(() => '<i></i>').join('')}</div>
      <div class="alignTrack"><i class="alignZone"></i><i class="alignMarker"></i></div>
      <div class="alignActions"><button id="alignSkip">Atla (indirim yok)</button><button class="primary" id="alignHit">Hizala</button></div></div>`;
    document.body.append(box);
    const hit = box.querySelector('#alignHit'), marker = box.querySelector('.alignMarker'), zone = box.querySelector('.alignZone');
    let round = 0, hits = 0, center = 0.5, t0 = performance.now(), live = true;
    const pos = (now) => CP.alignMarker((now - t0) / 1000, rounds[round].speed);
    const setRound = () => {
      center = 0.2 + Math.random() * 0.6; t0 = performance.now();
      zone.style.left = (center - rounds[round].zone / 2) * 100 + '%'; zone.style.width = rounds[round].zone * 100 + '%';
    };
    const frame = (now) => { if (!live) return; marker.style.left = pos(now) * 100 + '%'; requestAnimationFrame(frame); };
    const leave = (count) => { live = false; removeEventListener('keydown', keys, true); box.remove(); done(count); };
    const summary = () => {
      live = false;
      const after = CP.jumpCost(G, { ...p, alignDiscount: CP.alignDiscount(hits) });
      box.querySelector('#alignText').innerHTML = hits ? `<b>${hits} / ${rounds.length} isabet.</b> Sıçrama bedeli ${base} yerine <b>${String(after).replace('.', ',')} enerji</b>.` : `İsabet yok. Sıçrama bedeli <b>${base} enerji</b>, ceza yok.`;
      box.querySelector('.alignActions').innerHTML = '<button class="primary" id="alignGo">Devam →</button>';
      const go = box.querySelector('#alignGo'); go.onclick = () => leave(hits); go.focus();
    };
    hit.onclick = () => {
      const good = CP.alignHit(pos(performance.now()), center, rounds[round].zone);
      if (good) hits++;
      box.querySelectorAll('.alignPips i')[round].className = good ? 'good' : 'miss';
      if (CINEMA && CP.sceneAudio.initialized) CP.sceneAudio.cue(good ? 'positive' : 'caution');
      round++;
      if (round >= rounds.length) summary(); else setRound();
    };
    box.querySelector('#alignSkip').onclick = () => leave(0);
    const keys = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (box.querySelector('#alignSkip')) leave(0); else leave(hits); }
      if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); const nodes = [...box.querySelectorAll('button')], i = nodes.indexOf(document.activeElement); nodes[(i + 1) % nodes.length].focus(); }
    };
    addEventListener('keydown', keys, true);
    setRound(); hit.focus(); requestAnimationFrame(frame);
  }
  let tutorialHits = 0;
  function startMission(p) {
    if (replaying || G.over) return;
    if (p.tutorial) return beginMission(p, tutorialHits);
    if (FAST || !CINEMA) return beginMission(p, 0);
    alignJump(p, (hits) => beginMission(p, hits));
  }
  function beginMission(p, hits) {
    plan = { ...p, choices: [], logs: [], vet: G.vets[p.role] > 0, alignDiscount: CP.alignDiscount(hits), speaker: CP.story?.crewMember(p.role, sentOf(p.role)) };
    plan.stages = CP.stages(G, plan);
    if (!(CINEMA && plan.tutorial)) sfx.jump();
    renderStage(0);
  }
  function optTags(o, context) {
    const t = [];
    const preview = context && CP.choicePreview ? CP.choicePreview(context, o) : null;
    if ((o.mult || 1) > 1) t.push('<i class="tg up">Güç +</i>');
    if ((o.mult || 1) < 1) t.push('<i class="tg dn">Güç -</i>');
    if ((o.hz || 0) < 0 && (!preview || preview.reduced)) t.push('<i class="tg up">Kalıcılık +</i>');
    if ((o.hz || 0) > 0 && (!preview || preview.increased)) t.push('<i class="tg dn">Risk +</i>');
    if (o.hz && preview && !preview.reduced && !preview.increased) t.push('<i class="tg">Bu döngüde ek kalıcılık farkı yok</i>');
    if (o.grow) t.push('<i class="tg up">Zamanla büyür</i>');
    if (o.spread) t.push('<i class="tg up">Komşulara yayılır</i>');
    if (o.fx?.unrest > 0) t.push('<i class="tg dn">İsyan +</i>');
    if (o.fx?.unrest < 0) t.push('<i class="tg up">İsyan -</i>');
    return t.join('');
  }
  function renderStage(i) {
    const st = plan.stages[i];
    const decide = (o) => {
      plan.choices.push(o);
      plan.logs.push(CP.fill(o.log, plan.region, plan.year));
      if (i < 2) renderStage(i + 1); else runJump();
    };
    if (CINEMA) return CP.cinema.stage(G, plan, i, decide, () => { CP.cinema.close(); if (plan.tutorial) firstBriefing(); else openMissions(plan.region, plan.year); });
    const img = plan.year === 430 ? '<img class="fieldImg" src="assets/era430.jpg" alt="M.S. 430 saha operasyonu">' : '';
    const labels = ['Geliş', 'Kriz', 'Ayrılık'];
    modal(`${stepHead(4, `${yr(plan.year)} · ${CP.regionName(plan.region, plan.year)}`)}${i === 0 ? img : ''}
      ${plan.tutorial ? '<p class="eyebrow">İLK GÖREV · SUYUN İZİ</p>' : ''}
      <p style="margin:0;color:var(--dim)">${i === 0 ? `Temporal Shift iniş yaptı. ${ROLES[plan.role].name} görevde: ${plan.m.name}.` : `Görev sürüyor: ${plan.m.name}.`} <b style="color:var(--cy)">Karar ${i + 1}/3: ${labels[i]}</b></p>
      <h3>${st.title}</h3><p class="lead">${st.text}</p>
      <div class="optGrid">${st.opts.map((o, k) => `<button class="opt" data-f="${k}"><b>${o.t}</b>${optTags(o, plan)}</button>`).join('')}</div>
      <div class="mfoot"><button id="mCancel">Hazırlığa dön</button><span class="muted">${i < 2 ? 'Seçimlerini tamamlayana kadar enerji harcanmaz.' : `${CP.eraCost(G, plan.year)} enerji · Son seçimden sonra tarih yeniden hesaplanır.`}</span></div>`);
    $('#mCancel').onclick = () => plan.tutorial ? firstBriefing() : openMissions(plan.region, plan.year);
    document.querySelectorAll('[data-f]').forEach((b) => {
      b.onclick = () => {
        const o = st.opts[+b.dataset.f];
        decide(o);
      };
    });
  }

  // ---- Tarih yeniden akiyor ----
  function runJump() {
    CP.cinema?.close();
    closeModal();
    lastKeys = new Set(G.tl.log.map((e) => e.y + e.text));
    const rep = CP.jump(G, plan);
    rep.tutorial = !!plan.tutorial;
    guidedStart = false;
    rep.logs = plan.logs; rep.mName = plan.current ? plan.current.name : plan.m.name;
    replay(rep, () => showReport(rep));
  }
  function doExtract(id) {
    if (replaying || G.over) return;
    lastKeys = new Set(G.tl.log.map((e) => e.y + e.text));
    const rep = CP.extract(G, id);
    if (rep) { rep.extracted = true; replay(rep, () => showReport(rep)); }
  }
  function replay(rep, done) {
    CP.hud?.render(G);
    if (CINEMA && rep.tutorial) {
      replaying = true;
      $('#btnJump').disabled = true; $('#btnBook').disabled = true; $('#btnEnd').disabled = true;
      return CP.cinema.replay(G, rep, () => { replaying = false; viewYear = 2070; renderAll(); done(); });
    }
    replaying = true;
    compareTl = rep.before;
    renderCrew(); renderCore(); renderDrops(); renderHand();
    const steps = G.tl.history;
    const start = Math.max(0, steps.findIndex((s) => s.y >= (rep.iv?.year || 1970)));
    $('#guide').innerHTML = '<b>Tarih yeniden yazılıyor...</b> Kelebeğin kanat çırpışını izle.';
    $('#btnJump').disabled = true; $('#btnBook').disabled = true; $('#btnEnd').disabled = true;
    document.querySelectorAll('[data-c], [data-x], [data-y]').forEach((b) => { b.disabled = true; });
    const dur = FAST || reducedMotion ? 50 : 6000;
    const t0 = performance.now();
    const seq = steps.slice(start);
    const tick = (now) => {
      const i = Math.max(0, Math.min(seq.length - 1, Math.floor(((now - t0) / dur) * seq.length)));
      if (viewYear !== seq[i].y) popMarks(seq[i].y);
      viewYear = seq[i].y;
      paintMap(viewYear); ticker(viewYear); paintWindow(seq[i].global); renderTimeline(); renderPulse();
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
    return `<h3>${REG[id].name}, ${rep.after.final.y}</h3>` + rows.map((r) => `<div class="stat big2"><span>${r.n}</span><span><b>${Math.round(r.a)} → ${Math.round(r.b)}</b> · ${mag(r.d, r.inv)}</span></div>`).join('');
  }
  const evLine = (p) => `<div class="${p.bad ? 'bad' : ''}"><i>${p.y}</i>${p.text}${p.cause ? `<small class="cause">${p.cause}</small>` : ''}</div>`;
  function resourceBlock(rep) {
    const r = rep.resources; if (!r) return '';
    const f = (n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    return `<div class="resourceLedger"><h3>Bu Sıçramanın Kaynakları</h3><div class="stat"><span>Çekirdek enerjisi</span><b>${f(r.energyBefore)} → ${f(r.energyAfter)}</b></div><p>−${f(r.spent)} sıçrama · +${f(r.recovered)} ikmal${r.shipResearch ? ` · Gemi araştırması +${f(r.shipResearch)} teknoloji bonusu` : ''}</p></div>`;
  }
  function reportBody(rep) {
    const d = rep.diff, story = CP.reportStory(rep), { before, after } = CP.reportTracks(G, rep);
    const tags = { mine: 'Senin izin', world: 'Dünyada', bad: 'Dünyada', avoided: 'Önlendi', lost: 'Miras dağıldı' };
    const points = CP.butterfly(rep);
    const world = d.global.filter((x) => ['ppm', 'water', 'bio', 'unrest'].includes(x.k) && Math.abs(x.d) >= (x.k === 'ppm' ? 2 : 0.5)).slice(0, 3);
    const worldName = { ppm: ['Küresel karbon', true, ' ppm'], water: ['Küresel tatlı su', false, ''], bio: ['Biyoçeşitlilik', false, ''], unrest: ['İsyan riski', true, ''] };
    const r = rep.resources, f = (n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    return `<div class="reportCols"><section class="butterfly">${achStrip(rep.ach)}<h3>Kelebek Etkisi</h3><p class="bflyAction">${story.action}</p>
      <div class="bflyList">${points.map((p) => `<div class="bfly ${p.type}"><i>${p.y}</i><span>${p.text}<small>${tags[p.type]}</small></span></div>`).join('') || '<p class="muted">Bu kez tarihe yansıyan bir olay kaydedilmedi.</p>'}</div></section>
      <section class="reportData"><h3>İkinci Prototip</h3>${Object.entries(CP.TRACKS).map(([k, n]) => `<div class="stat"><span>${n}</span><span>%${Math.round(before[k])} → <b>%${Math.round(after[k])}</b></span></div>`).join('')}
      ${story.changes.length ? `<h3>${story.name}</h3>${story.changes.map((x) => `<div class="stat"><span>${x.label}</span><span>${Math.round(x.a)} → <b>${Math.round(x.b)}</b> ${mag(x.d, x.inverse)}</span></div>`).join('')}` : ''}
      ${world.length ? `<h3>Dünya</h3>${world.map((x) => `<div class="stat"><span>${worldName[x.k][0]}</span><span>${Math.round(x.a)} → <b>${Math.round(x.b)}${worldName[x.k][2]}</b> ${mag(x.d, worldName[x.k][1])}</span></div>`).join('')}` : ''}
      ${d.newMilestones.length ? `<h3>Yeni Eşikler</h3>${d.newMilestones.slice(0, 2).map((m) => `<div class="mile">★ ${REG[m.r].name}: ${m.name}</div>`).join('')}` : ''}
      ${r ? `<div class="stat reportEnergy"><span>Enerji</span><span>${f(r.energyBefore)} → <b>${f(r.energyAfter)}</b></span></div><p class="muted reportEnergyNote">−${f(r.spent)} sıçrama · +${f(r.recovered)} ikmal${r.saved ? ` · ${f(r.saved)} tasarruf` : ''}${r.shipResearch ? ` · Gemi araştırması +${f(r.shipResearch)} teknoloji bonusu` : ''}</p>` : ''}</section></div>`;
  }
  // Başarımlar: kazanılan satırlar rapora girer, sinema ekranında kısa bir bildirim çıkar.
  const achStrip = (list) => list?.length ? `<div class="achStrip">${list.slice(0, 3).map((a) => `<div class="achItem"><i>◆</i><span><b>${a.title}</b>${a.text}</span></div>`).join('')}${list.length > 3 ? `<small class="achMore">+${list.length - 3} başarım daha. Tümü Başarımlar listesinde.</small>` : ''}</div>` : '';
  function achToast(list) {
    for (const a of list) {
      const el = document.createElement('div');
      el.className = 'achToast'; el.setAttribute('role', 'status');
      el.innerHTML = `<i>◆</i><span><small>BAŞARIM</small><b>${a.title}</b>${a.text}</span>`;
      document.body.append(el);
      setTimeout(() => el.remove(), 6000);
    }
  }
  function showAchievements() {
    const got = new Map((G.ach || []).map((x) => [x.id, x]));
    const all = CP.achList(), row = (a) => {
      const rec = got.get(a.id);
      return `<div class="achRow ${rec ? 'got' : ''}"><i>${rec ? '◆' : '◇'}</i><span><b>${a.title}</b>${rec ? CP.achText(a, rec.r) : a.hint}</span></div>`;
    };
    modal(`<h2>Başarımlar</h2><p class="muted" style="margin:0 0 10px">Bu döngüde ${got.size} / ${all.length}. Kazandığın başarım sonraki sıçramalarda geri alınmaz.</p>
      <div class="achGrid">${[...all.filter((a) => got.has(a.id)), ...all.filter((a) => !got.has(a.id))].map(row).join('')}</div>
      <div class="mfoot"><span></span><button id="mClose">Kapat</button></div>`);
    $('#mClose').onclick = closeModal;
  }
  function showReport(rep, details = false) {
    if (!rep.ach) rep.ach = CP.checkAch(G);
    if (!(CINEMA && rep.tutorial && !details && !G.over)) {
      if (rep.diff.newMilestones.length) sfx.mile(); else if (rep.protoAfter > rep.protoBefore + 0.5) sfx.good(); else sfx.bad();
    }
    if (G.over) { CP.cinema?.close(); showEnd(rep); return; }
    if (CINEMA && rep.tutorial && !details) achToast(rep.ach);
    if (CINEMA && rep.tutorial && !details) return CP.cinema.result(G, rep,
      (card) => { CP.takeOffer(G, card); CP.cinema.close(); afterTurn(); },
      () => { CP.cinema.close(); showReport(rep, true); });
    const cards = G.offers.map((id) => CARDS.find((c) => c.id === id));
    modal(`${rep.tutorial ? '<p class="eyebrow">İLK SIÇRAMA TAMAMLANDI</p>' : ''}<h2>Kelebek Raporu</h2>${reportBody(rep)}
      ${rep.tutorial ? '<p class="tutorialNote">İlk izin oluştu. Şimdi üç hedef kolundan hangisinin geride olduğuna bak; sonraki bölgeyi, çağı ve görevi sen seçeceksin.</p>' : ''}
      ${G.tl.catastrophe ? `<div class="warn"><b>Bu tarih ${G.tl.catastrophe.y} yılında kıyametle bitiyor:</b> ${CATA[G.tl.catastrophe.type]}. Son Seans başladı.</div>` : ''}
      <h3>Sonraki görev için bir kart al ${G.hand.length >= 4 ? '(elin dolu)' : ''}</h3><div class="optGrid">${cards.map((c) => `<button class="card ${c.color}" data-off="${c.id}" ${G.hand.length >= 4 ? 'disabled' : ''}><b>${c.name}</b>${c.desc}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Kartsız devam</button></div>`);
    document.querySelectorAll('[data-off]').forEach((b) => { b.onclick = () => { CP.takeOffer(G, b.dataset.off); afterTurn(); }; });
    $('#mClose').onclick = () => { CP.takeOffer(G, null); afterTurn(); };
  }

  // İlk görevden sonra komuta ekranını bölge bölge tanıtır.
  const tourSteps = [
    { target: '#resourceHud .hudEnergy', title: 'Enerji', text: 'Her sıçrama enerji harcar, görevden sonra biraz geri gelir. Biterse döngü biter.' },
    { target: '#resourceHud .hudCrew', title: 'Ekibin', text: 'Her göreve bir uzman gider ve o çağda kalır. İki turda bir yeni üye seçersin; arada kişi gerekirse geçmişten geri alırsın, ama bu pahalıdır.' },
    { target: '#resourceHud .hudPrototype', title: 'Asıl hedefin', text: 'Teknoloji, Ekosistem ve Barış. Bir kol %100 olunca dünya gemiye yakıt gönderir. Üçü de %100 olunca ikinci makine tamamlanır ve oyunu kazanırsın.' },
    { target: '#pulse', title: 'Dünya Nabzı', text: 'Her hedefi beşer gösterge besler; burada iyileşen şey hedefi de doldurur. Bir göstergenin çubuğu dolunca dünya örgütü kurulur ve yönünü sen seçersin.' },
    { target: '#mapWrap', title: 'Dünya haritası', text: 'Renkler bölgelerin durumunu gösterir. Bir bölgeye bas; bilgileri açılır, sıçramayı oradan planlarsın.' },
    { target: '#tlBar', title: 'Zaman çizelgesi', text: 'Bir çağa bas, o yılın dünyasını haritada gör. Geçmişi değiştirdikçe bu çizgi de değişir.' },
    { target: '#cardDrawer', title: 'Karar kartların', text: 'Görev sonunda kazandığın kartlar burada durur. Açıp bir karta basarak oynarsın. En fazla 4 kart taşıyabilirsin.', open: true },
    { target: '#view', title: 'Seyir ekranı', text: 'Geminin penceresi. Dünya iyileştikçe yağmur diner, gökyüzü açılır.' },
    { target: '#ops .tabs', title: 'Gemi, Tarih Kitabı, Başarımlar', text: 'Gemi seni komuta güvertesine götürür. Tarih Kitabı, değiştirdiğin her olayı yıl yıl gösterir. Başarımlar, bu döngüde neleri başardığını ve sırada ne olduğunu listeler.' },
    { target: '#shiftBar', title: 'Gemi vardiyası', text: 'Her sıçramadan önce 2 iş seç: araştırma, medya, erzak. Gemide ilgili uzman olmalı; kimi göndereceğini buna göre düşün.' },
    { target: '#btnJump', title: 'Yeni görev', text: 'Haritadan bölge seçmek yerine buradaki listeyi de kullanabilirsin. Artık bölgeyi, çağı ve uzmanı sen seçiyorsun.' },
  ];
  function mapTour(done) {
    const tour = document.createElement('div');
    tour.id = 'tour'; tour.setAttribute('role', 'dialog'); tour.setAttribute('aria-modal', 'true'); tour.setAttribute('aria-labelledby', 'tourTitle');
    tour.innerHTML = '<div class="tourHole"></div><div class="tourTip"><small id="tourCount"></small><h3 id="tourTitle"></h3><p id="tourText" aria-live="polite"></p><div class="tourActions"><button id="tourSkip">Turu atla</button><button id="tourNext" class="primary"></button></div></div>';
    document.body.append(tour);
    const hole = tour.querySelector('.tourHole'), tip = tour.querySelector('.tourTip'), next = tour.querySelector('#tourNext');
    const drawer = $('#cardDrawer'), drawerWasOpen = drawer.open;
    let at = 0;
    const place = () => {
      const target = document.querySelector(tourSteps[at].target);
      if (!target) return;
      const r = target.getBoundingClientRect(), gap = 12, pad = 6;
      Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      const t = tip.getBoundingClientRect();
      const below = r.bottom + pad + gap + t.height <= innerHeight, above = r.top - pad - gap - t.height >= 0;
      const top = below ? r.bottom + pad + gap : above ? r.top - pad - gap - t.height : Math.max(gap, (innerHeight - t.height) / 2);
      tip.style.top = top + 'px';
      tip.style.left = Math.max(gap, Math.min(innerWidth - t.width - gap, r.left + r.width / 2 - t.width / 2)) + 'px';
    };
    const show = () => {
      const step = tourSteps[at];
      drawer.open = step.open ? true : drawerWasOpen;
      document.querySelector(step.target)?.scrollIntoView?.({ block: 'nearest' });
      tour.querySelector('#tourCount').textContent = `KOMUTA EKRANI · ${at + 1} / ${tourSteps.length}`;
      tour.querySelector('#tourTitle').textContent = step.title;
      tour.querySelector('#tourText').textContent = step.text;
      next.textContent = at === tourSteps.length - 1 ? 'Anladım' : 'Sonraki →';
      place(); next.focus();
    };
    const finish = () => { removeEventListener('resize', place); drawer.open = drawerWasOpen; tour.remove(); done(); };
    next.onclick = () => { if (at === tourSteps.length - 1) finish(); else { at++; show(); } };
    tour.querySelector('#tourSkip').onclick = finish;
    tour.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === next ? tour.querySelector('#tourSkip') : next).focus(); }
    });
    addEventListener('resize', place);
    show();
  }
  function afterTurn() {
    persistRun();
    closeModal(); renderAll();
    if (CINEMA && !FAST && !G.over && G.jumps === 1 && !tourSeen) { tourSeen = true; return mapTour(continueTurn); }
    continueTurn();
  }
  // Dünya örgütü: gösterge kotayı aşınca kurulur, oyuncu yönünü seçer.
  function showOrg(org) {
    if (CINEMA && CP.sceneAudio.initialized) CP.sceneAudio.cue('positive');
    modal(`<p class="eyebrow orgRise">▲ ${org.rise.toLocaleUpperCase('tr-TR')} · DÜNYA ÖRGÜTÜ KURULDU</p><h2>${org.name}</h2>${CINEMA ? CP.story.dialogue(org.speaker, org.text) : `<p class="lead">${org.text}</p>`}
      <h3>Örgütü nasıl yönlendireceksin?</h3><div class="optGrid orgGrid">${org.opts.map((o, i) => `<button class="opt" data-org="${i}"><b>${o.t}</b><span class="missionDesc">${o.note}</span></button>`).join('')}</div>`);
    document.querySelectorAll('[data-org]').forEach((b) => {
      b.onclick = () => {
        const r = CP.answerOrg(G, org, +b.dataset.org);
        const earned = CP.checkAch(G);
        persistRun(); renderAll();
        if (G.over) { closeModal(); return showEnd(); }
        const rows = Object.entries(CP.TRACKS).map(([k, n]) => `<div class="stat"><span>${n}</span><b>%${Math.round(r.tracksBefore[k])} → %${Math.round(r.tracksAfter[k])}</b></div>`).join('');
        modal(`<p class="eyebrow">${org.name}</p><h2>${r.opt.t}</h2><p class="lead">${r.opt.note} Etkisi 2030’dan itibaren tarihe işlendi.</p>${achStrip(earned)}${rows}${r.energyAfter !== r.energyBefore ? `<div class="stat"><span>Enerji</span><b>${Math.round(r.energyBefore)} → ${Math.round(r.energyAfter)}</b></div>` : ''}<div class="mfoot"><span></span><button class="primary" id="mNext">Devam</button></div>`);
        $('#mNext').onclick = () => { closeModal(); continueTurn(); };
        $('#mNext').focus();
      };
    });
  }
  // Yeni üye seçimi: her rol için sıradaki kişi gösterilir.
  function showRecruit() {
    const line = 'Komutan, dünyanın dört bir yanından gönüllü başvuruları var. Bu tur bir kişiyi gemiye alabiliriz. Sıradaki görev için kime ihtiyacın var?';
    modal(`<p class="eyebrow">YENİ ÜYE · ${CP.TUNE.recruitEvery} TURDA BİR</p><h2>Ekibe kim katılsın?</h2>${CINEMA ? CP.story.dialogue('cem', line) : `<p class="lead">${line}</p>`}
      <div class="optGrid recruitGrid">${Object.entries(ROLES).map(([k, r]) => {
        const person = CP.story?.cast[CP.story.crewId(k, sentOf(k) + G.crew[k])];
        return `<button class="opt recruit" data-recruit="${k}">${person ? `<img src="assets/cinema/${person.image}" alt=""><b>${person.name}</b>` : ''}<span class="recruitRole">${r.name}</span><span class="missionDesc">Şu an ${G.crew[k]} kişi var. Gemideyken ${r.onBase.replace('Üste kaldığında: ', '')}</span></button>`;
      }).join('')}</div>`);
    document.querySelectorAll('[data-recruit]').forEach((b) => {
      b.onclick = () => { CP.recruit(G, b.dataset.recruit); persistRun(); closeModal(); renderAll(); continueTurn(); };
    });
  }
  // Tamamlanan kol: dünyadan gemiye yakıt gelir.
  function showFuel(f) {
    const s = CP.FUEL[f.k];
    if (CINEMA && CP.sceneAudio.initialized) CP.sceneAudio.cue('positive');
    G.fuelShown = (G.fuelShown || 0) + 1; persistRun(); renderAll();
    const fmt = (n) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    modal(`<p class="eyebrow orgRise">▲ ${s.rise.toLocaleUpperCase('tr-TR')} · YAKIT İKMALİ</p><h2>${s.title}</h2>${CINEMA ? CP.story.dialogue('cem', s.text) : `<p class="lead">${s.text}</p>`}
      <div class="stat"><span>Çekirdek enerjisi</span><b>+${fmt(f.gain)}</b></div>
      <div class="mfoot"><span></span><button class="primary" id="mNext">Devam</button></div>`);
    $('#mNext').onclick = () => { closeModal(); continueTurn(); };
    $('#mNext').focus();
  }
  function continueTurn() {
    const fuel = CP.nextFuel(G);
    if (fuel) return showFuel(fuel);
    if (CP.recruitDue(G)) return showRecruit();
    const org = CP.nextOrg(G);
    if (org) return showOrg(org);
    const ctx = CP.nextLetter(G);
    if (ctx) showLetter(ctx);
  }
  function openBridge() {
    if (!CINEMA || replaying || G.over) return;
    closeModal();
    CP.cinema.home(G,
      () => { CP.cinema.close(); openPlanner(); },
      () => { CP.cinema.close(); renderAll(); },
      () => { CP.cinema.close(); showBook(); }, saveNotice);
  }
  function persistRun() {
    if (!CP.store) return;
    G.tutorialGuided = guidedStart;
    const result = CP.store.write(G);
    saveNotice = result.ok ? 'Döngü bu tarayıcıda kaydedildi. Sayfayı yenileyince devam edebilirsin.' : result.message;
    $('#saveStatus').textContent = saveNotice;
    if (result.ok) savedRun = CP.store.inspect();
  }
  function resumeGame() {
    const result = CP.store.read();
    if (!result.ok) { savedRun = { status: 'invalid' }; saveNotice = result.message; intro(); return; }
    G = result.game; seenIntro = true; guidedStart = !!G.tutorialGuided && G.jumps === 0;
    viewYear = 2070; sel = null; compareTl = null; lastKeys = new Set();
    saveNotice = 'Kayıt açıldı. Dünya, önceki kararlarından yeniden hesaplandı.';
    CP.cinema?.close(); closeModal(); renderAll();
    if (G.over) return showEnd();
    if (guidedStart) return firstBriefing();
    if (CP.nextFuel(G)) return showFuel(CP.nextFuel(G));
    if (CP.recruitDue(G)) return showRecruit();
    const org = CP.nextOrg(G);
    if (org) return showOrg(org);
    const ctx = CP.nextLetter(G);
    if (ctx) return showLetter(ctx);
    if (CINEMA) openBridge();
  }
  // Vakiftan mektup
  function showLetter(ctx) {
    const m = CP.missionById(ctx.iv.mission);
    if (CINEMA && CP.sceneAudio.initialized) CP.sceneAudio.cue('letter');
    modal(`<h2>Geçmişten Bir Mektup</h2>${CINEMA ? CP.story.dialogue('cem', `${CP.regionName(ctx.iv.region, ctx.year)} içindeki ${m.name} kuruluşunun mirasçılarından bir mektup var. Size okuyorum: ${ctx.letter.text}`) : ''}<p style="margin:0;color:var(--dim)">${yr(ctx.year)}, ${CP.regionName(ctx.iv.region, ctx.year)}. Kurduğun "${m.name}" görevinin mirasçılarından. Yanıtlamak sıçrama harcatmaz.</p>
      <h3>${ctx.letter.title}</h3><p class="lead">${ctx.letter.text}</p>
      <div class="optGrid">${ctx.letter.opts.map((o, i) => `<button class="opt" data-l="${i}"><b>${o.t}</b>${optTags(o)}</button>`).join('')}</div>
      <div class="mfoot"><button id="mClose">Mektubu yanıtsız bırak</button></div>`);
    document.querySelectorAll('[data-l]').forEach((b) => {
      b.onclick = () => {
        const o = ctx.letter.opts[+b.dataset.l];
        const rep = CP.answerLetter(G, ctx, o);
        persistRun();
        renderAll();
        if (G.over) return showEnd();
        modal(`<h2>Mektuba Yanıt</h2>${CINEMA ? CP.story.dialogue('cem', 'Yanıtını kayda geçirdim. Şimdi aynı bölgenin önceki ve yeni ölçümlerine bakalım; her kazanımın başka bir etkisi olabilir.') : ''}<div class="chain"><div><i>${ctx.year}</i>${CP.fill(o.log, ctx.iv.region, ctx.year)}</div></div>
          ${localBlock(ctx.iv.region, rep)}<div class="mfoot"><button id="mClose">Devam</button></div>`);
        $('#mClose').onclick = () => { closeModal(); if (CP.nextFuel(G)) showFuel(CP.nextFuel(G)); };
      };
    });
    $('#mClose').onclick = () => { G.lastLetter = G.jumps; persistRun(); closeModal(); };
  }

  // ---- Kartlar ----
  function useCard(i) {
    if (replaying || G.over) return;
    if (guidedStart && G.jumps === 0) return firstBriefing();
    const c = CARDS.find((x) => x.id === G.hand[i]);
    const fire = (region) => {
      const rep = CP.playCard(G, i, region);
      closeModal();
      if (!rep) return;
      persistRun();
      renderAll();
      if (G.over) return showEnd(rep);
      if (rep.diff.newMilestones.length) sfx.mile(); else sfx.good();
      modal(`<h2>${c.name}</h2>${reportBody(rep)}<div class="mfoot"><button id="mClose">Tamam</button></div>`);
      $('#mClose').onclick = () => { closeModal(); if (CP.nextFuel(G)) showFuel(CP.nextFuel(G)); };
    };
    if (!c.target) return fire();
    modal(`<h2>${c.name}</h2><p class="lead">${c.desc}</p><div class="optGrid regionChoices">${REGIONS.map((r) => `<button class="opt" data-t="${r.id}"><b>${r.name}</b></button>`).join('')}</div><div class="mfoot"><button id="mClose">Vazgeç</button></div>`);
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
    CP.checkAch(G);
    persistRun();
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
      <div class="mfoot"><button id="mAch">Başarımlar ${(G.ach || []).length}/${CP.achList().length}</button><button class="primary" id="mRe">YENİ DÖNGÜ</button></div>`);
    $('#mAch').onclick = () => { showAchievements(); $('#mClose').textContent = 'Döngü sonuna dön'; $('#mClose').onclick = showEnd; };
    $('#mRe').onclick = () => start();
  }

  function firstBriefing() {
    CP.hud?.setVisible(true);
    const p = CP.firstMission(G);
    if (!p) { guidedStart = false; renderAll(); return openPlanner(); }
    if (CINEMA) return CP.cinema.briefing(G, p, () => startMission(p), FAST ? null : (go) => alignJump(p, (hits) => { tutorialHits = hits; go(); }));
    modal(`<p class="eyebrow">İLK GÖREV · 2070 → M.S. 430</p><h2>Suyun izi</h2>
      <div class="briefing"><div><p class="lead">Anadolu’nun geleceğinde bir havzayı korumayı deneyeceğiz.</p>
      <p>${CP.missionReason(G, p, 'ana')}</p>
      <p>M.S. 430’da Kızılırmak kıyısına bir araştırmacı bırak. Bir koruma alanı kur ve mirasının nasıl yaşayacağına üç kararla yön ver.</p></div>
      <dl><div><dt>Hedef</dt><dd>Koruma Toprakları Kur</dd></div><div><dt>Ekip</dt><dd>1 araştırmacı</dd></div><div><dt>Bedel</dt><dd>20 enerji</dd></div></dl></div>
      <p class="tutorialNote">Önce karar verirsin. Sonra tarih yeniden akar; raporda kararının izini ve ölçülen sonucu görürsün. Uzun vadeli mirasın sürmesi garanti değildir.</p>
      <div class="mfoot"><button id="mClose">Komuta merkezine dön</button><button class="primary" id="mFirst">Göreve başla</button></div>`);
    $('#mClose').onclick = closeModal;
    $('#mFirst').onclick = () => startMission(p);
  }

  function intro() {
    CP.hud?.setVisible(false);
    if (CINEMA) return CP.cinema.intro(G,
      () => { seenIntro = true; CP.cinema.prologue(firstBriefing); },
      { summary: savedRun.status === 'ready' ? savedRun.summary : null, onResume: resumeGame,
        notice: savedRun.status === 'invalid' ? 'Önceki kayıt açılamıyor; üzerine yazılmadı. Yeni döngüye başlayabilirsin.' : savedRun.status === 'unavailable' ? 'Tarayıcının kayıt alanına erişilemiyor; bu sekmede oynamaya devam edebilirsin.' : '' });
    modal(`<p class="eyebrow">TEMPORAL SHIFT · KOMUTAN BRİFİNGİ</p><h2>Gelecek, geçmişte başlar.</h2>
      <p class="lead">Zaman teknolojisini yasaklayan totaliter bir rejimden kaçırılan tek prototip, seni 2070’e getirdi. Dünyanın ve ikinci bir prototipin geleceği, geçmişte bırakacağın izlere bağlı.</p>
      <ol class="introSteps"><li><b>Bir görev bırak.</b><span>Uzmanını geçmişe gönder, üç karar ver.</span></li><li><b>Tarihin değişimini izle.</b><span>Mirasının kuşaklar sonraki izlerini gör.</span></li><li><b>Üç kolu tamamla.</b><span>Teknoloji, Ekosistem ve Barış: hepsi %100.</span></li></ol>
      <p class="muted">İlk görev Anadolu’da. Ekip üyesi ve enerji harcarsın; her kararın bir bedeli olabilir.</p>
      ${savedRun.status === 'ready' ? `<p class="saveNote">Kayıtlı döngü: ${savedRun.summary.jumps} sıçrama · %${Math.round(savedRun.summary.energy)} enerji.</p><button class="primary" id="mResume">${savedRun.summary.over ? 'Son döngüyü gör' : 'Döngüye devam et'}</button>` : ''}
      <div class="mfoot"><button id="mFree">Keşfederek başla</button><button class="primary" id="mGo">İlk göreve başla</button></div>`);
    $('#mGo').onclick = () => { seenIntro = true; firstBriefing(); };
    if ($('#mResume')) $('#mResume').onclick = resumeGame;
    $('#mFree').onclick = () => { seenIntro = true; guidedStart = false; closeModal(); renderAll(); };
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
    if (reducedMotion) { windowHealth = windowTarget; frame(); }
  }
  function resize() {
    const host = CINEMA ? $('#view') : null;
    cv.width = host ? Math.max(1, host.clientWidth) : innerWidth;
    cv.height = host ? Math.max(1, host.clientHeight) : innerHeight;
    if (reducedMotion && G) frame();
  }
  if (CINEMA && globalThis.ResizeObserver) new ResizeObserver(resize).observe($('#view'));
  addEventListener('resize', resize);
  function frame() {
    if (CP.cinema?.active) { if (!reducedMotion) requestAnimationFrame(frame); return; }
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
    const rain = reducedMotion ? 0 : Math.round((CINEMA ? 60 : 160) * (1 - h));
    while (drops.length < rain) drops.push([Math.random() * W, Math.random() * H, 8 + Math.random() * 12]);
    drops.length = rain;
    ctx.strokeStyle = 'rgba(150,190,210,.22)'; ctx.beginPath();
    for (const d of drops) { ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0] - 2, d[1] + d[2]); d[1] += d[2]; if (d[1] > H) d[1] = -20; }
    ctx.stroke();
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  function start() {
    const seed = qs.has('seed') ? +qs.get('seed') : undefined;
    G = CP.newGame(seed);
    if (CP.store) { G.saveId = CP.newSaveId(); savedRun = CP.store.inspect(); }
    saveNotice = savedRun.status === 'unavailable' ? 'Bu tarayıcıda kayıt alanına erişilemiyor.' : '';
    CP.cinema?.close();
    viewYear = 2070; sel = null; guidedStart = !seenIntro && !qs.has('skip'); lastKeys = new Set(); compareTl = null;
    for (const id of ['legacyDrawer', 'cardDrawer', 'dataDrawer']) $('#' + id).open = !!CINEMA && id === 'cardDrawer';
    renderAll(); closeModal();
    if (!seenIntro && !qs.has('skip')) intro();
  }
  CP.debug = { get G() { return G; }, renderAll, openPlanner, openRegion, showEnd, showBook, preventEvent, openEra, openMissions };

  $('#btnJump').onclick = () => openPlanner();
  $('#btnBook').onclick = showBook;
  $('#btnAch').onclick = showAchievements;
  $('#btnBridge').onclick = openBridge;
  $('#btnSave').onclick = () => { if (!replaying && !G.over) persistRun(); };
  $('#btnMute').onclick = () => { muted = !muted; CP.cinema?.setMuted(muted); $('#btnMute').textContent = muted ? 'Ses: Kapalı' : 'Ses: Açık'; };
  $('#btnEnd').onclick = () => { G.over = G.over || 'quit'; showEnd(); };
  buildMap(); resize(); start(); requestAnimationFrame(frame);
})();
