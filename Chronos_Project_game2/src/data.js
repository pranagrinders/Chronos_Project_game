// OYUN ICERIGI: yeni bolge, olay, kart, yol eklemek icin kod degil sadece bu dosya degisir.
globalThis.CP = globalThis.CP || {};

CP.YEARS = { start: 430, end: 2070, step: 10 };

// Sicrama duraklari. cost: Cekirdek Enerjisi, scale: etkinin gucu (erken = guclu ama riskli)
CP.ERAS = [
  { year: 430, name: 'Derin Kökler', cost: 20, scale: 1.75, crack: 2.5, desc: 'Uzun vadeli tohumlar. En pahalı ve en öngörülemez sıçrama.' },
  { year: 1880, name: 'Sanayi Patlaması', cost: 14, scale: 1.3, crack: 1.8, desc: 'Kirliliğin ilk büyük eşikleri henüz aşılmadı.' },
  { year: 1970, name: 'Plastik Çağı', cost: 10, scale: 1.0, crack: 1.2, desc: 'Tüketim alışkanlıkları küreselleşiyor.' },
  { year: 2000, name: 'Sinsi Hazırlık', cost: 8, scale: 0.8, crack: 0.9, desc: 'Timi sessizce yerleştirme dönemi.' },
  { year: 2026, name: 'Hasat ve Kriz', cost: 6, scale: 0.75, crack: 0.6, desc: 'Etkisi kesin ve hızlı, ama gücü sınırlı.' },
];

// Bolgeler. peak degerleri: tarihin kendi akisinda ulasilacak tepe. indY: sanayilesme orta noktasi
CP.REGIONS = [
  { id: 'kam', eco: 9, name: 'Kuzey Amerika', old: ['Yerli Konfederasyonlar', 'Yeni Dünya Devletleri'], arch: 'Sanayici', pop: 7, ind: 90, indY: 1930, agri: 65, mil: 30, cons: 95, stoic: 45, bio: 72, water: 75, soil: 75, nb: ['lam'] },
  { id: 'lam', eco: 16, name: 'Latin Amerika', old: ['And ve Maya Toplulukları', 'Genç Cumhuriyetler'], arch: 'Kırılgan Havza', pop: 8, ind: 45, indY: 1990, agri: 65, mil: 12, cons: 55, stoic: 35, bio: 95, water: 88, soil: 72, nb: ['kam'] },
  { id: 'bav', eco: 3, name: 'Batı Avrupa', old: ['Kavimler Göçü Avrupası', 'Sanayi İmparatorlukları'], arch: 'Sanayici', pop: 6, ind: 80, indY: 1910, agri: 55, mil: 14, cons: 80, stoic: 30, bio: 60, water: 72, soil: 70, nb: ['isk', 'ana', 'odk', 'rus'] },
  { id: 'isk', eco: 2, name: 'İskandinavya', old: ['Kuzey Klanları', 'Kuzey Krallıkları'], arch: 'Yeşil Öncü', pop: 1, ind: 55, indY: 1940, agri: 30, mil: 6, cons: 65, stoic: 15, bio: 78, water: 90, soil: 60, env: 12, nb: ['bav', 'rus'] },
  { id: 'ana', eco: 2, name: 'Anadolu', old: ['Doğu Roma Anadolusu', 'Osmanlı Anadolusu'], arch: 'Geçiş Köprüsü', pop: 1.5, ind: 55, indY: 1990, agri: 55, mil: 20, cons: 60, stoic: 40, bio: 70, water: 62, soil: 70, env: 3, nb: ['bav', 'odk', 'rus'] },
  { id: 'odk', eco: 6, name: 'Orta Doğu ve K. Afrika', old: ['Bereketli Hilal Şehirleri', 'Çöl Ticaret Yolları'], arch: 'Kırılgan Havza', pop: 7, ind: 50, indY: 1985, agri: 30, mil: 32, cons: 55, stoic: 70, bio: 40, water: 30, soil: 36, nb: ['ana', 'bav', 'saf', 'gas'] },
  { id: 'saf', eco: 18, name: 'Sahra Altı Afrika', old: ['Nehir Krallıkları', 'Sömürge Toprakları'], arch: 'Kırılgan Havza', pop: 20, ind: 30, indY: 2030, agri: 55, mil: 10, cons: 30, stoic: 40, bio: 88, water: 62, soil: 58, nb: ['odk'] },
  { id: 'rus', eco: 12, name: 'Rusya ve Orta Asya', old: ['Bozkır Halkları', 'Bozkır İmparatorluğu'], arch: 'Stoik', pop: 3, ind: 70, indY: 1950, agri: 40, mil: 34, cons: 55, stoic: 80, bio: 80, water: 82, soil: 70, nb: ['bav', 'isk', 'ana', 'das', 'gas'] },
  { id: 'gas', eco: 6, name: 'Güney Asya', old: ['Gupta Toprakları', 'Baharat Limanları'], arch: 'Kırılgan Havza', pop: 24, ind: 55, indY: 2005, agri: 72, mil: 14, cons: 45, stoic: 50, bio: 68, water: 52, soil: 62, nb: ['odk', 'rus', 'das', 'gda'] },
  { id: 'das', eco: 7, name: 'Doğu Asya', old: ['Kuzey Hanedanları', 'Doğu İmparatorlukları'], arch: 'Sanayici', pop: 15, ind: 95, indY: 1995, agri: 65, mil: 22, cons: 70, stoic: 65, bio: 62, water: 60, soil: 65, nb: ['rus', 'gas', 'gda'] },
  { id: 'gda', eco: 14, name: 'Güneydoğu Asya', old: ['Takımada Krallıkları', 'Baharat Adaları'], arch: 'Kırılgan Havza', pop: 8, ind: 55, indY: 2005, agri: 65, mil: 10, cons: 55, stoic: 40, bio: 92, water: 80, soil: 70, nb: ['gas', 'das', 'oky'] },
  { id: 'oky', eco: 5, name: 'Okyanusya', old: ['Ada Denizcileri', 'Uzak Koloniler'], arch: 'Kırılgan Havza', pop: 0.6, ind: 50, indY: 1950, agri: 60, mil: 8, cons: 75, stoic: 25, bio: 78, water: 45, soil: 45, nb: ['gda'] },
];

