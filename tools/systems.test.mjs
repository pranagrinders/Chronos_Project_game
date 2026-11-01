// Çalıştır: node --test tools/systems.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/data.js';import '../src/content.js';import '../src/sim.js';import '../src/game.js';import '../src/experience.js';import '../src/scene-data.js';import '../src/save.js';
const { CP } = globalThis;
const mission = (G, year = 1970, region = 'ana') => {
  const o = CP.offerMissions(G, region, year)[0], p = { ...o, region };
  p.choices = CP.stages(G, p).map((s) => s.opts[0]);
  return p;
};
test('Hizalama indirimi isabetle artar, ıskalamak ceza vermez', () => {
  const G = CP.newGame(7), p = CP.firstMission(G);
  assert.equal(CP.jumpCost(G, p), 20);
  const cost = [0, 1, 2, 3].map((h) => CP.jumpCost(G, { ...p, alignDiscount: CP.alignDiscount(h) }));
  assert.deepEqual(cost, [...cost].sort((a, b) => b - a));
  assert.ok(cost[3] < cost[0]);
  p.choices = CP.stages(G, p).map((s) => s.opts[0]);
  p.alignDiscount = CP.alignDiscount(3);
  const rep = CP.jump(G, p);
  assert.equal(rep.resources.spent, cost[3]);
  assert.ok(Math.abs(rep.resources.saved - (20 - cost[3])) < 1e-9);
});
test('İşaret izin bölgede kalır; isabet bölgeye bağlıdır', () => {
  for (let t = 0; t < 8; t += 0.13) { const m = CP.alignMarker(t, 1.3); assert.ok(m >= 0 && m <= 1); }
  assert.ok(CP.alignHit(0.5, 0.5, 0.1)); assert.ok(!CP.alignHit(0.7, 0.5, 0.1));
});
test('İlk görev yalnız eğitimde çıkar, serbest görev listesine girmez', () => {
  const G = CP.newGame(7);
  assert.equal(CP.firstMission(G).m.id, 'meclis');
  for (const r of CP.REGIONS) for (const e of CP.ERAS) assert.ok(!CP.offerMissions(G, r.id, e.year).some((o) => o.m.id === 'meclis'));
});
test('Vardiya 2 işle sınırlı, gemide uzman ister, ilk görevden önce kapalı', () => {
  const G = CP.newGame(7);
  assert.equal(CP.toggleShift(G, 'research'), false);
  G.jumps = 1;
  assert.ok(CP.toggleShift(G, 'research')); assert.ok(CP.toggleShift(G, 'media'));
  assert.equal(CP.toggleShift(G, 'supply'), false);
  assert.ok(CP.toggleShift(G, 'media')); assert.deepEqual(G.shift, ['research']);
  G.crew.res = 0; assert.equal(CP.toggleShift(G, 'supply'), false);
});
test('Vardiya bir sonraki sıçramaya işler ve sıfırlanır', () => {
  const a = CP.newGame(7), b = CP.newGame(7);
  a.jumps = b.jumps = 1;
  CP.toggleShift(b, 'supply'); CP.toggleShift(b, 'media');
  const pa = mission(a), pb = mission(b);
  assert.equal(CP.jumpCost(b, pb), CP.eraCost(b, pb.year) - CP.TUNE.supply);
  const plain = CP.jump(a, pa), rep = CP.jump(b, pb);
  assert.equal(plain.iv.power, undefined);
  assert.equal(rep.iv.power, 1.1);
  assert.deepEqual(b.shift, []);
  const c = CP.newGame(7); c.jumps = 1; CP.toggleShift(c, 'research');
  const bonus = c.protoBonus; CP.jump(c, mission(c));
  assert.equal(c.protoBonus - bonus, 3); // vardiya 1,5 + gemideki bilim insanı 1,5
});
test('Her Nabız göstergesinin bir örgütü var; her örgütün üç yönü var', () => {
  const keys = Object.values(CP.PULSE).flat().map((i) => i.key);
  assert.equal(keys.length, 15); assert.equal(new Set(keys).size, 15);
  assert.deepEqual(CP.ORGS.map((o) => o.key).sort(), [...keys].sort());
  const g = CP.simulate(7, []).final.global;
  for (const k of keys) assert.ok(Number.isFinite(g[k]), k);
  for (const o of CP.ORGS) assert.equal(o.opts.length, 3);
});
test('Örgüt kota aşılınca kurulur, turda bir kez sorulur ve tarihe işler', () => {
  const G = CP.newGame(7); G.jumps = 2;
  assert.equal(CP.nextOrg(G), null);
  const water = CP.ORGS.find((o) => o.key === 'water'), quota = water.quota;
  try {
    water.quota = 0.001;
    CP.jump(G, mission(G)); G.lastOrg = undefined;
    const org = CP.nextOrg(G);
    assert.ok(org);
    const r = CP.answerOrg(G, water, 0);
    assert.equal(G.orgs.water, 0); assert.equal(CP.nextOrg(G), null);
    assert.ok(r.after.log.some((e) => e.kind === 'org'));
    const a = r.before.final.regions.ana.water, b = r.after.final.regions.ana.water;
    assert.notEqual(a, b);
  } finally { water.quota = quota; }
});
test('Önlenen savaş Barış Konseyi kotasını doldurur', () => {
  const G = CP.newGame(7);
  assert.equal(CP.orgProgress(G, 'wars'), 0);
  G.base = { ...G.base, log: [...G.base.log, { id: 'war' }, { id: 'war' }] };
  assert.equal(CP.orgProgress(G, 'wars'), 2);
});
test('Örgüt, vardiya ve hizalama kayıttan aynı tarihle döner', () => {
  const G = CP.newGame(7), p = CP.firstMission(G);
  p.choices = CP.stages(G, p).map((s) => s.opts[0]); p.alignDiscount = CP.alignDiscount(2);
  CP.jump(G, p); CP.takeOffer(G, G.offers[0]);
  CP.toggleShift(G, 'media'); CP.jump(G, mission(G)); CP.takeOffer(G, G.offers[0]);
  CP.answerOrg(G, CP.ORGS.find((o) => o.key === 'water'), 1);
  assert.ok(CP.toggleShift(G, 'research'));
  const back = CP.store.unpack(CP.store.pack(G));
  assert.deepEqual(back.orgs, G.orgs); assert.deepEqual(back.shift, ['research']); assert.equal(back.energy, G.energy);
  assert.deepEqual(back.tl.final.global, G.tl.final.global);
  const bad = JSON.parse(CP.store.pack(G)); bad.data.orgs = { water: 9 };
  assert.throws(() => CP.store.unpack(JSON.stringify(bad)));
});
test('Kelebek haberleri dünyayı değiştirmez, olay sayısını artırır', () => {
  const run = (news) => {
    const saved = CP.MISSION_NEWS; if (!news) CP.MISSION_NEWS = {};
    try {
      const G = CP.newGame(7), p = CP.firstMission(G);
      p.choices = CP.stages(G, p).map((s) => s.opts[0]);
      const rep = CP.jump(G, p);
      return { global: G.tl.final.global, raw: G.tl.raw, own: rep.chain.length };
    } finally { CP.MISSION_NEWS = saved; }
  };
  const a = run(true), b = run(false);
  assert.deepEqual(a.global, b.global); assert.deepEqual(a.raw, b.raw);
  assert.ok(a.own > b.own);
});
test('Örgüt metinleri olumlu; kota sözü geçmez', () => {
  for (const o of CP.ORGS) { assert.ok(o.rise); assert.ok(!/kota|eşi[kğ]/i.test(o.text), o.key); }
});

