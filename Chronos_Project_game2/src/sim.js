// SIMULASYON CEKIRDEGI: saf fonksiyon. simulate(seed, mudahaleler) -> tarih. UI bilmez.
globalThis.CP = globalThis.CP || {};
(() => {
  const { YEARS, REGIONS, LINKS, EVENTS, ECHOES, ROLES, ERAS, MISSIONS, BLOCK_MISSION, CURRENTS, FAR, LOCAL, CAUSES, PARAM_TR, PROJECTS } = CP;
  const REG = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
  const TOTALPOP = REGIONS.reduce((s, r) => s + r.pop, 0);
  const TOTALECO = REGIONS.reduce((s, r) => s + r.eco, 0);
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
  CP.eraFor = (y) => [...ERAS].reverse().find((e) => e.year <= y) || ERAS[0];
  CP.missionById = (id) => (id === BLOCK_MISSION.id ? BLOCK_MISSION : MISSIONS.find((m) => m.id === id));

  // Bir gorevin nihai etki vektoru: gorev + 3 karar + mektuplar
  function buildLegacy(iv, seed) {
    const m = CP.missionById(iv.mission);
    const role = ROLES[iv.role];
    const fx = {};
    const add = (o) => { if (o) for (const k in o) fx[k] = (fx[k] || 0) + o[k]; };
    let mult = CP.eraFor(iv.year).scale * (iv.vet ? 1.25 : 1);
    let hz = 0.03 + (m.hz || 0) + (iv.role === 'res' ? role.hz : 0);
    let grow = false, spread = 0, early = 0;
    if (m.useRole) add(role.fx);
    add(m.fx);
    for (const o of iv.choices || []) {
      add(o.fx); hz += o.hz || 0; mult *= o.mult || 1;
      if (o.grow) grow = true;
      if (o.spread) spread = Math.max(spread, o.spread);
      early += o.early || 0;
    }
    if (iv.shield) hz *= 0.5;
    if (iv.role === 'sci' && iv.year < 1700 && (fx.tech || fx.renew)) early += 0.6;
    let deadAt = null;
    for (let y = iv.year + 100; y <= YEARS.end; y += 100) {
      if (hash01(seed, 'hz', iv.id, y) < Math.max(0.004, hz)) { deadAt = y; break; }
    }
    return { iv, m, fx, mult, grow, spread, deadAt, early, hazard: Math.max(0.004, hz), tau: m.tau || 28, echoed: {}, cur: iv.current ? CURRENTS.find((c) => c.id === iv.current) : null, a: {} };
  }

  // Aynı miras kurallarından olasılık öngörüsü. Oyuncunun seed'i veya gerçekleşecek dağılma yılı gösterilmez.
  CP.legacyRisk = (iv) => {
    const l = buildLegacy(iv, 0), checks = Math.max(0, Math.floor((YEARS.end - iv.year) / 100));
    const perCentury = Math.min(1, l.hazard);
    return { checks, perCentury, total: 1 - Math.pow(1 - perCentury, checks), atFloor: perCentury <= 0.004 };
  };

  function strength(l, y, stoic) {
    const t0 = l.iv.year;
    if (y < t0) return 0;
    const age = y - t0;
    let s = l.mult * Math.max(1 - Math.exp(-age / l.tau), age > 0 ? 0.25 : 0);
    if (l.grow) s *= 1 + Math.min(0.55, age / 500);
    if (l.deadAt && y >= l.deadAt) s *= 0.18;
    if (l.iv.extractedAt) s *= 0.6;
    return s * (1 - (stoic / 100) * 0.45);
  }

  function regionName(id, y) {
    const d = REG[id];
    if (y < 1500) return d.old[0];
    if (y < 1920) return d.old[1];
    return d.name;
  }
  CP.regionName = regionName;
  CP.fill = (t, id, y) => t.replace(/\{bolge\}/g, regionName(id, y)).replace(/\{nehir\}/g, LOCAL[id].nehir).replace(/\{urun\}/g, LOCAL[id].urun);

  CP.simulate = function simulate(seed, interventions = [], opts = {}) {
    const legacies = interventions.filter((i) => i.kind === 'drop').map((i) => buildLegacy(i, seed));
    const directs = interventions.filter((i) => i.kind === 'card' && i.year != null);
    const cracks = interventions.filter((i) => i.crack);
    const blocks = interventions.filter((i) => i.block).map((i) => ({ ...i.block, iv: i.id, y0: i.year }));
    const state = {};
    for (const r of REGIONS) {
      state[r.id] = {
        bio: r.bio, water: r.water, soil: r.soil, stoic: r.stoic, consumption: 3, culture: 22, awareness: 8, unrest: 12,
        agri: r.agri * 0.2, industry: 0, digital: 0, military: r.mil * 0.6, renew: 0, waste: 5, food: 60, resilience: 30,
        war: 0, tech: 0, earlyTech: 0, cur: 0, budget: {}, flags: {}, once: {}, last: {},
      };
    }
    let ppm = 278, ocean = 2, nuke = 0;
    const history = [], log = [];
    let catastrophe = null;
    const footprintK = opts.patch ?? 1;
    const push = (e) => log.push(e);
    const blockedFor = (key, ids, y) => blocks.find((b) => b.key === key && ids.includes(b.region) && y >= b.y0 && y <= b.y + 20);

    for (let y = YEARS.start; y <= YEARS.end; y += YEARS.step) {
      const pf = popF(y);
      let g = aggregate(state);
      const heat = 3 * Math.log2(ppm / 280);
      g.heat = heat; g.ocean = ocean; g.ppm = ppm;
      let footprint = 0;
      for (const c of cracks) if (y >= c.year) footprint += c.crack;
      footprint *= footprintK;

      const fxBy = {}, guarded = {};
      for (const r of REGIONS) { fxBy[r.id] = {}; guarded[r.id] = {}; state[r.id].cur = 0; }
      const addFx = (id, fx, s) => { for (const k in fx) fxBy[id][k] = (fxBy[id][k] || 0) + fx[k] * s; };
      for (const l of legacies) {
        const id = l.iv.region;
        const s = strength(l, y, state[id].stoic);
        if (!s) continue;
        const dead = l.deadAt && y >= l.deadAt;
        addFx(id, l.fx, s);
        if (l.spread) for (const n of REG[id].nb) addFx(n, l.fx, s * l.spread);
        if (!dead && l.m.guard) for (const k of l.m.guard) guarded[id][k] = true;
        if (l.early) state[id].earlyTech = clamp(state[id].earlyTech + 0.25 * l.early, 0, 40);
        if (l.deadAt === y) push({ y, r: id, kind: 'legacy', iv: l.iv.id, bad: true, text: `${regionName(id, y)}: ${l.m.name} görevinin mirası dağıldı. Geriye birkaç kitap kaldı.` });

        // Akim: kendi kendine komsulara yayilir
        if (l.cur) {
          if (!Object.keys(l.a).length) l.a[id] = 0.18;
          for (const k of Object.keys(l.a)) {
            const st = state[k];
            const v = l.a[k];
            const gr = dead ? -0.06 : 0.3 * v * (1 - v) * (0.55 + st.culture / 70 + st.awareness / 120) * (1 - st.stoic / 170);
            l.a[k] = clamp(v + gr, 0, 1);
            st.cur = Math.max(st.cur, l.a[k]);
            addFx(k, l.cur.fx, l.a[k] * Math.min(1.5, l.mult + 0.2));
            if (dead || l.a[k] < 0.4) continue;
            const paths = [...REG[k].nb, ...(y >= 1900 ? FAR[k] || [] : [])];
            for (const n of paths) {
              if (l.a[n] != null) continue;
              const st2 = state[n];
              if (hash01(seed, 'cur', l.iv.id, n, y) < 0.2 + st2.culture / 180 - st2.stoic / 300) {
                l.a[n] = 0.12;
                push({ y, r: n, kind: 'echo', iv: l.iv.id, good: true, text: `${regionName(n, y)}: "${l.cur.name}" buraya da ulaştı.` });
              }
            }
          }
        }

        // Gelecekteki yankilar
        if (dead) continue;
        const fire = (key, ec) => {
          l.echoed[key] = true;
          for (const k in ec.fx) if (state[id][k] != null && k !== 'tech') state[id][k] = clamp(state[id][k] + ec.fx[k]);
          push({ y, r: id, kind: 'echo', iv: l.iv.id, good: true, text: CP.fill(ec.text, id, y) });
        };
        if (l.m.useRole) {
          ECHOES.forEach((ec, ei) => {
            if (ec.role !== l.iv.role || l.echoed[ei] || y < ec.from || y > ec.to || y - l.iv.year < 40) return;
            if (hash01(seed, 'echo', l.iv.id, ei, y) < 0.3) fire(ei, ec);
          });
        }
        (l.m.echoes || []).forEach((ec, ei) => {
          const key = 'm' + ei;
          if (l.echoed[key] || y - l.iv.year < ec.after) return;
          if (hash01(seed, 'mecho', l.iv.id, ei, y) < 0.5) fire(key, ec);
        });
      }
      for (const c of directs) {
        if (y < c.year) continue;
        const k = 1 - Math.exp(-(y - c.year + 10) / 20);
        if (c.fx && c.region) {
          addFx(c.region, c.fx, k);
          if (c.spread) for (const n of REG[c.region].nb) addFx(n, c.fx, k * 0.6);
        }
        if (c.fxAll) for (const r of REGIONS) addFx(r.id, c.fxAll, k);
        if (c.ocean) ocean = clamp(ocean + c.ocean);
      }

      // Bolge guncelleme
      let emission = 0, plastic = 0, oceanFx = 0;
      for (const def of REGIONS) {
        const id = def.id, r = state[id], f = fxBy[id];
        const war = r.war > 0 ? 1 : 0;
        const fv = (k) => 45 * Math.tanh((f[k] || 0) / 45); // azalan getiri
        oceanFx += f.ocean || 0;

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

        const pre = { ...r };
        for (const [from, to, k] of LINKS) {
          const d = (k * pre[from]) / 100;
          r[to] += k < 0 ? d * pf * 1.6 : d;
        }
        const fragile = def.arch === 'Kırılgan Havza' ? 1.3 : 1;
        const heatK = heat * L(y, 1990, 18);
        for (const [k, hk] of [['bio', 0.3], ['water', 0.2], ['soil', 0.2]]) {
          const fx = fv(k);
          r[k] += (fx > 0 ? 0.11 : 0.05) * (clamp(def[k] + fx * 0.8) - r[k]) - heatK * hk * fragile - (k === 'soil' ? 0 : war * 2);
          r[k] = clamp(r[k], k === 'water' ? 7 : 0);
        }
        r.tech = f.tech || 0;

        r.food = clamp(r.soil * 0.48 + r.water * 0.4 + 18 - heat * 4.5 - war * 15 - r.earlyTech * 0.1 + fv('food'));
        r.resilience = clamp(r.renew * 0.22 + r.waste * 0.18 + r.awareness * 0.26 + r.water * 0.16 + r.bio * 0.12 + 8 - war * 10 + fv('resilience'));
        mv('unrest', 8 + (100 - r.food) * 0.42 + (100 - r.water) * 0.12 + war * 15 + r.earlyTech * 0.4 + fv('unrest'), 0.3);

        const clean = 1 - 0.8 * (r.renew / 100);
        emission += (def.pop / TOTALPOP) * pf * ((r.industry + r.digital * 0.25 + r.consumption * 0.3) * clean + r.agri * 0.32);
        plastic += (def.pop / TOTALPOP) * pf * r.consumption * (1 - r.waste / 110) * L(y, 1960, 8);
      }

      ppm += emission * 0.8 - (ppm - 278) * 0.011 * (0.5 + g.bio / 100);
      for (const c of cracks) if (y === Math.floor(c.year / 10) * 10) ppm += c.crack * footprintK * 0.8;
      ocean = clamp(ocean + plastic * 0.2 + Math.max(0, ppm - 300) * 0.016 - ocean * 0.012 + oceanFx * 0.25);

      // Savaslar
      let wars = 0;
      for (const def of REGIONS) {
        const r = state[def.id];
        if (r.war > 0) { r.war--; wars++; continue; }
        if (y < 1900) continue;
        const p = 0.012 + (r.military > 24 ? 0.022 : 0) + (r.water < 30 ? 0.05 : 0) + (r.unrest > 60 ? 0.05 : 0) + r.earlyTech * 0.0016 - r.awareness * 0.00025;
        if (hash01(seed, 'war', def.id, y) < p) {
          const foe = [...def.nb].sort((a, b) => state[b].military - state[a].military)[0];
          const b = blockedFor('war', [def.id, foe], y);
          if (b) { push({ y, r: def.id, kind: 'echo', iv: b.iv, good: true, text: `${regionName(def.id, y)}: Kapıdaki savaş son anda önlendi.` }); continue; }
          r.war = state[foe].war = 2 + Math.floor(hash01(seed, 'wlen', def.id, y) * 2);
          wars += 2;
          const dry = r.water < 35;
          push({ y, r: def.id, foe, kind: 'major', war: true, id: 'war', cause: dry ? `Sebep: Su ${Math.round(r.water)} seviyesine düştü.` : r.military > 24 ? `Sebep: Askeri bütçe %${Math.round(r.budget.mil)} seviyesine çıktı.` : null,
            text: `${regionName(def.id, y)} ve ${regionName(foe, y)}: ${dry ? 'Su Savaşı' : 'Savaş'} Koalisyonu kuruldu.` });
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
          if (!ev.once && r.last[ev.id] && y - r.last[ev.id] < (ev.cd || 50)) continue;
          if (ev.need && !r.flags[ev.need]) continue;
          if (ev.cond && !ev.cond(r, g, y)) continue;
          if (hash01(seed, ev.id, def.id, y) >= ev.p) continue;
          if (guarded[def.id][ev.id]) continue;
          const b = blockedFor(ev.id, [def.id], y);
          if (b) { push({ y, r: def.id, kind: 'echo', iv: b.iv, good: true, text: `${regionName(def.id, y)}: Beklenen felaket gerçekleşmedi. Tarih değişti.` }); r.once[ev.id] = true; continue; }
          r.once[ev.id] = true;
          r.last[ev.id] = y;
          if (ev.flag) r.flags[ev.flag] = y;
          for (const k in ev.fx) r[k] = clamp(r[k] + ev.fx[k]);
          const t = ev.text[Math.floor(hash01(seed, 't', ev.id, def.id, y) * ev.text.length)];
          push({ y, r: def.id, kind: ev.kind, good: ev.good, id: ev.id, text: CP.fill(t, def.id, y), cause: ev.why ? causeOf(r, ev.why) : null });
        }
      }

      g = aggregate(state);
      if (!catastrophe && y >= 1950) {
        if (nuke >= 100) catastrophe = { type: 'nuke', y };
        else if (g.water < 12) catastrophe = { type: 'water', y };
        else if (g.bio < 11) catastrophe = { type: 'virus', y };
      }

      const techRaw = REGIONS.reduce((s, d) => s + state[d.id].tech * (0.6 + d.pop / 15), 0);
      history.push({
        y,
        global: {
          ...g, ppm, ocean, heat, footprint, nuke, wars, tech: 100 * (1 - Math.exp(-techRaw / 130)),
          accuracy: coverage(interventions, y),
          earlyTech: clamp(REGIONS.reduce((s, d) => s + state[d.id].earlyTech, 0) * 0.7),
        },
        regions: Object.fromEntries(REGIONS.map((d) => {
          const { flags, once, last, ...rest } = state[d.id];
          return [d.id, { ...rest, budget: { ...rest.budget } }];
        })),
      });
      if (catastrophe) break;
    }

    const last = history[history.length - 1];
    return { seed, history, log, catastrophe, final: last, raw: rawTracks(history), milestones: milestones(last) };
  };

  // Otomatik sebep: bu parametreyi en cok asagi ceken baglanti
  function causeOf(r, param) {
    let best = null, bv = 0;
    for (const [from, to, k] of LINKS) {
      if (to !== param || k >= 0 || !CAUSES[from]) continue;
      const v = -k * r[from];
      if (v > bv) { bv = v; best = from; }
    }
    return best ? `Sebep: ${CAUSES[best]} baskısı, ${PARAM_TR[param]} ${Math.round(r[param])} seviyesine indi.` : null;
  }

  function aggregate(state) {
    const out = {};
    for (const k of ['bio', 'water', 'soil']) out[k] = REGIONS.reduce((s, d) => s + state[d.id][k] * d.eco, 0) / TOTALECO;
    for (const k of ['culture', 'unrest', 'awareness', 'agri', 'industry', 'digital', 'military', 'renew', 'waste', 'consumption', 'food', 'resilience']) {
      out[k] = REGIONS.reduce((s, d) => s + state[d.id][k] * d.pop, 0) / TOTALPOP;
    }
    return out;
  }

  function coverage(ivs, y) {
    const n = new Set();
    for (const i of ivs) if (i.kind === 'drop' && i.role === 'res' && i.year <= y) n.add(i.region);
    return 25 + (n.size / REGIONS.length) * 75;
  }

  // Bolge esikleri: tamamlanan projeler
  function milestones(snap) {
    const out = [];
    for (const d of REGIONS) for (const p of PROJECTS) if (snap.regions[d.id][p.key] >= p.at) out.push({ r: d.id, name: p.name, key: p.key });
    return out;
  }

  // Ikinci Prototip uc koldan beslenir: ham puanlar
  function rawTracks(history) {
    const last = history[history.length - 1].global;
    const m = milestones(history[history.length - 1]);
    const late = history.filter((h) => h.y >= 2030);
    const avg = (k) => late.reduce((s, h) => s + h.global[k], 0) / Math.max(1, late.length);
    const count = (key) => m.filter((x) => x.key === key).length;
    return {
      tech: last.tech * 0.55 + last.renew * 0.65 + last.awareness * 0.1 + count('renew') * 1.2,
      eco: (last.bio + last.water + last.soil) / 3 + (700 - last.ppm) * 0.05 + (100 - last.ocean) * 0.06 + count('waste') * 0.35,
      peace: 100 - (avg('wars') * 7 + avg('unrest') * 0.7 + avg('military') * 0.5 + avg('nuke') * 0.4) + count('awareness') * 1,
    };
  }

  const score = (r) => (r.bio + r.water + r.soil + r.awareness + r.renew + r.food) / 6 - r.unrest * 0.3;
  CP.diff = function diff(a, b) {
    const ga = a.final.global, gb = b.final.global;
    const keys = ['ppm', 'water', 'bio', 'soil', 'awareness', 'unrest', 'renew', 'ocean', 'food', 'resilience', 'military', 'industry', 'waste'];
    const global = keys.map((k) => ({ k, a: ga[k], b: gb[k], d: gb[k] - ga[k] }));
    const regions = REGIONS.map((d) => ({ id: d.id, d: score(b.final.regions[d.id]) - score(a.final.regions[d.id]) }))
      .sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
    const seen = new Set(a.log.map((e) => e.y + e.text));
    const gone = new Set(b.log.map((e) => e.y + e.text));
    const mk = (x) => x.r + x.name;
    const had = new Set(a.milestones.map(mk));
    return {
      global, regions,
      newEvents: b.log.filter((e) => !seen.has(e.y + e.text)),
      avoided: a.log.filter((e) => !gone.has(e.y + e.text) && e.kind === 'major' && !e.good),
      newMilestones: b.milestones.filter((x) => !had.has(mk(x))),
    };
  };
})();
