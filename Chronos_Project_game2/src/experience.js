// Oyuncuya yön veren metinler. Simülasyonu değiştirmez; sonuçları kayıtlardan okur.
globalThis.CP = globalThis.CP || {};
(() => {
  const region = (id) => CP.REGIONS.find((r) => r.id === id);
  CP.firstMission = (G) => {
    const m = CP.missionById('meclis');
    const role = CP.roleFor(G, m);
    return role && G.energy >= CP.eraCost(G, 430) ? { m, role, region: 'ana', year: 430, tutorial: true } : null;
  };

  CP.missionReason = (G, offer, id) => {
    const r = G.tl.final.regions[id];
    const low = (key, yes, no) => r[key] < 50 ? yes : no;
    const reasons = {
      vakif_sci: low('renew', 'Temiz enerji henüz yeterince yaygın değil. Uzun ömürlü araştırma birikimi bu açığı hedefler.', 'Temiz enerjideki kazanımı korumak için araştırmayı kuşaklara aktarabilirsin.'),
      vakif_res: 'Araştırmacı burada ölçüm yaparsa bölge verilerini kesin görürsün; diğer vakıfların kalıcılığına da destek olur.',
      vakif_edu: low('awareness', 'Çevre bilinci düşük. Bir okul, tüketim alışkanlıklarını bilgi yoluyla değiştirmeyi hedefler.', 'Mevcut çevre bilincini yeni kuşaklara aktarmak için bir okul kurabilirsin.'),
      gelenek: 'Bilginin günlük hayatta kalması gerekiyor. Gelenekler, ekolojik davranışları kültürün parçası yapmayı hedefler.',
      koruma: low('water', 'Su baskı altında. Havzayı korumak suyu, toprağı ve yaban hayatını birlikte destekler.', 'Yaşam alanlarını korumak, su ve toprak kaybına karşı uzun vadeli bir önlemdir.'),
      tohum: low('food', 'Gıda güvenliği kırılgan. Yerel tohumları saklamak kıtlık ve kötü hasat riskine karşı koruma sağlar.', 'Yerel tohum çeşitliliği, gelecekteki kötü hasatlara karşı bir güvencedir.'),
      tarim: low('soil', 'Toprak yıpranmış durumda. Tarım baskısını azaltmak suyu ve gıda üretimini de destekler.', 'Tarımın su ve toprak üzerindeki baskısını azaltarak mevcut verimi koruyabilirsin.'),
      akim: 'Tek bir kuruluşun ötesine ulaşmak için davranış değişikliğine ihtiyaç var. Kültür yayılmayı hızlandırır; yerel direnç yavaşlatır.',
      yasa: low('waste', 'Atık döngüsü zayıf. Çevre bütçesi ve atık kuralları, kirliliğin kaynağına müdahale eder.', 'Atık yönetimindeki kazanımı bütçe ve yasalarla destekleyebilirsin.'),
      ifsa: 'Savunmaya ayrılan kaynakları azaltmayı hedeflersin. İfşa toplumsal gerilimi artırabileceği için bunun da bir bedeli var.',
      mucit: 'Temiz teknoloji için yeni bir buluş yolu açabilirsin. Mucidi korumak, araştırmanın kaybolmasını önlemeyi hedefler.',
      kent: low('resilience', 'Kentlerin iklim direnci düşük. Su tutan zeminler ve gölge, sel ve sıcak dalgalarına karşı koruma sağlar.', 'Kentlerin direncini güçlendirerek sonraki iklim olaylarına hazırlanabilirsin.'),
      deniz: 'Plastik ve avlanma baskısı sınırları aşar. Yerel koruma ağı, küresel okyanus yükünü azaltmayı hedefler.',
      sifir: 'Atığı kaynağında azaltmak mümkün. Mahalle ölçeğinde kompost ve yeniden kullanım, toprağı da destekler.',
      enerji: low('renew', 'Temiz enerji payı düşük. Ortak güneş ve rüzgâr yatırımı fosil üretim baskısını azaltmayı hedefler.', 'Temiz enerjiyi ortak mülkiyetle yaygınlaştırarak mevcut dönüşümü güçlendirebilirsin.'),
      degistir: 'Bu olumsuz olay mevcut tarihte yaşandı. Hemen öncesine giderek doğrudan önlemeyi deneyebilirsin.',
    };
    return reasons[offer.m.id] || 'Bu görev bölgenin geleceğine müdahale eder; sonuç kararlarına ve tarihin akışına bağlıdır.';
  };

  CP.reportTracks = (G, rep) => {
    const before = CP.tracks(G, rep.before);
    // Yeni turdaki gemi/kart teknoloji bonusu geçmiş ölçüme sızmasın.
    // Diğer iki kol bonussuzdur; tur öncesi ortalama raporda zaten saklanır.
    before.tech = CP.clamp(rep.protoBefore * 3 - before.eco - before.peace);
    return { before, after: CP.tracks(G, rep.after) };
  };

  // Yalnız müdahale kimliğiyle ilişkilendirilmiş olaylar doğrudan iz olarak anlatılır.
  // Diğer dünya olayları nedensellik iddiasıyla bu zincire eklenmez.
  CP.reportStory = (rep) => {
    const id = rep.iv?.region || rep.region;
    const m = rep.iv?.mission && CP.missionById(rep.iv.mission);
    const name = id ? region(id).name : 'Dünya';
    const action = rep.extracted ? `${name} görevindeki ${CP.ROLES[rep.iv.role].name.toLocaleLowerCase('tr-TR')} gemiye döndü. Mirasın gücü azaldı.`
      : rep.card ? `${rep.card.name} kartını kullandın.`
      : m ? `${rep.iv.year} yılında ${name}: ${m.name}.` : 'Geçmişteki göreve yeni bir yön verdin.';
    const choices = rep.logs || [];
    const direct = rep.iv && !rep.extracted ? rep.after.log.filter((e) => e.iv === rep.iv.id) : [];
    const echoes = direct.filter((e) => e.kind === 'echo');
    const loss = direct.find((e) => e.kind === 'legacy');
    const traces = [...echoes.slice(0, 2), ...(loss ? [loss] : [])].sort((a, b) => a.y - b.y);
    const a = id ? rep.before.final.regions[id] : rep.before.final.global;
    const b = id ? rep.after.final.regions[id] : rep.after.final.global;
    const keys = [
      ['water', 'Su', false], ['bio', 'Yaban hayatı', false], ['soil', 'Toprak', false],
      ['food', 'Gıda güvenliği', false], ['renew', 'Temiz enerji', false], ['awareness', 'Bilinç', false],
      ['waste', 'Sıfır atık', false], ['resilience', 'Kent direnci', false], ['unrest', 'İsyan riski', true],
      ['military', 'Askeri bütçe', true], ['consumption', 'Tüketim', true],
    ];
    const changes = keys.map(([key, label, inverse]) => ({ key, label, inverse, a: a[key], b: b[key], d: b[key] - a[key] }))
      .filter((x) => Number.isFinite(x.d) && Math.abs(x.d) >= 0.5)
      .sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 3);
    return { action, choices, traces, changes, name, beforeYear: rep.before.final.y, afterYear: rep.after.final.y };
  };
})();
