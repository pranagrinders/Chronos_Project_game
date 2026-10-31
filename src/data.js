// OYUN ICERIGI: yeni bolge, olay, kart, yol eklemek icin kod degil sadece bu dosya degisir.
globalThis.CP = globalThis.CP || {};

CP.YEARS = { start: 430, end: 2070, step: 10 };

// Sicrama duraklari. cost: Cekirdek Enerjisi, scale: etkinin gucu (erken = guclu ama riskli)
CP.ERAS = [
  { year: 430, name: 'Derin Kökler', cost: 20, scale: 1.75, crack: 2.5, desc: 'Uzun vadeli tohumlar. En pahalı ve en öngörülemez sıçrama.' },
  { year: 1880, name: 'Sanayi Patlaması', cost: 14, scale: 1.3, crack: 1.8, desc: 'Kirliliğin ilk büyük eşikleri henüz aşılmadı.' },
  { year: 1970, name: 'Plastik Çağı', cost: 10, scale: 1.0, crack: 1.2, desc: 'Tüketim alışkanlıkları küreselleşiyor.' },
  { year: 2000, name: 'Sinsi Hazırlık', cost: 8, scale: 0.8, crack: 0.9, desc: 'Timi sessizce yerleştirme dönemi.' },
  { year: 2026, name: 'Hasat ve Kriz', cost: 6, scale: 0.6, crack: 0.6, desc: 'Etkisi kesin ve hızlı, ama gücü sınırlı.' },
];

