// HIKAYE ICERIGI: gorevler, kararlar, akimlar, mektuplar, haberler.
// Yeni icerik eklemek icin yalnizca bu dosyaya yeni bir satir eklemek yeterlidir.
globalThis.CP = globalThis.CP || {};

CP.LOCAL = {
  kam: { nehir: 'Mississippi', urun: 'mısır' }, lam: { nehir: 'Amazon', urun: 'kahve' }, bav: { nehir: 'Ren', urun: 'buğday' },
  isk: { nehir: 'Torne', urun: 'arpa' }, ana: { nehir: 'Kızılırmak', urun: 'fındık' }, odk: { nehir: 'Nil', urun: 'hurma' },
  saf: { nehir: 'Nijer', urun: 'darı' }, rus: { nehir: 'Volga', urun: 'buğday' }, gas: { nehir: 'Ganj', urun: 'pirinç' },
  das: { nehir: 'Yangtze', urun: 'pirinç' }, gda: { nehir: 'Mekong', urun: 'pirinç' }, oky: { nehir: 'Murray', urun: 'buğday' },
};
// Akimlarin okyanus asiri yolu (1900 sonrasi)
CP.FAR = { kam: ['bav', 'das'], bav: ['kam', 'lam'], lam: ['bav'], das: ['kam', 'oky'], oky: ['das'], saf: ['bav'] };

// Akimlar: baslatilir, sonra haritada kendi kendine yayilir.
CP.CURRENTS = [
  { id: 'agac', name: 'Ağaç Dikme Töreni', from: 430, to: 1900, fx: { bio: 22, water: 8, culture: 8 }, desc: 'Her doğumda bir ağaç dikilir.' },
  { id: 'nobet', name: 'Nöbetleşe Ekim Şenliği', from: 430, to: 1900, fx: { soil: 24, agri: -8, culture: 6 }, desc: 'Toprak dinlenince bayram yapılır.' },
  { id: 'supay', name: 'Su Paylaşım Meclisi', from: 430, to: 1950, fx: { water: 24, culture: 8, unrest: -6 }, desc: 'Kuyular ortak yönetilir.' },
  { id: 'bisiklet', name: 'Bisiklet Kulüpleri', from: 1880, to: 2070, fx: { industry: -14, consumption: -8, awareness: 8 }, desc: 'Kentler pedalla tanışır.' },
  { id: 'onarim', name: 'Tamir Et Akımı', from: 1880, to: 2070, fx: { consumption: -24, waste: 16 }, desc: 'Atmak ayıp, onarmak moda olur.' },
  { id: 'paylasim', name: 'Araç Paylaşımı', from: 1970, to: 2070, fx: { industry: -20, consumption: -10, awareness: 6 }, desc: 'Otostop ve ortak yolculuk yaygınlaşır.' },
  { id: 'azet', name: 'Az Et Haftası', from: 1970, to: 2070, fx: { agri: -24, water: 10, awareness: 6 }, desc: 'Sofralar sessizce değişir.' },
  { id: 'yavasmoda', name: 'Yavaş Moda', from: 1970, to: 2070, fx: { consumption: -20, waste: 10, culture: 6 }, desc: 'Az kıyafet, uzun ömür.' },
  { id: 'ekran', name: 'Ekran Orucu', from: 2000, to: 2070, fx: { digital: -26, culture: 12 }, desc: 'Haftada bir gün sunucular dinlenir.' },
  { id: 'bostan', name: 'Kent Bostanları', from: 2000, to: 2070, fx: { soil: 14, resilience: 16, food: 12 }, desc: 'Çatılar ve boş arsalar yeşerir.' },
  { id: 'mutfak', name: 'Sıfır Atık Mutfağı', from: 2000, to: 2070, fx: { waste: 26, consumption: -8 }, desc: 'Kabuklar da yemeğe, artıklar komposta.' },
];

