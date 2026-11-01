const { JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let checks = 0;
function check(value, label) { assert.ok(value, label); console.log('PASS', label); checks++; }
function boot(query = '?seed=7&fast&classic', reduce = false) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e));
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), { url: 'https://chronos.test/' + query, runScripts: 'outside-only', virtualConsole: vc });
  const w = dom.window, frames = [];
  let clock = 0;
  w.matchMedia = () => ({ matches: reduce });
  w.requestAnimationFrame = cb => frames.push(cb);
  Object.defineProperty(w.performance, 'now', { value: () => clock });
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (_, k) => k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} });
  const style = w.document.createElement('style'); style.textContent = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8'); w.document.head.append(style);
  for (const file of ['map-data', 'data', 'content', 'sim', 'game', 'experience', 'scene-data', 'save', 'scene-audio', 'hud', 'narrative', 'cinema', 'ui']) w.eval(fs.readFileSync(path.join(root, 'src/' + file + '.js'), 'utf8'));
  const $ = q => w.document.querySelector(q);
  const click = q => { const el = $(q); assert.ok(el, 'Missing: ' + q); assert.ok(!el.disabled, 'Disabled: ' + q); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));if(el.matches('[data-choice]')){const c=w.document.querySelector('#cConfirm');if(c&&!c.disabled)c.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));} };
  const text = () => $('#modalBox').textContent;
  const flush = () => { for (let i = 0; i < 12 && !text().includes('Kelebek Raporu'); i++) { clock += 1000; const batch = frames.splice(0); batch.forEach(cb => cb(clock)); } };
  return { dom, w, $, click, text, errors, flush, frames };
}
const app = boot();
try {
  const { $, click, text, w } = app;
  check(text().includes('Gelecek, geçmişte başlar.'), 'Açılış brifingi görünür');
  check(!$('#dataDrawer').open && !$('#cardDrawer').open && !$('#legacyDrawer').open, 'İkincil paneller başlangıçta kapalı');
  click('#mGo');
  check(text().includes('Suyun izi') && text().includes('20 enerji'), 'İlk görev amaç ve bedelini açıklar');
  click('#mClose');
  check($('#modal').classList.contains('hidden'), 'Brifingden komutaya dönülebilir');
  click('#r_kam');
  check(text().includes('Suyun izi'), 'Eğitim sırasında harita ilk göreve yönlendirir');
  click('#mFirst');
  check(text().includes('Karar 1/3'), 'İlk karar açılır');
  click('[data-f="0"]');
  check(text().includes('Karar 2/3'), 'İkinci karar açılır');
  click('#mCancel');
  check(w.CP.debug.G.energy === 100 && w.CP.debug.G.jumps === 0, 'Hazırlıktan dönmek enerji ve ekip tüketmez');
  click('#mFirst');
  click('[data-f="0"]'); click('[data-f="0"]'); click('[data-f="0"]');
  check($('#btnJump').disabled && $('#btnBook').disabled && $('#btnEnd').disabled, 'Tarih akarken yeni işlem başlatılamaz');
  check([...w.document.querySelectorAll('[data-y]')].every(x => x.disabled), 'Tarih oynatılırken yıl düğmeleri kilitli');
  app.flush();
  check(text().includes('Kelebek Raporu') && text().includes('KARARIN') && text().includes('TARİHTEKİ İZİ') && text().includes('2070 YILINDA ANADOLU'), 'Rapor karar, gerçek iz ve ölçüm sırasıyla açılır');
  check(!/undefined|NaN/.test(text()), 'Raporda eksik değer veya bozuk sayı yok');
  check(text().includes('Bu Sıçramanın Kaynakları')&&text().includes('ikmal'), 'Klasik raporda enerji harcaması ve ikmal ayrılır');
  check(w.CP.debug.G.jumps === 1 && w.CP.debug.G.ivs[0].choices.length === 3, 'Üç karar tek gerçek sıçrama oluşturur');
  click('[data-off]');
  check($('#modal').classList.contains('hidden') && $('#btnJump').textContent === 'SIÇRAMA HAZIRLIĞI', 'İlk rapordan sonra serbest komutaya geçilir');
  click('#btnJump'); click('[data-reg="ana"]'); click('[data-era="2026"]');
  check(w.document.querySelectorAll('.missionWhy').length > 0 && text().includes('Neden bu görev?'), 'Serbest görevlerin gerekçeleri görünür');
  check(!/undefined|NaN|\{nehir\}|\{urun\}/.test(text()), 'Görev kartlarında yer tutucu kalmaz');
  click('[data-m="0"]');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check(text().includes('Görevin ne?') && w.CP.debug.G.jumps === 1, 'Escape görevi tüketmeden hazırlığa döndürür');
  w.CP.debug.renderAll();
  $('#cardDrawer').open = true; click('[data-c="0"]'); click('[data-t="ana"]');
  check(text().includes('Acil Durum Fonu') && text().includes('KARARIN'), 'Bölge hedefli kart yeni raporla çalışır');
  click('#mClose');
  $('#dataDrawer').open = true;
  click('[data-y="1970"]');
  check($('#dataDrawer').open && $('#yearLabel').textContent === '1970', 'Veri panelinin açık durumu yıl değiştirince korunur');
  click('#btnBook'); check(text().includes('Tarih Kitabı'), 'Tarih Kitabı erişilebilir'); click('#mClose');
  click('#btnEnd'); check(!!$('#mRe'), 'Oyun sonu ve yeni döngü erişilebilir'); click('#mRe');
  check(w.CP.debug.G.jumps === 0 && $('#modal').classList.contains('hidden'), 'Yeni döngü önceki eğitim kilidini taşımaz');
  check(app.errors.length === 0, 'DOM akışı boyunca çalışma zamanı hatası yok');
} finally { app.dom.window.close(); }
const free = boot('?seed=1&classic');
try { free.click('#mFree'); free.click('#btnJump'); check(free.text().includes('Hangi bölge?'), 'Oyuncu eğitimi atlayıp keşfederek başlayabilir'); check(free.errors.length === 0, 'Serbest başlangıçta çalışma zamanı hatası yok'); } finally { free.dom.window.close(); }
const reduced = boot('?seed=7&fast&classic', true);
try {
  reduced.click('#mGo'); reduced.click('#mFirst'); reduced.click('[data-f="1"]'); reduced.click('[data-f="1"]'); reduced.click('[data-f="2"]'); reduced.flush();
  check(reduced.text().includes('Kelebek Raporu'), 'Azaltılmış hareket modunda farklı kararlarla rapora ulaşılır');
  check(reduced.frames.length <= 1, 'Azaltılmış hareket modunda arka plan sürekli animasyon üretmez');
  check(reduced.errors.length === 0, 'Azaltılmış hareket modunda çalışma zamanı hatası yok');
} finally { reduced.dom.window.close(); }
console.log('TOTAL', checks, 'checks passed. This is a DOM flow test, not a browser layout or screenshot test.');
