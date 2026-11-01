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