// Gorevler. roles: oncelik sirasiyla kim gidebilir. need: bolgenin 2070 durumuna gore uygunluk.
// useRole: rolun temel etkisini de alir. tau: etkinin olgunlasma hizi. guard: engelledigi olaylar.
CP.MISSIONS = [
  { id: 'vakif_sci', name: 'Bilim Vakfı Kur', roles: ['sci'], from: 430, to: 2070, useRole: true, need: (r) => 100 - r.renew, desc: 'Temiz teknoloji araştırması kuşaklar boyu sürer.',
    crisis: { title: 'Kayıp Defter', text: 'Vakfın en değerli defteri çalındı. Hırsız, bilgiyi kendi çıkarı için satacak.', opts: [
      { t: 'Bilgiyi herkese açıkla', log: 'çalınan bilgiyi herkese açıkladı', fx: { awareness: 8, renew: 6 }, mult: 0.95 },
      { t: 'Kopyasını sakla, sessiz kal', log: 'gizli bir kopyayla çalışmayı sürdürdü', hz: -0.012, fx: { tech: 6 } } ] } },
  { id: 'vakif_res', name: 'Gözlem Ağı Kur', roles: ['res'], from: 430, to: 2070, useRole: true, need: (r) => 60 - r.awareness * 0.3, desc: 'Bölgenin verileri kesinleşir, oradaki vakıflar korunur.',
    crisis: { title: 'Sahte Kayıtlar', text: 'Yerel yönetici, ölçümlerin kötü çıkmasını istemiyor. Rakamları değiştirmenizi söylüyor.', opts: [
      { t: 'Gerçek rakamları yay', log: 'sahte rakamları reddedip gerçek ölçümleri yaydı', fx: { awareness: 8, unrest: 4 }, mult: 1.1 },
      { t: 'İki defter tut', log: 'gerçek ölçümleri gizli bir defterde sakladı', hz: -0.014 } ] } },
  { id: 'vakif_edu', name: 'Düşünce Okulu Kur', roles: ['edu'], from: 430, to: 2070, useRole: true, need: (r) => 80 - r.awareness, desc: 'Bilinç artar, tüketim düşer. Fikirler yüzyıllar sonra yeniden keşfedilir.',
    crisis: { title: 'Yasak Kitap', text: 'Okulun kitabı yasaklandı. Öğrencileriniz ne yapacağınızı soruyor.', opts: [
      { t: 'Kitabı ezberlet', log: 'yasaklı kitabı öğrencilerine ezberletti', hz: -0.012, fx: { culture: 8 } },
      { t: 'Meydanda oku', log: 'yasaklı kitabı meydanda yüksek sesle okudu', mult: 1.25, hz: 0.02, fx: { unrest: 5 } } ] } },
  { id: 'gelenek', name: 'Kültürel Gelenek Başlat', roles: ['edu', 'res'], from: 430, to: 1950, tau: 40, need: (r) => 70 - r.culture, fx: { culture: 24, awareness: 12, consumption: -12, bio: 6 }, hz: -0.012, desc: 'Ekolojik ilkeler festivallere ve hikayelere işlenir. Çok kalıcıdır.',
    crisis: { title: 'Yeni Yönetici', text: 'Yeni yönetici eski festivali gereksiz buluyor.', opts: [
      { t: 'Festivali onun adına düzenle', log: 'festivali yöneticinin adıyla yeniden adlandırdı', hz: -0.01 },
      { t: 'Halkla birlikte direnin', log: 'festivali halkla birlikte savundu', mult: 1.2, fx: { culture: 6, unrest: 5 } } ] },
    echoes: [ { after: 80, text: '{bolge}: Eski festival hâlâ kutlanıyor. Kimse nereden geldiğini hatırlamıyor.', fx: { culture: 3 } }, { after: 500, text: '{bolge}: "Toprağa teşekkür günü" resmi tatil ilan edildi.', fx: { awareness: 4 } } ] },
  { id: 'koruma', name: 'Koruma Toprakları Kur', roles: ['res', 'sci'], from: 430, to: 2070, need: (r) => 100 - r.bio, fx: { bio: 34, water: 22, soil: 14, industry: -8, unrest: 3 }, desc: 'Toprak satın alınır, koruma alanı ilan edilir. Doğaya doğrudan etki.',
    crisis: { title: 'Sınır Anlaşmazlığı', text: 'Komşu çiftçiler koruma alanının otlaklarını elinden aldığını söylüyor.', opts: [
      { t: 'Ortak yönetim kur', log: 'çiftçilerle ortak yönetim kurdu', hz: -0.012, fx: { unrest: -5 }, mult: 0.95 },
      { t: 'Sınırı koru', log: 'sınırı ne pahasına olursa olsun korudu', mult: 1.2, fx: { unrest: 6 } } ] },
    echoes: [ { after: 60, text: '{bolge}: {nehir} kıyısındaki eski koruma alanına yaban hayatı geri döndü.', fx: { bio: 3 } }, { after: 200, text: '{bolge}: Koruma alanı, kurak yıllarda bölgenin su deposu oldu.', fx: { water: 3 } } ] },
  { id: 'tohum', name: 'Tohum Bankası Kur', roles: ['sci', 'res'], from: 430, to: 2070, guard: ['kitlik', 'hasat'], need: (r) => 95 - r.food, fx: { soil: 18, food: 26, agri: -6 }, desc: 'Yerel {urun} tohumları saklanır. Bölge kıtlıklara karşı korunur.',
    crisis: { title: 'Mucize Tohum', text: 'Bir tüccar yüksek verimli ama tek türlü bir tohum satıyor. Hasat iki katına çıkabilir.', opts: [
      { t: 'Çeşitliliği koru', log: 'tek tohum yerine çeşitliliği korudu', fx: { bio: 8, soil: 6 } },
      { t: 'Tüccarla anlaş', log: 'yüksek verimli tohumu kabul etti', mult: 1.2, fx: { food: 8, bio: -5 } } ] },
    echoes: [ { after: 40, text: '{bolge}: Tohum bankasından çıkan {urun} çeşidi kuraklığa dayandı.', fx: { soil: 4 } } ] },
  { id: 'tarim', name: 'Rejeneratif Tarım Yay', roles: ['sci', 'edu'], from: 430, to: 2070, need: (r) => r.agri + (60 - r.soil), fx: { agri: -30, soil: 30, water: 10 }, desc: 'Toprağı yormayan yöntemler öğretilir. Metan ve su baskısı düşer.',
    crisis: { title: 'Kötü Hasat', text: 'İlk yıl hasat düşük çıktı. Çiftçiler eski yönteme dönmek istiyor.', opts: [
      { t: 'Kayıpları karşıla', log: 'çiftçilerin kaybını kendi kaynaklarıyla karşıladı', mult: 1.15 },
      { t: 'Yavaş geçişe izin ver', log: 'geçişi yavaşlatıp güven kazandı', hz: -0.012, mult: 0.95, fx: { unrest: -4 } } ] },
    echoes: [ { after: 50, text: '{bolge}: {urun} tarlalarında yıllar sonra toprak solucanları geri döndü.', fx: { soil: 3 } } ] },
  { id: 'akim', name: 'Akım Başlat', roles: ['edu', 'res'], from: 430, to: 2070, current: true, need: (r) => 40 + r.consumption * 0.5 + r.culture * 0.2, fx: { awareness: 4 }, desc: 'Bir akım başlatırsın, sonrası kendi kendine yayılır. Kültür hızlandırır, stoiklik yavaşlatır.',
    crisis: { title: 'Alay Konusu', text: 'Akım gazetelerde ve meclislerde alay konusu oldu.', opts: [
      { t: 'Mizahla karşılık ver', log: 'alaya mizahla karşılık verdi', mult: 1.25, fx: { culture: 5 } },
      { t: 'Sessizce örgütlen', log: 'sessizce küçük gruplar halinde örgütlendi', hz: -0.012 } ] } },
  { id: 'yasa', name: 'Yasa Kampanyası', roles: ['edu', 'res'], from: 1880, to: 2070, tau: 12, need: (r) => 75 - r.waste, fx: { env: 18, waste: 24, military: -6 }, desc: 'Bütçe hızla çevreye kayar. Etkisi hızlı görünür.',
    crisis: { title: 'Son Oylama', text: 'Yasa birkaç oyla kaybedilmek üzere. Bir sanayi temsilcisi uzlaşı öneriyor.', opts: [
      { t: 'Uzlaş, yasa çıksın', log: 'uzlaşıp yumuşatılmış yasayı çıkardı', mult: 0.9, hz: -0.015 },
      { t: 'Halkı sokağa çağır', log: 'halkı meydanlara çağırıp yasayı olduğu gibi geçirdi', mult: 1.3, fx: { unrest: 7 } } ] },
    echoes: [ { after: 20, text: '{bolge}: Yasa sonrası fabrikalar atıklarını {nehir} nehrine dökmeyi bıraktı.', fx: { water: 4 } } ] },
  { id: 'ifsa', name: 'Savaş Bütçesini İfşa Et', roles: ['res'], from: 1880, to: 2070, tau: 10, need: (r) => r.military * 2.2 + (r.war > 0 ? 25 : 0), fx: { military: -34, env: 10, unrest: 6 }, hz: 0.01, desc: 'Çevre fonlarının savaşa aktarıldığı ortaya çıkar. Askeri bütçe düşer, isyan riski doğar.',
    crisis: { title: 'Kaynak Tehlikede', text: 'Belgeleri size veren memur takip ediliyor.', opts: [
      { t: 'Onu kaçır, yayını ertele', log: 'kaynağını güvenli yere kaçırdı', hz: -0.012, mult: 0.95 },
      { t: 'Hemen yayımla', log: 'belgeleri aynı gece yayımladı', mult: 1.3, fx: { unrest: 5 } } ] },
    echoes: [ { after: 15, text: '{bolge}: Sızan bütçe belgeleri nedeniyle savunma bakanı istifa etti.', fx: { military: -3 } } ] },
  { id: 'mucit', name: 'Genç Mucidi Koru', roles: ['sci'], from: 1880, to: 2070, tau: 18, need: (r) => 90 - r.renew, fx: { tech: 34, renew: 26 }, desc: 'Tarihte unutulan bir mucidi hayatta ve işinin başında tutarsın. Teknoloji sıçrar.',
    crisis: { title: 'Patent Satışı', text: 'Bir petrol şirketi mucide servet teklif ediyor. Amaçları buluşu rafa kaldırmak.', opts: [
      { t: 'Patenti halka aç', log: 'mucidi patentini halka açmaya ikna etti', fx: { renew: 10, awareness: 4 } },
      { t: 'Şirkete sızdır, içeriden değiştir', log: 'mucidi şirkete sokup içeriden dönüştürdü', mult: 1.2, hz: 0.015, fx: { industry: -8 } } ] },
    echoes: [ { after: 25, text: '{bolge}: Unutulması gereken bir mucidin güneş bataryası seri üretime geçti.', fx: { renew: 5 } } ] },
  { id: 'kent', name: 'İklim Dirençli Kent', roles: ['sci', 'edu'], from: 1970, to: 2070, tau: 14, guard: ['sel', 'isi'], need: (r) => 85 - r.resilience, fx: { resilience: 40, water: 12, renew: 8 }, desc: 'Sünger kentler ve gölgeli sokaklar. Bölge sel ve sıcak hava dalgalarından korunur.',
    crisis: { title: 'Pahalı Mahalle', text: 'Yeşil dönüşüm kiraları yükseltiyor. Eski sakinler taşınmak zorunda kalıyor.', opts: [
      { t: 'Kiraları sabitle', log: 'dönüşümde kira güvencesi sağladı', fx: { unrest: -6 }, mult: 0.95 },
      { t: 'Hızla devam et', log: 'itirazlara rağmen dönüşümü hızlandırdı', mult: 1.2, fx: { unrest: 5 } } ] },
    echoes: [ { after: 15, text: '{bolge}: Sünger kent projesi {nehir} taşkınını kayıpsız atlattı.', fx: { unrest: -3 } } ] },
  { id: 'deniz', name: 'Deniz Koruma Ağı', roles: ['res', 'sci'], from: 1880, to: 2070, guard: ['mercan', 'balik'], need: (r, g) => g.ocean * 0.8, fx: { ocean: -3, bio: 14, consumption: -6 }, desc: 'Avlanma ve plastik sınırlandırılır. Küresel okyanus yükü düşer.',
    crisis: { title: 'Balıkçı Filosu', text: 'Yasak bölgede dev bir balıkçı filosu görüldü.', opts: [
      { t: 'Küçük balıkçılarla ortaklaş', log: 'yerel balıkçılarla denizi birlikte korudu', hz: -0.012, fx: { unrest: -3 } },
      { t: 'Görüntüleri dünyaya yay', log: 'filonun görüntülerini tüm dünyaya yaydı', mult: 1.25, fx: { awareness: 6 } } ] },
    echoes: [ { after: 30, text: '{bolge}: Koruma ağındaki balık stokları yeniden yükseliyor.', fx: { bio: 3 } } ] },
  { id: 'sifir', name: 'Sıfır Atık Mahallesi', roles: ['edu'], from: 1970, to: 2070, tau: 12, need: (r) => 90 - r.waste, fx: { waste: 38, soil: 12, consumption: -10 }, desc: 'Kompost, atık yağ toplama ve depozito. Komşular birbirinden öğrenir.',
    crisis: { title: 'Kokan Kompost', text: 'Mahalleli kompost merkezinin kokusundan şikayetçi.', opts: [
      { t: 'Atölyelerle öğret', log: 'mahallelilere kompost atölyeleri düzenledi', fx: { awareness: 8 } },
      { t: 'Merkezi büyüt, sanayileştir', log: 'kompostu endüstriyel tesise taşıdı', mult: 1.2, fx: { soil: 6 } } ] },
    echoes: [ { after: 15, text: '{bolge}: Mahalle modeli kent geneline yayıldı, çöp hacmi belirgin biçimde düştü.', fx: { waste: 4 } } ] },
  { id: 'enerji', name: 'Enerji Kooperatifi', roles: ['sci', 'edu'], from: 1970, to: 2070, tau: 14, need: (r) => 90 - r.renew + r.digital * 0.2, fx: { renew: 40, digital: -10, industry: -8 }, desc: 'Halkın ortak sahip olduğu rüzgar ve güneş santralleri.',
    crisis: { title: 'Şebeke Reddi', text: 'Dağıtım şirketi kooperatifin elektriğini şebekeye almıyor.', opts: [
      { t: 'Mahkemeye git', log: 'şebeke davasını yıllar sonra kazandı', hz: -0.012, mult: 0.95 },
      { t: 'Kendi şebekeni kur', log: 'kendi mikro şebekesini kurdu', mult: 1.25, fx: { resilience: 8 } } ] },
    echoes: [ { after: 15, text: '{bolge}: Kooperatif modeli yüzlerce kasabaya örnek oldu.', fx: { renew: 5 } } ] },
];

