# Chronos Project: Son Döngü — Geliştirme Notları

## Güncel kararlar (31 Ekim 2026)

- İsim: **Chronos Project: Son Döngü**. Gemi: **Temporal Shift**. Rejim: **totaliter rejim**.
- Parametreler: GDD'deki **15 küresel** parametre + bölge başına ayrı parametreler. Slayt 7'deki "24" sayısı güncellenecek.
- Teknoloji: Derleme gerektirmeyen HTML + JS. `index.html` çift tıkla açılır.
- Görev kartları, 3 kararlı akış, akımlar, Olayı Değiştir, mektuplar ve 3 kollu prototip eklendi (1 Kasım).
- Hikaye içeriği `src/content.js`, dünya verisi `src/data.js` içinde, bağlantılar `CP.LINKS` tablosunda, simülasyon `src/sim.js`, kurallar `src/game.js`.
- Denge testi: `node tools/balance.mjs`.

Aşağıdaki bölümler ilk öneri metnidir; yukarıdaki kararlarla çelişirse yukarıdakiler geçerlidir.

---

Bu dosya GDD'yi (`HP Oyun , Chronos Project,.odt`) ve pitch deck'i tamamlar, onların yerine geçmez.
Buradaki kararlar **öneri** niteliğindedir. Kutay ve Fatih onayladıkça "Karar" olarak kesinleşir.

Teslim: 1 Kasım 2026, gece 24:00 (kalan süre yaklaşık 27 saat; resmi saat kontrol edilecek).

---

## 1. En büyük eksik: oyunun "turu" tanımlı değil

Belgeler dünyayı, parametreleri ve rolleri çok iyi anlatıyor, ama oyuncunun dakika dakika ne yaptığı belirsiz.
Oyuncu hep 2070'te mi duruyor, zaman akıyor mu, geçmişe gidince 2070'e ne oluyor?
Kodlamaya başlamadan önce kapanması gereken tek gerçek açık bu.

### Öneri: "Sıçra ve Yeniden Hesapla" döngüsü

Oyuncu hep 2070'tedir. Tarih, oyuncunun müdahale listesinin bir sonucudur:

1. **Oku:** 2070 haritasına ve panellere bak, krizi gör.
2. **Planla:** Çağ + bölge + mürettebat üyesi + 3 aşamalı yol seçimi (strateji, yöntem, büyüme).
3. **Sıçra:** Çekirdek enerjisi harcanır, zamansal kirlilik eklenir.
4. **Yeniden hesapla:** Tarih 430'dan 2070'e 5-8 saniyede akar. Harita yıl yıl renk değiştirir, manşetler geçer.
5. **Kelebek raporu:** "Bu sıçrama neyi değiştirdi?" Nedensellik zinciri gösterilir.
6. Kart çek, tekrar başla.

Bir oyun 8-12 sıçrama, yani yaklaşık 15-20 dakika. "Son Döngü" adı da buradan anlam kazanır.

### Neden bu model

- Kelebek etkisi, oyunun vaadi olarak ekranda **görünür** olur. Tur tabanlı düz akışta 430'daki kararın sonucunu görmek için dakikalarca beklemek gerekirdi.
- Kod tek bir saf fonksiyona iner: `simulate(seed, mudahaleler) -> tarih`. Save sistemi ve çağlar arası durum senkronu gerekmez.
- 10 yıllık adımla 164 adım × 12 bölge eder, anında hesaplanır.
- Karşı-gerçek bedavadır: simülasyonu son müdahale olmadan bir kez daha çalıştırıp farkı alırız. Kelebek raporu bu farktan üretilir.
- Oyuncu, önceki tarihi grafiklerde hayalet çizgi olarak görür.

**Teknik not:** Rastgelelik `hash(seed, yıl, bölge, olayId)` ile üretilmeli. Tek bir sıralı RNG kullanılırsa küçük bir müdahale tüm zarları kaydırır ve fark raporu gürültüye döner.

---

## 2. Belgeler arası çelişkiler ve önerilen çözümler

