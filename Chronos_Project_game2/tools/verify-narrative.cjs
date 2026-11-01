// Yeni anlatı/önizleme akışı için manuel seçim+ayrı onay; gerçek tarayıcı renderı değildir.
const{JSDOM,VirtualConsole}=require(process.env.JSDOM_PATH||'jsdom');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),audioFixture=require('./audio-harness.cjs');
const root=path.resolve(__dirname,'..');let checks=0;const check=(x,n)=>{assert.ok(x,n);checks++;console.log('PASS',n);};
function boot(query='?seed=7&fast',voice=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://chronos.test/'+query,runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,sound=audioFixture(),frames=[],spoken=[];let clock=0,hidden=false,cancels=0;Object.defineProperty(w.document,'hidden',{get:()=>hidden});
 w.AudioContext=sound.AudioContext;w.setTimeout=sound.setTimeout;w.clearTimeout=sound.clearTimeout;w.matchMedia=q=>({matches:q.includes('prefers-reduced')?false:false});w.requestAnimationFrame=f=>frames.push(f);Object.defineProperty(w.performance,'now',{value:()=>clock});
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
 if(voice){w.speechSynthesis={getVoices:()=>[{lang:'tr-TR',localService:true}],speak:u=>spoken.push(u),cancel:()=>cancels++,addEventListener(){}};w.SpeechSynthesisUtterance=function(text){this.text=text;};}
 for(const name of ['style','cinema','hud','story']){const e=w.document.createElement('style');e.textContent=fs.readFileSync(root+'/css/'+name+'.css','utf8');w.document.head.append(e);}
 for(const name of ['map-data','data','content','sim','game','experience','scene-data','save','scene-audio','hud','narrative','cinema','ui'])w.eval(fs.readFileSync(root+'/src/'+name+'.js','utf8'));
 const $=q=>w.document.querySelector(q),click=q=>{const e=$(q);assert.ok(e,q);assert.ok(!e.disabled,q);e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 const choose=n=>{click(`[data-choice="${n}"]`);click('#cConfirm');};
 return{w,dom,$,click,choose,errors,sound,frames,spoken,cancels:()=>cancels,advance:ms=>clock+=ms,hide:()=>{hidden=true;w.document.dispatchEvent(new w.Event('visibilitychange'));sound.flush();},flush:()=>{clock+=1000;frames.splice(0).forEach(f=>f(clock));}};
}
const a=boot();
try{
 const{$,w,click,choose,sound}=a,G=w.CP.debug.G;
 check(w.document.body.classList.contains('storyMode'),'Yeni anlatı stili varsayılan oyunda etkin');
 check(w.getComputedStyle($('#cinemaTitle')).fontFamily.includes('Barlow'),'Başlık eski serif yazı tipini devralmaz');
 $('#cBegin').dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true}));check(sound.contexts.length===0,'İlk kullanıcı hareketinden önce menü gezinmesi ses başlatmaz');
 click('#cBegin');check($('#cinema').textContent.includes('Leyla Aras'),'Brifingde görev bağlamını bir kişi anlatır');check(w.getComputedStyle($('#cinema .storyDialogue p')).fontFamily.includes('Manrope'),'Diyalog eski serif yazı tipini devralmaz');click('#cTravel');
 check($('#cinema').textContent.includes('Leyla Aras'),'İlk saha kararı isimsiz anlatıcıdan gelmez');
 check($('#cConfirm').disabled,'Bir yol seçilmeden onaylanamaz');
 check(w.document.querySelectorAll('.storyOptions .cChoice>img').length===2,'İlk iki seçenek yazının yanında eylem resmi taşır');
 click('[data-choice="0"]');check($('#cinema').textContent.includes('KARAR 1 / 3')&&G.jumps===0&&G.energy===100,'Resme tıklamak kararı uygulamaz veya enerji harcamaz');
 check($('#cChoiceDetails').textContent.includes('NE KAZANIRIZ?')&&$('#cChoiceDetails').textContent.includes('NEYE MAL OLUR?'),'Seçilen eylemin fayda ve bedeli aynı önizlemede açıklanır');
 check(!!$('#cChoiceVisual .storyArt svg')&&!$('#cConfirm').disabled,'Eylem için kod canlandırması ve ayrı onay vardır');
 click('[data-choice="1"]');check($('[data-choice="1"]').getAttribute('aria-pressed')==='true'&&$('[data-choice="0"]').getAttribute('aria-pressed')==='false','Oyuncu onaydan önce fikrini değiştirebilir');
 click('#cConfirm');check($('#cinema').textContent.includes('Dara'),'Otlak çatışmasını geçimini oradan sağlayan kişi anlatır');
 click('[data-choice="0"]');check($('#cChoiceVisual img').getAttribute('src').includes('common-grazing'),'Ortak yönetim yolu ortak otlak sahnesini gösterir');
 click('[data-choice="1"]');check($('#cChoiceVisual img').getAttribute('src').includes('protected-boundary'),'Sınır yolu kapalı otlak sahnesini gösterir');
 check($('#cChoiceDetails .cChoiceCost').textContent.includes('Toplumsal gerilim artar'),'Sınırın insanlara bedeli görünür; yalnız yeşil fayda gösterilmez');
 click('#cConfirm');choose(0);check(G.jumps===1&&G.energy<100&&G.crew.res===1,'Üçüncü onay tek gerçek sıçramayı gerçekleştirir');
 click('#cSkip');click('#cContinue');click('#cMap');
 check($('#left').contains($('#legacyDrawer'))&&$('#left').contains($('#cardDrawer')),'Geçmiş kuruluş eylemleri sadeleştirilen haritada erişilebilir kalır');
 check(!$('#dispatch')&&!!$('#leader img')&&$('#view').contains($('#window'))&&!!$('#mapHint'),'Sağ kolon yok; ekip lideri, seyir ekranı ve harita yönergesi var');
 click('#r_kam');check(!$('#modal').classList.contains('hidden')&&$('#modalBox').textContent.includes('Yatırım Dağılımı'),'Haritadan bölge seçmek bölge bilgilerini açar');
 click('#mClose');check(!w.document.querySelector('.region.sel'),'Bilgi penceresi kapanınca bölge seçimi temizlenir');
 click('#r_kam');click('#mPlan');click('[data-era="2026"]');
 check([...w.document.querySelectorAll('[data-m]')].every(e=>e.querySelector('.missionRequester img')&&e.querySelector('.missionQuote')),'Serbest görevlerin her birini bir kişi ister ve nedenini söyler');
 click('[data-m="0"]');
 check($('#cinema').dataset.mode==='decision'&&$('#cinema').textContent.includes('2026'),'Serbest görev de karakterli sahneye geçer,430yılına zorlanmaz');
 check(!$('#cinema').textContent.includes('Dara'),'Anadolu430yerel kişisi modern Amerika sahnesine taşınmaz');
 const n=sound.contexts[0].nodes.length;a.advance(200);$('#cSound').dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true}));const hoverN=sound.contexts[0].nodes.length;
 check(hoverN>n,'Kullanıcı etkileşiminden sonra menü gezinmesi kısa efekt verir');
 $('#cSound').dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true}));check(sound.contexts[0].nodes.length===hoverN,'Aynı anda tekrarlanan gezinme efekti hız sınırına takılır');
 click('#cSound');sound.flush();const mutedN=sound.contexts[0].nodes.length;a.advance(200);$('#cSound').dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true}));check(sound.contexts[0].nodes.length===mutedN,'Sessizde gezinme yeni ses oluşturmaz');
 check(sound.contexts.length===1,'Harita,menü ve karakterli kararlar tek ses bağlamını kullanır');
 a.hide();check(sound.contexts[0].state==='suspended','Sekme gizlenince menü/ortam sesi askıya alınır');
 check(a.errors.length===0,'Yeni anlatı/serbest görev/ses akışında çalışma zamanı hatası yok');
}finally{a.dom.window.close();}
const b=boot('?seed=7&fast',true);
try{
 b.click('#cBegin');b.click('#cTravel');check(!b.$('#cinema [data-voice-line]').hidden,'Yerel Türkçe ses varsa karakteri dinleme eylemi açılır');
 b.click('#cinema [data-voice-line]');check(b.spoken.length===1&&b.spoken[0].lang==='tr-TR','Dinleme yalnız görünür konuşma metnini yerel Türkçe sese verir');
 const n=b.cancels();b.click('#cSound');check(b.cancels()>n,'Sessize alma karakter anlatımını da keser');
 check(b.errors.length===0,'Yerel konuşma seçeneğinde çalışma zamanı hatası yok');
}finally{b.dom.window.close();}
console.log('TOTAL',checks,'narrative DOM/audio contract checks passed. No rendered visual or audible quality acceptance.');
