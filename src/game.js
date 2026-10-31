// OYUN KURALLARI: enerji, tim, kartlar, kazanma/kaybetme. UI bilmez.
globalThis.CP = globalThis.CP || {};
(() => {
  const { ERAS, ROLES, CARDS, FIELD } = CP;
  const clamp = CP.clamp;

  // Prototip %: raw puani baslangic tarihi ile kazanma esigi arasina olcekler
  const WIN_GAIN = 54; // baslangica gore gereken ham artis (tools/balance.mjs ile ayarlandi)
  const BASE_PROTO = 10;

  CP.newGame = function newGame(seed = (Date.now() % 1e9)) {
    const G = {
      seed, energy: 100, crew: Object.fromEntries(Object.keys(ROLES).map((k) => [k, ROLES[k].start])),
      vets: { sci: 0, res: 0, edu: 0 }, ivs: [], hand: [], jumps: 0, protoBonus: 0, patch: 1,
      nextId: 1, doomed: false, over: null, rawBase: 0, offers: [],
    };
    G.base = CP.simulate(seed, []);
    G.rawBase = CP.rawProto(G.base.final.global, null);
    G.tl = G.base;
    G.hand = [CARDS[0], CARDS[1]].map((c) => c.id);
    return G;
  };

  CP.proto = (G, tl = G.tl) => {
    if (tl.catastrophe) return 0;
    const p = BASE_PROTO + ((CP.rawProto(tl.final.global, null) - G.rawBase) / WIN_GAIN) * (100 - BASE_PROTO);
    return clamp(p + G.protoBonus);
  };

  CP.eraCost = (G, year) => {
    const e = ERAS.find((x) => x.year === year);
    return Math.round(e.cost);
  };
  CP.minCost = () => Math.min(...ERAS.map((e) => e.cost));

  // Saha olayi secimi: rol + yila uyan olay, sabit hash ile
  CP.fieldEvent = (G, role, year) => {
    const list = FIELD.map((f, i) => ({ ...f, i })).filter((f) => f.role === role && year >= f.from && year <= f.to);
    return list[Math.floor(CP.hash01(G.seed, 'field', G.jumps, role) * list.length)] || null;
  };

  const makeDrop = (G, plan) => ({
    id: 'd' + G.nextId, kind: 'drop', role: plan.role, year: plan.year, region: plan.region,
    path: plan.path, field: plan.field, fieldId: plan.fieldId, vet: plan.vet,
    crack: ERAS.find((e) => e.year === plan.year).crack,
  });

  const resim = (G, ivs) => CP.simulate(G.seed, ivs, { patch: G.patch });

  // Arastirmaci ustteyse tahmini onizleme
  CP.preview = (G, plan) => {
    const tl = resim(G, [...G.ivs, makeDrop(G, plan)]);
    const d = CP.diff(G.tl, tl);
    return { d, proto: CP.proto(G, tl) - CP.proto(G), cata: tl.catastrophe };
  };

  // Sicrama: tarih yeniden hesaplanir, fark raporu doner
  CP.jump = function jump(G, plan) {
    const before = G.tl, protoBefore = CP.proto(G);
    const iv = makeDrop(G, plan);
    G.nextId++;
    G.energy -= CP.eraCost(G, plan.year);
    G.crew[plan.role]--;
    if (plan.vet) G.vets[plan.role]--;
    G.ivs.push(iv);
    G.jumps++;
    return afterChange(G, before, protoBefore, iv);
  };

  // Geri toplama: uyeyi deneyimli olarak geri al, vakfin gucu azalir
  CP.extract = function extract(G, id) {
    const iv = G.ivs.find((i) => i.id === id);
    if (!iv || iv.extractedAt || G.energy < CP.eraCost(G, iv.year)) return null;
    const before = G.tl, protoBefore = CP.proto(G);
    G.energy -= CP.eraCost(G, iv.year);
    iv.extractedAt = iv.year + 30;
    G.crew[iv.role]++;
    G.vets[iv.role]++;
    G.ivs.push({ id: 'x' + G.nextId++, kind: 'crack', year: iv.year, crack: 0.8 });
    G.jumps++;
    return afterChange(G, before, protoBefore, iv);
  };

  function afterChange(G, before, protoBefore, iv) {
    G.tl = resim(G, G.ivs);
    // Gemide kalan timin faydalari ve ikmal
    if (G.crew.sci > 0) G.protoBonus += 2;
    const renew = G.tl.final.global.renew || 0;
    const regen = 2 + renew * 0.12;
    G.energy = Math.min(100, G.energy + regen);
    let volunteer = null;
    if (G.jumps % 3 === 0 && G.tl.final.global.awareness > 30) volunteer = addVolunteer(G);
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
    const pool = CARDS.map((c) => c.id);
    const out = [];
    let i = 0;
    while (out.length < n && i < 40) {
      const id = pool[Math.floor(CP.hash01(G.seed, 'card', G.jumps, i++) * pool.length)];
      if (!out.includes(id)) out.push(id);
    }
    return out;
  }
  CP.takeOffer = (G, id) => { if (id && G.hand.length < 4) G.hand.push(id); G.offers = []; };

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
    const rep = { card: c, before, after: G.tl, diff: CP.diff(before, G.tl), protoBefore, protoAfter: CP.proto(G) };
    checkEnd(G, true);
    return rep;
  };

  function checkEnd(G, fromCard) {
    if (CP.proto(G) >= 100) { G.over = 'win'; return; }
    if (G.tl.catastrophe) {
      // Son Seans: kiyamet goruldu, bir sans daha
      if (G.doomed && !fromCard) { G.over = G.tl.catastrophe.type; return; }
      G.doomed = true;
    } else G.doomed = false;
    const hasCrew = Object.values(G.crew).some((v) => v > 0);
    if (G.energy < CP.minCost() && !G.hand.includes('yakit')) { G.over = G.tl.catastrophe ? G.tl.catastrophe.type : 'energy'; return; }
    if (!hasCrew && !G.ivs.some((i) => i.kind === 'drop' && !i.extractedAt) && !G.hand.includes('gonullu')) G.over = 'energy';
  }
  CP.canAct = (G) => Object.values(G.crew).some((v) => v > 0);
})();