| Konu | Çelişki | Öneri |
|---|---|---|
| Köken hikayesi | GDD: çekirdek "kayıp medeniyet mirası". Deck: uzak gelecekteki diktatörlükten kaçırıldı | Deck'teki sürüm. Kayıp medeniyet, o uzak geleceğin kendisi olur |
| Çağlar | GDD: 5 dönem. UI: 430, 1880, 1970, 2000, 2026, 2070. GDD'de ayrıca "1400" ve "420" geçiyor | UI'daki 5 geçmiş durak + 2070 üs |
| Kaynak | GDD: yakıt. UI: "Temporal Core Stabilite" ve yakıt göstergesi yok | Tek bar: **Çekirdek Enerjisi**. Maliyet uzaklıkla artar; sıfırlanırsa oyun biter |
| Yüzyıllık araştırma | Bilim insanı yüzyıllarca araştırıyor, ama "görev süresi 30 yıl" | Kişi 30 yıl aktif, sonra kurduğu **vakıf/ekol** azalan etkiyle sürer. Geri toplama yalnızca bu 30 yılda mümkün |
| Ülkeler | 430'da bugünkü ülkeler yok, otomotiv yok | **Bölgeler** (bkz. §4). İsimler çağa göre değişir, sektörler çağa göre açılır |
| CO₂ değeri | Mock'ta 450 ve 4550 ppm | Gerçek çıpalar: ~280 (430), ~290 (1880), ~325 (1970), ~370 (2000), ~425 (2026). 2070 varsayılanı 550+ |
| İsim | Klasör "Chronos", oyun "Temporal Shift" | Temporal Shift: Son Döngü |

---

## 3. Jüri riski: hassas içerik

Sunumda HP, UNDP ICPSD ve COP31 Türkiye logoları var. Şunlar fikri değil, doğrudan ifadeyi riske sokuyor:

- **"Dinsel diktatörlük"** ana tanıtım cümlesinde. Öneri: "zaman teknolojisini yasaklayan totaliter rejim". Hikaye hiçbir şey kaybetmiyor.
- **"Ekolojik ilkeleri dini inançlara harmanlamak"** yolu. Öneri: "kültürel gelenekler ve ritüeller".
- **Gerçek ülke + olumsuz manşet** ("Ortadoğu'da Su Savaşları", "ABD iklim fonlarını kesti"). Öneri: bölge düzeyinde, kurgusal blok adlarıyla. Bölge sistemi sınır tartışmalarından da korur.
- **"Radikal baskı grubu":** Mekanik kalsın, şiddeti teşvik etmeden, sonuçları olan bir yol olarak yazılsın.

---

## 4. Kapsam: ne yapıyoruz, ne kesiyoruz

**Yapıyoruz**

- **12 bölge:** K. Amerika, L. Amerika, Batı Avrupa, İskandinavya, Anadolu, Orta Doğu ve K. Afrika, Sahra Altı Afrika, Rusya ve Orta Asya, Güney Asya, Doğu Asya, Güneydoğu Asya, Okyanusya.
- **Bölge karakteri:** stoik, sanayici, kırılgan gibi GDD'deki tipler. COP31 için Anadolu ayrı ve detaylı bir bölge; Sıfır Atık hedefleri burada öne çıkar.
- **Parametreler:** Bölge başına ~8 durum + 5 bütçe payı, üzerine küresel değerler. Toplam 150+ canlı değer eder, "50+" iddiası dürüstçe karşılanır. UI'da 4 kadran ve açılır klasör.
- **3 rol**, 12 yol kombinasyonu (3 × 2 × 2). Yollar ayrı metin ağacı değil, etki katsayısıdır.
- **~40 olay** (minör + majör), **~12 kart**, 3 bitiş türü + 3 oyun sonu (enerji, nükleer savaş, su).
- **Veri sisi:** Bölgede araştırmacı yoksa değer aralık gösterilir (`~%30-55`), varsa kesin. Ucuz ve çok güçlü bir mekanik.
- **Savaş:** Askeri pay + su eşiği aşılınca koalisyon kurulur, komşulara negatif yayılım yapar.

**Kesiyoruz (Roadmap slaytına)**

- Geçmişten mürettebat toplama, doktor/zanaatkar rolleri, co-op.
- 100 söz: yerine ~25 söz (bkz. §5).
- Ülke bazlı detay ve bireysel su tüketimi gibi lore düzeyi veriler.

**Denge kuralları** (yoksa oyun tek bir optimal stratejiye iner)

- Erken müdahale güçlü ama öngörülemez ve pahalı; geç müdahale zayıf ama kesin.
- Aynı bölgeye yığılmada azalan getiri; eşikler ve doğrusal olmayan etkiler.
- Teknolojik Erken Keşif Riski: Çok erken teknoloji bölgesel krizi tetikleyebilir.
- Kazanma formülü net olmalı: `İkinci Prototip % = f(Teknoloji, Ekosistem, Barış)`, %100'de zafer.

---

## 5. Eklenecek fikirler (etkisi yüksek, maliyeti düşük)