// Baglanti agi: [kaynak, hedef, katsayi]. Her 10 yilda hedef += katsayi * kaynak/100.
// Negatif baglantilar nufusla olceklenir: dunya kalabaliklastikca ayni sanayi daha cok yipratir.
CP.LINKS = [
  ['industry', 'water', -3.2], ['industry', 'bio', -2.8], ['industry', 'soil', -1.0],
  ['agri', 'water', -3.0], ['agri', 'soil', -3.6], ['agri', 'bio', -3.2],
  ['consumption', 'water', -1.2], ['consumption', 'bio', -1.2], ['consumption', 'soil', -0.7],
  ['digital', 'water', -0.7],
  ['waste', 'soil', 3.2], ['waste', 'water', 2.0], ['waste', 'bio', 1.2],
  ['renew', 'bio', 1.0], ['renew', 'water', 1.0],
  ['awareness', 'bio', 0.8],
];

// UI kadranlari: GDD'deki 15 kuresel parametre
// bad:true -> yuksek olmasi kotu. key: tl.global icindeki alan
CP.GLOBALS = [
  { title: 'Ekolojik Temeller', items: [
    { key: 'bio', name: 'Biyoçeşitlilik' }, { key: 'water', name: 'Tatlı Su' },
    { key: 'ppm', name: 'Karbon', unit: ' ppm', bad: true, min: 280, max: 800 },
    { key: 'soil', name: 'Toprak Verimi' }, { key: 'ocean', name: 'Okyanus Yükü', bad: true } ] },
  { title: 'Sosyolojik Doku', items: [
    { key: 'culture', name: 'Kültürel Açılım' }, { key: 'unrest', name: 'İsyan Riski', bad: true }, { key: 'awareness', name: 'Ekolojik Eğitim' } ] },
  { title: 'Sektörel Baskılar', items: [
    { key: 'agri', name: 'Tarım ve Hayvancılık', bad: true }, { key: 'industry', name: 'Sanayi ve Otomotiv', bad: true },
    { key: 'digital', name: 'Dijital Enerji', bad: true }, { key: 'military', name: 'Askeri Bütçe', bad: true } ] },
  { title: 'Operasyonel Dinamikler', items: [
    { key: 'footprint', name: 'Zamansal Kirlilik', bad: true }, { key: 'accuracy', name: 'Veri Doğruluğu' }, { key: 'earlyTech', name: 'Erken Keşif Riski', bad: true } ] },
];

