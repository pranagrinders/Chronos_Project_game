// SIMULASYON CEKIRDEGI: saf fonksiyon. simulate(seed, mudahaleler) -> tarih. UI bilmez.
globalThis.CP = globalThis.CP || {};
(() => {
  const { YEARS, REGIONS, LINKS, EVENTS, ECHOES, ROLES, PATHS, ERAS, FIELD } = CP;
  const REG = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const TOTALPOP = REGIONS.reduce((s, r) => s + r.pop, 0);
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const L = (y, mid, w) => 1 / (1 + Math.exp(-(y - mid) / w));
  const popF = (y) => 0.05 + 0.95 * L(y, 1975, 32);

  // Sira bagimsiz rastgelelik: kucuk mudahale tum zarlari kaydirmaz
  function hash01(...parts) {
    let h = 2166136261;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 1540483477); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  CP.hash01 = hash01;
  CP.clamp = clamp;

  // Bir birakmanin (drop) nihai etki vektoru
  function buildLegacy(iv, seed) {
    const role = ROLES[iv.role];
    const era = ERAS.find((e) => e.year === iv.year) || { scale: 1 };
    const fx = { ...role.fx };
    let mult = era.scale * (iv.vet ? 1.25 : 1);
    let hz = 0.03 + role.hz;
    let grow = false, spread = 0;
    const add = (o) => { if (o) for (const k in o) fx[k] = (fx[k] || 0) + o[k]; };
    (iv.path || []).forEach((id, i) => {
      const o = PATHS[i].opts.find((p) => p.id === id);
      if (!o) return;
      add(o.fx); hz += o.hz || 0; mult *= o.mult || 1;
      if (o.grow) grow = true;
      if (o.spread) spread = o.spread;
    });
    if (iv.field != null) {
      const opt = FIELD[iv.fieldId]?.opts[iv.field];
      if (opt) { add(opt.fx); hz += opt.hz || 0; mult *= opt.mult || 1; }
    }
    if (iv.shield) hz *= 0.5;
    const early = iv.role === 'sci' && iv.year < 1700
      ? (iv.path?.[0] === 'ritual' ? 0.35 : 0.7) + (FIELD[iv.fieldId]?.opts[iv.field]?.early || 0) : 0;
    // Dagilma yili sabit hash ile: ayni mudahale ayni kadere sahip olur
    let deadAt = null;
    for (let y = iv.year + 100; y <= YEARS.end; y += 100) {
      if (hash01(seed, 'hz', iv.id, y) < Math.max(0.004, hz)) { deadAt = y; break; }
    }
    return { iv, fx, mult, grow, spread, deadAt, early, echoed: {} };
  }

  function strength(l, y, stoic) {
    const t0 = l.iv.year;
    if (y < t0) return 0;
    const age = y - t0;
    const mature = 1 - Math.exp(-age / 28) ;
    let s = l.mult * Math.max(mature, age > 0 ? 0.25 : 0);
    if (l.grow) s *= 1 + Math.min(0.55, age / 500);
    if (l.deadAt && y >= l.deadAt) s *= 0.18;
    if (l.iv.extractedAt) s *= 0.6;
    return s * (1 - (stoic / 100) * 0.45);
  }

  CP.simulate = function simulate(seed, interventions = [], opts = {}) {
    const legacies = interventions.filter((i) => i.kind === 'drop').map((i) => buildLegacy(i, seed));
    const directs = interventions.filter((i) => i.kind === 'card' && i.year != null);
    const cracks = interventions.filter((i) => i.crack);
    const state = {};
    for (const r of REGIONS) {
      state[r.id] = {
        bio: r.bio, water: r.water, soil: r.soil, stoic: r.stoic, consumption: 3, culture: 22, awareness: 8, unrest: 12,
        agri: r.agri * 0.2, industry: 0, digital: 0, military: r.mil * 0.6, renew: 0, waste: 5, food: 60, resilience: 30,
        war: 0, tech: 0, earlyTech: 0, budget: {}, flags: {}, once: {},
      };
    }
    let ppm = 278, ocean = 2, nuke = 0;
    const history = [], log = [];
    let catastrophe = null;
    const footprintK = opts.patch ?? 1;

    const push = (e) => log.push(e);
    const fill = (t, id, y) => t.replace('{bolge}', regionName(id, y));

    for (let y = YEARS.start; y <= YEARS.end; y += YEARS.step) {
      const pf = popF(y);
      let g = aggregate(state);
      const heat = 3 * Math.log2(ppm / 280);
      g.heat = heat; g.ocean = ocean; g.ppm = ppm;
      let footprint = 0;
      for (const c of cracks) if (y >= c.year) footprint += c.crack;
      footprint *= footprintK;

      // Legacy ve kartlarin bolge bazli hedef etkileri
      const fxBy = {};
      for (const r of REGIONS) fxBy[r.id] = {};
      const addFx = (id, fx, s) => { for (const k in fx) fxBy[id][k] = (fxBy[id][k] || 0) + fx[k] * s; };
      for (const l of legacies) {
        const id = l.iv.region;
        const s = strength(l, y, state[id].stoic);
        if (!s) continue;
        addFx(id, l.fx, s);
        if (l.spread) for (const n of REG[id].nb) addFx(n, l.fx, s * l.spread);
        if (l.early && y >= l.iv.year) state[id].earlyTech = clamp(state[id].earlyTech + 0.25 * l.early, 0, 40);
        if (l.deadAt === y) push({ y, r: id, kind: 'legacy', iv: l.iv.id, bad: true, text: `${regionName(id, y)}: ${ROLES[l.iv.role].name} vakfı dağıldı. Geriye yalnızca birkaç kitap kaldı.` });
        // Gelecekteki yanki
        if (!(l.deadAt && y >= l.deadAt)) {
          ECHOES.forEach((ec, ei) => {
            if (ec.role !== l.iv.role || l.echoed[ei] || y < ec.from || y > ec.to || y - l.iv.year < 40) return;
            if (hash01(seed, 'echo', l.iv.id, ei, y) < 0.3) {
              l.echoed[ei] = true;
              for (const k in ec.fx) if (state[id][k] != null) state[id][k] = clamp(state[id][k] + ec.fx[k]);
              if (ec.fx.tech) state[id].tech += ec.fx.tech;
              push({ y, r: id, kind: 'echo', iv: l.iv.id, good: true, text: fill(ec.text, id, y) });
            }
          });
        }
      }
      for (const c of directs) {
        if (y < c.year) continue;
        const k = 1 - Math.exp(-(y - c.year + 10) / 20);
        if (c.fx && c.region) {
          addFx(c.region, c.fx, k);
          if (c.spread) for (const n of REG[c.region].nb) addFx(n, c.fx, k * 0.6);
        }
        if (c.fxAll) for (const r of REGIONS) addFx(r.id, c.fxAll, k);
        if (c.ocean) ocean += c.ocean;
      }

      // Bolge guncelleme
      let emission = 0, plastic = 0;
      for (const def of REGIONS) {
        const id = def.id, r = state[id], f = fxBy[id];
        const war = r.war > 0 ? 1 : 0;
        const fv = (k) => 45 * Math.tanh((f[k] || 0) / 45); // azalan getiri

        // Butce dagilimi: ulkenin yapay zekasi
        const w = {
          mil: def.mil * (0.7 + r.unrest * 0.006) + war * 35 + fv('military'),
          ind: 8 + def.ind * L(y, def.indY, 30) * 0.5,
          agri: 10 + def.agri * 0.15,
          env: L(y, 1985, 14) * (1 + r.awareness * 0.32 + (def.env || 0)) + fv('env'),
          edu: 4 + r.culture * 0.16 + r.awareness * 0.08,
        };
        const sum = Object.values(w).reduce((a, b) => a + Math.max(0, b), 0);
        for (const k in w) r.budget[k] = (Math.max(0, w[k]) / sum) * 100;

        const aw = r.awareness / 100;
        const mv = (k, target, rate = 0.2) => { r[k] += (clamp(target) - r[k]) * rate; };
        mv('industry', def.ind * L(y, def.indY, 28) * (1 - 0.28 * aw) + fv('industry'));
        mv('agri', def.agri * (0.2 + 0.8 * L(y, 1950, 35)) * (1 - 0.2 * aw) + fv('agri'));
        mv('consumption', def.cons * L(y, 1965, 24) * (1 - 0.32 * aw - 0.15 * (r.culture / 100)) + fv('consumption'));
        mv('digital', y < 1985 ? 0 : (25 + def.cons * 0.55) * L(y, 2018, 9) + fv('digital'));
        mv('renew', y < 1900 ? fv('renew') * 0.25 : (4 + r.awareness * 0.35 + r.budget.env * 0.8) * L(y, 2020, 18) + fv('renew'), 0.22);
        mv('waste', 4 + (y < 1950 ? 0 : (r.awareness * 0.3 + r.budget.env * 0.6)) * L(y, 2000, 20) + fv('waste'), 0.22);
        mv('awareness', 2 + r.budget.edu * 0.55 + r.culture * 0.12 + heat * 3 * L(y, 2000, 12) - r.consumption * 0.06 + fv('awareness'), 0.18);
        mv('culture', 20 + r.budget.edu * 0.6 - war * 10 + fv('culture'), 0.15);
        mv('military', r.budget.mil * 1.1 + fv('military') * 0.3, 0.3);
        mv('stoic', def.stoic - fv('awareness') * 0.25, 0.08);

        // Baglanti agi
        const pre = { ...r };
        for (const [from, to, k] of LINKS) {
          const d = (k * pre[from]) / 100;
          r[to] += k < 0 ? d * pf * 1.6 : d;
        }
        // Dogal toparlanma ve iklim baskisi
        const fragile = def.arch === 'Kırılgan Havza' ? 1.3 : 1;
        r.bio += 0.05 * (clamp(def.bio + fv('bio') * 0.8) - r.bio) - heat * 0.3 * fragile * L(y, 1990, 18) - war * 2;
        r.water += 0.05 * (clamp(def.water + fv('water') * 0.8) - r.water) - heat * 0.2 * fragile * L(y, 1990, 18) - war * 2;
        r.soil += 0.05 * (clamp(def.soil + fv('soil') * 0.8) - r.soil) - heat * 0.2 * fragile * L(y, 1990, 18);
        for (const k of ['bio', 'water', 'soil']) r[k] = clamp(r[k]);
        r.tech = f.tech || 0;

        // Turetilmis
        r.food = clamp(r.soil * 0.48 + r.water * 0.4 + 18 - heat * 4.5 - war * 15 - r.earlyTech * 0.1);
        r.resilience = clamp(r.renew * 0.22 + r.waste * 0.18 + r.awareness * 0.26 + r.water * 0.16 + r.bio * 0.12 + 8 - war * 10);
        mv('unrest', 8 + (100 - r.food) * 0.42 + (100 - r.water) * 0.12 + war * 15 + r.earlyTech * 0.4 + fv('unrest'), 0.3);

        const clean = 1 - 0.8 * (r.renew / 100);
        emission += (def.pop / TOTALPOP) * pf * ((r.industry * 1.0 + r.digital * 0.25 + r.consumption * 0.3) * clean + r.agri * 0.32);
        plastic += (def.pop / TOTALPOP) * pf * r.consumption * (1 - r.waste / 110) * L(y, 1960, 8);
      }

      // Atmosfer ve okyanus
      ppm += emission * 0.8 - (ppm - 278) * 0.011 * (0.5 + g.bio / 100);
      for (const c of cracks) if (y === Math.floor(c.year / 10) * 10) ppm += c.crack * footprintK * 0.8;
      ocean = clamp(ocean + plastic * 0.2 + Math.max(0, ppm - 300) * 0.016 - ocean * 0.012);

      // Savaslar
      let wars = 0;
      for (const def of REGIONS) {
        const r = state[def.id];
        if (r.war > 0) { r.war--; wars++; continue; }
        if (y < 1900) continue;
        const p = 0.012 + (r.military > 24 ? 0.022 : 0) + (r.water < 30 ? 0.05 : 0) + (r.unrest > 60 ? 0.05 : 0) + r.earlyTech * 0.0016 - r.awareness * 0.00025;
        if (hash01(seed, 'war', def.id, y) < p) {
          const foe = [...def.nb].sort((a, b) => state[b].military - state[a].military)[0];
          r.war = state[foe].war = 2 + Math.floor(hash01(seed, 'wlen', def.id, y) * 2);
          wars += 2;
          const water = r.water < 35;
          push({ y, r: def.id, kind: 'major', war: true, text: `${regionName(def.id, y)} ve ${regionName(foe, y)}: ${water ? 'Su Savaşı' : 'Savaş'} Koalisyonu kuruldu.` });
        }
      }
      if (y >= 1950) nuke = clamp(nuke + (wars >= 6 ? 14 : wars >= 4 ? 5 : -2) + (g.unrest > 62 ? 2 : 0));

      // Olaylar
      g = aggregate(state); g.heat = heat; g.ocean = ocean; g.ppm = ppm;
      for (const ev of EVENTS) {
        if (y < ev.from || y > ev.to) continue;
        for (const def of REGIONS) {
          if (ev.region && !ev.region.includes(def.id)) continue;
          const r = state[def.id];
          if (ev.once && r.once[ev.id]) continue;
          if (ev.need && !r.flags[ev.need]) continue;
          if (ev.cond && !ev.cond(r, g, y)) continue;
          if (hash01(seed, ev.id, def.id, y) >= ev.p) continue;
          r.once[ev.id] = true;
          if (ev.flag) r.flags[ev.flag] = y;
          for (const k in ev.fx) r[k] = clamp(r[k] + ev.fx[k]);
          push({ y, r: def.id, kind: ev.kind, good: ev.good, id: ev.id, text: fill(ev.text, def.id, y) });
        }
      }

      // Kiyamet kontrolu
      g = aggregate(state);
      if (!catastrophe && y >= 1950) {
        if (nuke >= 100) catastrophe = { type: 'nuke', y };
        else if (g.water < 14) catastrophe = { type: 'water', y };
        else if (g.bio < 11) catastrophe = { type: 'virus', y };
      }

      // Anlik goruntu
      const techRaw = REGIONS.reduce((s, d) => s + state[d.id].tech * (0.6 + d.pop / 15), 0);
      const tech = 100 * (1 - Math.exp(-techRaw / 130));
      const accuracy = coverage(interventions, y);
      history.push({
        y,
        global: {
          ...g, ppm, ocean, heat, footprint, accuracy, nuke, wars, tech,
          earlyTech: clamp(REGIONS.reduce((s, d) => s + state[d.id].earlyTech, 0) * 0.7),
          renew: g.renew, food: g.food, resilience: g.resilience,
        },
        regions: Object.fromEntries(REGIONS.map((d) => {
          const { flags, once, ...rest } = state[d.id];
          return [d.id, { ...rest, budget: { ...rest.budget } }];
        })),
      });
      if (catastrophe) break;
    }

    const last = history[history.length - 1];
    return { seed, history, log, catastrophe, final: last, proto: protoScore(last.global, catastrophe) };
  };

  function aggregate(state) {
    const out = {};
    for (const k of ['bio', 'water', 'soil', 'culture', 'unrest', 'awareness', 'agri', 'industry', 'digital', 'military', 'renew', 'waste', 'consumption', 'food', 'resilience']) {
      out[k] = REGIONS.reduce((s, d) => s + state[d.id][k] * d.pop, 0) / TOTALPOP;
    }
    return out;
  }

  function coverage(ivs, y) {
    const n = new Set();
    for (const i of ivs) if (i.kind === 'drop' && i.role === 'res' && i.year <= y) n.add(i.region);
    return 25 + (n.size / REGIONS.length) * 75;
  }

  // Ikinci Prototip %: teknoloji + ekosistem + baris
  function protoScore(g, cata) {
    if (cata) return 0;
    const eco = (g.bio + g.water + g.soil) / 3;
    const peace = 100 - Math.min(100, g.wars * 8 + g.unrest * 0.6 + g.nuke * 0.4);
    const raw = g.tech * 0.32 + g.renew * 0.32 + eco * 0.3 + peace * 0.14 + g.awareness * 0.14;
    return raw;
  }
  CP.rawProto = protoScore;

  function regionName(id, y) {
    const d = REG[id];
    if (y < 1500) return d.old[0];
    if (y < 1920) return d.old[1];
    return d.name;
  }
  CP.regionName = regionName;

  // Iki tarih arasindaki fark: kelebek raporu
  CP.diff = function diff(a, b) {
    const ga = a.final.global, gb = b.final.global;
    const keys = ['ppm', 'water', 'bio', 'soil', 'awareness', 'unrest', 'renew', 'ocean', 'food', 'resilience', 'military', 'industry'];
    const global = keys.map((k) => ({ k, a: ga[k], b: gb[k], d: gb[k] - ga[k] }));
    const regions = REGIONS.map((d) => {
      const ra = a.final.regions[d.id], rb = b.final.regions?.[d.id];
      const score = (r) => (r.bio + r.water + r.soil + r.awareness + r.renew + r.food) / 6 - r.unrest * 0.3;
      return { id: d.id, d: score(rb) - score(ra) };
    }).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
    const seen = new Set(a.log.map((e) => e.y + e.text));
    const gone = new Set(b.log.map((e) => e.y + e.text));
    return {
      global, regions,
      newEvents: b.log.filter((e) => !seen.has(e.y + e.text)),
      avoided: a.log.filter((e) => !gone.has(e.y + e.text) && e.kind === 'major' && !e.good),
    };
  };
})();