1. **Canlı pencere (sanatçı gözü).** Komuta merkezinin penceresi dünyanın durumunu gösterir: asit yağmurlu, neon şehir → açık gökyüzü ve yeşil. Katmanlı görsel + CSS ile birkaç saatlik iş; oyuncu sayılara bakmadan iyileşmeyi hisseder.
2. **Tarih Kitabı (şair gözü).** Her run kendi kroniğini yazar: "430: Anadolu'da bir orman vakfı kuruldu... 1970: Vakfın notları bir bakanın eline geçti." Oyun sonu ekranı olarak paylaşılabilir.
3. **Eğitmenlerin sözleri.** Oyun sonu sözlerinin bir kısmını kendi "unutulmuş düşünürlerimiz" söyler. Bu GDD'deki şakayı karşılar ve yanlış atıf riskini ortadan kaldırır. Gerçek alıntılar kaynağıyla doğrulanmadan girmez.
4. **Son perde: paradoks.** Dünyayı kurtarırsan, çekirdeği kaçırdığın diktatörlük hiç var olmaz, yani çekirdek de. Finalde bir seçim veya sessiz bir kapanış; "döngüyü kırmak" gerçek anlamını bulur.
5. **"Gerçek dünyada" kartı.** Her oyun sonu, kullanılan mekaniği gerçek bir çözüme bağlar (kompost, atık yağ toplama vb.). COP31 ve iklim eğitimi temasına doğrudan cevap.
6. **90 saniye kuralı.** Jüri oyunun başında az zaman harcar. İlk sıçrama yönlendirmeli olmalı ve ilk kelebek etkisi 90 saniye içinde görünmeli.

---

## 6. Teknik öneri

**Vite + TypeScript, tarayıcıda, DOM/SVG.** Oyun esasen bir strateji paneli; bu alanda web, oyun motorundan daha hızlı ilerler. Jüri link ile oynar (itch.io, GitHub Pages).
Harita: Natural Earth verisinden birleştirilmiş 12 bölge SVG'si.

```
src/sim/     saf simülasyon, UI bağımsız, Node'da test edilir
src/data/    bölgeler, parametreler, olaylar, kartlar, yollar (JSON/TS, kodsuz içerik ekleme)
src/ui/      harita, paneller, zaman çizelgesi, raporlar
tools/       otomatik oynayan bot: binlerce oyun oynatıp denge ölçer
```

İçeriğin veri olarak tutulması, belgedeki "ana kodu bozmadan genişletme" hedefini karşılar.

Görsel notu: Mock'lardaki metinler görsele gömülü ve kısmen bozuk ("Kost:", "Konstruktı"), yani doğrudan kullanılamaz. UI gerçek HTML ile yeniden kurulur, görseller yalnızca sanat yönü ve arka plan olur.

**Gemini'den gereken temiz görseller (metinsiz, ekransız):**

- Komuta odası: boş pencere ve boş monitörler
- Pencere manzarası × 3: çökmüş, orta, iyileşmiş
- Çağ sahnesi × 5
- Rol portresi × 3
- Kart görseli × ~12

---

## 7. Takvim önerisi

| Zaman | Hedef |
|---|---|
| 31 Eki, gece | Repo, simülasyon çekirdeği, bölge haritası |
| 1 Kas, 13:00 | **Oynanabilir döngü** (çirkin ama baştan sona oynanıyor) |
| 1 Kas, 18:00 | **Özellik dondurma:** içerik, olaylar, kartlar tamam |
| 1 Kas, 21:00 | Denge, cila, ses; build yayında |
| 1 Kas, 22:30 | Oynanış videosu + deck son hali |
| 1 Kas, 23:30 | **Teslim** (son 30 dakika tampon) |

---

## 8. Pitch deck düzeltmeleri

- [ ] "ŞABLON SAYFA x" etiketlerini kaldır; üç slaytta birden "Slayt 6 / 8" yazıyor.
- [ ] Sıralama: resmi şablonda Ekip → Gelecek Planları → Linkler ayrı slaytlar; deck'te birleşik ve farklı sırada. Şablona uydur.
- [ ] Yer tutucular: `kutay@email.com`, `fatih@email.com`, "Ekip Üyesi", `[Link Eklenecek]`.
- [ ] "Oyunumuzdan Sahneler" slaytına gerçek oyun ekran görüntüleri koy; konsept görselleri "konsept" diye etiketle.
- [ ] Lore cümlesini §3'e göre güncelle.
- [ ] GDD'deki Gemini kalıntısını temizle ("Bu metni doğrudan kopyalayıp Fatih'le paylaşacağınız..."); belge paylaşılacak.
- [ ] Gerekli çıktılar: oynanış videosu, GitHub linki, oynanabilir build.

---

## 9. Açık sorular

1. Fatih'in rahat ettiği araç nedir? Unity/Godot'ta çok güçlüyse §6 yeniden değerlendirilir.
2. Hackathon kuralları yapay zeka ile üretilen görsel ve kodu kabul ediyor mu, beyan gerekiyor mu?
3. Teslim saati ve tam teslim paketi resmi olarak nedir?
