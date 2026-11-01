import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/data.js';import '../src/content.js';import '../src/sim.js';import '../src/game.js';import '../src/experience.js';import '../src/scene-data.js';
const{CP}=globalThis;
test('Koruma seçeneklerinin fayda/bedel yönü gerçek kurallarla aynı',()=>{
 const opts=CP.missionById('koruma').crisis.opts;
 const common=CP.choiceExplanation(opts[0]),strict=CP.choiceExplanation(opts[1]);
 assert.ok(common.gains.includes('Mirasın dağılma riski azalır'));
 assert.ok(common.gains.includes('Toplumsal gerilim azalır'));
 assert.ok(common.costs.includes('Görevin etkisi biraz azalır'));
 assert.ok(strict.gains.includes('Görevin etkisi güçlenir'));
 assert.ok(strict.costs.includes('Toplumsal gerilim artar'));
});
test('Bütün saha ve miras kararlarının açıklamaları sonlu ve boş olmayan metinler',()=>{
 const opts=[...CP.FIELD.flatMap(s=>s.opts),...CP.MISSIONS.flatMap(m=>m.crisis.opts),...CP.FINALS.opts];
 for(const o of opts){const e=CP.choiceExplanation(o);assert.ok(e.gains.length+e.costs.length>0);assert.doesNotMatch(JSON.stringify(e),/undefined|NaN/);}
});
test('Görsel koruma oranı 0..1 aralığında ve gerçek sağlıkla monoton',()=>{
 const snap=value=>({y:2070,regions:{ana:{water:value,bio:value,soil:value,unrest:10}}});
 const low=CP.sceneState(snap(0)),mid=CP.sceneState(snap(50)),high=CP.sceneState(snap(100));
 assert.equal(low.protection,0);assert.equal(high.protection,1);assert.ok(mid.protection>low.protection&&mid.protection<high.protection);
 assert.equal(mid.water,50);assert.equal(mid.future,1);assert.equal(CP.sceneState({...snap(80),y:430}).future,0);
});
test('Zaman geçişi yalnız gerçek tarih ve o görevin kimlikli izlerini içerir',()=>{
 const G=CP.newGame(7),p=CP.firstMission(G);p.choices=CP.stages(G,p).map(s=>s.opts[0]);
 const rep=CP.jump(G,p),sequence=CP.sceneReplay(rep);
 assert.equal(sequence.history[0].y,430);assert.equal(sequence.history.at(-1).y,rep.after.final.y);
 for(const h of sequence.history)assert.ok(rep.after.history.includes(h));
 for(const e of sequence.traces){assert.equal(e.iv,rep.iv.id);assert.ok(rep.after.log.includes(e));}
});
test('Bir sonraki hedef, en gerideki gerçek koldan seçilir',()=>{
 const G=CP.newGame(1);assert.equal(CP.nextFocus(G).key,'tech');
 G.tl={...G.tl,raw:{...G.tl.raw,tech:G.base.raw.tech+90}};
 assert.equal(CP.nextFocus(G).key,'eco');
 G.tl={...G.tl,raw:{...G.tl.raw,eco:G.base.raw.eco+30}};
 assert.equal(CP.nextFocus(G).key,'peace');
 G.tl={...G.tl,catastrophe:{type:'water',y:2050}};
 assert.equal(CP.nextFocus(G).key,'crisis');assert.match(CP.nextFocus(G).message,/felakete/);
});
test('Sermaye mirasının çevre ve barış faydaları birlikte açıklanır',()=>{
 const e=CP.choiceExplanation(CP.FINALS.opts[1]);
 assert.ok(e.gains.includes('Miras zamanla büyür'));
 assert.ok(e.gains.includes('Çevreye ayrılan kaynak artar'));
 assert.ok(e.gains.includes('Askeri baskı azalır'));
});
