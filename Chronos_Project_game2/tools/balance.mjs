// Denge botu: node tools/balance.mjs [oyun sayisi]
import '../src/data.js';
import '../src/content.js';
import '../src/sim.js';
import '../src/game.js';
const { CP } = globalThis;
const N = +process.argv[2] || 60;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const f = (v) => (v == null ? '-' : v.toFixed(1));

const t = CP.simulate(1, []);
for (const y of [430, 1880, 1970, 2000, 2020, 2070]) {
  const s = t.history.find((h) => h.y === y);
  if (!s) continue;
  const g = s.global;
  console.log(y, 'ppm', f(g.ppm), 'isi', f(g.heat), 'su', f(g.water), 'bio', f(g.bio), 'toprak', f(g.soil), 'okyanus', f(g.ocean), 'bilinc', f(g.awareness), 'isyan', f(g.unrest), 'renew', f(g.renew), 'gida', f(g.food), 'savas', g.wars, 'nuke', f(g.nuke));
}
let cata = 0, cy = 0;
for (let s = 0; s < 200; s++) { const c = CP.simulate(s, []).catastrophe; if (c) { cata++; cy += c.y; } }
console.log('mudahalesiz tarihte kiyamet:', cata, '/200', cata ? 'ort yil ' + (cy / cata) : '');
const cnt = {};
t.log.forEach((e) => { const k = e.id + '|' + e.text; cnt[k] = (cnt[k] || 0) + 1; });
console.log('olay:', t.log.length, 'farkli cumle:', Object.keys(cnt).length, 'en cok tekrar:', Math.max(...Object.values(cnt)));
console.log('ham kollar', JSON.stringify(t.raw));

function randPlan(G) {
  const eras = CP.ERAS.filter((e) => e.cost <= G.energy);
  if (!CP.canAct(G) || !eras.length) return null;
  const year = pick(eras).year, region = pick(CP.REGIONS).id;
  const offers = CP.offerMissions(G, region, year);
  if (!offers.length) return null;
  const o = pick(offers);
  const plan = { ...o, region };
  plan.choices = CP.stages(G, plan).map((s) => pick(s.opts));
  return plan;
}
function bot(greedy, seed) {
  const G = CP.newGame(seed);
  let guard = 0;
  while (!G.over && guard++ < 50) {
    let plan;
    if (greedy) {
      let best = -1e9;
      for (let i = 0; i < greedy; i++) {
        const c = randPlan(G);
        if (!c) break;
        const pv = CP.trueOutcome(G, c);
        const v = pv.cata ? -999 : pv.proto / CP.eraCost(G, c.year);
        if (v > best) { best = v; plan = c; }
      }
    } else plan = randPlan(G);
    if (!plan) {
      if (!CP.canAct(G)) {
        const x = CP.extractable(G);
        if (x.length) { CP.extract(G, x[0].id); CP.takeOffer(G, G.offers[0]); continue; }
      }
      if (G.hand.length) { CP.playCard(G, 0, pick(CP.REGIONS).id); continue; }
      G.over = G.over || 'energy'; break;
    }
    CP.jump(G, plan);
    CP.takeOffer(G, G.offers[0]);
    const lt = !G.over && CP.nextLetter(G);
    if (lt) CP.answerLetter(G, lt, pick(lt.letter.opts));
    if (greedy && G.hand.length > 2 && !G.over) CP.playCard(G, 0, pick(CP.REGIONS).id);
  }
  return G;
}
for (const [name, g] of [['rastgele', 0], ['akilli(6)', 6], ['cok akilli(16)', 16]]) {
  const res = {}; let jumps = 0, proto = 0;
  const tr = { tech: 0, eco: 0, peace: 0 };
  const n = g > 6 ? Math.ceil(N / 3) : N;
  for (let s = 0; s < n; s++) {
    const G = bot(g, 1000 + s);
    res[G.over || 'yok'] = (res[G.over || 'yok'] || 0) + 1;
    jumps += G.jumps; proto += CP.proto(G);
    const k = CP.tracks(G); for (const x in tr) tr[x] += k[x] / n;
  }
  console.log(name, JSON.stringify(res), 'ort sicrama', f(jumps / n), 'ort prototip', f(proto / n), 'kollar', f(tr.tech), f(tr.eco), f(tr.peace));
}
