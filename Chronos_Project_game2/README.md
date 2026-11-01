# Chronos Project: Son Döngü

COP31 Oyun Hackathonu (GameUp Türkiye / HP) için geliştirilen 2D zaman yolculuğu ve kelebek etkisi stratejisi.

**Oynamak için:** `index.html` dosyasını tarayıcıda aç. Kurulum gerekmez.

**Oyuna başla** kısa açılış hikâyesini açar (**Hikâyeyi atla** ile geçilebilir). Ardından Anadolu'daki
ilk görev gelir; bu görev zorunlu eğitimdir ve atlanamaz. Alttaki rehber her ekranda nerede olduğunu,
ne yapman gerektiğini ve kalan adımları gösterir. Üç kararın ardından tarih yeniden hesaplanır; rapor
kararını, tarihsel izlerini ve ölçülen sonucu gösterir. Görevin sonunda kısa bir tur, komuta ekranını
(enerji, ekip, hedefler, harita, zaman çizelgesi, kartlar) bölge bölge tanıtır.
Karar kartları, geçmişteki görevler ve dünya verileri komuta ekranındaki açılır
panellerdedir. Küçük ekranlarda paneller haritanın altına taşınır.

| Dosya | Görev |
|---|---|
| `src/data.js` | Bölgeler, parametre bağlantıları, kartlar, sözler |
| `src/content.js` | Görevler, kararlar, akımlar, mektuplar, haberler |
| `src/sim.js` | Tarih simülasyonu: `simulate(seed, mudahaleler)` |
| `src/game.js` | Enerji, tim, görev, kart, mektup ve bitiş kuralları |
| `src/experience.js` | İlk görev, bölgeye göre görev gerekçeleri, kayıtlara dayalı rapor anlatımı |
| `src/scene-data.js` | Seçim açıklamaları ve gerçek bölge değerlerinden görsel durum |
| `src/save.js` | Küçük yerel kayıt ve seed/müdahalelerden geri yükleme |
| `src/cinema.js` | Komuta odası, havza, seçimler, tarih akışı ve önce/sonra sahnesi |
| `src/scene-audio.js` | Ortam sesi, geçiş/sonuç işaretleri ve ses yaşam döngüsü |
| `src/narrative.js` | Leyla/Cem/Dara, görev istekleri, yerel sesli okuma ve deterministik eylem canlandırmaları |
| `src/hud.js` | Bütün oyun ekranlarında ortak enerji, gemideki uzmanlar ve prototip şeridi |
| `src/ui.js` | Harita, paneller, sıçrama akışı |
| `tools/balance.mjs` | Otomatik oynayıp dengeyi ölçen bot |

Harita verisi: Natural Earth (kamu malı).

İlk Anadolu görevi sahne tabanlıdır: atmosferik ortamlar, kodla ışık/sis/su hareketi,
beklenen fayda ve bedel açıklamaları, atlanabilir zaman geçişi, gerçek ölçümlere bağlı
önce/sonra karşılaştırması. Diğer görevler serbest komuta arayüzünden oynanır.
`?classic` parametresi önceki arayüzü karşılaştırma için açar; `?fast` geçişleri hızlandırır.
AI görselleri temsili oyun illüstrasyonlarıdır; simülasyon sonucu ya da tarihsel kanıt değildir.
Varlık kaynakları ve üretim promptları `assets/cinema/` klasöründedir.

Oyun mantığı ve ses yaşam döngüsü: `node --test tools/experience.test.mjs tools/scene-data.test.mjs tools/save.test.mjs tools/scene-audio.test.mjs tools/decision-preview.test.mjs tools/narrative.test.mjs tools/systems.test.mjs` (ek paket gerekmez).
Denge ölçümü: `node tools/balance.mjs`.

İlk görevin sonunda komuta güvertesine dönersin; güvertedeki öneri, o an en geride
olan gerçek hedef kolundan gelir. **Sonraki görevi planla**, **Dünya haritasını aç**
ve **Tarih Kitabı** ile devam edebilirsin. Haritadaki **Gemi** düğmesi güverteyi yeniden açar.