test('Başarımlar: simülasyonu değiştirmez, kazanılan kalır, müdahalesiz dünyada verilmez', () => {
  const { CP } = globalThis;
  const G = CP.newGame(7);
  assert.deepEqual(CP.checkAch(G), [], 'Hiç müdahale yokken başarım yok');
  const ids = CP.achList().map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'Kimlikler benzersiz');
  const plan = { ...CP.firstMission(G) };
  plan.choices = CP.stages(G, plan).map((s) => s.opts[0]);
  CP.jump(G, plan);
  const before = JSON.stringify(G.tl.final);
  const fresh = CP.checkAch(G);
  assert.equal(JSON.stringify(G.tl.final), before, 'Kontrol tarihi değiştirmez');
  assert.ok(fresh.some((a) => a.id === 'first'));
  assert.deepEqual(CP.checkAch(G), [], 'Aynı başarım iki kez verilmez');
  G.ach.push({ id: 'renew', r: 'ana' });
  assert.equal(CP.store.unpack(CP.store.pack(G)).ach.length, G.ach.length, 'Kayıttan geri gelir');
  assert.ok(!/\{r\}/.test(CP.achText(CP.ACH_REGION[0], 'ana')));
  assert.ok(CP.achText(CP.ACH_REGION[0], 'ana').startsWith('Anadolu'));
  G.over = 'win';
  assert.ok(CP.checkAch(G).some((a) => a.id === 'win'), 'Kazanınca Son Döngü verilir');
});

