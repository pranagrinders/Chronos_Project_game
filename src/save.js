// Küçük yerel kayıt: tarih şişkinliğini saklamak yerine seed + müdahalelerden yeniden kurar.
globalThis.CP = globalThis.CP || {};
(() => {
  const KEY = 'chronos.run.v1', BACKUP = 'chronos.run.previous.v1', VERSION = 1;
  const fields = ['seed', 'energy', 'crew', 'vets', 'ivs', 'hand', 'jumps', 'protoBonus', 'patch', 'nextId', 'doomed', 'over', 'offers', 'letters', 'lastLetter', 'orgs', 'lastOrg', 'shift', 'ach', 'lastRecruit'];
  const optionKey = (o) => o.t + '\n' + o.log;
  const options = new Map([
    ...CP.FIELD.flatMap((s) => s.opts), ...CP.MISSIONS.flatMap((m) => m.crisis.opts),
    ...CP.BLOCK_MISSION.crisis.opts, ...CP.FINALS.opts, ...CP.LETTERS.flatMap((l) => l.opts), ...CP.TUTORIAL_STAGES.flatMap((s) => s.opts),
  ].map((o) => [optionKey(o), o]));
  const regions = new Set(CP.REGIONS.map((r) => r.id));
  const cards = new Map(CP.CARDS.map((c) => [c.id, c]));
  const events = new Set(['war', ...CP.EVENTS.map((e) => e.id)]);
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const fail = () => { throw new Error('Kayıt bu oyun sürümüyle eşleşmiyor.'); };
  const finite = (n, low = 0, high = Number.MAX_SAFE_INTEGER) => Number.isFinite(n) && n >= low && n <= high;
  const integer = (n, low = 0) => Number.isSafeInteger(n) && n >= low;
  const year = (n) => Number.isSafeInteger(n) && n >= 430 && n <= 2070;
  CP.newSaveId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

  function restoreIntervention(iv) {
    if (!iv || typeof iv.id !== 'string' || !/^[dxco][1-9]\d*$/.test(iv.id) || !year(iv.year)) return fail();
    if (iv.kind === 'drop') {
      const m = CP.missionById(iv.mission);
      if (!m || !CP.ROLES[iv.role] || !m.roles.includes(iv.role) || !regions.has(iv.region)) return fail();
      if (m.from && (iv.year < m.from || iv.year > m.to)) return fail();
      if (!Array.isArray(iv.choices) || iv.choices.length < 3 || iv.choices.length > 5) return fail();
      const choices = iv.choices.map((o) => {
        if (!o || typeof o.t !== 'string' || typeof o.log !== 'string') return fail();
        const original = options.get(optionKey(o)); if (!original) return fail(); return copy(original);
      });
      if (iv.current && !CP.CURRENTS.some((c) => c.id === iv.current && iv.year >= c.from && iv.year <= c.to)) return fail();
      if (m.current && !iv.current) return fail();
      if (!m.current && iv.current) return fail();
      if (iv.extractedAt != null && iv.extractedAt !== iv.year + 30) return fail();
      if (iv.letters != null && (!integer(iv.letters) || iv.letters > 2)) return fail();
      if (!finite(iv.crack, 0, 100)) return fail();
      if (iv.block && (!events.has(iv.block.key) || !regions.has(iv.block.region) || !year(iv.block.y))) return fail();
      if ((m.id === CP.BLOCK_MISSION.id) !== !!iv.block || !iv.id.startsWith('d')) return fail();
      return { id: iv.id, kind: 'drop', year: iv.year, role: iv.role, region: iv.region, mission: iv.mission,
        choices, vet: !!iv.vet, current: iv.current || undefined, block: iv.block ? copy(iv.block) : null,
        crack: iv.crack, ...(iv.extractedAt != null ? { extractedAt: iv.extractedAt } : {}),
        ...(iv.letters != null ? { letters: iv.letters } : {}), ...(iv.shield ? { shield: true } : {}), ...(iv.power === 1.1 ? { power: 1.1 } : {}) };
    }
    if (iv.kind === 'card') {
      const c = cards.get(iv.card);
      if (!c || !(c.fx || c.fxAll || c.ocean) || c.year !== iv.year || (c.target && !regions.has(iv.region))) return fail();
      if (!iv.id.startsWith('c') || (iv.region != null && !regions.has(iv.region))) return fail();
      return { id: iv.id, kind: 'card', year: c.year, region: iv.region, fx: c.fx, fxAll: c.fxAll, ocean: c.ocean, spread: c.spread, card: c.id };
    }
    if (iv.kind === 'org') {
      const org = CP.ORGS.find((o) => o.key === iv.org), opt = org?.opts[iv.choice];
      if (!opt || !iv.id.startsWith('o') || iv.year !== 2030) return fail();
      return { id: iv.id, kind: 'org', year: 2030, org: org.key, choice: iv.choice, fxAll: CP.orgFx(opt), text: `${org.name}: ${opt.t}.` };
    }
    if (iv.kind === 'crack' && iv.id.startsWith('x') && finite(iv.crack, 0, 100)) return { id: iv.id, kind: 'crack', year: iv.year, crack: iv.crack };
    return fail();
  }

  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > 1000000) return fail();
    const record = JSON.parse(raw), d = record?.data;
    if (record.version !== VERSION || !d || typeof record.runId !== 'string' || record.runId.length > 100) return fail();
    if (typeof record.savedAt !== 'string' || !Number.isFinite(Date.parse(record.savedAt))) return fail();
    if (record.ui && typeof record.ui.guidedStart !== 'boolean') return fail();
    if (!Number.isSafeInteger(d.seed) || !finite(d.energy, 0, 100) || !finite(d.protoBonus) || !finite(d.patch, 0, 1)) return fail();
    for (const k of ['jumps', 'nextId', 'letters']) if (!integer(d[k], k === 'nextId' ? 1 : 0)) return fail();
    if (d.lastLetter != null && (!integer(d.lastLetter) || d.lastLetter > d.jumps)) return fail();
    for (const name of ['crew', 'vets']) for (const role of Object.keys(CP.ROLES)) if (!integer(d[name]?.[role])) return fail();
    for (const name of ['hand', 'offers']) if (!Array.isArray(d[name]) || d[name].length > 4 || d[name].some((id) => !cards.has(id))) return fail();
    if (typeof d.doomed !== 'boolean' || (d.over !== null && !Object.hasOwn(CP.ENDINGS, d.over))) return fail();
    if (!Array.isArray(d.ivs) || d.ivs.length > 256) return fail();
    const ivs = d.ivs.map(restoreIntervention), ids = new Set(ivs.map((iv) => iv.id));
    if (ids.size !== ivs.length || ivs.some((iv) => +iv.id.slice(1) >= d.nextId)) return fail();
    if (d.jumps !== ivs.filter((iv) => iv.kind === 'drop' || iv.kind === 'crack').length) return fail();
    if (d.orgs != null) for (const [key, c] of Object.entries(d.orgs)) if (!CP.ORGS.find((o) => o.key === key)?.opts[c]) return fail();
    if (d.lastRecruit != null && (!integer(d.lastRecruit) || d.lastRecruit > d.jumps)) return fail();
    if (d.lastOrg != null && (!integer(d.lastOrg) || d.lastOrg > d.jumps)) return fail();
    if (d.shift != null && (!Array.isArray(d.shift) || d.shift.length > 2 || d.shift.some((id) => !CP.SHIFTS.some((x) => x.id === id)))) return fail();
    if (d.ach != null) {
      const known = new Set(CP.achList().map((a) => a.id));
      if (!Array.isArray(d.ach) || d.ach.length > known.size || new Set(d.ach.map((x) => x?.id)).size !== d.ach.length) return fail();
      if (d.ach.some((x) => !known.has(x?.id) || (x.r != null && !regions.has(x.r)))) return fail();
    }
    const roleCounts = (r) => Object.fromEntries(Object.keys(CP.ROLES).map((k) => [k, r[k]]));
    return { ...record, data: { ...d, crew: roleCounts(d.crew), vets: roleCounts(d.vets), ivs } };
  }
  function pack(G) {
    const data = Object.fromEntries(fields.filter((k) => G[k] !== undefined).map((k) => [k, G[k]]));
    return JSON.stringify({ version: VERSION, runId: G.saveId || `seed-${G.seed}`, savedAt: new Date().toISOString(), ui: { guidedStart: G.tutorialGuided ?? G.jumps === 0 }, data });
  }
  function unpack(raw) {
    const r = parse(raw), G = CP.newGame(r.data.seed);
    for (const k of fields) if (r.data[k] !== undefined) G[k] = r.data[k];
    G.saveId = r.runId;
    G.tutorialGuided = r.ui?.guidedStart ?? G.jumps === 0;
    G.tl = CP.simulate(G.seed, G.ivs, { patch: G.patch });
    return G;
  }
  function inspect(storage) {
    try {
      const raw = (storage || globalThis.localStorage).getItem(KEY);
      if (!raw) return { status: 'none' };
      const r = parse(raw);
      return { status: 'ready', summary: { jumps: r.data.jumps, energy: r.data.energy, over: r.data.over, savedAt: r.savedAt } };
    } catch (e) { return { status: e.name === 'SecurityError' ? 'unavailable' : 'invalid' }; }
  }
  function write(G, storage) {
    try {
      const s = storage || globalThis.localStorage;
      G.saveId = G.saveId || CP.newSaveId();
      const raw = pack(G); parse(raw);
      const old = s.getItem(KEY);
      if (old) {
        let sameRun = false;
        try { sameRun = JSON.parse(old).runId === G.saveId; } catch (_) { /* Bozuk kayıt da yedekte korunur. */ }
        if (!sameRun) s.setItem(BACKUP, old);
      }
      s.setItem(KEY, raw);
      if (s.getItem(KEY) !== raw) throw new Error('Kayıt doğrulanamadı.');
      return { ok: true, savedAt: JSON.parse(raw).savedAt };
    } catch (_) { return { ok: false, message: 'Kayıt yapılamadı. Bu döngü şu an yalnız açık sekmede duruyor.' }; }
  }
  function read(storage) {
    try {
      const raw = (storage || globalThis.localStorage).getItem(KEY);
      if (!raw) return { ok: false, message: 'Devam edilecek bir kayıt yok.' };
      return { ok: true, game: unpack(raw), savedAt: JSON.parse(raw).savedAt };
    } catch (_) { return { ok: false, message: 'Kayıt açılamadı. Mevcut kayıt korunuyor; yeni döngü başlatabilirsin.' }; }
  }
  CP.store = { key: KEY, backupKey: BACKUP, pack, unpack, inspect, write, read };
})();
