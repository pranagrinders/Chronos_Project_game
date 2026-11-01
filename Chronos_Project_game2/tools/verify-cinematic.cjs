const { JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname, '..'); let checks=0;
function check(v,label){assert.ok(v,label);console.log('PASS',label);checks++;}
function boot(query='?seed=7&fast',reduce=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://chronos.test/'+query,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,frames=[];let clock=0;
 for(const css of ['style.css','cinema.css','hud.css','story.css']){const el=w.document.createElement('style');el.textContent=fs.readFileSync(path.join(root,'css',css),'utf8');w.document.head.append(el);}
 w.matchMedia=()=>({matches:reduce});w.requestAnimationFrame=cb=>frames.push(cb);Object.defineProperty(w.performance,'now',{value:()=>clock});
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
 for(const name of ['map-data','data','content','sim','game','experience','scene-data','save','scene-audio','hud','narrative','cinema','ui'])w.eval(fs.readFileSync(path.join(root,'src/'+name+'.js'),'utf8'));
 const $=q=>w.document.querySelector(q),text=()=>$('#cinema').textContent;
 const click=q=>{const el=$(q);assert.ok(el,'Missing '+q);assert.ok(!el.disabled,'Disabled '+q);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));if(el.matches('[data-choice]')){const c=w.document.querySelector('#cConfirm');if(c&&!c.disabled)c.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}};
 const flush=()=>{for(let i=0;i<16&&$('#cinema').dataset.mode==='replay';i++){clock+=1000;frames.splice(0).forEach(cb=>cb(clock));}};
 return{dom,w,$,text,click,flush,errors,frames};
}
const a=boot();
try{
 const{$,click,text,w}=a;
 check($('#cinema').dataset.mode==='intro'&&!$('#cinema').hidden,'Yeni açılış varsayılan ve görünür');
 check($('#app').inert&&$('#app').getAttribute('aria-hidden')==='true','Sahnedeyken komuta kontrolleri erişimden çıkarılır');
 check(text().includes('Gelecek,')&&!!$('#cBegin'),'Komuta odasında tek belirgin başlangıç eylemi');
 click('#cSound');check($('#btnMute').textContent==='Ses: Kapalı','Sahne sesi komuta düğmesiyle eşitlenir');click('#cSound');
 check(w.document.styleSheets.length===4,'Dört stil dosyası DOM tarafından hatasız ayrıştırılır');
 click('#cBegin');check($('#cinema').dataset.mode==='briefing'&&text().includes('20 enerji'),'Havza brifingi hedef ve bedelini açıklar');
 check(!$('#cExit')&&!$('#cFree'),'İlk görev zorunlu: açılış ve brifingde eğitimi atlayan çıkış yok');
 $('#cinema').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check($('#cinema').dataset.mode==='briefing','Escape brifingden eğitimi atlatmaz');
 check($('.tGuide .current').textContent==='Görevi al'&&$('.tWhere').textContent.includes('2070'),'Rehber oyuncunun yerini ve adımını söyler');
 click('#cTravel');
 check($('#cinema').dataset.mode==='decision'&&w.document.querySelectorAll('[data-choice]').length===2,'İlk sahnede iki gerçek karar görünür');
 check(text().includes('Bir yolu seç.')&&!!$('#cConfirm'),'Seçimlerde fayda ve bedel açık');
 check($('.tGuide .current').textContent==='3 karar ver'&&$('.tWhere').textContent.includes('M.S. 430'),'Karar ekranında rehber 430 yılını gösterir');
 check(!!$('.cResearcher img')&&text().includes('Leyla Aras'),'Saha uzmanı kimliği ve portresi görünür');
 click('[data-choice="0"]');check(text().includes('KARAR 2 / 3')&&text().includes('Önceki kararın:'),'Önceki seçim sonraki sahnede hatırlatılır');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 // Key handler belongs to the cinematic root; browser focus is there. Dispatch there.
 $('#cinema').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 check($('#cinema').dataset.mode==='briefing'&&w.CP.debug.G.energy===100,'Escape hazırlığı masrafsız iptal eder');
 click('#cTravel');click('[data-choice="1"]');click('[data-choice="1"]');
 check(w.document.querySelectorAll('[data-choice]').length===3,'Ayrılıkta üç gerçek miras yolu seçilebilir');
 $('[data-choice="1"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 check($('#cChoiceDetails').textContent.includes('Askeri baskı azalır'),'Üçüncü fayda kesilmez; sermaye yolunun barış etkisi görünür');
 click('[data-choice="2"]');
 check($('#cinema').dataset.mode==='replay'&&w.CP.debug.G.jumps===1,'Üç karar tek sıçrama oluşturur ve tarih akışı başlar');
 check($('#btnJump').disabled&&$('#app').inert,'Tarih akarken arka planda ikinci sıçrama başlatılamaz');
 a.flush();check($('#cinema').dataset.mode==='result','Gerçek tarih akışı sonuç sahnesine ulaşır');
 const G=w.CP.debug.G,expected=String(w.CP.sceneState(G.tl.final).future*w.CP.sceneState(G.tl.final).protection);
 check($('#cinema').style.getPropertyValue('--green-opacity')===expected,'Gelecek görselinin karışımı gerçek bölge ölçümünden gelir');
 check(text().includes('Sayılar gerçek oyun ölçümleridir.'),'Temsili görsel ile ölçüm ayrımı açık');
 click('#cBefore');check($('#cBefore').getAttribute('aria-pressed')==='true','Önceki tarih karşılaştırması seçilebilir');
 check($('#cCompareLabel').textContent==='ÖNCEKİ ZAMAN ÇİZGİSİ','Karşılaştırmanın başlığı seçilen tarihi doğru adlandırır');
 check($('#cinema').style.getPropertyValue('--green-opacity')===String(w.CP.sceneState(G.base.final).future*w.CP.sceneState(G.base.final).protection),'Önceki tarih gösterimi başlangıç verisini kullanır');
 click('#cAfter');check($('#cAfter').getAttribute('aria-pressed')==='true','Yeni tarihe geri dönülebilir');
 const count=G.hand.length;click('[data-reward]');
 check($('#cinema').dataset.mode==='home'&&$('#app').inert&&G.hand.length===count+1,'Destek kartından sonra atmosferik komuta güvertesine dönülür');
 check(text().includes(w.CP.nextFocus(G).label),'Komuta güvertesi gerçek geride kalan kolu gösterir');
 check(text().includes('Su Meclisi Kur'),'Bırakılan kuruluş komuta güvertesinde hatırlanır');
 click('#cMap');check($('#cinema').hidden&&!$('#app').inert,'Güverteden dünya haritasına geçilebilir');
 click('#btnBridge');check($('#cinema').dataset.mode==='home','Haritadan Gemi düğmesiyle güverteye dönülebilir');
 click('#cBook');check($('#modalBox').textContent.includes('Tarih Kitabı'),'Güverteden tarih kitabı açılabilir');click('#mClose');
 click('#btnBridge');click('#cPlanNext');check($('#modalBox').textContent.includes('Hangi bölge?'),'İlk sahneden sonra serbest dünya akışı korunur');
 check(a.errors.length===0,'Sinematik akışta çalışma zamanı hatası yok');
}finally{a.dom.window.close();}
const b=boot('?seed=7&fast');
try{
 b.click('#cBegin');b.click('#cTravel');b.click('[data-choice="0"]');b.click('[data-choice="0"]');b.click('[data-choice="0"]');b.click('#cSkip');
 check(b.$('#cinema').dataset.mode==='result','Zaman geçişi güvenle atlanabilir');
 b.click('#cDetails');check(b.$('#cinema').hidden&&b.$('#modalBox').textContent.includes('Kelebek Raporu'),'Sahneden tam rapora geçilebilir');
 b.click('#mClose');check(b.$('#modal').classList.contains('hidden')&&b.$('#cinema').dataset.mode==='home','Ayrıntılı rapordan komuta güvertesine dönülür');
 check(b.errors.length===0,'Atlama ve tam rapor akışında hata yok');
}finally{b.dom.window.close();}
const c=boot('?seed=1');
try{
 c.click('#cBegin');check(c.$('#cinema').dataset.mode==='prologue'&&c.$('#resourceHud').hidden,'Yeni oyun açılış hikâyesiyle başlar; kaynak şeridi henüz gizli');
 const scenes=c.w.CP.story.prologue.length;check(c.text().includes('Yağmur artık zehirli.')&&c.$('#cProBack').hidden,'Hikâye ilk karttan başlar');
 c.click('#cProNext');check(c.text().includes('Bu çağa ait değilsin.'),'Devam sonraki kartı açar');
 c.click('#cProBack');check(c.text().includes('Yağmur artık zehirli.'),'Geri önceki kartı açar');
 for(let i=1;i<scenes;i++)c.click('#cProNext');check(c.text().includes('Komutan sensin.')&&c.$('#cProNext').textContent.includes('Görevi al'),'Son kart göreve çağırır');
 c.click('#cProNext');check(c.$('#cinema').dataset.mode==='briefing'&&!c.$('#resourceHud').hidden,'Hikâye sonunda brifinge geçilir');
 check(c.errors.length===0,'Açılış hikâyesinde hata yok');
}finally{c.dom.window.close();}
const skip=boot('?seed=1');
try{skip.click('#cBegin');skip.click('#cStorySkip');check(skip.$('#cinema').dataset.mode==='briefing','Hikâye atlanır ama ilk görev atlanmaz');check(skip.errors.length===0,'Hikâye atlamada hata yok');}finally{skip.dom.window.close();}
const d=boot('?seed=2&fast',true);
try{d.click('#cBegin');d.click('#cTravel');d.click('[data-choice="1"]');d.click('[data-choice="0"]');d.click('[data-choice="1"]');d.flush();check(d.$('#cinema').dataset.mode==='result','Azaltılmış harekette sinematik görev tamamlanır');check(d.errors.length===0,'Azaltılmış hareket akışında hata yok');}finally{d.dom.window.close();}
const e=boot('?seed=7&fast&classic');
try{check(e.$('#cinema').hidden&&e.$('#modalBox').textContent.includes('Gelecek, geçmişte başlar.'),'Klasik UI karşılaştırma modu korunur');check(e.errors.length===0,'Klasik modda hata yok');}finally{e.dom.window.close();}
const normal=boot('?seed=3');
try{normal.click('#cBegin');normal.click('#cStorySkip');normal.click('#cTravel');check(!!normal.$('#alignHit'),'Sıçrama öncesi hizalama açılır');check(normal.$('#align').textContent.includes('Atla'),'Hizalama atlanabilir');normal.click('#alignSkip');check(!normal.$('#align')&&normal.$('#cinema').dataset.mode==='travel','Normal hızda zamansal geçiş sahnesi açılır');normal.click('#cSkipTravel');check(normal.$('#cinema').dataset.mode==='decision','Zamansal geçiş atlanabilir');normal.click('[data-choice="0"]');normal.click('[data-choice="0"]');normal.click('[data-choice="0"]');check(normal.$('#cinema').dataset.mode==='replay','Normal hızda gerçek tarih geçişi açılır');const caption=normal.$('#cTrace'),observer=new normal.w.MutationObserver(()=>{});observer.observe(caption,{childList:true});for(let i=0;i<5;i++)normal.frames.splice(0).forEach(cb=>cb(1000+i*.01));check(observer.takeRecords().length<=1,'Aynı tarih karesinde canlı altyazı tekrar tekrar yazılmaz');observer.disconnect();normal.click('#cSkip');check(normal.$('#cinema').dataset.mode==='result','Normal akıştan sonuç sahnesine geçilir');normal.click('[data-reward]');check(!!normal.$('#tour')&&normal.$('#tourTitle').textContent==='Enerji','İlk görevden sonra komuta ekranı turu açılır');const tourSteps=10;for(let i=1;i<tourSteps;i++){normal.click('#tourNext');if(i===6)check(normal.$('#cardDrawer').open,'Tur kartları açıkça gösterir');}check(normal.$('#tourNext').textContent==='Anladım','Turun son adımı bitişi söyler');normal.click('#tourNext');check(!normal.$('#tour')&&normal.$('#cinema').dataset.mode==='home'&&!normal.$('#cardDrawer').open,'Tur bitince güverteye dönülür');const g=normal.w.CP.debug.G;g.tl.log.push({kind:'legacy',iv:g.ivs[0].id,y:530,text:'Miras dağıldı.'});normal.w.CP.cinema.home(g,()=>{},()=>{},()=>{});check(normal.text().includes('Mirası dağıldı'),'Dağılan kuruluş komuta güvertesinde yaşamaya devam ediyor gibi gösterilmez');check(normal.errors.length===0,'Normal hız akışında çalışma zamanı hatası yok');}finally{normal.dom.window.close();}
console.log('TOTAL',checks,'cinematic DOM checks passed. No browser screenshots/layout were tested.');