// Bolgeler. peak degerleri: tarihin kendi akisinda ulasilacak tepe. indY: sanayilesme orta noktasi
CP.REGIONS = [
  { id: 'kam', name: 'Kuzey Amerika', old: ['Yerli Konfederasyonlar', 'Yeni Dünya Devletleri'], arch: 'Sanayici', pop: 7, ind: 90, indY: 1930, agri: 65, mil: 30, cons: 95, stoic: 45, bio: 72, water: 75, soil: 75, nb: ['lam'] },
  { id: 'lam', name: 'Latin Amerika', old: ['And ve Maya Toplulukları', 'Genç Cumhuriyetler'], arch: 'Kırılgan Havza', pop: 8, ind: 45, indY: 1990, agri: 65, mil: 12, cons: 55, stoic: 35, bio: 95, water: 88, soil: 72, nb: ['kam'] },
  { id: 'bav', name: 'Batı Avrupa', old: ['Kavimler Göçü Avrupası', 'Sanayi İmparatorlukları'], arch: 'Sanayici', pop: 6, ind: 80, indY: 1910, agri: 55, mil: 14, cons: 80, stoic: 30, bio: 60, water: 72, soil: 70, nb: ['isk', 'ana', 'odk', 'rus'] },
  { id: 'isk', name: 'İskandinavya', old: ['Kuzey Klanları', 'Kuzey Krallıkları'], arch: 'Yeşil Öncü', pop: 1, ind: 55, indY: 1940, agri: 30, mil: 6, cons: 65, stoic: 15, bio: 78, water: 90, soil: 60, env: 12, nb: ['bav', 'rus'] },
  { id: 'ana', name: 'Anadolu', old: ['Doğu Roma Anadolusu', 'Osmanlı Anadolusu'], arch: 'Geçiş Köprüsü', pop: 1.5, ind: 55, indY: 1990, agri: 55, mil: 20, cons: 60, stoic: 40, bio: 70, water: 62, soil: 70, env: 3, nb: ['bav', 'odk', 'rus'] },
  { id: 'odk', name: 'Orta Doğu ve K. Afrika', old: ['Bereketli Hilal Şehirleri', 'Çöl Ticaret Yolları'], arch: 'Kırılgan Havza', pop: 7, ind: 50, indY: 1985, agri: 30, mil: 32, cons: 55, stoic: 70, bio: 40, water: 30, soil: 36, nb: ['ana', 'bav', 'saf', 'gas'] },
  { id: 'saf', name: 'Sahra Altı Afrika', old: ['Nehir Krallıkları', 'Sömürge Toprakları'], arch: 'Kırılgan Havza', pop: 20, ind: 30, indY: 2030, agri: 55, mil: 10, cons: 30, stoic: 40, bio: 88, water: 62, soil: 58, nb: ['odk'] },
  { id: 'rus', name: 'Rusya ve Orta Asya', old: ['Bozkır Halkları', 'Bozkır İmparatorluğu'], arch: 'Stoik', pop: 3, ind: 70, indY: 1950, agri: 40, mil: 34, cons: 55, stoic: 80, bio: 80, water: 82, soil: 70, nb: ['bav', 'isk', 'ana', 'das', 'gas'] },
  { id: 'gas', name: 'Güney Asya', old: ['Gupta Toprakları', 'Baharat Limanları'], arch: 'Kırılgan Havza', pop: 24, ind: 55, indY: 2005, agri: 72, mil: 14, cons: 45, stoic: 50, bio: 68, water: 52, soil: 62, nb: ['odk', 'rus', 'das', 'gda'] },
  { id: 'das', name: 'Doğu Asya', old: ['Kuzey Hanedanları', 'Doğu İmparatorlukları'], arch: 'Sanayici', pop: 15, ind: 95, indY: 1995, agri: 65, mil: 22, cons: 70, stoic: 65, bio: 62, water: 60, soil: 65, nb: ['rus', 'gas', 'gda'] },
  { id: 'gda', name: 'Güneydoğu Asya', old: ['Takımada Krallıkları', 'Baharat Adaları'], arch: 'Kırılgan Havza', pop: 8, ind: 55, indY: 2005, agri: 65, mil: 10, cons: 55, stoic: 40, bio: 92, water: 80, soil: 70, nb: ['gas', 'das', 'oky'] },
  { id: 'oky', name: 'Okyanusya', old: ['Ada Denizcileri', 'Uzak Koloniler'], arch: 'Kırılgan Havza', pop: 0.6, ind: 50, indY: 1950, agri: 60, mil: 8, cons: 75, stoic: 25, bio: 78, water: 45, soil: 45, nb: ['gda'] },
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
    onBase: 'Üste kaldığında: her sıçramada İkinci Prototip +%2.' },
  res: { name: 'Alan Araştırmacısı', start: 2, fx: { tech: 6, awareness: 5, military: -5, water: 5 }, hz: -0.015,
    desc: 'Bölgenin verilerini kesinleştirir, oradaki diğer vakıfların dağılma riskini düşürür.',
    onBase: 'Üste kaldığında: sıçramadan önce tahmini etki önizlemesi gösterir.' },
  edu: { name: 'Eğitmen', start: 2, fx: { awareness: 24, culture: 12, consumption: -14, waste: 12, unrest: -4 }, hz: 0,
    desc: 'Toplumu bilinçlendirir, tüketimi düşürür. Fikirleri yüzyıllar sonra yeniden keşfedilir.',
    onBase: 'Üste kaldığında: sıçrama sonrası kart seçeneği +1.' },
};

// 3 asamali karar agaci: etki katsayilari, ayri metin agaci degil
CP.PATHS = [
  { title: 'Ana Strateji', opts: [
    { id: 'ritual', name: 'Kültür ve Ritüel', desc: 'Ekolojik ilkeler geleneklere ve festivallere işlenir. Kalıcı ve dirençli.', fx: { culture: 12, awareness: 7, consumption: -7, bio: 4 }, hz: -0.012 },
    { id: 'land', name: 'Koruma Toprakları', desc: 'Toprak satın alınır, koruma alanları ilan edilir. Doğaya doğrudan etki.', fx: { bio: 16, water: 12, soil: 9, industry: -6, unrest: 3 }, hz: 0.005 },
    { id: 'found', name: 'Gizli Eğitim Vakfı', desc: 'Bilgi kuşaktan kuşağa saklanır. Teknoloji ve bilinç getirir.', fx: { awareness: 9, tech: 8, waste: 7 }, hz: 0 } ] },
  { title: 'Yöntem', opts: [
    { id: 'legal', name: 'Barışçıl Kampanya', desc: 'Yavaş ama güvenli. Etki x0.85, dağılma riski düşük.', mult: 0.85, hz: -0.012 },
    { id: 'radical', name: 'Sert Baskı Grubu', desc: 'Hızlı ama tepki çeker. Etki x1.3, isyan ve dağılma riski yüksek.', mult: 1.3, hz: 0.035, fx: { unrest: 8 } } ] },
  { title: 'Büyüme', opts: [
    { id: 'fin', name: 'Finansal Birikim', desc: 'Sermaye zamanla katlanır, bölgenin bütçesini çevreye kaydırır.', grow: true, fx: { env: 9, military: -3 } },
    { id: 'geo', name: 'Coğrafi Yayılım', desc: 'Komşu bölgelere etkisinin %45\'i yayılır.', spread: 0.45 } ] },
];

