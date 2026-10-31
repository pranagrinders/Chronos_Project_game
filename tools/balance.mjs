// Denge botu: node tools/balance.mjs [oyun sayisi]
import '../src/data.js';
import '../src/sim.js';
import '../src/game.js';
const { CP } = globalThis;
const N = +process.argv[2] || 60;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const f = (v) => (v == null ? '-' : v.toFixed(1));

// Tarih capalari
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
console.log('olay sayisi (seed 1):', t.log.length);

function randPlan(G) {
  const roles = Object.keys(G.crew).filter((k) => G.crew[k] > 0);
  const eras = CP.ERAS.filter((e) => e.cost <= G.energy);
  if (!roles.length || !eras.length) return null;
  const role = pick(roles), year = pick(eras).year;
  const fe = CP.fieldEvent(G, role, year);
  return { role, year, region: pick(CP.REGIONS).id, path: CP.PATHS.map((p) => pick(p.opts).id), fieldId: fe?.i, field: fe ? Math.floor(Math.random() * 2) : null };
}
function bot(greedy, seed) {
  const G = CP.newGame(seed);
  let guard = 0;
  while (!G.over && guard++ < 40) {
    let plan;
    if (greedy) {
      let best = -1e9;
      for (let i = 0; i < greedy; i++) {
        const c = randPlan(G);
        if (!c) break;
        const pv = CP.preview(G, c);
        const v = pv.cata ? -999 : pv.proto / CP.eraCost(G, c.year);
        if (v > best) { best = v; plan = c; }
      }
    } else plan = randPlan(G);
    if (!plan) {
      if (G.hand.length) {
        const i = G.hand.findIndex((x) => CP.CARDS.find((c) => c.id === x));
        CP.playCard(G, i, pick(CP.REGIONS).id);
        continue;
      }
      G.over = 'energy'; break;
    }
    CP.jump(G, plan);
    CP.takeOffer(G, G.offers[0]);
    if (greedy && G.hand.length > 2 && !G.over) CP.playCard(G, 0, pick(CP.REGIONS).id);
  }
  return G;
}
for (const [name, g] of [['rastgele', 0], ['akilli(6)', 6], ['cok akilli(16)', 16]]) {
  const res = {}; let jumps = 0, proto = 0;
  const n = g > 6 ? Math.ceil(N / 3) : N;
  for (let s = 0; s < n; s++) {
    const G = bot(g, 1000 + s);
    res[G.over || 'yok'] = (res[G.over || 'yok'] || 0) + 1;
    jumps += G.jumps; proto += CP.proto(G);
  }
  console.log(name, JSON.stringify(res), 'ort sicrama', f(jumps / n), 'ort prototip', f(proto / n));
}