// Tarih Kitabi'ndan secilen olayi onleme gorevi
CP.BLOCK_MISSION = { id: 'degistir', name: 'Olayı Değiştir', roles: ['res', 'edu', 'sci'], tau: 8, fx: { unrest: -8, water: 8, military: -8 }, desc: 'Bu felaketi önlemek için doğrudan o yıla gidersin. Tarih direnebilir.',
  crisis: { title: 'Son Saat', text: 'Felakete sayılı günler kaldı. Tek bir hamle yapabilirsin.', opts: [
    { t: 'Karar vericilerle gizlice görüş', log: 'karar vericilerle gizlice görüşüp süreci yavaşlattı', hz: -0.01 },
    { t: 'Halkı önceden uyar', log: 'halkı önceden uyarıp kitlesel tepki doğurdu', mult: 1.2, fx: { awareness: 6, unrest: 3 } } ] } };

// 1. karar: gelis. Cag ve role gore degisir.
CP.FIELD = [
  { role: 'sci', from: 430, to: 1879, title: 'Yerel Bilgeler', text: 'Yerel şifacılar toprağı nasıl dinlendirdiklerini gösteriyor, ama sizin aletlerinizden korkuyorlar.', opts: [
    { t: 'Aletleri gizle, onlardan öğren', log: 'yerel bilgeliği kayda geçirdi', fx: { soil: 8, bio: 4 }, mult: 0.95 }, { t: 'Teknolojiyi açıkça göster', log: 'zamanının çok ötesinde bir teknoloji gösterdi', mult: 1.2, fx: { tech: 6 }, early: 0.6 } ] },
  { role: 'sci', from: 430, to: 1879, title: 'Uğursuz Yıldız', text: 'Gökte görülen bir kuyruklu yıldız halkı tedirgin etti. Herkes bir açıklama bekliyor.', opts: [
    { t: 'Gökyüzü takvimi hazırla', log: 'halka gökyüzü ve ekim takvimi hazırladı', fx: { soil: 6, culture: 5 } }, { t: 'Bu fırsatla saygınlık kazan', log: 'tutulmaları önceden bilerek büyük saygınlık kazandı', mult: 1.2, hz: 0.01 } ] },
  { role: 'sci', from: 1880, to: 1999, title: 'Fabrika Sahibinin Teklifi', text: 'Zengin bir sanayici çalışmanızı finanse etmek istiyor. Karşılığında patent onun olacak.', opts: [
    { t: 'Kabul et, hızlı büyü', log: 'laboratuvarını bir sanayiciye bağladı', mult: 1.25, fx: { industry: 4 } }, { t: 'Reddet, bilgiyi halka aç', log: 'buluşlarını halka açık yayımladı', mult: 0.95, fx: { awareness: 6, renew: 5 } } ] },
  { role: 'sci', from: 1880, to: 1999, title: 'Duman Altında', text: 'Laboratuvarınızın yanındaki fabrika bacası çocukları hasta ediyor.', opts: [
    { t: 'Ölçümleri gazeteye ver', log: 'hava ölçümlerini gazetelere verdi', fx: { awareness: 8, unrest: 3 } }, { t: 'Baca filtresi geliştir', log: 'ilk baca filtresini geliştirdi', fx: { industry: -6, tech: 5 } } ] },
  { role: 'sci', from: 2000, to: 2070, title: 'Veri Merkezi Sorunu', text: 'Modellerinizi çalıştıran sunucular kömürle besleniyor. Hesaplama gücünüz mü, ilkeniz mi?', opts: [
    { t: 'Sunucuları yenilenebilire taşı', log: 'veri merkezlerini temiz enerjiye taşıdı', fx: { digital: -10, renew: 6 }, mult: 0.9 }, { t: 'Önce sonuç, modelleri koştur', log: 'modelleri ne pahasına olursa olsun çalıştırdı', mult: 1.25, fx: { digital: 5 } } ] },
  { role: 'sci', from: 2000, to: 2070, title: 'Soğutma Suyu', text: 'Tesisiniz bölgenin suyunu tüketiyor. Yerel halk kapıya dayandı.', opts: [
    { t: 'Kapalı devreye geç', log: 'tesisi kapalı devre suya geçirdi', fx: { water: 8 }, mult: 0.95 }, { t: 'Tazminat öde, devam et', log: 'tazminat ödeyip üretime devam etti', mult: 1.2, fx: { unrest: 4 } } ] },
  { role: 'res', from: 430, to: 1879, title: 'Kayıp Tablet', text: 'Harabelerde eski bir iklim kaydı buldunuz. Geleceğe taşımak tehlikeli bir yolculuk ister.', opts: [
    { t: 'Mağaraya mühürle', log: 'iklim kayıtlarını bir mağaraya mühürledi', hz: -0.012, fx: { tech: 3 } }, { t: 'Kopyalatıp yay', log: 'kayıtları kopyalatıp kervanlarla yaydı', mult: 1.2, hz: 0.012, fx: { awareness: 5 } } ] },
  { role: 'res', from: 430, to: 1879, title: 'Kervan Yolu', text: 'Bir kervan size katılmayı teklif ediyor. Gözlem noktaları kurmak için ideal, ama yavaş.', opts: [
    { t: 'Kervanla git', log: 'kervan yolları boyunca gözlem noktaları kurdu', mult: 1.1, fx: { awareness: 4 } }, { t: 'Tek bir noktada derinleş', log: 'tek bir vadiyi kuşaklar boyu kayda aldı', hz: -0.012, fx: { water: 5 } } ] },
  { role: 'res', from: 1880, to: 1999, title: 'Gizli Rapor', text: 'Bir devletin savaş bütçesi için iklim fonunu boşalttığını gösteren belgeler elinizde.', opts: [
    { t: 'Basına sızdır', log: 'gizli bütçe belgelerini basına sızdırdı', fx: { military: -10, unrest: 6, awareness: 4 } }, { t: 'Sessizce arşivle', log: 'belgeleri sessizce arşivledi', hz: -0.012, mult: 1.05 } ] },
  { role: 'res', from: 1880, to: 1999, title: 'Nehir Numunesi', text: '{nehir} nehrinden aldığınız numuneler ürkütücü. Yerel gazete haberi basmaya çekiniyor.', opts: [
    { t: 'Sonuçları halka asın', log: '{nehir} numunelerini meydana astı', fx: { water: 6, awareness: 5 } }, { t: 'Bilim dünyasına gönder', log: 'numuneleri uluslararası bir dergiye gönderdi', fx: { tech: 5 }, hz: -0.008 } ] },
  { role: 'res', from: 2000, to: 2070, title: 'Sensör Ağı', text: 'Nehirlere ucuz sensörler yerleştirebilirsiniz. Şirketler veriyi satın almak istiyor.', opts: [
    { t: 'Açık veri yap', log: 'nehir verilerini herkese açtı', fx: { water: 8, awareness: 4 } }, { t: 'Satıp projeyi fonla', log: 'verileri satarak projeyi fonladı', mult: 1.2, fx: { env: 4 } } ] },
  { role: 'res', from: 2000, to: 2070, title: 'Uydu Görüntüsü', text: 'Uydu görüntüleri kaçak bir orman kesimini gösteriyor.', opts: [
    { t: 'Yerel halkla birlikte belgele', log: 'kaçak kesimi yerel halkla birlikte belgeledi', fx: { bio: 8, unrest: 2 } }, { t: 'Davayı uluslararasına taşı', log: 'davayı uluslararası mahkemeye taşıdı', mult: 1.15, fx: { military: -4 } } ] },
  { role: 'edu', from: 430, to: 1879, title: 'Köy Meydanı', text: 'Halk sizi dinliyor, ama yöneticinin danışmanı "yabancı fikirler" diye homurdanıyor.', opts: [
    { t: 'Öğretiyi masallara gizle', log: 'öğretisini masallara ve ninnilere gizledi', hz: -0.012, fx: { culture: 8 } }, { t: 'Meydanda açıkça anlat', log: 'meydanlarda açıkça ders verdi', mult: 1.2, hz: 0.015 } ] },
  { role: 'edu', from: 430, to: 1879, title: 'Çırak', text: 'Bir çocuk peşinize takıldı. Okuma öğrenmek istiyor, ailesi tarlada ona ihtiyaç duyuyor.', opts: [
    { t: 'Akşam dersleri başlat', log: 'köy çocuklarına akşam dersleri başlattı', fx: { awareness: 7, culture: 3 } }, { t: 'Aileyi ikna et, yanına al', log: 'bir çırak yetiştirip işi ona devretti', hz: -0.012, mult: 1.05 } ] },
  { role: 'edu', from: 1880, to: 1999, title: 'İlk Okul', text: 'Fabrika işçilerinin çocukları için bir okul açabilirsiniz. Patronlar hoşnut değil.', opts: [
    { t: 'İşçi birlikleriyle ortaklaş', log: 'işçi birlikleriyle okullar açtı', fx: { awareness: 7, unrest: 3 }, mult: 1.1 }, { t: 'Patronlarla uzlaş', log: 'patronlarla uzlaşıp müfredatı yumuşattı', hz: -0.008, mult: 0.95, fx: { culture: 3 } } ] },
  { role: 'edu', from: 1880, to: 1999, title: 'Plastik Mucizesi', text: 'Herkes yeni plastik eşyalara hayran. Uyarılarınız gülünç bulunuyor.', opts: [
    { t: 'Ev ekonomisi dersleri ver', log: 'ev ekonomisi derslerinde tamir ve yeniden kullanımı öğretti', fx: { consumption: -8, waste: 5 } }, { t: 'Çarpıcı bir sergi aç', log: 'bir yıllık çöpten çarpıcı bir sergi açtı', mult: 1.2, fx: { culture: 5 } } ] },
  { role: 'edu', from: 2000, to: 2070, title: 'Viral An', text: 'Atık yağ toplama videonuz yayılıyor. Reklam teklifleri geliyor.', opts: [
    { t: 'Mahalle toplama ağına dönüştür', log: 'videoyu mahalle toplama ağına dönüştürdü', fx: { waste: 10 }, mult: 0.95 }, { t: 'Ünü büyüt, kitleye ulaş', log: 'kampanyayı kitlesel bir harekete taşıdı', mult: 1.2, fx: { consumption: 3 } } ] },
  { role: 'edu', from: 2000, to: 2070, title: 'İklim Kaygısı', text: 'Öğrencileriniz umutsuz. "Zaten her şey bitti" diyorlar.', opts: [
    { t: 'Mahallede küçük bir iş başlat', log: 'öğrencileriyle mahallede somut işler başlattı', fx: { resilience: 8, culture: 4 } }, { t: 'Gençlik meclisi kur', log: 'gençlik iklim meclisi kurdu', mult: 1.15, fx: { awareness: 6 } } ] },
];