// Gecmis cagda karsilasilan saha olaylari. to: gecerli son yil.
// opts: mult=etki carpani, hz=dagilma riski, fx=ek etki, cost/+enerji
CP.FIELD = [
  { role: 'sci', from: 430, to: 1700, title: 'Yerel Bilgeler', text: 'Yerel şifacılar toprağı nasıl dinlendirdiklerini gösteriyor, ama sizin aletlerinizden korkuyorlar.',
    opts: [ { t: 'Aletleri gizle, onlardan öğren', log: 'yerel bilgeliği kayda geçirdi', fx: { soil: 8, bio: 4 }, mult: 0.95 }, { t: 'Teknolojiyi açıkça göster', log: 'zamanının çok ötesinde bir teknoloji gösterdi', mult: 1.2, fx: { tech: 6 }, early: 0.6 } ] },
  { role: 'sci', from: 1880, to: 1990, title: 'Fabrika Sahibinin Teklifi', text: 'Zengin bir sanayici laboratuvarınızı finanse etmek istiyor. Karşılığında patent onun olacak.',
    opts: [ { t: 'Kabul et, hızlı büyü', log: 'laboratuvarını bir sanayiciye bağladı', mult: 1.25, fx: { industry: 4 } }, { t: 'Reddet, bilgiyi halka aç', log: 'buluşlarını halka açık yayımladı', mult: 0.95, fx: { awareness: 6, renew: 5 } } ] },
  { role: 'sci', from: 2000, to: 2026, title: 'Veri Merkezi Sorunu', text: 'Modellerinizi çalıştıran sunucular kömürle besleniyor. Hesaplama gücünüz mü, ilkeniz mi?',
    opts: [ { t: 'Sunucuları yenilenebilire taşı', log: 'veri merkezlerini temiz enerjiye taşıdı', fx: { digital: -10, renew: 6 }, mult: 0.9 }, { t: 'Önce sonuç, modelleri koştur', log: 'modelleri ne pahasına olursa olsun çalıştırdı', mult: 1.25, fx: { digital: 5 } } ] },
  { role: 'res', from: 430, to: 1700, title: 'Kayıp Tablet', text: 'Harabelerde eski bir iklim kaydı buldunuz. Geleceğe taşımak tehlikeli bir yolculuk ister.',
    opts: [ { t: 'Mağaraya mühürle', log: 'iklim kayıtlarını bir mağaraya mühürledi', hz: -0.012, fx: { tech: 3 } }, { t: 'Kopyalatıp yay', log: 'kayıtları kopyalatıp kervanlarla yaydı', mult: 1.2, hz: 0.012, fx: { awareness: 5 } } ] },
  { role: 'res', from: 1880, to: 1990, title: 'Gizli Rapor', text: 'Bir devletin savaş bütçesi için iklim fonunu boşalttığını gösteren belgeler elinizde.',
    opts: [ { t: 'Basına sızdır', log: 'gizli bütçe belgelerini basına sızdırdı', fx: { military: -10, unrest: 6, awareness: 4 } }, { t: 'Sessizce arşivle', log: 'belgeleri sessizce arşivledi', hz: -0.012, mult: 1.05 } ] },
  { role: 'res', from: 2000, to: 2026, title: 'Sensör Ağı', text: 'Nehirlere ucuz sensörler yerleştirebilirsiniz. Şirketler veriyi satın almak istiyor.',
    opts: [ { t: 'Açık veri yap', log: 'nehir verilerini herkese açtı', fx: { water: 8, awareness: 4 } }, { t: 'Satıp projeyi fonla', log: 'verileri satarak projeyi fonladı', mult: 1.2, fx: { env: 4 } } ] },
  { role: 'edu', from: 430, to: 1700, title: 'Köy Meydanı', text: 'Halk sizi dinliyor, ama yöneticinin danışmanı "yabancı fikirler" diye homurdanıyor.',
    opts: [ { t: 'Öğretiyi masallara gizle', log: 'öğretisini masallara ve ninnilere gizledi', hz: -0.012, fx: { culture: 8 } }, { t: 'Meydanda açıkça anlat', log: 'meydanlarda açıkça ders verdi', mult: 1.2, hz: 0.015 } ] },
  { role: 'edu', from: 1880, to: 1990, title: 'İlk Okul', text: 'Fabrika işçilerinin çocukları için bir okul açabilirsiniz. Patronlar hoşnut değil.',
    opts: [ { t: 'İşçi birlikleriyle ortaklaş', log: 'işçi birlikleriyle okullar açtı', fx: { awareness: 7, unrest: 3 }, mult: 1.1 }, { t: 'Patronlarla uzlaş', log: 'patronlarla uzlaşıp müfredatı yumuşattı', hz: -0.008, mult: 0.95, fx: { culture: 3 } } ] },
  { role: 'edu', from: 2000, to: 2026, title: 'Viral An', text: 'Atık yağ toplama videonuz yayılıyor. Reklam teklifleri geliyor.',
    opts: [ { t: 'Mahalle toplama ağına dönüştür', log: 'videoyu mahalle toplama ağına dönüştürdü', fx: { waste: 10 }, mult: 0.95 }, { t: 'Ünü büyüt, kitleye ulaş', log: 'kampanyayı kitlesel bir harekete taşıdı', mult: 1.2, fx: { consumption: 3 } } ] },
];