Tamamlanan tur, kart kullanımı ve mektup kararı tarayıcıya otomatik kaydedilir.
Haritada **Kaydet** düğmesi de vardır. Yeniden açılışta **Döngüye devam et** görünür;
bitmiş bir kayıt için **Son döngüyü gör** kullanılır. Yeni döngünün ilk kaydında önceki
kayıt ayrı bir yedekte korunur. Hazırlık aşamasındaki henüz onaylanmamış seçimler
otomatik kayda dahil değildir.

Kayıt için tarayıcının bu dosyaya yerel depolama izni vermesi gerekir. Kayıt yapılamazsa
oyun bunu açıkça bildirir ve açık sekmede devam eder. Aynı tarayıcı ve dosya yolunu
kullan; başka klasördeki kopya aynı kaydı görmeyebilir. Haritadaki **Döngüyü bitir**
o oyunu sonuçlandırır; yalnız ara vermek için tamamlanan turdan sonra sekmeyi kapatabilirsin.

Kararlardaki dağılma öngörüsü, mevcut karar zincirini ve 2070'e kalan gerçek yüzyıl
adımlarını kullanır. Yaklaşık olasılıktır; gerçekleşecek sonucu söylemez. Kalıcılık
zaten koruma sınırındaysa seçenek ek koruma varmış gibi sunulmaz. Sonuç raporu
enerji harcamasını, geri kazanılan ikmali ve gemideki bilim insanlarının teknoloji
bonusunu ayrı gösterir.

Oyun başladıktan sonra üstteki kaynak şeridi her ekranda kalır: enerji, gemideki
bilim insanı/araştırmacı/eğitmen sayısı ve üç prototip kolu. Mektup ve rapor
açıldığında da görünür. Değerler güncel gemi durumudur; eski zaman çizgisini
karşılaştırmak bu kaynakları geri sarmaz. Hazırlık aşaması henüz enerji tüketmez.
Dar ekranlarda şerit iki satıra geçer. Açılışta kayıt/yeni döngü seçilene kadar
kaynaklar gösterilmez. Özel kaynak ikonları SVG'dir; yeni font veya ağ isteği yoktur.


Haritadan bölge seçmek bölge bilgilerini açar; sıçrama oradan planlanır. Serbest görevlerde
Leyla veya Cem isteği ve gerekçeyi aktarır. İlk Anadolu görevindeki otlak çatışmasını kurmaca çoban Dara anlatır.
Bir karar resmine basmak önizlemeyi açar;**Bu kararı onayla**ile ilerlersin.
Son onayda gerçek görev bedeli ödenir. Önizleme eylemin temsili canlandırmasıdır,
gelecekteki ölçülmüş sonuç değildir.

Menüde gezinme/açma/geri/onay efektleri ve sahne sesi ortak bağlamı kullanır.
Kullanıcı etkileşiminden önce ses açılmaz;Sessiz tercihi gezinme ve konuşmayı da keser.
Tarayıcı yerel Türkçe WebSpeechsesi sağlıyorsa **Konuşmayı dinle** görünür;
çevrimiçi ses seçilmez. Bu seçenek her tarayıcıda mevcut olmayabilir;metin daima görünür.
Manrope/Barlowfontları ve OFLlisansları assets/fonts içindedir;oyun harici font isteği yapmaz.

**Başarımlar:** `CP.ACH_REGION` ve `CP.ACH_WORLD` (`src/content.js`), kontrol `CP.checkAch` (`src/game.js`). Simülasyonu değiştirmez; kazanılan başarım döngü boyunca kalır ve kayda yazılır.

Yeni sistemler: **Dünya Nabzı** (haritanın üstünde, her hedefi besleyen beşer gösterge), **Gemi Vardiyası**
(sıçramadan önce 2 iş), **Sıçrama hizalama** (atlanabilir; her isabet yakıtı %8 düşürür) ve **Dünya örgütleri**
(gösterge kotayı aşınca kurulur, 3 yön seçilir). Ayarlar `src/game.js` içindeki `CP.TUNE` satırındadır;
değiştirince `node tools/balance.mjs` ile ölçün. `TUNE='{"orgQuota":3}'` ortam değişkeni denemeye yarar.

Gemini için portre ve sahne istekleri `assets/cinema/GEMINI_ISTEKLERI.md` içindedir. Dosyalar eklenince oyun onları kendiliğinden kullanır.
