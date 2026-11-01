# Gemini görsel istekleri

Güncel durum: portreler arka planı temizlenmiş `.png`, sahneler `.jpg` olarak oyunda. Gemini'nin `.jfif` çıktısı JPEG'dir; yeni sahne eklerseniz uzantısını `.jpg` yapın.

Dosyaları bu klasöre (`assets/cinema/`) tam bu adlarla koyun. Oyun onları kendiliğinden kullanır;
bir dosya yoksa eski görsel görünür, hata çıkmaz.

## Portreler (6 adet)

Her portre için önce bu ortak metni, sonra kişinin satırını yapıştırın:

> Standalone original fictional character portrait for a time-travel strategy game, transparent background.
> Bust to waist-up, three quarter view facing slightly left. Painterly realistic premium strategy-game illustration,
> textured brushwork, credible face and hands, warm ochre key light from the right, cool dark teal rim light from the left.
> Calm, grounded expression, not a fashion model. Worn practical clothing in charcoal, moss and ochre.
> No text, no logo, no badge, no UI, no frame, no pedestal. This is a fictional person, not a real person.

| Dosya | Oyundaki adı | Kişi |
|---|---|---|
| `arastirmaci-1.png` | Selim Aydın | Male field researcher, 34, Turkish, short dark curly hair, trimmed beard, weathered field jacket, a small brass surveying instrument on a strap |
| `arastirmaci-2.png` | Naz Demir | Female field researcher, 41, Anatolian, dark hair tied back, sun-worn skin, canvas coat with many pockets, a rolled paper map in one hand |
| `bilim-1.png` | Dr. Ada Yılmaz | Female scientist, 38, Turkish, shoulder-length dark hair, thin-framed glasses, charcoal technical jacket, small glass sample vial in hand |
| `bilim-2.png` | Dr. Kaan Erdem | Male scientist, 56, Mediterranean, grey hair and short grey beard, tired kind eyes, dark knit sweater under a worn lab coat |
| `egitim-1.png` | Elif Şahin | Female educator, 29, Turkish, warm smile, long dark braid, simple earth-toned coat, holding a worn book against her chest |
| `egitim-2.png` | Murat Koç | Male educator, 62, Anatolian, white moustache, gentle expression, old tweed jacket, a piece of chalk in his fingers |

## Karar sahneleri (16 adet)

Her sahne için önce bu ortak metni, sonra sahnenin satırını yapıştırın:

> Single cinematic strategy-game illustration, wide landscape 3:2. Rich painterly semi-realism with visible brush texture,
> emotionally credible figures, warm natural light and cool shadows, earthy moss, ochre and ink-slate palette, camera near eye height.
> One unified scene. No text, no writing, no labels, no maps with writing, no logos, no UI, no split frame, no arrows.

Çağlar: **eski** M.S. 430-1879, **sanayi** 1880-1969, **modern** 1970-2070.

| Dosya | Sahne | Ne anlatır |
|---|---|---|
| `sahne-saha-eski.png` | Around the year 900, a researcher in a plain cloak talks with villagers beside a river, sketching on a wax tablet, simple stone village behind | Ekip sahada çalışıyor |
| `sahne-saha-sanayi.png` | Around 1900, a researcher takes a water sample from a dark river in a brass bottle, factory chimneys and workers in the background | Ekip sahada çalışıyor |
| `sahne-saha-modern.png` | Present day, a field team with a tablet and water sensor at a low river among dry fields, wind turbines far away | Ekip sahada çalışıyor |
| `sahne-gerilim-sanayi.png` | Around 1900, workers and townspeople argue at a factory gate with a manager, tense but no violence, smoky sky | Karar bedel doğuruyor, halk tepkili |
| `sahne-gerilim-modern.png` | Present day, residents with handmade blank signs face officials outside a town hall, tense but peaceful | Karar bedel doğuruyor, halk tepkili |
| `sahne-birlik-sanayi.png` | Around 1920, workers, farmers and a teacher agree around a wooden table in a lamp-lit union hall, shaking hands | İnsanlarla birlikte karar |
| `sahne-birlik-modern.png` | Present day, a neighbourhood assembly in a community hall, diverse people raising hands, plants and solar panels through the window | İnsanlarla birlikte karar |
| `sahne-yayilim-eski.png` | Around the year 1000, a camel caravan leaves a village at dawn carrying scrolls, a messenger waves toward the next valley | Bilgi komşu bölgelere taşınıyor |
| `sahne-yayilim-sanayi.png` | Around 1900, a steam train at a small station, people handing out printed pamphlets with no readable text | Bilgi komşu bölgelere taşınıyor |
| `sahne-yayilim-modern.png` | Present day, volunteers in several towns connected by a bus, a van and bicycles loaded with seed boxes and tools | Bilgi komşu bölgelere taşınıyor |
| `sahne-arsiv-eski.png` | Around the year 800, a candle-lit cave with clay tablets and scrolls on stone shelves, a keeper sealing the entrance | Bilgi güvene alınıyor |
| `sahne-arsiv-sanayi.png` | Around 1900, a quiet archive room with tall wooden shelves, a clerk hiding a ledger behind books | Bilgi güvene alınıyor |
| `sahne-arsiv-modern.png` | Present day, a modest underground data and seed vault, a technician closing a heavy door, cool light | Bilgi güvene alınıyor |
| `sahne-buyume-eski.png` | Around the year 1200, a thriving market town by a river, merchants funding a new granary under construction | Sermayeyle büyüme |
| `sahne-buyume-sanayi.png` | Around 1920, a wealthy patron visits a growing workshop with engineers and early solar and wind prototypes | Sermayeyle büyüme |
| `sahne-buyume-modern.png` | Present day, a large community-owned solar and wind farm under construction, investors and locals in hard hats | Sermayeyle büyüme |

Zaman azsa önce bu altısını yapın; oyunda en sık çıkanlar bunlar: `sahne-saha-sanayi`, `sahne-saha-modern`,
`sahne-gerilim-sanayi`, `sahne-gerilim-modern`, `sahne-birlik-sanayi`, `sahne-birlik-modern`.