// Birakilan timin gelecekteki yankilari: kelebek zincirini olusturur.
CP.ECHOES = [
  { role: 'sci', from: 900, to: 1500, text: '{bolge} bölgesinde sulama ve nöbetleşe ekim yöntemleri yayıldı.', fx: { soil: 3 } },
  { role: 'sci', from: 1600, to: 1880, text: '{bolge} akademilerinde kökeni belirsiz bir enerji defteri bulundu.', fx: { tech: 3 } },
  { role: 'sci', from: 1890, to: 1990, text: '{bolge}: Eski notlara dayanan güneş kolektörü fuarda ilgi gördü.', fx: { renew: 4 } },
  { role: 'sci', from: 2000, to: 2060, text: '{bolge}: Vakfın araştırması şebeke depolama sorununu çözdü.', fx: { renew: 5, tech: 4 } },
  { role: 'res', from: 800, to: 1700, text: '{bolge}: Kuşaktan kuşağa aktarılan iklim günlükleri kıtlığı önceden haber verdi.', fx: { water: 3 } },
  { role: 'res', from: 1750, to: 1990, text: '{bolge}: Gözlem istasyonu ağı, tarihin ilk kirlilik haritasını çıkardı.', fx: { awareness: 3 } },
  { role: 'res', from: 2000, to: 2060, text: '{bolge}: Sızan veriler savunma bütçesinin bir kısmını su arıtmaya kaydırdı.', fx: { military: -4, water: 3 } },
  { role: 'edu', from: 800, to: 1700, text: '{bolge} masallarında "denize borçlu olan çocuk" hikayesi anlatılmaya başlandı.', fx: { culture: 3 } },
  { role: 'edu', from: 1750, to: 1950, text: '{bolge}: Unutulmuş bir düşünürün tamir ve onarım üzerine yazıları basıldı. Kimse ciddiye almadı.', fx: { awareness: 3 } },
  { role: 'edu', from: 1960, to: 2030, text: '{bolge}: Gençler yıllar önce yazılmış "göz ardı edilmiş" bir bildiriyi ellerinde taşıyor.', fx: { awareness: 5, consumption: -4 } },
  { role: 'edu', from: 2031, to: 2069, text: '{bolge}: Okul müfredatına eski bir ekolojik öncünün adı verildi.', fx: { awareness: 3, waste: 3 } },
];

