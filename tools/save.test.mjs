import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/data.js';import '../src/content.js';import '../src/sim.js';import '../src/game.js';import '../src/experience.js';import '../src/scene-data.js';import '../src/save.js';
const{CP}=globalThis;
function memory(){const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),dump:m};}
function first(seed=7){const G=CP.newGame(seed),p=CP.firstMission(G);p.choices=CP.stages(G,p).map(s=>s.opts[0]);CP.jump(G,p);CP.takeOffer(G,G.offers[0]);return G;}
function sameHistory(a,b){assert.deepEqual(b.tl,a.tl);assert.deepEqual(CP.tracks(b),CP.tracks(a));for(const k of ['energy','crew','vets','hand','jumps','nextId','protoBonus','patch','doomed','over','offers','lastLetter'])assert.deepEqual(b[k],a[k],k);}

test('İlk görev aynı tarih, kaynak, kart ve hedeflerle geri yüklenir',()=>{
 for(const seed of [0,1,7,29]){const G=first(seed),raw=CP.store.pack(G),restored=CP.store.unpack(raw);sameHistory(G,restored);assert.ok(raw.length<15000);assert.ok(!raw.includes('history'));}
});
test('Kart, yama, arşiv, kalkan ve geri alma müdahaleleri korunur',()=>{
 const G=first();G.hand=['fon','yama','arsiv','kalkan'];
 for(let n=0;n<4;n++)CP.playCard(G,0,'ana');
 const drop=CP.extractable(G)[0];assert.ok(drop);CP.extract(G,drop.id);CP.takeOffer(G,null);
 const restored=CP.store.unpack(CP.store.pack(G));sameHistory(G,restored);
 assert.ok(restored.ivs.find(i=>i.kind==='drop').shield);assert.ok(restored.ivs.some(i=>i.kind==='crack'));
});
test('Mektup kararları ve aynı turdaki yanıt durumu korunur',()=>{
 const G=first(),ctx={iv:G.ivs[0],year:930};CP.answerLetter(G,ctx,CP.LETTERS[0].opts[0]);
 const restored=CP.store.unpack(CP.store.pack(G));sameHistory(G,restored);assert.equal(restored.ivs[0].choices.length,4);assert.equal(restored.ivs[0].letters,1);
});
test('Akım ve doğrudan olay önleme görevleri geri yüklenir',()=>{
 const G=CP.newGame(7),m=CP.missionById('akim'),p={m,role:'edu',region:'ana',year:430,current:CP.CURRENTS[0]};p.choices=CP.stages(G,p).map(s=>s.opts[0]);CP.jump(G,p);CP.takeOffer(G,null);
 sameHistory(G,CP.store.unpack(CP.store.pack(G)));
 const H=CP.newGame(7),ev=H.tl.log.find(e=>CP.canBlock(H,e));assert.ok(ev);
 const block={m:CP.BLOCK_MISSION,role:CP.roleFor(H,CP.BLOCK_MISSION),region:ev.r,year:ev.y-10,event:ev};block.choices=CP.stages(H,block).map(s=>s.opts[0]);CP.jump(H,block);CP.takeOffer(H,null);
 sameHistory(H,CP.store.unpack(CP.store.pack(H)));
});
test('Yeni döngü önceki kaydı yedekler; aynı döngünün her turu yedeği ezmez',()=>{
 const s=memory(),G=first(7);assert.ok(CP.store.write(G,s).ok);const old=s.getItem(CP.store.key);
 const H=first(7);assert.ok(CP.store.write(H,s).ok);assert.notEqual(G.saveId,H.saveId);assert.equal(s.getItem(CP.store.backupKey),old);
 H.hand=['fon'];CP.playCard(H,0,'ana');assert.ok(CP.store.write(H,s).ok);assert.equal(s.getItem(CP.store.backupKey),old);
});
test('Bozuk ya da desteklenmeyen kayıt okunurken değiştirilmez',()=>{
 const s=memory();s.setItem(CP.store.key,'bozuk-json');assert.equal(CP.store.inspect(s).status,'invalid');assert.equal(CP.store.read(s).ok,false);assert.equal(s.getItem(CP.store.key),'bozuk-json');
 const data=JSON.parse(CP.store.pack(first()));data.version=99;s.setItem(CP.store.key,JSON.stringify(data));assert.equal(CP.store.read(s).ok,false);assert.equal(JSON.parse(s.getItem(CP.store.key)).version,99);
});
test('Depolama hatası oyunu veya eldeki kaydı bozmaz',()=>{
 const s={getItem(){throw Object.assign(new Error(),{name:'SecurityError'});},setItem(){throw new Error();}};
 assert.equal(CP.store.inspect(s).status,'unavailable');assert.equal(CP.store.read(s).ok,false);assert.equal(CP.store.write(first(),s).ok,false);
 const stored=memory();CP.store.write(first(),stored);const raw=stored.getItem(CP.store.key);
 stored.setItem=()=>{throw Object.assign(new Error(),{name:'QuotaExceededError'});};assert.equal(CP.store.write(first(2),stored).ok,false);assert.equal(stored.getItem(CP.store.key),raw);
});
test('Geçersiz sayılar, bilinmeyen içerik ve kopya müdahale kimlikleri reddedilir',()=>{
 const raw=CP.store.pack(first());
 const corrupt=[d=>{d.data.energy=-10;},d=>{d.data.hand=['yok'];},d=>{d.data.ivs[0].mission='yok';},d=>{d.data.ivs[0].choices[0].t='yok';},d=>{d.data.ivs.push(d.data.ivs[0]);},d=>{d.data.jumps=99;},d=>{d.data.ivs[0].region='yok';}];
 for(const mutate of corrupt){const d=JSON.parse(raw);mutate(d);assert.throws(()=>CP.store.unpack(JSON.stringify(d)));}
});
test('Karar etkileri güncel içerikten gelir, kayıt içindeki fx üzerine yazılamaz',()=>{
 const G=first(),r=JSON.parse(CP.store.pack(G));r.data.ivs[0].choices[0].fx={water:999999};sameHistory(G,CP.store.unpack(JSON.stringify(r)));
});
test('Eğitim/serbest tercih ve bitmiş döngünün sonucu korunur',()=>{
 const G=CP.newGame(3);G.tutorialGuided=false;assert.equal(CP.store.unpack(CP.store.pack(G)).tutorialGuided,false);
 G.over='quit';const H=CP.store.unpack(CP.store.pack(G));assert.equal(H.over,'quit');
 const s=memory();CP.store.write(G,s);assert.equal(CP.store.inspect(s).summary.over,'quit');
});
