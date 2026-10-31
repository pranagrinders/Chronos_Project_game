// world-atlas (Natural Earth, public domain) TopoJSON -> 12 bolgelik SVG path verisi
// Kullanim: node tools/genmap.mjs <countries-110m.json>
import { readFileSync, writeFileSync } from 'node:fs';

const R = {
  kam: 'United States of America,Canada,Mexico,Greenland,Guatemala,Belize,Honduras,El Salvador,Nicaragua,Costa Rica,Panama,Cuba,Haiti,Dominican Rep.,Jamaica,Bahamas,Puerto Rico,Trinidad and Tobago',
  lam: 'Colombia,Venezuela,Guyana,Suriname,Ecuador,Peru,Brazil,Bolivia,Paraguay,Uruguay,Argentina,Chile,Falkland Is.',
  bav: 'United Kingdom,Ireland,France,Spain,Portugal,Belgium,Netherlands,Luxembourg,Germany,Switzerland,Austria,Italy,Poland,Czechia,Slovakia,Hungary,Slovenia,Croatia,Bosnia and Herz.,Serbia,Montenegro,Kosovo,Albania,Macedonia,Greece,Bulgaria,Romania,Moldova,Ukraine,Belarus,Lithuania,Latvia,Estonia',
  isk: 'Norway,Sweden,Finland,Denmark,Iceland',
  ana: 'Turkey,Cyprus,N. Cyprus',
  odk: 'Morocco,W. Sahara,Algeria,Tunisia,Libya,Egypt,Sudan,Syria,Lebanon,Israel,Palestine,Jordan,Iraq,Iran,Saudi Arabia,Yemen,Oman,United Arab Emirates,Qatar,Kuwait',
  saf: 'Mauritania,Mali,Niger,Chad,S. Sudan,Eritrea,Djibouti,Ethiopia,Somalia,Somaliland,Senegal,Gambia,Guinea-Bissau,Guinea,Sierra Leone,Liberia,Côte d\'Ivoire,Ghana,Togo,Benin,Burkina Faso,Nigeria,Cameroon,Central African Rep.,Eq. Guinea,Gabon,Congo,Dem. Rep. Congo,Uganda,Kenya,Rwanda,Burundi,Tanzania,Angola,Zambia,Malawi,Mozambique,Zimbabwe,Botswana,Namibia,South Africa,Lesotho,eSwatini,Madagascar',
  rus: 'Russia,Kazakhstan,Uzbekistan,Turkmenistan,Kyrgyzstan,Tajikistan,Georgia,Armenia,Azerbaijan,Mongolia',
  gas: 'Afghanistan,Pakistan,India,Nepal,Bhutan,Bangladesh,Sri Lanka',
  das: 'China,Taiwan,North Korea,South Korea,Japan',
  gda: 'Myanmar,Thailand,Laos,Vietnam,Cambodia,Malaysia,Brunei,Singapore,Philippines,Indonesia,Timor-Leste,Papua New Guinea',
  oky: 'Australia,New Zealand,Fiji,Solomon Is.,Vanuatu,New Caledonia',
};
const byName = {};
for (const [k, v] of Object.entries(R)) for (const n of v.split(',')) byName[n] = k;

const topo = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((a) => {
  let x = 0, y = 0;
  return a.map(([dx, dy]) => [(x += dx) * scale[0] + translate[0], (y += dy) * scale[1] + translate[1]]);
});
const ring = (ids) => {
  const out = [];
  for (const i of ids) {
    const a = i >= 0 ? arcs[i] : [...arcs[~i]].reverse();
    out.push(...(out.length ? a.slice(1) : a));
  }
  // Tarih degistirme cizgisini kesen halkalar haritada yatay serit cizer: saga tasi
  const cross = out.some((p, i) => i && Math.abs(p[0] - out[i - 1][0]) > 180);
  return cross ? out.map(([x, y]) => [x < 0 ? x + 360 : x, y]) : out;
};
const W = 1000, H = 520, LATMAX = 84, LATMIN = -58;
const proj = ([lon, lat]) => [((lon + 180) / 360) * W, ((LATMAX - lat) / (LATMAX - LATMIN)) * H];

const paths = {}, acc = {}, missing = [];
for (const g of topo.objects.countries.geometries) {
  const name = g.properties.name;
  const reg = byName[name];
  if (!reg) { missing.push(name); continue; }
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  for (const poly of polys) {
    const pts = ring(poly[0]).map(proj);
    let area = 0, cx = 0, cy = 0;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const f = p[0] * q[1] - q[0] * p[1];
      area += f; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f;
    });
    const a = acc[reg] || (acc[reg] = { a: 0, x: 0, y: 0 });
    if (Math.abs(area) > 1) { a.a += area; a.x += cx; a.y += cy; }
    paths[reg] = (paths[reg] || '') +
      poly.map((r) => 'M' + ring(r).map(proj).map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join('L') + 'Z').join('');
  }
}
const center = {};
for (const [k, a] of Object.entries(acc)) center[k] = [Math.round(a.x / (3 * a.a)), Math.round(a.y / (3 * a.a))];
center.rus = [750, 90]; center.oky = [875, 400]; center.bav = [525, 130];
writeFileSync('src/map-data.js',
  '// tools/genmap.mjs tarafindan uretildi (Natural Earth 110m)\nglobalThis.CP = globalThis.CP || {};\nCP.MAP = ' +
  JSON.stringify({ W, H, paths, center }) + ';\n');
console.log('eksik:', missing.join(' | '));
console.log('merkez:', JSON.stringify(center));