// Dunya olaylari. cond(r, g, y) parametrelere bakar; fx bolgeyi etkiler; flag zincir kurar.
// kind major: haber bandina duser. p: 10 yillik olasilik.
CP.EVENTS = [
  { id: 'kuraklik', kind: 'minor', from: 1000, to: 2070, p: 0.05, cond: (r) => r.water < 45, text: '{bolge}: Kuraklık dalgası hasadı vurdu.', fx: { water: -4, unrest: 5 } },
  { id: 'fabrika', kind: 'minor', from: 1880, to: 2070, p: 0.05, cond: (r) => r.industry > 45, text: '{bolge}: Fabrika kazası nehri kirletti.', fx: { water: -4, awareness: 2 } },
  { id: 'sel', kind: 'minor', from: 1980, to: 2070, p: 0.09, cond: (r, g) => g.heat > 1 && r.resilience < 50, text: '{bolge}: Aşırı yağış kentleri sular altında bıraktı.', fx: { unrest: 6, soil: -2 } },
  { id: 'isi', kind: 'minor', from: 2000, to: 2070, p: 0.1, cond: (r, g) => g.heat > 1.5, text: '{bolge}: Sıcak hava dalgası rekor kırdı.', fx: { unrest: 4, awareness: 2 } },
  { id: 'kitlik', kind: 'major', from: 1500, to: 2070, p: 0.12, cond: (r) => r.food < 32, text: '{bolge}: Kıtlık alarmı. Gıda güvenliği çöktü.', fx: { unrest: 14 } },
  { id: 'isyan', kind: 'major', from: 1700, to: 2070, p: 0.15, cond: (r) => r.unrest > 68, text: '{bolge}: Halk sokakta. Hükümet zor durumda.', fx: { military: 6, culture: -3 } },
  { id: 'sifiratik', kind: 'major', from: 1980, to: 2070, once: true, p: 0.3, cond: (r) => r.waste > 45 && r.awareness > 42, text: '{bolge} Sıfır Atık Yasası\'na geçti! Atıklar hızla azalıyor.', fx: { waste: 10, soil: 3 }, good: true },
  { id: 'kompost', kind: 'minor', from: 1960, to: 2070, once: true, p: 0.25, cond: (r) => r.waste > 28, text: '{bolge}: Mahallelerde kompost merkezleri açıldı.', fx: { soil: 4, waste: 3 }, good: true },
  { id: 'atikyag', kind: 'minor', from: 1990, to: 2070, once: true, p: 0.25, cond: (r) => r.waste > 38, text: '{bolge}: Atık yağ toplama filosu yola çıktı.', fx: { water: 3 }, good: true },
  { id: 'gunes', kind: 'major', from: 1990, to: 2070, once: true, p: 0.3, cond: (r) => r.renew > 45, text: '{bolge}: Şebekenin yarısı artık temiz kaynaklardan besleniyor.', fx: { renew: 5, industry: -3 }, good: true },
  { id: 'hareket', kind: 'major', from: 1960, to: 2070, once: true, p: 0.25, cond: (r) => r.awareness > 55, text: '{bolge}: Milyonlar iklim için yürüdü, seçim sonuçları değişti.', fx: { awareness: 5, military: -4 }, good: true },
  { id: 'mahsul', kind: 'minor', from: 1950, to: 2070, once: true, p: 0.2, cond: (r) => r.food > 62 && r.awareness > 35, text: '{bolge}: Dirençli tohum programı gıda güvenliğini yükseltti.', fx: { soil: 3 }, good: true },
  { id: 'iklimkent', kind: 'minor', from: 2000, to: 2070, once: true, p: 0.25, cond: (r) => r.resilience > 58, text: '{bolge}: Sünger kent projesi selleri durdurdu.', fx: { unrest: -5 }, good: true },
  { id: 'kiyi', kind: 'major', from: 2020, to: 2070, once: true, p: 0.18, cond: (r, g) => g.heat > 2.1, text: '{bolge}: Kıyı kentleri için göç planı açıklandı.', fx: { unrest: 9 } },
  { id: 'iklimfon', kind: 'major', from: 2000, to: 2070, p: 0.08, cond: (r) => r.military > 26, text: '{bolge}: Savunma bütçesi artırıldı, iklim fonları kesildi!', fx: { renew: -3, military: 3 } },
  { id: 'mercan', kind: 'major', from: 1990, to: 2070, once: true, region: ['oky', 'gda'], p: 0.25, cond: (r, g) => g.ocean > 55, text: '{bolge}: Mercan resifleri beyazladı, balıkçılık çöktü.', fx: { unrest: 6, bio: -4 } },
  { id: 'dijital', kind: 'minor', from: 2020, to: 2070, once: true, p: 0.2, cond: (r) => r.digital > 45, text: '{bolge}: Veri merkezleri kentin elektriğini geçti.', fx: { water: -2 } },
  // Trofik zincir (GDD: 1880 av turu -> 1970 hasere -> 2000 pestisit)
  { id: 'avci', kind: 'major', from: 1880, to: 1960, once: true, p: 0.35, cond: (r) => r.bio < 58, text: '{bolge}: Tahribat son büyük avcı türünü yok etti.', fx: { bio: -3 }, flag: 'avci' },
  { id: 'hasere', kind: 'minor', from: 1960, to: 2000, once: true, p: 0.4, need: 'avci', text: '{bolge}: Doğal avcısı kalmayan haşereler tarlaları sardı.', fx: { soil: -3, unrest: 3 }, flag: 'hasere' },
  { id: 'pestisit', kind: 'major', from: 2000, to: 2050, once: true, p: 0.4, need: 'hasere', text: '{bolge}: Pestisit kullanımı tavan yaptı, yeraltı suları zehirlendi. Zincir 1880\'de başlamıştı.', fx: { water: -8, agri: 4 } },
];

