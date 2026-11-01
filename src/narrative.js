// Kurmaca kişiler ve karar canlandırmaları; sonuçlar yine simülasyonun verisidir.
globalThis.CP = globalThis.CP || {};
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cast = {
    leyla:{name:'Leyla Aras',role:'Alan araştırmacısı · Temporal Shift',image:'researcher.png'},
    cem:{name:'Dr. Cem Sönmez',role:'Bilim sorumlusu · Temporal Shift',image:'cem.png'},
    dara:{name:'Dara',role:'Çoban · Kızılırmak havzası, 430',image:'dara.png'},
  };
  const crew = {
    res: ['Alan araştırmacısı · Temporal Shift', ['arastirmaci-1', 'Selim Aydın', 'Emre Kaya', 'Tolga Şen', 'Ozan Tuna'], ['arastirmaci-2', 'Naz Demir', 'Zeynep Arslan', 'Sevgi Tan', 'Gül Aksoy']],
    sci: ['Bilim insanı · Temporal Shift', ['bilim-1', 'Dr. Ada Yılmaz', 'Dr. Ece Korkmaz', 'Dr. Selin Aksu', 'Dr. Defne Kurt'], ['bilim-2', 'Dr. Kaan Erdem', 'Dr. Orhan Güven', 'Dr. Haluk Tekin', 'Dr. Cemal Uz']],
    edu: ['Eğitmen · Temporal Shift', ['egitim-1', 'Elif Şahin', 'Merve Yıldız', 'Ayşe Polat', 'Esra Çelik'], ['egitim-2', 'Murat Koç', 'Hasan Öztürk', 'İbrahim Aslan', 'Yusuf Demirel']],
  };
  const portraits = new Set();
  // Aynı portre farklı adlarla kullanılır; ad, portredeki kişinin cinsiyetine uyar.
  const people = {};
  for (const [key, [role, a, b]] of Object.entries(crew)) {
    people[key] = [];
    for (let i = 1; i < a.length; i++) for (const [p, name] of [[a[0], a[i]], [b[0], b[i]]]) {
      const id = i === 1 ? p : `${p}~${i}`;
      cast[id] = { name, role, image: p + '.png', portrait: p };
      people[key].push(id);
    }
    for (const p of [a[0], b[0]]) if (globalThis.Image) { const img = new Image(); img.onload = () => portraits.add(p); img.src = `assets/cinema/${p}.png`; }
  }
  // Göreve giden uzman. n: bu rolden daha önce kaç kişi gitti.
  const crewId = (role, n) => { const list = people[role] || []; return list[n % (list.length || 1)]; };
  const crewMember = (role, n) => { const id = crewId(role, n); return id && portraits.has(cast[id].portrait) ? id : null; };
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
  const request = (offer, member) => { const [speaker,line] = requests[offer.m.id] || ['leyla',offer.m.desc];return{speaker:member||speaker,line}; };
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
  const stageSpeaker=(plan,index)=>plan.speaker&&!plan.tutorial?plan.speaker:plan.tutorial&&plan.region==='ana'&&plan.year===430&&index===1?'dara':plan.role==='sci'?'cem':'leyla';
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
  const tutorialHint=(plan,index,option)=>plan.tutorial?option.hint:null;
  const stageLine=(plan,index)=>plan.stages[index].text;
  // Seçeneğin metnine göre sahne. Sıra önemli: ilk eşleşen kazanır, eşleşmeyen sahadaki ekibe düşer.
  const VISUAL_WORDS=[
    ['archive',['gizle','sakla','defter','ezber','kaçır','olduğu gibi']],
    ['boundary',['redde','mahkeme','dava','sokağa','meydan','diren']],
    ['council',['meclis','ikna','ortaklaş','örgütlen','güvenin','kabul edin','festival','arkamıza','mahalle','görüş','siyaset','kira']],
    ['route',['halka','herkese','açık','yay','gazete','basın','sızdır','uyar','dağıt','sergi','gönder','ders','atölye','çevir','mizah','kitle']],
    ['growth',['büyü','satıp','fon','şirket','tüccar','tazminat','karşıla','kral','saygınlık','yenilenebilir','filtre','şebeke','devre']],
  ];
  const VISUAL_KINDS={
    archive:{image:'anatolia-430.png',caption:'Bilgi gözden uzak bir yerde saklanır; erişim sınırlı kalır.'},
    boundary:{image:'protected-boundary.png',caption:'Karar açıkça karşı duruş gerektirir; tepki de beraberinde gelir.'},
    council:{image:'common-grazing.png',caption:'Karar, insanlarla yüz yüze konuşularak birlikte alınır.'},
    route:{image:'anatolia-430.png',caption:'Bilgi kişiden kişiye ve yoldan yola yayılır.'},
    growth:{image:'common-grazing.png',caption:'Yatırım ve üretim, işi büyütmek için devreye girer.'},
  };
  const TUTORIAL_ART={archive:'sahne-arsiv-eski.jpg',route:'sahne-yayilim-eski.jpg',spread:'sahne-yayilim-eski.jpg',observe:'sahne-saha-eski.jpg',growth:'sahne-buyume-eski.jpg'};
  function visual(option){
    if(option.art)return{kind:option.art,image:option.image||TUTORIAL_ART[option.art],caption:option.caption};
    const t=option.t.toLocaleLowerCase('tr-TR');
    if(t.includes('ortak yönetim'))return{kind:'council',image:'common-grazing.png',caption:'İnsanlar otlakları ve koruma alanını birlikte yönetir.'};
    if(t.includes('sınırı koru'))return{kind:'boundary',image:'protected-boundary.png',caption:'Koruma güçlenir; sürülerin eski otlaklara erişimi kesilir.'};
    if(option.spread)return{kind:'spread',image:'anatolia-430.png',caption:'Kuruluşun etkisi komşu bölgelere de taşınır.'};
    if(t.includes('kopya')||t.includes('kervan'))return{kind:'route',image:'anatolia-430.png',caption:'Bilgi ve gözlem noktaları yol boyunca yayılır.'};
    if(t.includes('mühür')||t.includes('arşiv'))return{kind:'archive',image:'anatolia-430.png',caption:'Bilgi tek bir yerde korunur; erişim ve yayılma daha sınırlıdır.'};
    if(option.grow)return{kind:'growth',image:'common-grazing.png',caption:'Kuruluş sermaye desteğiyle zaman içinde büyür.'};
    if(t.includes('devret')||t.includes('uzlaş')||t.includes('birlik'))return{kind:'council',image:'common-grazing.png',caption:'İşi sürdürecek insanlarla bir anlaşma kurulur.'};
    const match=VISUAL_WORDS.find(([,words])=>words.some(w=>t.includes(w)));
    if(match)return{kind:match[0],...VISUAL_KINDS[match[0]]};
    return{kind:option.fx?.unrest>0?'boundary':'observe',image:option.fx?.unrest>0?'protected-boundary.png':'anatolia-430.png',caption:'Görev ekibinin uygulayacağı yolun temsili canlandırması.'};
  }
  function choiceLead(o,preview){
    if(o.lead)return o.lead;
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
  // Serbest görevlerde çağa ve eyleme uygun görsel; dosya henüz yoksa eski görsele düşer.
  const SCENE_KIND={council:'birlik',boundary:'gerilim',route:'yayilim',spread:'yayilim',archive:'arsiv',growth:'buyume',observe:'saha'};
  const eraSlug=y=>y<1880?'eski':y<1970?'sanayi':'modern';
  function visualFor(option,plan){
    const v=visual(option);
    if(!plan||plan.tutorial)return v;
    const name=SCENE_KIND[v.kind],era=eraSlug(plan.year),caption='Temsilî sahne · '+v.caption;
    // Eski çağın birlik ve gerilim sahneleri ilk görevin görselleridir.
    if(era==='eski'&&(name==='birlik'||name==='gerilim'))return {...v,image:name==='birlik'?'common-grazing.png':'protected-boundary.png',caption};
    const fallback=plan.year>=1880?(v.kind==='boundary'?'anatolia-dry.png':'anatolia-protected.png'):v.image;
    return {...v,image:`sahne-${name}-${era}.jpg`,fallback,caption};
  }
  const sceneImg=a=>`<img src="assets/cinema/${a.image}" alt="${esc(a.caption)}"${a.fallback?` onerror="this.onerror=null;this.src='assets/cinema/${a.fallback}'"`:''}>`;
  // Seçenek alt yazısı: kuraldan üretilen kısa kazanç ve bedel.
  const choiceSummary=o=>{const m=CP.choiceExplanation(o);return [...m.gains.slice(0,2),...m.costs.slice(0,1)].join(' · ')||'Görevin devamını destekler.';};
  // Zaman fonksiyonu: önceki kareye bağlı durum yok. Geçmiş sonucu bu çizim üretmez.
  function actionFrame(time,kind){
    const p=Math.max(0,Math.min(1,time/2.8)),e=1-Math.pow(1-p,3);
    return{p,e,paperX:kind==='archive'?34*e:110*e,paperY:kind==='spread'?-25*e:0,gate:kind==='boundary'?55*e:0,route:280*e,glow:.25+.4*Math.sin(Math.PI*p)};
  }
  function art(option,plan){
    const a=visualFor(option,plan);
    return `<div class="storyArt" data-action-kind="${a.kind}">${sceneImg(a)}<svg viewBox="0 0 320 180" aria-hidden="true"><path class="storyRoute" d="M25 140Q120 35 280 70" pathLength="280"/><g class="storyPaper" data-action-paper><rect x="62" y="110" width="35" height="25" rx="2"/><path d="M69 116h20m-20 6h20m-20 6h13"/></g><g class="storyGate" data-action-gate><path d="M125 155v-55m70 55v-55m-70 15h70m-70 20h70"/></g><circle class="storyDestination" cx="280" cy="70" r="7"/></svg><span>${esc(a.caption)}</span></div>`;
  }
  function animateArt(node){
    if(!node)return()=>{};
    const kind=node.dataset.actionKind,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).has('fast');
    let cancelled=false;const start=performance.now();
    const draw=t=>{if(cancelled||!node.isConnected)return;const f=actionFrame(t,kind);node.style.setProperty('--action-progress',String(f.e));node.querySelector('.storyRoute').style.strokeDashoffset=String(280-f.route);node.querySelector('[data-action-paper]').setAttribute('transform',`translate(${f.paperX} ${f.paperY})`);node.querySelector('[data-action-gate] path').style.strokeDasharray='180';node.querySelector('[data-action-gate] path').style.strokeDashoffset=String((1-f.e)*180);if(f.p<1&&!reduce)requestAnimationFrame(now=>draw((now-start)/1000));};
    draw(reduce?2.8:0);return()=>{cancelled=true;};
  }
  CP.story={cast,crewMember,crewId,prologue,tutorialHint,choiceSummary,sceneImg,request,dialogue,bindVoices,stopVoice,stageSpeaker,stageLine,visual:visualFor,choiceLead,art,animateArt,actionFrame,esc,muted:false};
})();