// Bolge paneli: ulke/bolge parametreleri (kuresel 15'ten ayri)
CP.REGION_VIEW = [
  { title: 'Toplumsal Doku', items: [
    { key: 'stoic', name: 'Halk Direnci (Stoiklik)', neutral: true }, { key: 'consumption', name: 'Yerel Tüketim', bad: true },
    { key: 'culture', name: 'Kültürel Açılım' }, { key: 'awareness', name: 'Bilinç Seviyesi' }, { key: 'unrest', name: 'İsyan Riski', bad: true } ] },
  { title: 'Yaşam Dayanıkları', items: [
    { key: 'food', name: 'Gıda Güvenliği' }, { key: 'resilience', name: 'Kent Direnci' }, { key: 'water', name: 'Su' }, { key: 'bio', name: 'Yaban Hayatı' }, { key: 'soil', name: 'Toprak' } ] },
  { title: 'Sektörler', items: [
    { key: 'renew', name: 'Yenilenebilir Enerji' }, { key: 'waste', name: 'Sıfır Atık' }, { key: 'industry', name: 'Sanayi', bad: true }, { key: 'agri', name: 'Tarım Baskısı', bad: true }, { key: 'digital', name: 'Dijital Enerji', bad: true } ] },
];
CP.BUDGETS = { mil: 'Savunma', ind: 'Sanayi', agri: 'Tarım', env: 'Çevre', edu: 'Eğitim' };

// Bolgelerin zamanla gelistirdigi somut projeler (GDD: To-Do listesi)
CP.PROJECTS = [
  { name: 'Kompost Tesisleri Ağı', key: 'waste', at: 30 },
  { name: 'Atık Yağ Toplama Filosu', key: 'waste', at: 42 },
  { name: 'Sıfır Atık Yasası', key: 'waste', at: 55 },
  { name: 'Temiz Enerji Şebekesi', key: 'renew', at: 50 },
  { name: 'İklim Eğitim Müfredatı', key: 'awareness', at: 55 },
];

// Tim rolleri. fx: birakildigi bolgede hedeflere etkisi. onBase: gemide kalinca verdigi fayda
CP.ROLES = {
  sci: { name: 'Bilim İnsanı', start: 2, fx: { tech: 16, renew: 20, soil: 8, agri: -8, industry: -6 }, hz: 0,
    desc: 'Temiz enerji ve tarım teknolojisi geliştirir. Çok erken bırakılırsa Erken Keşif Riski doğurur.',
    onBase: 'Üste kaldığında: her sıçramada Teknoloji kolu +%1,5.' },
  res: { name: 'Alan Araştırmacısı', start: 2, fx: { tech: 6, awareness: 5, military: -5, water: 5 }, hz: -0.015,
    desc: 'Bölgenin verilerini kesinleştirir, oradaki diğer vakıfların dağılma riskini düşürür.',
    onBase: 'Üste kaldığında: görevlerin yönünü ve riskini önceden raporlar.' },
  edu: { name: 'Eğitmen', start: 2, fx: { awareness: 24, culture: 12, consumption: -14, waste: 12, unrest: -4 }, hz: 0,
    desc: 'Toplumu bilinçlendirir, tüketimi düşürür. Fikirleri yüzyıllar sonra yeniden keşfedilir.',
    onBase: 'Üste kaldığında: sıçrama sonrası kart seçeneği +1.' },
};

