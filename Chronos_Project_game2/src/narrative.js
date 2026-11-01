// Kurmaca kişiler ve karar canlandırmaları; sonuçlar yine simülasyonun verisidir.
globalThis.CP = globalThis.CP || {};
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cast = {
    leyla:{name:'Leyla Aras',role:'Alan araştırmacısı · Temporal Shift',image:'researcher.png'},
    cem:{name:'Dr. Cem Sönmez',role:'Bilim sorumlusu · Temporal Shift',image:'cem.png'},
    dara:{name:'Dara',role:'Çoban · Kızılırmak havzası, 430',image:'dara.png'},
  };
  const requests = {
    vakif_sci:['cem','Bilgi bir insanla birlikte kaybolmamalı. Burada kuşaklar boyunca çalışacak bir araştırma merkezi kuralım.'],
    vakif_res:['leyla','Ölçmeden karar veriyoruz. Buraya bir gözlem ekibi bırakırsak hem nehri tanırız hem diğer kuruluşları destekleriz.'],
    vakif_edu:['leyla','İnsanlar alışkanlıklarını ancak nedenini anladıklarında değiştiriyor. Burada bir okulun temellerini atalım.'],
    gelenek:['leyla','Bir kural unutulabilir; birlikte yaşanan bir gelenek kalır. Doğayı gözeten bir alışkanlık başlatalım.'],
    koruma:['leyla','Bu havzanın suyunu ve yaşam alanlarını birlikte korumak istiyorum. Ama burada yaşayanları dışarıda bırakırsak direnecekler.'],
    tohum:['cem','Tek bir kötü hasat her şeyi bitirebilir. Yerel tohumları saklayacak bir kuruluş bırakalım.'],
    tarim:['leyla','Toprağı her yıl biraz daha yoruyoruz. Çiftçilerin de geçinebileceği bir onarım yolu bulmalıyız.'],
    akim:['leyla','Tek başımıza herkese ulaşamayız. İnsanların kendi aralarında sürdürebileceği bir hareket başlatalım.'],
    yasa:['cem','Bütçe başka yere akarsa çevre kuralları kâğıtta kalır. Atık ve çevre için kalıcı bir pay ayıralım.'],
    ifsa:['cem','Askerî harcamaların arkasında kaybolan kaynaklar var. Gerçeği açığa çıkarabiliriz; fakat halkın tepkisini de göze alacağız.'],
    mucit:['cem','Bu buluşun geleceği değiştirme ihtimali var. Onu geliştiren insanın çalışmaya devam edebilmesini sağlamalıyız.'],
    kent:['leyla','Bir sıcak dalgasında herkes aynı ölçüde korunmuyor. Gölgeyi, suyu ve toprağı insanların yaşadığı yere geri getirelim.'],
    deniz:['leyla','Su sınır tanımıyor. Balıkçılarla ve kıyıdaki insanlarla bir koruma ağı kurmayı deneyelim.'],
    sifir:['leyla','Atığı uzakta bir yere yollamak çözüm değil. Mahallede onarımı ve yeniden kullanımı örgütleyelim.'],
    enerji:['cem','Temiz enerji yalnız bir buluş değil, kimin elinde olduğuyla da ilgili. Ortak bir enerji kooperatifi kuralım.'],
    degistir:['cem','Bu olayın mevcut tarihte nasıl bittiğini biliyoruz. Hemen öncesine gidip gidişatı değiştirmeyi deneyebiliriz.'],
  };
  const request = (offer) => { const [speaker,line] = requests[offer.m.id] || ['leyla',offer.m.desc];return{speaker,line}; };
  const voiceAvailable = () => window.speechSynthesis?.getVoices().find(v=>v.localService && /^tr(?:-|_)/i.test(v.lang));
  function stopVoice(){window.speechSynthesis?.cancel();}
  function dialogue(who,line,extra=''){
    const person=cast[who]||cast.leyla;
    return `<aside class="cResearcher storyDialogue ${extra}"><img src="assets/cinema/${person.image}" alt="${esc(person.name)}, kurmaca oyun karakteri"><div><span>${esc(person.name)}</span><small>${esc(person.role)}</small><p>${esc(line)}</p><button class="storyListen" data-voice-person="${who}" data-voice-line="${esc(line)}" hidden>Konuşmayı dinle</button></div></aside>`;
  }
  function bindVoices(container){
    container.querySelectorAll('[data-voice-line]').forEach(b=>{
      b.hidden=!voiceAvailable();
      b.onclick=()=>{const voice=voiceAvailable();if(!voice||document.hidden||CP.story.muted)return;stopVoice();const u=new SpeechSynthesisUtterance(b.dataset.voiceLine);u.voice=voice;u.lang='tr-TR';u.rate=.94;u.pitch=b.dataset.voicePerson==='cem'?.87:1;window.speechSynthesis.speak(u);};
    });
  }
  window.speechSynthesis?.addEventListener?.('voiceschanged',()=>bindVoices(document));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();});
  addEventListener('pagehide',stopVoice);
  const stageSpeaker=(plan,index)=>plan.tutorial&&plan.region==='ana'&&plan.year===430&&index===1?'dara':plan.role==='sci'?'cem':'leyla';
  // Açılış hikâyesi. Görseller aynı vadinin iki hâli üzerinden "bugün / geçmiş" farkını gösterir.
  const prologue=[
    {art:'city',kicker:'YIL 2070',title:'Yağmur artık zehirli.',text:['Nehirler kuruyor. Tarlalar çöle dönüyor.','İnsanlar kalan son suyun başında birbirine düşüyor.']},
    {art:'core',kicker:'SEN',title:'Bu çağa ait değilsin.',text:['Çok daha ileri bir gelecekten kaçtın. Orada bir rejim, zaman yolculuğunu yasakladı ve insanlığı sona sürüklüyor.','Yasaklı tek zaman makinesini çaldın ve buraya sığındın.']},
    {art:'bridge',kicker:'NEDEN BURADASIN?',title:'Yenisini yapmak zorundasın.',text:['Makinenin enerjisi sınırlı. Bitmeden ikincisini yapmalısın; 2070 bunu deneyebileceğin son yıl.','Ama bu dünya onu yapacak durumda değil:'],items:[['Teknoloji','bilgi kayboldu'],['Ekosistem','doğa ölüyor'],['Barış','insanlar savaşıyor']]},
    {art:'dry',kicker:'KIZILIRMAK · 2070',title:'Bugünü onaramazsın.',text:['Bu vadi bir zamanlar yeşildi. Nehirden geriye cılız bir su kaldı.','Burada artık her şey için çok geç.']},
    {art:'past',kicker:'KIZILIRMAK · M.S. 430',title:'Ama geçmişe gidebilirsin.',text:['Aynı vadi, 1640 yıl önce.','Burada atılan küçük bir adım yüzyıllar boyunca büyür ve 2070’e kadar ulaşır.'],jump:true},
    {art:'past',kicker:'BEDELİ',title:'Her yolculuk bir şey götürür.',text:['Her sıçrama makinenin enerjisini tüketir.','Geçmişe bıraktığın kişi o çağda kalır, ömrünü orada geçirir. Ekibin az. Enerjin sınırlı.']},
    {art:'past',kicker:'İLK GÖREVİN',title:'Komutan sensin.',text:['Araştırmacın Leyla gitmeye hazır.','Hedef: M.S. 430, Kızılırmak kıyısı. Suyu koruyacak kuralı orada başlat.'],person:'researcher.png'},
  ];
  // İlk görevin sade anlatımı. Yalnız metindir; seçeneklerin kuralları content.js'te kalır.
  const tutorialStages={
    'Kayıp Tablet':{line:'Komutan, vardık. Harabelerde eski bir iklim kaydı buldum. Bu bilgi 2070’e ulaşmalı. Saklayayım mı, çoğaltıp yayayım mı?',hints:{'Mağaraya mühürle':'Bilgi güvende kalır, ama az kişi öğrenir.','Kopyalatıp yay':'Çok kişi öğrenir, ama iz daha kolay silinir.'}},
    'Kervan Yolu':{line:'Komutan, vardık. Bir kervan bize katılmayı teklif ediyor. Onlarla gidersem daha çok yere ulaşırım; kalırsam bu vadiyi yakından izlerim. Ne yapayım?',hints:{'Kervanla git':'Daha çok yere ve insana ulaşırsın.','Tek bir noktada derinleş':'Bu vadiyi kuşaklarca izlersin; su korunur, iz uzun yaşar.'}},
    'Sınır Anlaşmazlığı':{line:'Ben Dara, çobanım. Meclisinizin su kuralları otlaklarımızı kapatıyor. Sürümü nerede besleyeceğim? Suyu korumak istiyorsun, anladım. Ama biz de burada yaşıyoruz.',hints:{'Ortak yönetim kur':'Çobanlar meclise katılır. Gerginlik düşer, kurallar biraz gevşer.','Sınırı koru':'Su kuralları katı kalır, çobanlar öfkelenir.'}},
    'Ayrılık':{line:'Yıllar geçti, Komutan. Saçlarım ağardı. Ben öldükten sonra Su Meclisi’ne kim sahip çıkacak?',hints:{'Yerel halka devret':'Daha küçük kalır, ama uzun yaşar.','Sermayeyle büyüt':'Para güç katar; etkisi zamanla büyür.','Komşulara yay':'Komşu bölgelere de ulaşır; burada biraz zayıflar.'}},
  };
  const tutorialHint=(plan,index,option)=>plan.tutorial?tutorialStages[plan.stages[index].title]?.hints[option.t]:null;
  function stageLine(plan,index){
    return (plan.tutorial&&tutorialStages[plan.stages[index].title]?.line)||plan.stages[index].text;
  }
  function visual(option){
    const t=option.t.toLocaleLowerCase('tr-TR');
    if(t.includes('ortak yönetim'))return{kind:'council',image:'common-grazing.png',caption:'İnsanlar otlakları ve koruma alanını birlikte yönetir.'};
    if(t.includes('sınırı koru'))return{kind:'boundary',image:'protected-boundary.png',caption:'Koruma güçlenir; sürülerin eski otlaklara erişimi kesilir.'};
    if(option.spread)return{kind:'spread',image:'anatolia-430.png',caption:'Kuruluşun etkisi komşu bölgelere de taşınır.'};
    if(t.includes('kopya')||t.includes('kervan'))return{kind:'route',image:'anatolia-430.png',caption:'Bilgi ve gözlem noktaları yol boyunca yayılır.'};
    if(t.includes('mühür')||t.includes('arşiv'))return{kind:'archive',image:'anatolia-430.png',caption:'Bilgi tek bir yerde korunur; erişim ve yayılma daha sınırlıdır.'};
    if(option.grow)return{kind:'growth',image:'common-grazing.png',caption:'Kuruluş sermaye desteğiyle zaman içinde büyür.'};
    if(t.includes('devret')||t.includes('uzlaş')||t.includes('birlik'))return{kind:'council',image:'common-grazing.png',caption:'İşi sürdürecek insanlarla bir anlaşma kurulur.'};
    return{kind:option.fx?.unrest>0?'boundary':'observe',image:option.fx?.unrest>0?'protected-boundary.png':'anatolia-430.png',caption:'Görev ekibinin uygulayacağı yolun temsili canlandırması.'};
  }
  function choiceLead(o,preview){
    const pct=Math.round(Math.abs((o.mult||1)-1)*100), t=o.t.toLocaleLowerCase('tr-TR');
    if(t.includes('ortak yönetim'))return `Otlakları birlikte yönetiyoruz. Çiftçiler kararın parçası oluyor ve gerilim azalıyor; buna karşılık koruma görevinin gücü %${pct} düşüyor.`;
    if(t.includes('sınırı koru'))return `Otlak sınırını kapalı tutuyoruz. Koruma görevinin gücü %${pct} artıyor; geçimi bu alana bağlı insanların tepkisi yükseliyor.`;
    if(t.includes('mühür'))return 'İklim kayıtlarını tek bir yerde saklıyoruz. Bilgi korunuyor ve teknoloji birikimine katkı sağlıyor; kervanlarla geniş bir paylaşım ağı kurmuyoruz.';
    if(t.includes('kopya'))return `Kayıtları kopyalayıp kervanlara veriyoruz. Bilgi daha çok insana ulaşıyor, görevin gücü %${pct} artıyor; ${preview && !preview.increased ? 'kalıcılık öngörüsü ise altta gösteriliyor' : 'mirasın uzun vadede dağılma riski de yükseliyor'}.`;
    if(o.spread)return `Komşu bölgelerde de işleyen bir ağ kuruyoruz. Etki bu bölgenin dışına taşarken ana görevin gücü %${pct} düşüyor.`;
    if(o.grow)return 'Kuruluşu sermaye desteğiyle büyütüyoruz. Etki zaman içinde güçleniyor; çevreye ayrılan pay ve askerî baskı üzerindeki etkisi aşağıda gösteriliyor.';
    if(t.includes('devret'))return `Kuruluşu yerel insanlara devrediyoruz. ${preview && !preview.reduced ? 'Mevcut kalıcılık öngörüsü değişmiyor;' : 'Kalıcılığı desteklemeyi seçiyoruz;'} ana görevin gücünden %${pct} vazgeçiyoruz.`;
    return 'Ekibin uygulayacağı adımı seçiyorsun. Aşağıdaki fayda ve bedeller göreve eklenir; gelecekte ölçülen sonuç diğer kararlar ve tarih ile birlikte oluşur.';
  }
  function visualFor(option,plan){
    const v=visual(option);
    return plan && !plan.tutorial && plan.year>=1880 ? {...v,image:v.kind==='boundary'?'anatolia-dry.png':'anatolia-protected.png',caption:'Temsilî saha projeksiyonu · '+v.caption} : v;
  }
  // Zaman fonksiyonu: önceki kareye bağlı durum yok. Geçmiş sonucu bu çizim üretmez.
  function actionFrame(time,kind){
    const p=Math.max(0,Math.min(1,time/2.8)),e=1-Math.pow(1-p,3);
    return{p,e,paperX:kind==='archive'?34*e:110*e,paperY:kind==='spread'?-25*e:0,gate:kind==='boundary'?55*e:0,route:280*e,glow:.25+.4*Math.sin(Math.PI*p)};
  }
  function art(option,plan){
    const a=visualFor(option,plan);
    return `<div class="storyArt" data-action-kind="${a.kind}"><img src="assets/cinema/${a.image}" alt="${esc(a.caption)}"><svg viewBox="0 0 320 180" aria-hidden="true"><path class="storyRoute" d="M25 140Q120 35 280 70" pathLength="280"/><g class="storyPaper" data-action-paper><rect x="62" y="110" width="35" height="25" rx="2"/><path d="M69 116h20m-20 6h20m-20 6h13"/></g><g class="storyGate" data-action-gate><path d="M125 155v-55m70 55v-55m-70 15h70m-70 20h70"/></g><circle class="storyDestination" cx="280" cy="70" r="7"/></svg><span>${esc(a.caption)}</span></div>`;
  }
  function animateArt(node){
    if(!node)return()=>{};
    const kind=node.dataset.actionKind,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).has('fast');
    let cancelled=false;const start=performance.now();
    const draw=t=>{if(cancelled||!node.isConnected)return;const f=actionFrame(t,kind);node.style.setProperty('--action-progress',String(f.e));node.querySelector('.storyRoute').style.strokeDashoffset=String(280-f.route);node.querySelector('[data-action-paper]').setAttribute('transform',`translate(${f.paperX} ${f.paperY})`);node.querySelector('[data-action-gate] path').style.strokeDasharray='180';node.querySelector('[data-action-gate] path').style.strokeDashoffset=String((1-f.e)*180);if(f.p<1&&!reduce)requestAnimationFrame(now=>draw((now-start)/1000));};
    draw(reduce?2.8:0);return()=>{cancelled=true;};
  }
  CP.story={cast,prologue,tutorialHint,request,dialogue,bindVoices,stopVoice,stageSpeaker,stageLine,visual:visualFor,choiceLead,art,animateArt,actionFrame,esc,muted:false};
})();