// 3. karar: final, gorevin nasil kalici olacagini belirler
CP.FINALS = { title: 'Ayrılık', text: 'Görev tamamlanıyor. Temporal Shift seni almaya gelmeden önce son kararını veriyorsun: Bu iş senden sonra nasıl yaşayacak?', opts: [
  { t: 'Yerel halka devret', log: 'işi yerel halka devretti', hz: -0.016, mult: 0.95 },
  { t: 'Sermayeyle büyüt', log: 'işi sermayeyle büyüyecek şekilde kurdu', grow: true, fx: { env: 8, military: -3 } },
  { t: 'Komşulara yay', log: 'işi komşu bölgelere yaydı', spread: 0.45, mult: 0.95 },
] };

// Vakiflardan gelen mektuplar: siçrama harcatmaz, sonucu vakfi etkiler
CP.LETTERS = [
  { title: 'Kral Vakfı Kapatmak İstiyor', text: 'Yeni kral vakfın topraklarına göz dikti. Elçisi kapıda.', opts: [
    { t: 'Kralın adını vakfa verin', log: 'vakıf kralın adını alarak hayatta kaldı', hz: -0.012, mult: 0.95 }, { t: 'Halkı arkamıza alalım', log: 'halk vakfı krala karşı savundu', mult: 1.15, fx: { culture: 6, unrest: 4 } } ] },
  { title: 'Bir Kıtlık Yılı', text: 'Bu yıl hasat yok. Vakfın ambarında tohum var, ama yerse gelecek yıl ekecek tohum kalmaz.', opts: [
    { t: 'Halka dağıtın', log: 'vakıf ambarını halka açtı', fx: { unrest: -8, culture: 5 }, mult: 0.95 }, { t: 'Tohumu saklayın', log: 'vakıf tohumları sakladı, o kış zor geçti', fx: { soil: 8, unrest: 5 }, mult: 1.1 } ] },
  { title: 'Bölünme', text: 'Vakıfta iki grup oluştu: Biri sessizce çalışmak, öbürü siyasete girmek istiyor.', opts: [
    { t: 'Sessiz yolu seçin', log: 'vakıf siyasetten uzak durdu', hz: -0.014 }, { t: 'Siyasete girin', log: 'vakıf üyeleri meclise girdi', mult: 1.2, fx: { env: 8 }, hz: 0.012 } ] },
  { title: 'Büyük Bağış', text: 'Bir sanayici vakfa dev bir bağış teklif ediyor. Adı binaya yazılacak.', opts: [
    { t: 'Kabul edin', log: 'vakıf sanayicinin bağışıyla büyüdü', mult: 1.2, fx: { industry: 4 } }, { t: 'Reddedin', log: 'vakıf bağışı reddedip bağımsız kaldı', fx: { awareness: 6 } } ] },
  { title: 'Nehir Değişti', text: '{nehir} yatağını değiştirdi. Vakfın tarlaları kurudu, köyler göç ediyor.', opts: [
    { t: 'Halkla birlikte taşının', log: 'vakıf halkla birlikte yeni topraklara göç etti', fx: { water: 7 }, hz: -0.008 }, { t: 'Kanal kazın', log: 'vakıf kuşaklar süren bir kanal kazdırdı', mult: 1.15, fx: { water: 10, bio: -3 } } ] },
  { title: 'Eski Metinler', text: 'Kurucunun yazdıkları artık yeni kuşaklara tuhaf geliyor. Yeniden yazılsın mı?', opts: [
    { t: 'Çağın diline çevirin', log: 'kurucunun metinleri çağın diline çevrildi', fx: { awareness: 7, culture: 3 } }, { t: 'Olduğu gibi koruyun', log: 'kurucunun metinleri harfi harfine korundu', hz: -0.014 } ] },
  { title: 'Bir Öğrenci Ayrılıyor', text: 'En parlak öğrenci kendi okulunu açmak istiyor, uzak diyarlara gidecek.', opts: [
    { t: 'Yolunu açın', log: 'öğrenci uzak diyarlarda yeni bir okul açtı', spread: 0.25 }, { t: 'Kalması için ikna edin', log: 'öğrenci kalıp vakfın başına geçti', mult: 1.12 } ] },
  { title: 'Şüpheli Yabancı', text: 'Bir yabancı, kurucunun nereden geldiğini araştırıyor. Çok şey biliyor gibi.', opts: [
    { t: 'Arşivi gizleyin', log: 'vakıf arşivini gizleyip yabancıyı yanılttı', hz: -0.012 }, { t: 'Ona güvenin', log: 'yabancı vakfın en güçlü destekçisi oldu', mult: 1.2, hz: 0.012 } ] },
];