// Kartlar: { fx: yil icin bolgesel etki } veya ozel etki. target: kart bolge ister mi
CP.CARDS = [
  { id: 'fon', name: 'Acil Durum Fonu', target: true, year: 2026, color: 'red', desc: 'Seçilen bölgede kriz fonu: isyan düşer, gıda ve su toparlanır.', fx: { unrest: -35, water: 26, soil: 20, food: 15 } },
  { id: 'medya', name: 'Medya Kampanyası', target: true, year: 2026, color: 'amber', desc: 'Seçilen bölgede bilinç yükselir, tüketim düşer.', fx: { awareness: 45, consumption: -30 } },
  { id: 'yama', name: 'Zaman Çatlağı Yaması', color: 'green', desc: 'Birikmiş zamansal kirliliğin yarısını temizler.', patch: 0.5 },
  { id: 'yakit', name: 'Yakıt İkmali', color: 'blue', desc: 'Çekirdek Enerjisi +18.', energy: 18 },
  { id: 'gonullu', name: 'Yeni Gönüllü', color: 'green', desc: 'Tima, en az kalan rolden bir üye katılır.', crew: 1 },
  { id: 'kalkan', name: 'Vakıf Kalkanı', color: 'blue', desc: 'Son bırakılan vakfın dağılma riskini kalıcı olarak yarıya indirir.', shield: true },
  { id: 'sulh', name: 'Barış Konferansı', target: true, year: 2000, color: 'amber', desc: 'Seçilen bölge ve komşularında askeri bütçe 2000\'den itibaren düşer.', fx: { military: -36 }, spread: 1 },
  { id: 'orman', name: 'Büyük Ağaçlandırma', target: true, year: 1970, color: 'green', desc: 'Seçilen bölgede 1970\'ten itibaren yaban hayatı ve su güçlenir.', fx: { bio: 44, water: 20 } },
  { id: 'okyanus', name: 'Okyanus Temizliği', color: 'blue', year: 2000, desc: 'Küresel: 2000\'den itibaren okyanus yükü her on yılda azalır.', ocean: -6 },
  { id: 'tarim', name: 'Rejeneratif Tarım', target: true, year: 1970, color: 'green', desc: 'Seçilen bölgede tarım baskısı düşer, toprak toparlanır.', fx: { agri: -38, soil: 30 } },
  { id: 'patent', name: 'Açık Patent', color: 'amber', year: 2000, desc: 'Küresel: Temiz teknoloji patentleri serbest. Tüm bölgelerde temiz enerji güçlenir.', fxAll: { renew: 18 } },
  { id: 'arsiv', name: 'Kayıp Arşiv', color: 'blue', desc: 'Teknoloji kolu +%8.', proto: 8 },
];

// Oyun sonu sozleri: oyuncunun birakdigi "unutulmus dusunurler"in kaleminden (kurgusal)
CP.QUOTES = [
  'Toprağa borcunu ödemeyen, çocuğundan faiziyle tahsil eder.',
  'Bir nehir yalnızca suyunu değil, hafızasını da taşır.',
  'Tamir edilen her eşya, geleceğe yazılmış küçük bir mektuptur.',
  'Ormanı ağaçlarla değil, onu korumayı öğrenen çocuklarla ekersin.',
  'Fazlası olan yoksullaşır; yeteri olan zenginleşir.',
  'İklim, ertelediklerimizin toplamıdır.',
  'Denize attığın, bir gün sofrana oturur.',
  'Bugünün artığı, yarının yokluğudur.',
  'Geleceğe gidemezsin, ama ona her gün bir şey gönderirsin.',
  'Kuş sustuğunda orman bilir; biz en son anlarız.',
  'Yağmuru duymak için önce makineleri susturman gerekir.',
  'Bir kentin gücü duvarlarında değil, selden sonra komşusuna açtığı kapıdadır.',
  'Çöp diye bir şey yoktur; yalnızca yerini bilmediğimiz şeyler vardır.',
  'Kelebek kanadını çırpar, ama fırtınayı biz seçeriz.',
  'Toprak sabırlıdır, açlık değil.',
  'Bir ağacın gölgesinde oturan, onu dikeni nadiren tanır.',
  'Tüketmek unutmaktır; onarmak hatırlamak.',
  'Zaman yalnızca ileri akar, sorumluluk iki yöne de.',
  'Sessiz bir bahar, gürültülü bir kıtlığın habercisidir.',
  'Temiz su, en eski barış antlaşmasıdır.',
  'Hepimiz atalarız, yalnızca henüz torunlarımızla tanışmadık.',
  'Az ama onarılabilir olan, çok ama atılabilir olandan uzun yaşar.',
  'Rüzgarı satın alamazsın; ama önünü kesebilirsin.',
  'Unutulan her düşünür, zamanını bekleyen bir tohumdur.',
  'Dünyayı kurtarmak bir kez yapılmaz; her sabah yeniden yapılır.',
];