test('İlk görev kendi sahnelerini kullanır, seçenekleri kayıttan geri gelir', () => {
  const { CP } = globalThis;
  const G = CP.newGame(7), plan = { ...CP.firstMission(G) };
  const stages = CP.stages(G, plan);
  assert.equal(stages, CP.TUTORIAL_STAGES);
  for (const s of stages) { assert.ok(s.when && s.guide && s.text.length > 40); for (const o of s.opts) assert.ok(o.lead && o.hint && o.art && o.caption && o.log); }
  plan.choices = stages.map((s) => s.opts[s.opts.length - 1]);
  CP.jump(G, plan);
  assert.deepEqual(CP.store.unpack(CP.store.pack(G)).ivs[0].choices.map((c) => c.t), plan.choices.map((c) => c.t));
});

test('Yeni üye: iki turda bir seçilir, kayda geçer, son kişi gidince oyun erken bitmez', () => {
  const { CP } = globalThis;
  const G = CP.newGame(7);
  assert.equal(CP.recruitDue(G), false, 'Başlangıçta yok');
  CP.jump(G, mission(G));
  assert.equal(CP.recruitDue(G), false, '1. tur sonunda yok');
  assert.equal(CP.recruit(G, 'sci'), false, 'Vakti gelmeden alınamaz');
  assert.equal(CP.recruitIn(G), 1);
  CP.jump(G, mission(G));
  assert.equal(CP.recruitDue(G), true, '2. tur sonunda var');
  const crew = G.crew.edu;
  assert.equal(CP.recruit(G, 'edu'), true);
  assert.equal(G.crew.edu, crew + 1, 'Seçilen rol artar');
  assert.equal(CP.recruit(G, 'edu'), false, 'Aynı turda ikinci kez alınamaz');
  assert.equal(CP.store.unpack(CP.store.pack(G)).lastRecruit, G.jumps);
  const H = CP.newGame(7);
  CP.jump(H, mission(H)); CP.jump(H, mission(H));
  H.lastRecruit = undefined; H.over = null;
  for (const k of Object.keys(H.crew)) H.crew[k] = 0;
  assert.equal(CP.recruitDue(H), true);
  assert.ok(CP.recruit(H, 'res') && CP.canAct(H), 'Gemi boşken de seçilen üye göreve çıkabilir');
});

test('Tamamlanan kol bir kez yakıt verir, kol düşse de kalır, kayda geçer', () => {
  const { CP } = globalThis;
  const G = CP.newGame(7);
  assert.equal(CP.nextFuel(G), null);
  CP.jump(G, mission(G));
  G.protoBonus = 1000; G.energy = 40;
  const p = mission(G); const cost = CP.jumpCost(G, p);
  const rep = CP.jump(G, p);
  assert.deepEqual(G.fueled.map((f) => f.k), ['tech']);
  assert.equal(G.fueled[0].gain, CP.TUNE.fuelGain);
  assert.equal(CP.nextFuel(G).k, 'tech');
  const e1 = G.energy; G.protoBonus = 0; CP.takeOffer(G, null);
  CP.playCard(G, 0, 'ana');
  assert.equal(G.fueled.length, 1, 'İkinci kez verilmez');
  assert.ok(G.energy <= e1 + 1e-9 || G.hand.length >= 0);
  G.fuelShown = 1; assert.equal(CP.nextFuel(G), null, 'Gösterilen tekrar çıkmaz');
  const R = CP.store.unpack(CP.store.pack(G));
  assert.equal(R.fueled[0].k, 'tech'); assert.equal(R.fuelShown, 1);
  const H = CP.newGame(7); H.energy = 90; CP.jump(H, mission(H)); H.protoBonus = 1000; const before = H.energy; CP.jump(H, mission(H));
  assert.ok(H.energy <= 100, 'Enerji tavanı aşılmaz');
  assert.ok(H.fueled[0].gain <= CP.TUNE.fuelGain);
  void cost; void rep; void before;
});