// Rol genel yankilari (vakif gorevleri icin)
CP.ECHOES = [
  { role: 'sci', from: 900, to: 1500, text: '{bolge}: Sulama ve nöbetleşe ekim yöntemleri yayıldı.', fx: { soil: 3 } },
  { role: 'sci', from: 1600, to: 1880, text: '{bolge}: Akademide kökeni belirsiz bir enerji defteri bulundu.', fx: { tech: 3 } },
  { role: 'sci', from: 1890, to: 1990, text: '{bolge}: Eski notlara dayanan güneş kolektörü fuarda ilgi gördü.', fx: { renew: 4 } },
  { role: 'sci', from: 2000, to: 2060, text: '{bolge}: Vakfın araştırması şebeke depolama sorununu çözdü.', fx: { renew: 5, tech: 4 } },
  { role: 'res', from: 800, to: 1700, text: '{bolge}: Kuşaktan kuşağa aktarılan iklim günlükleri kıtlığı önceden haber verdi.', fx: { water: 3 } },
  { role: 'res', from: 1750, to: 1990, text: '{bolge}: Gözlem istasyonu ağı, tarihin ilk kirlilik haritasını çıkardı.', fx: { awareness: 3 } },
  { role: 'res', from: 2000, to: 2060, text: '{bolge}: Sızan veriler savunma bütçesinin bir kısmını su arıtmaya kaydırdı.', fx: { military: -4, water: 3 } },
  { role: 'edu', from: 800, to: 1700, text: '{bolge}: Masallarda "denize borçlu olan çocuk" hikayesi anlatılmaya başlandı.', fx: { culture: 3 } },
  { role: 'edu', from: 1750, to: 1950, text: '{bolge}: Unutulmuş bir düşünürün onarım üzerine yazıları basıldı. Kimse ciddiye almadı.', fx: { awareness: 3 } },
  { role: 'edu', from: 1960, to: 2030, text: '{bolge}: Gençler yıllar önce yazılmış "göz ardı edilmiş" bir bildiriyi ellerinde taşıyor.', fx: { awareness: 5, consumption: -4 } },
  { role: 'edu', from: 2031, to: 2069, text: '{bolge}: Okul müfredatına eski bir ekolojik öncünün adı verildi.', fx: { awareness: 3, waste: 3 } },
];

// Otomatik sebep: bagliliklar tablosundan uretilir
CP.CAUSES = { industry: 'sanayi', agri: 'tarım ve hayvancılık', consumption: 'tüketim', digital: 'veri merkezleri' };
CP.PARAM_TR = { water: 'su', bio: 'yaban hayatı', soil: 'toprak' };

