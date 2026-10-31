# Chronos Project: Son Döngü

COP31 Oyun Hackathonu (GameUp Türkiye / HP) için geliştirilen 2D zaman yolculuğu ve kelebek etkisi stratejisi.

**Oynamak için:** `index.html` dosyasını tarayıcıda aç. Kurulum gerekmez.

| Dosya | Görev |
|---|---|
| `src/data.js` | Bölgeler, parametre bağlantıları, kartlar, sözler |
| `src/content.js` | Görevler, kararlar, akımlar, mektuplar, haberler |
| `src/sim.js` | Tarih simülasyonu: `simulate(seed, mudahaleler)` |
| `src/game.js` | Enerji, tim, görev, kart, mektup ve bitiş kuralları |
| `src/ui.js` | Harita, paneller, sıçrama akışı |
| `tools/balance.mjs` | Otomatik oynayıp dengeyi ölçen bot |

Harita verisi: Natural Earth (kamu malı).
