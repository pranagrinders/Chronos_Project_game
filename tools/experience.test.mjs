// Çalıştır: node --test tools/experience.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/data.js';
import '../src/content.js';
import '../src/sim.js';
import '../src/game.js';
import '../src/experience.js';
const { CP } = globalThis;

function firstRun(seed, choices = [0, 0, 0]) {
  const G = CP.newGame(seed), p = CP.firstMission(G);
  p.choices = CP.stages(G, p).map((s, i) => s.opts[choices[i]]);
  const rep = CP.jump(G, p);
  rep.logs = p.choices.map((o) => CP.fill(o.log, p.region, p.year));
  return { G, rep, p };
}

test('İlk görev üç gerçek kararla farklı tohumlarda normal kuralları kullanır', () => {
  for (let seed = 0; seed < 12; seed++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 3; c++) {
    const { G, rep, p } = firstRun(seed, [a, b, c]);
    assert.equal(p.region, 'ana'); assert.equal(p.year, 430); assert.equal(p.m.id, 'meclis');
    assert.equal(G.jumps, 1); assert.equal(G.crew.res, CP.ROLES.res.start - 1);
    assert.equal(G.energy, 100 - 20 + rep.regen); assert.equal(p.choices.length, 3);
    assert.ok(!G.over); assert.ok(!G.tl.catastrophe);
    const story = CP.reportStory(rep);
    assert.equal(story.choices.length, 3);
    for (const e of story.traces) { assert.equal(e.iv, rep.iv.id); assert.ok(G.tl.log.includes(e)); }
    for (const x of story.changes) assert.equal(x.d, rep.after.final.regions.ana[x.key] - rep.before.final.regions.ana[x.key]);
  }
});

test('Eğitim görevi ekibi ve enerjiyi gözetir; durum değiştirmez', () => {
  const G = CP.newGame(1), before = JSON.stringify(G);
  CP.firstMission(G); assert.equal(JSON.stringify(G), before);
  G.energy = 19; assert.equal(CP.firstMission(G), null);
  G.energy = 100; G.crew.res = 0; assert.equal(CP.firstMission(G).role, 'sci');
  G.crew.sci = 0; assert.equal(CP.firstMission(G), null);
});

test('Tüm görev gerekçeleri mevcut bölgelerde tanımlıdır; yer tutucu kalmaz', () => {
  const G = CP.newGame(7);
  for (const r of CP.REGIONS) for (const m of [...CP.MISSIONS, CP.BLOCK_MISSION]) {
    const reason = CP.missionReason(G, { m }, r.id);
    assert.ok(reason.length > 40); assert.doesNotMatch(reason, /undefined|NaN|\{bolge\}|\{nehir\}/);
  }
});

test('Dünya olayları doğrudan görevin izi olarak anlatılmaz; yoksa iz uydurulmaz', () => {
  const { rep } = firstRun(7);
  const edited = { ...rep, after: { ...rep.after, log: [{ y: 2040, r: 'ana', kind: 'major', text: 'Başka olay' }, { y: 2000, kind: 'echo', iv: 'başka-görev', text: 'Başka iz' }] } };
  assert.equal(CP.reportStory(edited).traces.length, 0);
  assert.deepEqual(CP.reportStory(edited).changes, CP.reportStory(rep).changes);
});

test('Kart ve geri alma raporları doğru türde anlatılır', () => {
  const { G, rep } = firstRun(7);
  const card = CP.playCard(G, 0, 'ana');
  assert.match(CP.reportStory(card).action, /Acil Durum Fonu/);
  assert.equal(CP.reportStory(card).traces.length, 0);
  const extraction = CP.extract(G, rep.iv.id);
  assert.ok(extraction); extraction.extracted = true;
  const story = CP.reportStory(extraction);
  assert.match(story.action, /gemiye döndü/); assert.equal(story.traces.length, 0);
});

test('Küçük farklar ve farklı bitiş yılları dürüstçe aktarılır', () => {
  const { rep } = firstRun(7);
  const same = { ...rep, after: rep.before };
  assert.equal(CP.reportStory(same).changes.length, 0);
  const earlier = { ...rep, after: { ...rep.after, final: { ...rep.after.final, y: 2040 } } };
  assert.equal(CP.reportStory(earlier).afterYear, 2040);
  assert.equal(CP.reportStory(earlier).beforeYear, 2070);
});

test('Yeni tur ve kart bonusu raporun önceki teknoloji değerini değiştirmez', () => {
  const G = CP.newGame(7), original = CP.tracks(G);
  const p = CP.firstMission(G); p.choices = CP.stages(G, p).map((s) => s.opts[0]);
  const rep = CP.jump(G, p), tracks = CP.reportTracks(G, rep);
  for (const k of Object.keys(original)) assert.ok(Math.abs(tracks.before[k] - original[k]) < 1e-8);
  G.hand = ['arsiv'];
  const beforeCard = CP.tracks(G), card = CP.playCard(G, 0);
  const cardTracks = CP.reportTracks(G, card);
  for (const k of Object.keys(beforeCard)) assert.ok(Math.abs(cardTracks.before[k] - beforeCard[k]) < 1e-8);
  assert.ok(cardTracks.after.tech > cardTracks.before.tech);
});