// Dunya olaylari. text dizidir: ayni olay her seferinde baska cumleyle gelir.
// cond parametreleri okur, fx bolgeyi etkiler, why otomatik sebep uretir, cd: tekrar suresi (yil)
CP.EVENTS = [
  { id: 'kuraklik', kind: 'minor', from: 1000, to: 2070, p: 0.09, cd: 60, cond: (r) => r.water < 45, why: 'water', fx: { water: -4, unrest: 5 }, text: [
    '{bolge}: {nehir} kıyısında su seviyesi tarihin en düşük noktasında.', '{bolge}: Kuraklık {urun} hasadını yarıya indirdi.', '{bolge}: Köylerde kuyular birer birer kuruyor.', '{bolge}: Çocuklar suya ulaşmak için saatlerce yürüyor.', '{bolge}: Barajların doluluk oranı alarm veriyor.' ] },
  { id: 'fabrika', kind: 'minor', from: 1880, to: 2070, p: 0.08, cd: 50, cond: (r) => r.industry > 45, fx: { water: -4, awareness: 2 }, text: [
    '{bolge}: Fabrika kazası {nehir} nehrini kirletti.', '{bolge}: {nehir} kıyısında toplu balık ölümleri görüldü.', '{bolge}: Kimyasal sızıntı içme suyuna karıştı.', '{bolge}: Kent üstünde günlerdir sarı bir duman asılı.' ] },
  { id: 'sel', kind: 'minor', from: 1980, to: 2070, p: 0.1, cd: 40, cond: (r, g) => g.heat > 1 && r.resilience < 50, fx: { unrest: 6, soil: -2 }, text: [
    '{bolge}: Aşırı yağış kentleri sular altında bıraktı.', '{bolge}: {nehir} taştı, binlerce kişi evini kaybetti.', '{bolge}: Beton zemin suyu emmedi, metro hatları doldu.', '{bolge}: Bir günde aylık yağış düştü.' ] },
  { id: 'isi', kind: 'minor', from: 2000, to: 2070, p: 0.1, cd: 40, cond: (r, g) => g.heat > 1.5, fx: { unrest: 4, awareness: 2 }, text: [
    '{bolge}: Sıcak hava dalgası rekor kırdı.', '{bolge}: Okullar sıcak yüzünden tatil edildi.', '{bolge}: Elektrik şebekesi klimalara yenik düştü.', '{bolge}: Tarım işçileri için gündüz çalışma yasağı getirildi.' ] },
  { id: 'orman', kind: 'minor', from: 1990, to: 2070, p: 0.1, cd: 50, cond: (r, g) => g.heat > 1.2 && r.bio < 70, fx: { bio: -5, unrest: 3 }, text: [
    '{bolge}: Orman yangınları haftalardır söndürülemiyor.', '{bolge}: Duman, komşu kentlere kadar ulaştı.', '{bolge}: Yangın binlerce yıllık bir ormanı küle çevirdi.' ] },
  { id: 'hasat', kind: 'minor', from: 1300, to: 2070, p: 0.1, cd: 60, cond: (r) => r.soil < 42, why: 'soil', fx: { soil: -2, unrest: 4 }, text: [
    '{bolge}: Yorgun toprak {urun} vermiyor.', '{bolge}: Tarlalarda erozyon başladı, üst toprak rüzgarla gidiyor.', '{bolge}: Köylüler ilk kez tohumluğunu yemek zorunda kaldı.' ] },
  { id: 'hava', kind: 'minor', from: 1900, to: 2070, p: 0.08, cd: 50, cond: (r) => r.industry > 55, fx: { unrest: 3, awareness: 2 }, text: [
    '{bolge}: Kentte hava kirliliği alarmı. Parklar boşaldı.', '{bolge}: Solunum hastalıkları hastaneleri doldurdu.', '{bolge}: Kışın kömür dumanı güneşi kapattı.' ] },
  { id: 'cop', kind: 'minor', from: 1960, to: 2070, p: 0.08, cd: 50, cond: (r) => r.consumption > 45 && r.waste < 25, fx: { water: -3, soil: -2 }, text: [
    '{bolge}: Çöp dağları kıyıya kadar ulaştı.', '{bolge}: Plastik atıklar {nehir} ağzında bir ada oluşturdu.', '{bolge}: Depolama alanları doldu, atıklar açıkta yakılıyor.' ] },
  { id: 'gocmen', kind: 'minor', from: 2010, to: 2070, p: 0.09, cd: 40, cond: (r) => r.food < 38, fx: { unrest: 5 }, text: [
    '{bolge}: İklim göçmenleri sınırlara doğru yola çıktı.', '{bolge}: Köyler boşalıyor, kentlerin çevresinde çadırlar büyüyor.' ] },
  { id: 'balik', kind: 'minor', from: 1950, to: 2070, p: 0.08, cd: 60, cond: (r, g) => g.ocean > 30, fx: { bio: -3, unrest: 2 }, text: [
    '{bolge}: Balık stokları çöktü, küçük balıkçılar filolarını bağladı.', '{bolge}: Avlanan balıkların midesinde mikroplastik bulundu.', '{bolge}: Denizanası patlaması sahilleri kapattı.' ] },
  { id: 'kitlik', kind: 'major', from: 1500, to: 2070, p: 0.14, cd: 70, cond: (r) => r.food < 32, why: 'soil', fx: { unrest: 14 }, text: [
    '{bolge}: Kıtlık alarmı. Gıda güvenliği çöktü.', '{bolge}: {urun} fiyatları bir ayda üç katına çıktı.', '{bolge}: Ekmek kuyrukları uzuyor, tahıl depoları boş.' ] },
  { id: 'isyan', kind: 'major', from: 1700, to: 2070, p: 0.15, cd: 50, cond: (r) => r.unrest > 62, fx: { military: 6, culture: -3 }, text: [
    '{bolge}: Halk sokakta. Hükümet zor durumda.', '{bolge}: Su fiyatlarına karşı genel grev ilan edildi.', '{bolge}: Başkentte olağanüstü hal ilan edildi.' ] },
  { id: 'iklimfon', kind: 'major', from: 2000, to: 2070, p: 0.09, cd: 40, cond: (r) => r.military > 24, fx: { renew: -3, military: 3 }, text: [
    '{bolge}: Savunma bütçesi artırıldı, iklim fonları kesildi!', '{bolge}: Yenilenebilir enerji teşvikleri silah alımına aktarıldı.', '{bolge}: Çevre bakanlığı kapatılıp savunmaya bağlandı.' ] },
  { id: 'kiyi', kind: 'major', from: 2020, to: 2070, once: true, p: 0.16, cond: (r, g) => g.heat > 2.1, fx: { unrest: 9 }, text: [
    '{bolge}: Kıyı kentleri için göç planı açıklandı.', '{bolge}: Deniz seviyesi limanları kullanılmaz hale getirdi.', '{bolge}: Tuzlu su {urun} tarlalarına karışmaya başladı.' ] },
  { id: 'mercan', kind: 'major', from: 1990, to: 2070, once: true, region: ['oky', 'gda', 'lam'], p: 0.25, cond: (r, g) => g.ocean > 45, fx: { unrest: 6, bio: -4 }, text: [
    '{bolge}: Mercan resifleri beyazladı, balıkçılık çöktü.', '{bolge}: Resif turizmi bitti, kıyı köyleri boşalıyor.' ] },
  { id: 'dijital', kind: 'minor', from: 2020, to: 2070, once: true, p: 0.2, cond: (r) => r.digital > 40, fx: { water: -2 }, text: [
    '{bolge}: Veri merkezleri kentin elektriğini geçti.', '{bolge}: Yapay zeka sunucuları için {nehir} suyu çekiliyor.' ] },
  { id: 'sifiratik', kind: 'major', from: 1980, to: 2070, once: true, good: true, p: 0.3, cond: (r) => r.waste > 42 && r.awareness > 32, fx: { waste: 10, soil: 3 }, text: [
    '{bolge} Sıfır Atık Yasası\'na geçti! Atıklar hızla azalıyor.', '{bolge}: Depozito sistemi ve kompost zorunlu hale geldi.' ] },
  { id: 'kompost', kind: 'minor', from: 1960, to: 2070, once: true, good: true, p: 0.25, cond: (r) => r.waste > 26, fx: { soil: 4, waste: 3 }, text: [
    '{bolge}: Mahallelerde kompost merkezleri açıldı.', '{bolge}: Organik atıklar artık tarlalara gübre olarak dönüyor.' ] },
  { id: 'atikyag', kind: 'minor', from: 1990, to: 2070, once: true, good: true, p: 0.25, cond: (r) => r.waste > 36, fx: { water: 3 }, text: [
    '{bolge}: Atık yağ toplama filosu yola çıktı.', '{bolge}: Mahalle atık yağ noktaları lavabolara giden yağı kesti.' ] },
  { id: 'gunes', kind: 'major', from: 1990, to: 2070, once: true, good: true, p: 0.3, cond: (r) => r.renew > 42, fx: { renew: 5, industry: -3 }, text: [
    '{bolge}: Şebekenin yarısı artık temiz kaynaklardan besleniyor.', '{bolge}: Son kömür santrali törenle kapatıldı.', '{bolge}: Çatılardaki güneş panelleri gündüz şebekeye elektrik satıyor.' ] },
  { id: 'hareket', kind: 'major', from: 1960, to: 2070, once: true, good: true, p: 0.25, cond: (r) => r.awareness > 48, fx: { awareness: 5, military: -4 }, text: [
    '{bolge}: Milyonlar iklim için yürüdü, seçim sonuçları değişti.', '{bolge}: Öğrenciler okul boykotuyla iklim yasasını geçirdi.' ] },
  { id: 'mahsul', kind: 'minor', from: 1950, to: 2070, once: true, good: true, p: 0.2, cond: (r) => r.food > 60 && r.awareness > 30, fx: { soil: 3 }, text: [
    '{bolge}: Dirençli {urun} programı gıda güvenliğini yükseltti.', '{bolge}: Gıda israfını azaltma yasası sofraları değiştirdi.' ] },
  { id: 'iklimkent', kind: 'minor', from: 2000, to: 2070, once: true, good: true, p: 0.25, cond: (r) => r.resilience > 48, fx: { unrest: -5 }, text: [
    '{bolge}: Sünger kent projesi selleri durdurdu.', '{bolge}: Kent ormanları sıcaklığı birkaç derece düşürdü.' ] },
  { id: 'nehirtemiz', kind: 'major', from: 1970, to: 2070, once: true, good: true, p: 0.25, cond: (r) => r.water > 62 && r.awareness > 28, fx: { bio: 4 }, text: [
    '{bolge}: {nehir} yıllar sonra ilk kez yüzülebilir ilan edildi.', '{bolge}: Balık sürüleri {nehir} nehrine geri döndü.' ] },
  { id: 'yaban', kind: 'minor', from: 1980, to: 2070, once: true, good: true, p: 0.22, cond: (r) => r.bio > 62 && r.awareness > 24, fx: { soil: 2 }, text: [
    '{bolge}: Yok olduğu sanılan bir tür yeniden görüldü.', '{bolge}: Büyük yırtıcılar eski yaşam alanlarına döndü, denge kuruldu.' ] },
  { id: 'denizdestek', kind: 'minor', from: 1990, to: 2070, once: true, good: true, region: ['oky', 'gda', 'isk', 'bav', 'lam'], p: 0.2, cond: (r, g) => g.ocean < 45 && r.waste > 24, fx: { bio: 3 }, text: [
    '{bolge}: Tek kullanımlık plastik yasağı sahilleri temizledi.', '{bolge}: Balinalar yıllar sonra kıyıya yaklaştı.' ] },
  // Trofik zincir (GDD: 1880 av turu -> 1970 hasere -> 2000 pestisit)
  { id: 'avci', kind: 'major', from: 1880, to: 1960, once: true, p: 0.35, cond: (r) => r.bio < 58, fx: { bio: -3 }, flag: 'avci', why: 'bio', text: [
    '{bolge}: Tahribat son büyük avcı türünü yok etti.', '{bolge}: Bölgenin son büyük yırtıcı sürüsü de yok edildi.' ] },
  { id: 'hasere', kind: 'minor', from: 1960, to: 2000, once: true, p: 0.4, need: 'avci', fx: { soil: -3, unrest: 3 }, flag: 'hasere', text: [
    '{bolge}: Doğal avcısı kalmayan haşereler tarlaları sardı.', '{bolge}: Kemirgenler {urun} depolarını yiyip bitirdi.' ] },
  { id: 'pestisit', kind: 'major', from: 2000, to: 2050, once: true, p: 0.4, need: 'hasere', fx: { water: -8, agri: 4 }, text: [
    '{bolge}: Pestisit kullanımı tavan yaptı, yeraltı suları zehirlendi. Zincir 1880\'lerde başlamıştı.', '{bolge}: Tarım ilaçları {nehir} nehrinde tehlike sınırını aştı. Bir avcının yokluğu 100 yıl sonra fatura kesti.' ] },
];