// Oyun sonu: mekanigin gercek dunya karsiligi (COP31 odak alanlari)
CP.REAL = [
  { key: 'waste', text: 'Sıfır Atık: Evindeki organik atığı kompostlamak, çöp hacmini gözle görülür ölçüde azaltır. Atık yağı lavaboya dökme, toplama noktasına götür.' },
  { key: 'renew', text: 'Yenilenebilir Enerji: Binaların ve evlerin enerji tasarrufu, en ucuz temiz enerji kaynağıdır.' },
  { key: 'consumption', text: 'Bilinçli Tüketim: Onarmak ve daha uzun kullanmak, karbon ayak izini doğrudan düşürür.' },
  { key: 'food', text: 'Gıda Güvenliği: Gıda israfını azaltmak, su ve toprak üzerindeki baskıyı hafifletir.' },
  { key: 'resilience', text: 'İklim Dirençli Şehirler: Yeşil alanlar ve geçirgen zeminler selleri ve sıcak hava dalgalarını hafifletir.' },
  { key: 'ocean', text: 'Okyanuslar: Tek kullanımlık plastiği azaltmak, mikroplastik yükünü kaynağında keser.' },
  { key: 'awareness', text: 'İklim Eğitimi: Oyundaki eğitmenler gibi, öğrendiğini birine anlatmak da etkisi yıllar sonra görülen bir müdahaledir.' },
];

CP.ENDINGS = {
  win: { title: 'DÖNGÜ KIRILDI', text: 'İkinci prototip tamamlandı. Ama kurtardığın dünyada, çekirdeği kaçırdığın totaliter rejim hiç kurulmayacak. Hangar sessiz. Elindeki makine, artık var olmayan bir geleceğin hatırası. Kapıyı kapatıp dışarı çıkıyorsun: yağmur dinmiş.' },
  crew: { title: 'SON TİM', text: 'Gemide gönderecek kimse kalmadı. Bıraktığın vakıflar sensiz devam edecek. Çekirdek hâlâ yanıyor, ama artık yalnızca bir hatıra.' },
  quit: { title: 'GÖREV YARIDA KALDI', text: 'Komuta merkezinin ışıklarını kapattın. Zaman çizgisi, olduğu haliyle akmaya devam ediyor.' },
  energy: { title: 'ÇEKİRDEK SÖNDÜ', text: 'Zaman makinesi son enerjisini de harcadı. Gemi 2070\'te hareketsiz kaldı. Bıraktığın tohumlar yaşamaya devam edecek, ama sen sonucunu göremeyeceksin.' },
  nuke: { title: 'NÜKLEER KIŞ', text: 'Koalisyonlar birbirine girdi. Müdahalelerin dünyayı kurtaramadı, belki de bu savaşı sen hızlandırdın. Üste kimse yanıt vermiyor.' },
  water: { title: 'SON KUYU', text: 'Tatlı su rezervleri tükendi. Kentler boşaldı, sınırlar anlamını yitirdi.' },
  virus: { title: 'SESSİZ SALGIN', text: 'Yaban hayatının çöküşü, doğal dengenin frenini kaldırdı. Salgın, kimsenin kapatamayacağı kadar hızlı yayıldı.' },
};
CP.CATA = {
  nuke: 'Koalisyon savaşları nükleer eşiği aştı',
  water: 'Küresel tatlı su rezervi tükendi',
  virus: 'Biyoçeşitlilik çöküşü küresel salgını tetikledi',
};