// Kartlar: { fx: yil icin bolgesel etki } veya ozel etki. target: kart bolge ister mi
CP.CARDS = [
  { id: 'fon', name: 'Acil Durum Fonu', target: true, year: 2026, color: 'red', desc: 'Seçilen bölgede kriz fonu: isyan düşer, gıda ve su toparlanır.', fx: { unrest: -18, water: 10, soil: 8 } },
  { id: 'medya', name: 'Medya Kampanyası', target: true, year: 2026, color: 'amber', desc: 'Seçilen bölgede bilinç yükselir, tüketim düşer.', fx: { awareness: 22, consumption: -14 } },
  { id: 'yama', name: 'Zaman Çatlağı Yaması', color: 'green', desc: 'Birikmiş zamansal kirliliğin yarısını temizler.', patch: 0.5 },
  { id: 'yakit', name: 'Yakıt İkmali', color: 'blue', desc: 'Çekirdek Enerjisi +18.', energy: 18 },
  { id: 'gonullu', name: 'Yeni Gönüllü', color: 'green', desc: 'Tima, en az kalan rolden bir üye katılır.', crew: 1 },
  { id: 'kalkan', name: 'Vakıf Kalkanı', color: 'blue', desc: 'Son bırakılan vakfın dağılma riskini kalıcı olarak yarıya indirir.', shield: true },
  { id: 'sulh', name: 'Barış Konferansı', target: true, year: 2000, color: 'amber', desc: 'Seçilen bölge ve komşularında askeri bütçe 2000\'den itibaren düşer.', fx: { military: -14 }, spread: 1 },
  { id: 'orman', name: 'Büyük Ağaçlandırma', target: true, year: 1970, color: 'green', desc: 'Seçilen bölgede 1970\'ten itibaren yaban hayatı ve su güçlenir.', fx: { bio: 18, water: 8 } },
  { id: 'okyanus', name: 'Okyanus Temizliği', color: 'blue', year: 2000, desc: 'Küresel: 2000\'den itibaren okyanus yükü her on yılda azalır.', ocean: -2.5 },
  { id: 'tarim', name: 'Rejeneratif Tarım', target: true, year: 1970, color: 'green', desc: 'Seçilen bölgede tarım baskısı düşer, toprak toparlanır.', fx: { agri: -18, soil: 12 } },
  { id: 'patent', name: 'Açık Patent', color: 'amber', year: 2000, desc: 'Küresel: Temiz teknoloji patentleri serbest. Tüm bölgelerde yenilenebilir +8.', fxAll: { renew: 8 } },
  { id: 'arsiv', name: 'Kayıp Arşiv', color: 'blue', desc: 'İkinci Prototip +%6.', proto: 6 },
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