// İlk görev: 430'dan nehri fiziksel olarak değil, suyu paylaşma kültürünü korur. Etkisi Koruma görevine eşittir.
{
  const koruma = CP.MISSIONS.find((m) => m.id === 'koruma');
  CP.MISSIONS.push({ ...koruma, id: 'meclis', name: 'Su Meclisi Kur', tutorialOnly: true,
    desc: 'Çobanlar ve çiftçiler suyu birlikte paylaştırır. Kural kuşaktan kuşağa geçer.',
    echoes: [
      { after: 60, text: '{bolge}: Su Meclisi\'nin koruduğu {nehir} kıyılarına yaban hayatı geri döndü.', fx: { bio: 3 } },
      { after: 200, text: '{bolge}: Su Meclisi\'nin kuralları, kurak yıllarda bölgeyi ayakta tuttu.', fx: { water: 3 } },
    ] });
}

// Dünya Nabzı: her hedef kolunu besleyen beşer gösterge (bkz. sim.js rawTracks).
CP.PULSE = {
  tech: [{ key: 'tech', name: 'Bilim' }, { key: 'renew', name: 'Temiz enerji' }, { key: 'awareness', name: 'Bilinç' }, { key: 'waste', name: 'Sıfır atık' }, { key: 'resilience', name: 'Kent direnci' }],
  eco: [{ key: 'bio', name: 'Yaban hayatı' }, { key: 'water', name: 'Tatlı su' }, { key: 'soil', name: 'Toprak' }, { key: 'ppm', name: 'Karbon', bad: true }, { key: 'ocean', name: 'Deniz yükü', bad: true }],
  peace: [{ key: 'wars', name: 'Savaş', bad: true }, { key: 'nuke', name: 'Nükleer risk', bad: true }, { key: 'unrest', name: 'İsyan', bad: true }, { key: 'military', name: 'Askeri bütçe', bad: true }, { key: 'food', name: 'Gıda', bad: false }],
};

