// Kaynak şeridinin gerçek oyun akışıyla bütünlüğü. Görsel render testi değildir.
const{JSDOM,VirtualConsole}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let checks=0;
const check=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS',label);};
function boot(query='?seed=7&fast',saved={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://chronos.test/'+query,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,frames=[];let clock=0;
 Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));
 w.matchMedia=()=>({matches:false});w.requestAnimationFrame=cb=>frames.push(cb);Object.defineProperty(w.performance,'now',{value:()=>clock});
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
 for(const css of ['style','cinema','hud','story']){const e=w.document.createElement('style');e.textContent=fs.readFileSync(root+'/css/'+css+'.css','utf8');w.document.head.append(e);}
 for(const script of ['map-data','data','content','sim','game','experience','scene-data','save','scene-audio','hud','narrative','cinema','ui'])w.eval(fs.readFileSync(root+'/src/'+script+'.js','utf8'));
 const $=q=>w.document.querySelector(q),click=q=>{const e=$(q);assert.ok(e,q);assert.ok(!e.disabled,q);e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));if(e.matches('[data-choice]')){const c=w.document.querySelector('#cConfirm');if(c&&!c.disabled)c.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}};
 const value=key=>$(`[data-hud-value="${key}"]`).textContent;
 const finish=()=>{click('#cTravel');for(let i=0;i<3;i++)click('[data-choice="0"]');click('#cSkip');};
 return{dom,w,$,click,value,finish,errors};
}
let saved,key;
const a=boot();
try{
 const{$,click,value,w}=a,G=w.CP.debug.G;
 check($('#resourceHud').hidden&&!w.document.body.classList.contains('hasResourceHud'),'Kayıt/yeni döngü seçilmeden yanlış başlangıç kaynağı gösterilmez');
 click('#cBegin');
 check(!$('#resourceHud').hidden&&w.document.body.classList.contains('hasResourceHud'),'Göreve hazırlıkta kaynak şeridi görünür');
 check($('#resourceHud').parentElement===$('#cinema'),'Şerit aktif sinematik diyalogun erişilebilir içeriğindedir');
 check(w.getComputedStyle($('#resourceHud')).position==='fixed','Kaynak şeridi kaydırma alanından bağımsız sabit konumdadır');
 check($('#resourceHud').querySelectorAll('[data-hud-value]').length===7,'Enerji,üçuzman veüçhedef birlikte görünür');
 check(!$('#resourceHud').querySelector('button,a,input,[tabindex]'),'Şerit kararın klavye odağına yeni durak eklemez');
 check(value('energy')==='100%'&&['sci','res','edu'].every(k=>value(k)==='2'),'Başlangıç enerji ve ekip sayıları gerçek gemiyle aynıdır');
 check(['tech','eco','peace'].every(k=>value(k)==='10%'),'Başlangıç prototip kolları gerçek yüzdeyle görünür');
 check($('[data-hud-meter="energy"]').style.width==='100%','Enerji dolumu gerçek yüzdeyi kullanır');
 click('#cTravel');click('[data-choice="0"]');
 check(value('energy')==='100%'&&value('res')==='2','Henüz onaylanmayan hazırlık kaynak harcamaz');
 click('[data-choice="0"]');click('[data-choice="0"]');
 const energy=G.energy.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%';
 check($('#cinema').dataset.mode==='replay'&&value('energy')===energy&&value('res')==='1','Sıçrama başlar başlamaz gerçek enerji ve görevli sayısı güncellenir');
 click('#cSkip');
 check(Object.entries(w.CP.tracks(G)).every(([k,v])=>value(k)===v.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%'),'Sonuçta her hedef kolu gerçek oyun değeridir');
 const actual=$('#resourceHud').textContent;click('#cBefore');
 check($('#resourceHud').textContent===actual,'Önceki dünya karşılaştırması geminin gerçek kaynaklarını geri sarmaz');
 click('#cAfter');click('#cContinue');
 check($('#resourceHud').parentElement===$('#cinema')&&value('res')==='1','Güverteye dönüşte tek şerit ve doğru ekip kalır');
 key=w.CP.store.key;saved=w.localStorage.getItem(key);
 click('#cMap');
 check($('#resourceHud').parentElement===w.document.body&&!$('#resourceHud').hidden,'Haritaya geçince kaynaklar gizlenen sinematikte kalmaz');
 click('#btnBook');
 check($('#resourceHud').parentElement===$('#modal')&&$('#modal').getAttribute('role')==='dialog','Tarih Kitabı kaynak şeridini aynı erişilebilir diyalogda tutar');
 check($('#modal').getAttribute('aria-labelledby')==='dialogTitle'&&$('#dialogTitle').textContent==='Tarih Kitabı','Diyalog başlığı kaynak şeridi taşınırken korunur');
 click('#mClose');$('#cardDrawer').open=true;click('[data-c="0"]');click('[data-t="ana"]');
 check(Object.entries(w.CP.tracks(G)).every(([k,v])=>value(k)===v.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%'),'Kart sonrası kaynak şeridi yeni hedef durumunu gösterir');
 check($('#resourceHud').parentElement===$('#modal'),'Kart raporunda da şerit görünür diyalog içindedir');
 click('#mClose');click('#btnEnd');
 check($('#resourceHud').parentElement===$('#modal')&&value('energy')===energy,'Bitiş raporunda son gerçek kaynaklar görünür');
 check(w.document.querySelectorAll('#resourceHud').length===1,'Sahne ve diyalog geçişleri kaynak şeridini çoğaltmaz');
 check(a.errors.length===0,'HUD ilk görev/kart/bitiş akışında çalışma zamanı hatası yok');
}finally{a.dom.window.close();}
const b=boot('?seed=7&fast',{[key]:saved});
try{
 check(b.$('#resourceHud').hidden,'Kayıtlı döngü varken ilk sahnede geçici yeni oyun değerleri gizlidir');b.click('#cBegin');
 const G=b.w.CP.debug.G;
 check(b.value('res')==='1'&&b.value('energy')===G.energy.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%','Devam edilen döngünün gerçek kaynakları geri yüklenir');
 check(b.errors.length===0,'HUD kayıt devamında çalışma zamanı hatası yok');
}finally{b.dom.window.close();}
const c=boot('?seed=7&fast&classic');
try{
 c.click('#mGo');
 check(!c.$('#resourceHud').hidden&&c.$('#resourceHud').parentElement===c.$('#modal'),'Klasik eğitim brifinginde de kaynak şeridi görünür');
 check(c.$('#resourceHud').getAttribute('aria-label').includes('Gemi kaynakları'),'Kaynak grubunun erişilebilir adı vardır');
 c.click('#mClose');
 check(c.$('#resourceHud').parentElement===c.w.document.body,'Klasik diyalog kapanınca şerit haritada kalır');
 check(c.errors.length===0,'Klasik HUD akışında çalışma zamanı hatası yok');
}finally{c.dom.window.close();}
const fixture=boot('?seed=1&skip');let letterRaw;
try{
 const C=fixture.w.CP;
 for(let seed=1;seed<=60&&!letterRaw;seed++){
  const G=C.newGame(seed);for(let n=0;n<2;n++){const p=C.firstMission(G);p.choices=C.stages(G,p).map(s=>s.opts[0]);C.jump(G,p);}
  if(!G.over&&C.nextLetter(G)){G.saveId='hud-letter-'+seed;G.tutorialGuided=false;C.store.write(G);letterRaw=fixture.w.localStorage.getItem(C.store.key);}
 }
 assert.ok(letterRaw,'letter fixture');
}finally{fixture.dom.window.close();}
const d=boot('?seed=7&fast',{[key]:letterRaw});
try{
 d.click('#cBegin');check(d.$('#modalBox').textContent.includes('Geçmişten Bir Mektup')&&d.$('#resourceHud').parentElement===d.$('#modal'),'Mektup okunurken gerçek gemi kaynakları aynı diyalogda görünür');
 const energy=d.value('energy'),G=d.w.CP.debug.G;d.click('[data-l="0"]');
 check(d.$('#modalBox').textContent.includes('Mektuba Yanıt')&&d.value('energy')===energy,'Mektuba yanıt enerji harcamaz; şerit doğru kaynağı korur');
 check(Object.entries(d.w.CP.tracks(G)).every(([k,v])=>d.value(k)===v.toLocaleString('tr-TR',{maximumFractionDigits:1})+'%'),'Mektup sonucunun hedef etkisi kaynak şeridine yansır');
 check(d.errors.length===0,'Mektup/yanıt HUD akışında çalışma zamanı hatası yok');
}finally{d.dom.window.close();}
console.log('TOTAL',checks,'HUD DOM checks passed. No rendered/mobile layout or audible audio verified.');
