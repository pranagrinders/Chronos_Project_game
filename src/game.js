// OYUN KURALLARI: enerji, tim, gorevler, kartlar, mektuplar, kazanma/kaybetme. UI bilmez.
globalThis.CP = globalThis.CP || {};
(() => {
  const { ERAS, ROLES, CARDS, FIELD, MISSIONS, BLOCK_MISSION, CURRENTS, FINALS, LETTERS, ORGS, SHIFTS } = CP;
  const clamp = CP.clamp;

  // Prototip kollari: baslangic tarihi ile hedef arasi olcekleme (tools/balance.mjs ile ayarlanir)
  CP.TUNE = { gain: { tech: 122, eco: 39, peace: 37 }, alignPerHit: 0.08, supply: 2, orgPower: 0.5, orgQuota: 2 };
  const BASE = 10;
  CP.TRACKS = { tech: 'Teknoloji', eco: 'Ekosistem', peace: 'Barış' };

  CP.newGame = function newGame(seed = (Date.now() % 1e9)) {
    const G = {
      seed, energy: 100, crew: Object.fromEntries(Object.keys(ROLES).map((k) => [k, ROLES[k].start])),
      vets: { sci: 0, res: 0, edu: 0 }, ivs: [], hand: [], jumps: 0, protoBonus: 0, patch: 1,
      nextId: 1, doomed: false, over: null, offers: [], letters: 0, orgs: {}, shift: [], ach: [],
    };
    G.base = CP.simulate(seed, []);
    G.tl = G.base;
    G.hand = ['fon', 'medya'];
    return G;
  };

  CP.tracks = (G, tl = G.tl) => {
    if (tl.catastrophe) return { tech: 0, eco: 0, peace: 0 };
    const out = {};
    for (const k of Object.keys(CP.TUNE.gain)) out[k] = clamp(BASE + ((tl.raw[k] - G.base.raw[k]) / CP.TUNE.gain[k]) * (100 - BASE));
    out.tech = clamp(out.tech + G.protoBonus);
    return out;
  };
  CP.proto = (G, tl = G.tl) => {
    const t = CP.tracks(G, tl);
    return (t.tech + t.eco + t.peace) / 3;
  };

  CP.eraCost = (G, year) => CP.eraFor(year).cost;
  CP.minCost = () => Math.min(...ERAS.map((e) => e.cost));
  // Sıçrama hizalama: isabet başına %10 yakıt indirimi. Iskalamanın cezası yok.
  CP.ALIGN_ROUNDS = [{ zone: 0.2, speed: 0.75 }, { zone: 0.15, speed: 1 }, { zone: 0.11, speed: 1.3 }];
  CP.alignDiscount = (hits) => clamp(hits, 0, 3) * CP.TUNE.alignPerHit;
  CP.alignMarker = (seconds, speed) => { const x = (seconds * speed) % 2; return x < 1 ? x : 2 - x; };
  CP.alignHit = (marker, center, zone) => Math.abs(marker - center) <= zone / 2;
  // Gemi Vardiyası
  CP.SHIFT_SLOTS = 2;
  CP.shiftAvailable = (G, s) => G.jumps > 0 && G.crew[s.role] > 0;
  CP.toggleShift = (G, id) => {
    const s = SHIFTS.find((x) => x.id === id);
    if (!s) return false;
    if (G.shift.includes(id)) { G.shift = G.shift.filter((x) => x !== id); return true; }
    if (!CP.shiftAvailable(G, s) || G.shift.length >= CP.SHIFT_SLOTS) return false;
    G.shift = [...G.shift, id];
    return true;
  };
  // Gerçek sıçrama bedeli: çağ bedeli, erzak ve hizalama indirimi.
  CP.jumpCost = (G, plan) => {
    const base = CP.eraCost(G, plan.year) - (G.shift.includes('supply') ? CP.TUNE.supply : 0);
    return Math.max(1, Math.round(base * (1 - (plan.alignDiscount || 0)) * 10) / 10);
  };
  // Dünya örgütleri
  const warCount = (tl) => tl.log.filter((e) => e.id === 'war').length;
  const pulseItem = (key) => Object.values(CP.PULSE).flat().find((i) => i.key === key);
  CP.orgProgress = (G, key) => {
    if (G.tl.catastrophe) return 0;
    if (key === 'wars') return warCount(G.base) - warCount(G.tl);
    const now = G.tl.final.global[key], base = G.base.final.global[key];
    return pulseItem(key)?.bad ? base - now : now - base;
  };
  CP.orgQuota = (org) => (org.key === 'wars' ? org.quota : org.quota * CP.TUNE.orgQuota);
  CP.nextOrg = (G) => {
    if (G.over || G.jumps < 2 || G.lastOrg === G.jumps) return null;
    let best = null, top = 1;
    for (const org of ORGS) {
      if (G.orgs[org.key] != null) continue;
      const ratio = CP.orgProgress(G, org.key) / CP.orgQuota(org);
      if (ratio >= top) { top = ratio; best = org; }
    }
    return best;
  };
  CP.orgFx = (opt) => opt.fx ? Object.fromEntries(Object.entries(opt.fx).map(([k, v]) => [k, v * CP.TUNE.orgPower])) : undefined;
  CP.answerOrg = (G, org, index) => {
    const opt = org.opts[index], before = G.tl, tracksBefore = CP.tracks(G), energyBefore = G.energy;
    G.orgs[org.key] = index; G.lastOrg = G.jumps;
    if (opt.energy) G.energy = Math.min(100, G.energy + opt.energy);
    if (opt.proto) G.protoBonus += opt.proto;
    if (opt.crew) addVolunteer(G);
    G.ivs.push({ id: 'o' + G.nextId++, kind: 'org', year: 2030, org: org.key, choice: index, fxAll: CP.orgFx(opt), text: `${org.name}: ${opt.t}.` });
    G.tl = resim(G, G.ivs);
    checkEnd(G, true);
    return { org, opt, before, after: G.tl, tracksBefore, tracksAfter: CP.tracks(G), energyBefore, energyAfter: G.energy };
  };
  // Başarımlar: kazanılan kalır, sonraki sıçramalar geri almaz. Simülasyona dokunmaz.
  CP.achList = () => [...CP.ACH_WORLD, ...CP.ACH_REGION];
  CP.achText = (a, region) => a.text.replace('{r}', region ? CP.REGIONS.find((r) => r.id === region).name : '');
  CP.checkAch = (G) => {
    G.ach = G.ach || [];
    const have = new Set(G.ach.map((x) => x.id)), fresh = [];
    const earn = (a, region) => { const rec = region ? { id: a.id, r: region } : { id: a.id }; G.ach.push(rec); have.add(a.id); fresh.push({ ...a, text: CP.achText(a, region) }); };
    const drops = G.ivs.filter((i) => i.kind === 'drop');
    const live = !G.tl.catastrophe;
    const dead = new Set(G.tl.log.filter((e) => e.kind === 'legacy').map((e) => e.iv));
    const h = {
      drops, alive: live ? drops.filter((d) => !dead.has(d.id) && d.extractedAt == null) : [],
      warsAvoided: live ? warCount(G.base) - warCount(G.tl) : 0, tracks: CP.tracks(G),
      heatDrop: live ? G.base.final.global.heat - G.tl.final.global.heat : 0,
      ppmDrop: live ? G.base.final.global.ppm - G.tl.final.global.ppm : 0,
    };
    for (const a of CP.ACH_WORLD) if (!have.has(a.id) && a.test(G, h)) earn(a);
    if (live) for (const a of CP.ACH_REGION) {
      if (have.has(a.id)) continue;
      const meets = (r) => (a.min != null ? r[a.key] >= a.min : r[a.key] <= a.max);
      const hit = CP.REGIONS.filter((r) => meets(G.tl.final.regions[r.id]) && !meets(G.base.final.regions[r.id]))
        .sort((x, y) => Math.abs(G.tl.final.regions[y.id][a.key] - G.base.final.regions[y.id][a.key]) - Math.abs(G.tl.final.regions[x.id][a.key] - G.base.final.regions[x.id][a.key]))[0];
      if (hit) earn(a, hit.id);
    }
    return fresh;
  };
  const roleFor = (G, m) => m.roles.find((r) => G.crew[r] > 0) || null;
  CP.roleFor = roleFor;

  // Bu bolge ve cag icin 3 gorev: bolgenin ihtiyacina gore, her seferinde cesitli
  CP.offerMissions = function offerMissions(G, region, year) {
    const r = G.tl.final.regions[region];
    const g = G.tl.final.global;
    const usedHere = new Set(G.ivs.filter((i) => i.kind === 'drop' && i.region === region).map((i) => i.mission));
    const cands = MISSIONS.filter((m) => !m.tutorialOnly && year >= m.from && year <= m.to && roleFor(G, m))
      .map((m) => ({ m, s: m.need(r, g) * (usedHere.has(m.id) ? 0.4 : 1) + CP.hash01(G.seed, 'off', G.jumps, region, year, m.id) * 45 }))
      .sort((a, b) => b.s - a.s).map((x) => x.m);
    const out = [];
    const nextEra = ERAS.find((e) => e.year > year)?.year ?? 2070;
    const ev = G.tl.log.find((e) => e.r === region && e.kind === 'major' && !e.good && e.y >= year && e.y < nextEra && e.y >= 500);
    if (ev && CP.canBlock(G, ev)) out.push({ m: BLOCK_MISSION, role: roleFor(G, BLOCK_MISSION), event: ev, year: Math.max(430, ev.y - 10) });
    // Once farkli rollerden gorev sec, boylece oyuncuya gercek bir tercih kalir
    const roles = new Set(out.map((o) => o.role));
    const ordered = [...cands.filter((m) => { const r = roleFor(G, m); if (roles.has(r)) return false; roles.add(r); return true; })];
    for (const m of cands) if (!ordered.includes(m)) ordered.push(m);
    for (const m of ordered) {
      if (out.length >= 3) break;
      const o = { m, role: roleFor(G, m), year };
      if (m.current) {
        const pool = CURRENTS.filter((c) => year >= c.from && year <= c.to);
        o.current = pool[Math.floor(CP.hash01(G.seed, 'curr', G.jumps, region, year) * pool.length)];
      }
      out.push(o);
    }
    return out;
  };

  CP.canBlock = (G, ev) => {
    if (!ev || ev.good || ev.kind !== 'major' || ev.y < 500) return false;
    if (G.ivs.some((i) => i.block && i.block.key === ev.id && i.block.region === ev.r && i.block.y === ev.y)) return false;
    return !!roleFor(G, BLOCK_MISSION) && G.energy >= CP.eraCost(G, Math.max(430, ev.y - 10));
  };

  // Gorevin uc karari: gelis, kriz, final
  CP.stages = function stages(G, plan) {
    const f = FIELD.filter((x) => x.role === plan.role && plan.year >= x.from && plan.year <= x.to);
    const arrive = f[Math.floor(CP.hash01(G.seed, 'field', G.jumps, plan.role, plan.region) * f.length)];
    return [arrive, plan.m.crisis, FINALS].map((s) => ({ ...s, text: CP.fill(s.text, plan.region, plan.year) }));
  };

  const makeDrop = (G, plan) => ({
    ...(G.shift?.includes('media') ? { power: 1.1 } : {}),
    id: 'd' + G.nextId, kind: 'drop', role: plan.role, year: plan.year, region: plan.region, mission: plan.m.id,
    choices: plan.choices || [], vet: plan.vet, current: plan.current?.id, block: plan.event ? { key: plan.event.id, region: plan.event.r, y: plan.event.y } : null,
    crack: CP.eraFor(plan.year).crack,
  });
  const resim = (G, ivs) => CP.simulate(G.seed, ivs, { patch: G.patch });

  // Yalnizca denge botu icin: gercek sonuc. Oyuncuya gosterilmez.
  CP.trueOutcome = (G, plan) => {
    const tl = resim(G, [...G.ivs, makeDrop(G, plan)]);
    return { proto: CP.proto(G, tl) - CP.proto(G), cata: tl.catastrophe };
  };

  // Arastirmaci raporu: sayi degil yon ve risk
  CP.intel = (plan) => {
    const m = plan.m;
    const fx = { ...(m.useRole ? ROLES[plan.role].fx : {}), ...(m.fx || {}), ...(plan.current?.fx || {}) };
    const NAMES = { bio: 'Yaban Hayatı', water: 'Su', soil: 'Toprak', renew: 'Temiz Enerji', waste: 'Sıfır Atık', awareness: 'Bilinç', culture: 'Kültür', tech: 'Teknoloji', food: 'Gıda', resilience: 'Kent Direnci', consumption: 'Tüketim', agri: 'Tarım Baskısı', industry: 'Sanayi', military: 'Askeri Bütçe', unrest: 'İsyan', digital: 'Dijital Enerji', env: 'Çevre Bütçesi', ocean: 'Okyanus Yükü' };
    const list = Object.entries(fx).filter(([k]) => NAMES[k]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3)
      .map(([k, v]) => `${NAMES[k]} ${v > 0 ? '▲' : '▼'}${Math.abs(v) >= 20 ? (v > 0 ? '▲' : '▼') : ''}`);
    const risk = CP.legacyRisk({ id: 'preview', mission: m.id, role: plan.role, year: plan.year, choices: plan.choices || [] }).total;
    return { list, risk: risk < 0.12 ? 'Düşük' : risk < 0.4 ? 'Orta' : 'Yüksek' };
  };

  CP.jump = function jump(G, plan) {
    const before = G.tl, protoBefore = CP.proto(G);
    const energyBefore = G.energy, bonusBefore = G.protoBonus, spent = CP.jumpCost(G, plan), saved = CP.eraCost(G, plan.year) - spent;
    const iv = makeDrop(G, plan);
    G.nextId++;
    G.energy -= spent;
    if (G.shift.includes('research')) G.protoBonus += 1.5;
    G.shift = [];
    G.crew[plan.role]--;
    if (plan.vet) G.vets[plan.role]--;
    G.ivs.push(iv);
    G.jumps++;
    const rep = afterChange(G, before, protoBefore, iv);
    rep.resources = { energyBefore, energyAfter: G.energy, spent, saved, recovered: G.energy - energyBefore + spent, shipResearch: G.protoBonus - bonusBefore };
    return rep;
  };

  CP.extract = function extract(G, id) {
    const iv = G.ivs.find((i) => i.id === id);
    if (!iv || iv.extractedAt || G.energy < CP.eraCost(G, iv.year)) return null;
    const before = G.tl, protoBefore = CP.proto(G);
    const energyBefore = G.energy, bonusBefore = G.protoBonus, spent = CP.eraCost(G, iv.year);
    G.energy -= CP.eraCost(G, iv.year);
    iv.extractedAt = iv.year + 30;
    G.crew[iv.role]++;
    G.vets[iv.role]++;
    G.ivs.push({ id: 'x' + G.nextId++, kind: 'crack', year: iv.year, crack: 0.8 });
    G.jumps++;
    const rep = afterChange(G, before, protoBefore, iv);
    rep.resources = { energyBefore, energyAfter: G.energy, spent, recovered: G.energy - energyBefore + spent, shipResearch: G.protoBonus - bonusBefore };
    return rep;
  };

  function afterChange(G, before, protoBefore, iv) {
    G.tl = resim(G, G.ivs);
    if (G.crew.sci > 0) G.protoBonus += 1.5;
    const regen = 1 + (G.tl.final.global.renew || 0) * 0.05;
    G.energy = Math.min(100, G.energy + regen);
    let volunteer = null;
    if (G.jumps % 3 === 0 && G.tl.final.global.awareness > 18) volunteer = addVolunteer(G);
    const rep = {
      iv, before, after: G.tl, diff: CP.diff(before, G.tl), protoBefore, protoAfter: CP.proto(G), regen, volunteer,
      chain: G.tl.log.filter((e) => iv && e.iv === iv.id),
    };
    G.offers = drawOffers(G);
    checkEnd(G);
    return rep;
  }

  function addVolunteer(G) {
    const k = Object.keys(G.crew).sort((a, b) => G.crew[a] - G.crew[b])[0];
    G.crew[k]++;
    return k;
  }
  function drawOffers(G) {
    const n = G.crew.edu > 0 ? 3 : 2;
    const out = [];
    let i = 0;
    while (out.length < n && i < 40) {
      const id = CARDS[Math.floor(CP.hash01(G.seed, 'card', G.jumps, i++) * CARDS.length)].id;
      if (!out.includes(id)) out.push(id);
    }
    return out;
  }
  CP.takeOffer = (G, id) => { if (id && G.hand.length < 4) G.hand.push(id); G.offers = []; };

  // Sicramalar arasi: vakiftan mektup
  CP.nextLetter = (G) => {
    if (G.jumps < 2 || G.lastLetter === G.jumps || CP.hash01(G.seed, 'letter', G.jumps) > 0.55) return null;
    const dead = new Set(G.tl.log.filter((e) => e.kind === 'legacy').map((e) => e.iv));
    const alive = G.ivs.filter((i) => i.kind === 'drop' && !dead.has(i.id) && !i.extractedAt && i.year < 2030 && (i.letters || 0) < 2);
    if (!alive.length) return null;
    const iv = alive[Math.floor(CP.hash01(G.seed, 'lt', G.jumps) * alive.length)];
    const l = LETTERS[Math.floor(CP.hash01(G.seed, 'lt2', G.jumps) * LETTERS.length)];
    const century = iv.year < 1500 ? 500 : iv.year < 1950 ? 100 : 20;
    const year = Math.min(2060, iv.year + century * (1 + (iv.letters || 0)));
    return { iv, year, letter: { ...l, text: CP.fill(l.text, iv.region, year) } };
  };
  CP.answerLetter = (G, ctx, opt) => {
    const before = G.tl, protoBefore = CP.proto(G);
    ctx.iv.choices = [...(ctx.iv.choices || []), opt];
    ctx.iv.letters = (ctx.iv.letters || 0) + 1;
    G.lastLetter = G.jumps;
    G.tl = resim(G, G.ivs);
    checkEnd(G, true);
    return { iv: ctx.iv, before, after: G.tl, diff: CP.diff(before, G.tl), protoBefore, protoAfter: CP.proto(G) };
  };

  CP.playCard = function playCard(G, idx, region) {
    const c = CARDS.find((x) => x.id === G.hand[idx]);
    if (!c || (c.target && !region)) return null;
    const before = G.tl, protoBefore = CP.proto(G);
    G.hand.splice(idx, 1);
    if (c.energy) G.energy = Math.min(100, G.energy + c.energy);
    if (c.patch) G.patch *= c.patch;
    if (c.proto) G.protoBonus += c.proto;
    if (c.crew) addVolunteer(G);
    if (c.shield) { const d = [...G.ivs].reverse().find((i) => i.kind === 'drop'); if (d) d.shield = true; }
    if (c.fx || c.fxAll || c.ocean) {
      G.ivs.push({ id: 'c' + G.nextId++, kind: 'card', year: c.year, region, fx: c.fx, fxAll: c.fxAll, ocean: c.ocean, spread: c.spread, card: c.id });
    }
    G.tl = resim(G, G.ivs);
    const rep = { card: c, region, before, after: G.tl, diff: CP.diff(before, G.tl), protoBefore, protoAfter: CP.proto(G) };
    checkEnd(G, true);
    return rep;
  };

  // Gemide kimse yok ve geri alinabilecek kimse de kalmadi mi?
  CP.extractable = (G) => {
    const dead = new Set(G.tl.log.filter((e) => e.kind === 'legacy').map((e) => e.iv));
    return G.ivs.filter((i) => i.kind === 'drop' && !i.extractedAt && !dead.has(i.id) && G.energy >= CP.eraCost(G, i.year));
  };
  function checkEnd(G, fromCard) {
    const t = CP.tracks(G);
    if (t.tech >= 100 && t.eco >= 100 && t.peace >= 100) { G.over = 'win'; return; }
    if (G.tl.catastrophe) {
      if (G.doomed && !fromCard) { G.over = G.tl.catastrophe.type; return; }
      G.doomed = true;
    } else G.doomed = false;
    const end = (why) => { G.over = G.tl.catastrophe ? G.tl.catastrophe.type : why; };
    if (G.energy < CP.minCost() && !G.hand.includes('yakit')) return end('energy');
    const hasCrew = Object.values(G.crew).some((v) => v > 0);
    if (!hasCrew && !CP.extractable(G).length && !G.hand.includes('gonullu')) end('crew');
  }
  CP.canAct = (G) => Object.values(G.crew).some((v) => v > 0);
})();