// Dünya örgütleri: bir gösterge kotayı aşınca kurulur, oyuncu yönünü seçer.
// quota: 2070 değerinin başlangıç tarihine göre iyileşmesi. wars için önlenen savaş sayısı.
CP.ORGS = [
  { key: 'tech', quota: 10, speaker: 'cem', name: 'Küresel Bilim Birliği', text: 'Bilim birikimi eşiği aştı. Ülkeler ortak laboratuvarlar kuruyor.', opts: [
    { t: 'Patentleri herkese aç', note: 'Temiz enerji yayılır, sanayi şikâyet eder.', fx: { renew: 10, tech: 4, unrest: 2 } },
    { t: 'Bilimi okullara taşı', note: 'Bilinç ve kültür güçlenir.', fx: { awareness: 8, culture: 4 } },
    { t: 'Gemimiz için çalıştır', note: 'Teknoloji hedefi doğrudan +%3.', proto: 3 } ] },
  { key: 'renew', quota: 12, speaker: 'cem', name: 'Dünya Enerji Kooperatifleri Birliği', text: 'Temiz enerji payı kotayı aştı. Kooperatifler dünya çapında birleşiyor.', opts: [
    { t: 'Kömür santrallerini kapat', note: 'Sanayi baskısı düşer, gerginlik artar.', fx: { industry: -8, renew: 8, unrest: 3 } },
    { t: 'Yoksul bölgelere dağıt', note: 'Gıda güçlenir, isyan azalır.', fx: { renew: 5, food: 4, unrest: -3 } },
    { t: 'Çekirdeğe enerji aktar', note: 'Gemiye +6 enerji.', energy: 6 } ] },
  { key: 'awareness', quota: 8, speaker: 'leyla', name: 'Dünya Ekolojik Eğitim Konseyi', text: 'Ekolojik bilinç eşiği geçti. Öğretmenler sınır tanımadan örgütleniyor.', opts: [
    { t: 'Müfredatı zorunlu yap', note: 'Bilinç artar, tüketim düşer.', fx: { awareness: 8, consumption: -6 } },
    { t: 'Sanat ve medyaya taşı', note: 'Kültür güçlenir.', fx: { awareness: 4, culture: 6 } },
    { t: 'Gönüllü yetiştir', note: 'Gemiye 1 yeni uzman katılır.', crew: 1 } ] },
  { key: 'waste', quota: 10, speaker: 'leyla', name: 'Küresel Sıfır Atık Ağı', text: 'Atık döngüsü kotayı aştı. Kentler ortak bir ağ kuruyor.', opts: [
    { t: 'Tek kullanımlık plastiği yasakla', note: 'Atık ve tüketim düşer, gerginlik artar.', fx: { waste: 8, consumption: -4, unrest: 2 } },
    { t: 'Mahalle onarım atölyeleri', note: 'Atık düşer, toprak güçlenir.', fx: { waste: 5, soil: 4 } },
    { t: 'Atıktan yakıt üret', note: 'Gemiye +5 enerji.', energy: 5 } ] },
  { key: 'resilience', quota: 8, speaker: 'leyla', name: 'İklim Dirençli Kentler Birliği', text: 'Kent direnci eşiği geçti. Belediyeler bilgi paylaşmaya başladı.', opts: [
    { t: 'Kıyı kentlerini önceliklendir', note: 'Kent direnci büyük ölçüde artar.', fx: { resilience: 9 } },
    { t: 'Gölge ve su tutan mahalleler', note: 'Su ve yaban hayatı da güçlenir.', fx: { resilience: 5, bio: 3, water: 3 } },
    { t: 'Afet fonunu paylaştır', note: 'İsyan azalır.', fx: { unrest: -5, resilience: 3 } } ] },
  { key: 'bio', quota: 8, speaker: 'leyla', name: 'Dünya Yaban Hayatı Konseyi', text: 'Biyoçeşitlilik kotayı aştı. Ülkeler ortak koruma ağı istiyor.', opts: [
    { t: 'Kıtalar arası koridorlar aç', note: 'Yaban hayatı artar, tarım baskısı düşer, gerginlik artar.', fx: { bio: 8, agri: -3, unrest: 2 } },
    { t: 'Yönetimi yerel halka ver', note: 'Yaban hayatı artar, isyan azalır.', fx: { bio: 5, unrest: -3 } },
    { t: 'Gen bankası kur', note: 'Toprak güçlenir, Teknoloji hedefi +%1.', fx: { bio: 3, soil: 3 }, proto: 1 } ] },
  { key: 'water', quota: 8, speaker: 'leyla', name: 'Dünya Su Bilinçliliği Örgütü', text: 'Su tüketimi kotanın altına indi. Bu başarıyla bir dünya örgütü kuruldu.', opts: [
    { t: 'Küresel su kotası yasası', note: 'Su çok güçlenir, tarım baskısı düşer, gerginlik artar.', fx: { water: 9, agri: -4, unrest: 3 } },
    { t: 'Su meclislerini yay', note: 'Su ve kültür güçlenir, isyan azalır.', fx: { water: 5, culture: 4, unrest: -2 } },
    { t: 'Su teknolojisine yatır', note: 'Bilim birikimi artar.', fx: { water: 3, tech: 5 } } ] },
  { key: 'soil', quota: 7, speaker: 'leyla', name: 'Küresel Toprak Konfederasyonu', text: 'Toprak verimi kotayı aştı. Çiftçi birlikleri tek çatıda toplanıyor.', opts: [
    { t: 'Tek tip tarıma vergi koy', note: 'Tarım baskısı düşer, gerginlik artar.', fx: { soil: 8, agri: -5, unrest: 2 } },
    { t: 'Çiftçi okulları aç', note: 'Toprak ve gıda güçlenir.', fx: { soil: 5, food: 5 } },
    { t: 'Toprağı karbon deposu yap', note: 'Toprak ve bilinç güçlenir.', fx: { soil: 3, awareness: 4 } } ] },
  { key: 'ppm', quota: 35, speaker: 'cem', name: 'Dünya Karbon Konseyi', text: 'Atmosferdeki karbon kotanın altına indi. Ülkeler ilk kez aynı masada.', opts: [
    { t: 'Küresel karbon vergisi', note: 'Sanayi baskısı düşer, gerginlik artar.', fx: { industry: -8, env: 6, unrest: 4 } },
    { t: 'Dünya ormanları programı', note: 'Yaban hayatı ve su güçlenir.', fx: { bio: 5, water: 3 } },
    { t: 'Karbon fonundan yakıt al', note: 'Gemiye +6 enerji.', energy: 6 } ] },
  { key: 'ocean', quota: 10, speaker: 'leyla', name: 'Okyanus İttifakı', text: 'Okyanus yükü kotanın altına indi. Kıyı ülkeleri ittifak kurdu.', opts: [
    { t: 'Açık denizleri koru', note: 'Okyanus yükü çok düşer.', fx: { ocean: -10 } },
    { t: 'Balıkçı kooperatifleri kur', note: 'Okyanus yükü düşer, gıda güçlenir.', fx: { ocean: -5, food: 3 } },
    { t: 'Plastik toplama filosu', note: 'Okyanus yükü ve atık düşer.', fx: { ocean: -4, waste: 4 } } ] },
  { key: 'wars', quota: 2, speaker: 'cem', name: 'Dünya Barış Konseyi', text: 'Yeterince savaşı önledin. Dünya barışı, ülkelerin çevreciliğe yönelmesine yardımcı oldu. Bu enerjiyi nereye akıtalım?', opts: [
    { t: 'Silah bütçesini iklime aktar', note: 'Askeri bütçe düşer, çevre bütçesi artar.', fx: { military: -10, env: 8 } },
    { t: 'Su paylaşım anlaşmaları', note: 'Su güçlenir, isyan azalır.', fx: { water: 5, unrest: -5 } },
    { t: 'Silah fabrikalarını dönüştür', note: 'Sanayi baskısı düşer, temiz enerji artar.', fx: { industry: -4, renew: 6 } } ] },
  { key: 'nuke', quota: 5, speaker: 'cem', name: 'Nükleer Silahsızlanma Anlaşması', text: 'Nükleer risk kotanın altına indi. Süper güçler masaya oturdu.', opts: [
    { t: 'Başlıkları sök', note: 'Askeri bütçe düşer, gerginlik artar.', fx: { military: -8, unrest: 2 } },
    { t: 'Diplomasiyi kurumsallaştır', note: 'İsyan azalır, kültür güçlenir.', fx: { unrest: -5, culture: 3 } },
    { t: 'Reaktörleri gemiye bağla', note: 'Gemiye +6 enerji.', energy: 6 } ] },
  { key: 'unrest', quota: 6, speaker: 'leyla', name: 'Küresel Adalet Platformu', text: 'İsyan riski kotanın altına indi. Halk hareketleri ortak bir sese kavuştu.', opts: [
    { t: 'İklim adaleti fonu', note: 'İsyan azalır, gıda güçlenir.', fx: { unrest: -6, food: 3 } },
    { t: 'Yerel meclisleri güçlendir', note: 'İsyan azalır, kültür güçlenir.', fx: { unrest: -4, culture: 4 } },
    { t: 'Gönüllü çağrısı yap', note: 'Gemiye 1 yeni uzman katılır.', crew: 1 } ] },
  { key: 'military', quota: 5, speaker: 'cem', name: 'Silahsızlanma Bloku', text: 'Askeri bütçeler kotanın altına indi. Ülkeler blok kurmaya başladı.', opts: [
    { t: 'Bütçeyi eğitime aktar', note: 'Askeri bütçe düşer, bilinç artar.', fx: { military: -6, awareness: 6 } },
    { t: 'Gizli harcamaları ifşa et', note: 'Askeri bütçe çok düşer, gerginlik artar.', fx: { military: -8, unrest: 3 } },
    { t: 'Savunma araştırmasını sivile çevir', note: 'Bilim ve temiz enerji güçlenir.', fx: { tech: 5, renew: 3 } } ] },
  { key: 'food', quota: 8, speaker: 'leyla', name: 'Dünya Gıda Güvenliği Örgütü', text: 'Gıda güvenliği kotayı aştı. Kıtlık artık kader sayılmıyor.', opts: [
    { t: 'Ortak tohum bankası', note: 'Gıda ve yaban hayatı güçlenir.', fx: { food: 7, bio: 2 } },
    { t: 'Hayvancılığı azalt', note: 'Tarım baskısı düşer, su güçlenir, gerginlik artar.', fx: { agri: -6, water: 3, unrest: 2 } },
    { t: 'Kıtlık fonu kur', note: 'Gıda güçlenir, isyan azalır.', fx: { food: 3, unrest: -5 } } ] },
];

// Gemi Vardiyası: sıçramalar arasında 2 iş. Gemide ilgili uzman olmalı.
CP.SHIFTS = [
  { id: 'research', role: 'sci', name: 'Araştırma', gain: 'Teknoloji +%1,5', desc: 'Gemideki bilim insanları çalışır. Sonraki sıçramada Teknoloji hedefi +%1,5.' },
  { id: 'media', role: 'edu', name: 'Medya kampanyası', gain: 'Görev gücü +%10', desc: 'Eğitmenler zemini hazırlar. Sonraki görevin gücü +%10.' },
  { id: 'supply', role: 'res', name: 'Erzak ve para', gain: 'Yakıt −2', desc: 'Araştırmacılar erzak ve para hazırlar. Sonraki sıçrama 2 enerji daha ucuz.' },
];
