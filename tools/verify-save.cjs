// Geliştirme kontrolü: JSDOM_PATH=/jsdom/modülü node tools/verify-save.cjs
const{JSDOM,VirtualConsole}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let checks=0;
const check=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS',label);};
function boot(entries={},classic=false,blocked=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://chronos.test/?seed=7&fast'+(classic?'&classic':''),runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,frames=[];let clock=0;
 for(const[k,v]of Object.entries(entries))w.localStorage.setItem(k,v);
 if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Object.assign(new Error(),{name:'SecurityError'});}});
 w.matchMedia=()=>({matches:false});w.requestAnimationFrame=cb=>frames.push(cb);Object.defineProperty(w.performance,'now',{value:()=>clock});
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
 for(const name of ['map-data','data','content','sim','game','experience','scene-data','save','scene-audio','hud','narrative','cinema','ui'])w.eval(fs.readFileSync(path.join(root,'src',name+'.js'),'utf8'));
 const $=q=>w.document.querySelector(q),click=q=>{const e=$(q);assert.ok(e,q);assert.ok(!e.disabled,q+' disabled');e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));if(e.matches('[data-choice]')){const c=w.document.querySelector('#cConfirm');if(c&&!c.disabled)c.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}};
 const flush=()=>{for(let i=0;i<16&&$('#cinema').dataset.mode==='replay';i++){clock+=1000;frames.splice(0).forEach(cb=>cb(clock));}};
 const finish=()=>{click('#cTravel');click('[data-choice="0"]');click('[data-choice="0"]');click('[data-choice="0"]');flush();click('#cContinue');};
 return{dom,w,$,click,flush,finish,errors};
}
let raw,expected,key;
const a=boot();
try{
 a.click('#cBegin');a.finish();const G=a.w.CP.debug.G;key=a.w.CP.store.key;raw=a.w.localStorage.getItem(key);
 check(!!raw&&JSON.parse(raw).data.jumps===1,'Tamamlanan ilk görev otomatik kaydedilir');
 check(!raw.includes('history')&&raw.length<15000,'Kayıt küçük kalır; tarih tablolarını içermez');
 check(a.$('#saveStatus').textContent.includes('kaydedildi'),'Haritada gerçek kayıt durumu görünür');
 expected=JSON.stringify({tl:G.tl,energy:G.energy,crew:G.crew,hand:G.hand,tracks:a.w.CP.tracks(G)});
 check(a.errors.length===0,'Kayıt oluşturulurken çalışma zamanı hatası yok');
}finally{a.dom.window.close();}
const b=boot({[key]:raw});
try{
 check(b.$('#cBegin').textContent.includes('Döngüye devam et'),'Yeni açılışta kayıtlı döngü için devam eylemi sunulur');b.click('#cBegin');
 const G=b.w.CP.debug.G;
 check(b.$('#cinema').dataset.mode==='home'&&G.jumps===1,'Devam, ilk görevi tekrarlatmadan güverteyi açar');
 check(JSON.stringify({tl:G.tl,energy:G.energy,crew:G.crew,hand:G.hand,tracks:b.w.CP.tracks(G)})===expected,'Sayfa yeniden açılınca dünya ve kaynaklar aynıdır');
 check(b.w.localStorage.getItem(key)===raw,'Devam ederken mevcut kayıt değiştirilmez');
 b.click('#cMap');b.$('#cardDrawer').open=true;b.click('[data-c="0"]');b.click('[data-t="ana"]');
 check(JSON.parse(b.w.localStorage.getItem(key)).data.hand.length===G.hand.length,'Kart kullanımı da kayda geçer');
 check(b.errors.length===0,'Devam ve kart kaydında hata yok');
}finally{b.dom.window.close();}
const c=boot({[key]:raw});
try{
 c.click('#cNewRun');check(c.w.localStorage.getItem(key)===raw,'Yeni döngünün hazırlığı eski kaydı hemen ezmez');c.finish();
 check(c.w.localStorage.getItem(c.w.CP.store.backupKey)===raw,'Yeni döngü tamamlanınca önceki kayıt yedekte korunur');
 check(JSON.parse(c.w.localStorage.getItem(key)).runId!==JSON.parse(raw).runId,'Aynı seed ile yeni döngü ayrı kayıt kimliği alır');
 check(c.errors.length===0,'Yeni döngü ve yedekte hata yok');
}finally{c.dom.window.close();}
const d=boot({[key]:'bozuk-json'});
try{
 check(d.$('#cinema').textContent.includes('üzerine yazılmadı'),'Bozuk kayıt kullanıcıya açıklanır');
 check(d.w.localStorage.getItem(key)==='bozuk-json','Bozuk kayıt açılışta korunur');d.click('#cBegin');d.click('#btnSave');
 check(d.w.localStorage.getItem(d.w.CP.store.backupKey)==='bozuk-json','Açıkça yeni kayıt yapılınca bozuk eski veri de yedeklenir');
 check(d.errors.length===0,'Bozuk kayıt oyunu çökertmez');
}finally{d.dom.window.close();}
const e=boot({},false,true);
try{
 check(e.$('#cinema').textContent.includes('kayıt alanına erişilemiyor'),'Depolama erişim engeli açılışta açıklanır');e.click('#cBegin');e.click('#btnSave');
 check(e.$('#saveStatus').textContent.includes('yalnız açık sekmede'),'Kayıt hatası başarı gibi gösterilmez');
 check(e.w.CP.debug.G.energy===100&&e.errors.length===0,'Kayıt alanı yokken oyun devam eder');
}finally{e.dom.window.close();}
const f=boot({[key]:raw},true);
try{check(!!f.$('#mResume'),'Klasik arayüzde de devam düğmesi var');f.click('#mResume');check(f.w.CP.debug.G.jumps===1&&f.$('#modal').classList.contains('hidden'),'Klasik devam da dünyayı geri yükler');check(f.errors.length===0,'Klasik devam akışında hata yok');}finally{f.dom.window.close();}
const ended=JSON.parse(raw);ended.data.over='quit';const g=boot({[key]:JSON.stringify(ended)});
try{check(g.$('#cBegin').textContent.includes('Son döngüyü gör'),'Bitmiş kayıt ayrı adlandırılır');g.click('#cBegin');check(g.$('#modalBox').textContent.includes('GÖREV YARIDA KALDI'),'Bitmiş döngü sonuç ekranına döner');check(g.errors.length===0,'Bitmiş kayıt devamında hata yok');}finally{g.dom.window.close();}
let guidedRaw;
const j=boot();
try{j.click('#cBegin');j.click('#btnSave');guidedRaw=j.w.localStorage.getItem(key);}finally{j.dom.window.close();}
// Eski sürümlerde eğitimi atlayarak alınmış kayıtlar açılmaya devam eder.
const oldFree=JSON.parse(guidedRaw);oldFree.ui.guidedStart=false;const freeRaw=JSON.stringify(oldFree);
const i=boot({[key]:freeRaw});
try{i.click('#cBegin');check(i.$('#cinema').dataset.mode==='home'&&i.w.CP.debug.G.jumps===0,'Sıfırıncı turdaki serbest tercih eğitim akışına çevrilmez');i.click('#cPlanNext');check(i.$('#modalBox').textContent.includes('Hangi bölge?'),'Serbest kayıtla görev planı özgür başlar');check(i.errors.length===0,'Sıfırıncı tur devamında hata yok');}finally{i.dom.window.close();}
const k=boot({[key]:guidedRaw});
try{k.click('#cBegin');check(k.$('#cinema').dataset.mode==='briefing','Tamamlanmamış eğitimin rehber tercihi korunur');check(k.errors.length===0,'Eğitim kaydını açarken hata yok');}finally{k.dom.window.close();}
let letterRaw;
const fixture=boot();
try{
 const C=fixture.w.CP;
 for(let seed=0;seed<25&&!letterRaw;seed++){
  const run=C.newGame(seed),first=C.firstMission(run);first.choices=C.stages(run,first).map(s=>s.opts[0]);C.jump(run,first);C.takeOffer(run,null);
  const second={...C.offerMissions(run,'bav',2000)[0],region:'bav'};second.choices=C.stages(run,second).map(s=>s.opts[0]);C.jump(run,second);C.takeOffer(run,null);
  if(!run.over&&C.nextLetter(run)){run.lastRecruit=run.jumps;letterRaw=C.store.pack(run);}
 }
 assert.ok(letterRaw,'Letter fixture not found');
}finally{fixture.dom.window.close();}
let answeredRaw;
const l=boot({[key]:letterRaw});
try{l.click('#cBegin');check(l.$('#modalBox').textContent.includes('Geçmişten Bir Mektup'),'Bekleyen mektup devam edilirken sunulur');l.click('[data-l="0"]');answeredRaw=l.w.localStorage.getItem(key);check(JSON.parse(answeredRaw).data.lastLetter===2,'Mektup yanıtı aynı tur için kaydedilir');check(l.errors.length===0,'Mektup geri yükleme/yanıtta hata yok');}finally{l.dom.window.close();}
const m=boot({[key]:answeredRaw});
try{m.click('#cBegin');check(m.$('#cinema').dataset.mode==='home','Yanıtlanmış mektup yeniden sorulmaz');check(m.errors.length===0,'Yanıt sonrası devamda hata yok');}finally{m.dom.window.close();}
console.log('TOTAL',checks,'save/resume DOM checks passed. No browser layout was tested.');
