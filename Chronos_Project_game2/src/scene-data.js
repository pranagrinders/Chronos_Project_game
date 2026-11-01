// Sinematik sunumun verileri: oyunun sonucuna karar vermez.
globalThis.CP = globalThis.CP || {};
(() => {
  const positive = {
    water: 'Su kaynakları desteklenir', bio: 'Yaban hayatı desteklenir', soil: 'Toprak desteklenir',
    food: 'Gıda güvenliği desteklenir', renew: 'Temiz enerji desteklenir', awareness: 'Bilgi daha çok insana ulaşır',
    culture: 'Yerel kültür güçlenir', tech: 'Teknoloji birikimi artar', env: 'Çevreye ayrılan kaynak artar',
    resilience: 'Kentlerin direnci artar', waste: 'Atık döngüsü güçlenir',
  };
  const pressure = { unrest: 'Toplumsal gerilim', military: 'Askeri baskı', consumption: 'Tüketim baskısı', industry: 'Sanayi baskısı', agri: 'Tarım baskısı', digital: 'Dijital enerji yükü', ocean: 'Okyanus yükü' };
  CP.choiceExplanation = (option) => {
    const gains = [], costs = [];
    if ((option.mult || 1) > 1) gains.push('Görevin etkisi güçlenir');
    if ((option.mult || 1) < 1) costs.push('Görevin etkisi biraz azalır');
    if (option.hz < 0) gains.push('Mirasın dağılma riski azalır');
    if (option.hz > 0) costs.push('Mirasın dağılma riski artar');
    if (option.grow) gains.push('Miras zamanla büyür');
    if (option.spread) gains.push('Etki komşu bölgelere ulaşır');
    if (option.early) costs.push('Erken teknoloji gerilim yaratabilir');
    for (const [key, value] of Object.entries(option.fx || {})) {
      if (!value) continue;
      if (positive[key]) (value > 0 ? gains : costs).push(value > 0 ? positive[key] : positive[key].replace('desteklenir', 'zayıflayabilir').replace('artar', 'azalabilir').replace('güçlenir', 'zayıflayabilir'));
      if (pressure[key]) (value < 0 ? gains : costs).push(pressure[key] + (value < 0 ? ' azalır' : ' artar'));
    }
    return { gains, costs, action: option.log, caveat: costs.length ? '' : 'Sonuç, görevin kalıcılığına ve tarihin akışına bağlı.' };
  };

  CP.choicePreview = (plan, option) => {
    const meaning = CP.choiceExplanation(option);
    const iv = { id: 'preview', mission: plan.m.id, role: plan.role, year: plan.year, choices: plan.choices || [], shield: plan.shield };
    const before = CP.legacyRisk(iv), after = CP.legacyRisk({ ...iv, choices: [...iv.choices, option] });
    const notes = [], reduced = after.total < before.total - 1e-10, increased = after.total > before.total + 1e-10;
    if (option.hz < 0 && !reduced) {
      meaning.gains = meaning.gains.filter((s) => s !== 'Mirasın dağılma riski azalır');
      notes.push(before.checks === 0 ? 'Bu çağdan 2070’e kadar dağılma riski oluşmuyor; ek kalıcılık fark yaratmıyor.' : 'Mirasın kalıcılığı zaten koruma sınırında; bu seçim ek kalıcılık sağlamıyor.');
    }
    if (option.hz > 0 && !increased) {
      meaning.costs = meaning.costs.filter((s) => s !== 'Mirasın dağılma riski artar');
      notes.push(before.checks === 0 ? 'Bu çağdan 2070’e kadar ek dağılma riski oluşmuyor.' : 'Önceki koruma kararları bu ek riski karşılıyor; toplam dağılma öngörüsü değişmiyor.');
    }
    return { ...meaning, caveat: meaning.costs.length ? '' : 'Sonuç, diğer kararlarına ve tarihin akışına da bağlı.', notes, before, after, reduced, increased };
  };

  CP.nextFocus = (G) => {
    if (G.tl.catastrophe) return { key: 'crisis', label: 'Önce felaketi önle', message: 'Tarih Kitabı’ndan felakete giden olayı seç; kalan sıçramanı onu önlemeye ayır.' };
    const tracks = CP.tracks(G);
    const key = Object.keys(CP.TRACKS).sort((a, b) => tracks[a] - tracks[b])[0];
    const messages = {
      tech: 'Temiz enerji ve bilim birikimini güçlendiren görevleri ara. Bilim Vakfı, bir mucidi korumak veya Enerji Kooperatifi bu kola destek olabilir.',
      eco: 'Su, toprak ve yaşam alanlarını destekleyen görevleri ara. Koruma Toprakları, Rejeneratif Tarım ve Sıfır Atık seçeneklerini incele.',
      peace: 'Askeri baskıyı ve toplumsal gerilimi azaltan görevleri ara. Bir araştırmacıyla savaş bütçesini ifşa etmek veya gerilimi azaltan kararlar almak bu kola destek olabilir.',
    };
    return { key, label: `${CP.TRACKS[key]} kolu geride`, message: messages[key], value: tracks[key] };
  };

  // Aynı mekânın iki temsili arasında karışım. Gerçek ölçümler UI'da ayrıca gösterilir.
  CP.sceneState = (snapshot, id = 'ana') => {
    const r = snapshot.regions[id];
    const health = (r.water + r.bio + r.soil) / 3;
    return {
      year: snapshot.y,
      protection: CP.clamp((health - 20) / 65, 0, 1),
      water: r.water, bio: r.bio, soil: r.soil, unrest: r.unrest,
      future: CP.clamp((snapshot.y - 1750) / 300, 0, 1),
      weather: health < 35 ? 'Kırılgan havza' : health < 60 ? 'Baskı altındaki havza' : 'Dirençli havza',
    };
  };
  CP.sceneReplay = (rep) => {
    const history = rep.after.history.filter((s) => s.y >= rep.iv.year);
    const traces = rep.after.log.filter((e) => e.iv === rep.iv.id).sort((a, b) => a.y - b.y);
    return { history, traces };
  };
})();
