// Sahne tabanlı ilk görev. Kararlar ve sonuçlar mevcut oyun kurallarından gelir.
(() => {
  const root = document.createElement('section');
  root.id = 'cinema'; root.hidden = true; root.tabIndex = -1;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fast = new URLSearchParams(location.search).has('fast');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => Math.round(v);
  const decimal = (v) => v.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  let active = false, token = 0, leave = null, oldFocus = null;
  let muted = false;
  let readyImages = false;
  const urls = ['bridge', 'anatolia-430', 'anatolia-dry', 'anatolia-protected', 'researcher'];
  const images = urls.map((name) => { const img = new Image(); img.src = `assets/cinema/${name}.png`; return img; });
  Promise.all(images.map((img) => img.decode?.().catch(() => {}) || Promise.resolve())).then(() => { readyImages = true; });

  const sound = (mode = 'valley') => { if (!muted) CP.sceneAudio?.play(mode); };
  const stopSound = () => CP.sceneAudio?.stop();
  function setMuted(value) {
    muted = value; if (CP.story) { CP.story.muted = value; if (value) CP.story.stopVoice(); } CP.sceneAudio?.mute(value); if (muted) stopSound(); else if (active) sound(root.dataset.place === 'bridge' ? 'bridge' : 'valley');
    const b = $('#cSound'); if (b) { b.textContent = muted ? 'Ses kapalı' : 'Ses açık'; b.setAttribute('aria-pressed', String(!muted)); }
    document.dispatchEvent(new CustomEvent('chronos-sound', { detail: { muted } }));
  }
  const tone = () => CP.sceneAudio?.cue('click');
  root.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.id !== 'cConfirm') tone(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSound(); else if (active && !muted && CP.sceneAudio?.initialized) sound(root.dataset.place); });

  addEventListener('pagehide', () => CP.sceneAudio?.dispose());
  addEventListener('pageshow', (e) => { if (e.persisted && active && !muted) sound(root.dataset.place); });

  const brand = '<div class="cBrand">CHRONOS PROJECT<span>SON DÖNGÜ</span></div>';
  const particles = () => `<div class="cMotes">${Array.from({ length: reduced ? 0 : 18 }, (_, i) => `<i style="--x:${CP.hash01('x', i) * 100}%;--delay:${-CP.hash01('d', i) * 20}s;--life:${12 + CP.hash01('l', i) * 15}s"></i>`).join('')}</div>`;
  const background = (bridge = false) => `<div class="cBack" aria-hidden="true"><div class="cArt">${bridge ? '<img class="cBridge" src="assets/cinema/bridge.png" alt="">' : '<img class="cPast" src="assets/cinema/anatolia-430.png" alt=""><img class="cDry" src="assets/cinema/anatolia-dry.png" alt=""><img class="cProtected" src="assets/cinema/anatolia-protected.png" alt=""><div class="cRiverShimmer"></div>'}</div><div class="cFog"></div>${particles()}<div class="cShade"></div></div>`;
  const tools = (allowExit = true, exitLabel = 'Komutaya dön', extra = '') => `<div class="cTools"><button id="cSound" aria-pressed="${!muted}">${muted ? 'Ses kapalı' : 'Ses açık'}</button>${allowExit ? `<button id="cExit">${exitLabel} <span aria-hidden="true">↗</span></button>` : ''}${extra}</div>`;
  // İlk görev rehberi: her ekranda oyuncunun yerini, işini ve kalan adımları söyler.
  const guideSteps = ['Görevi al', 'Geçmişe git', '3 karar ver', 'Tarihi izle', 'Sonucu gör'];
  const guide = (step, where, now) => `<nav class="tGuide" aria-label="İlk görev rehberi"><div class="tWhere"><span>NEREDESİN</span><b>${esc(where)}</b></div><div class="tNow"><span>ŞİMDİ</span><b>${esc(now)}</b></div><ol>${guideSteps.map((name, i) => `<li class="${i < step ? 'done' : i === step ? 'current' : ''}"${i === step ? ' aria-current="step"' : ''}>${name}</li>`).join('')}</ol></nav>`;
  function mount(html, mode, onExit) {
    token++;
    CP.story?.stopVoice();
    CP.sceneAudio?.cancelCues();
    if (!active) oldFocus = document.activeElement;
    active = true; leave = onExit; root.hidden = false; root.dataset.mode = mode; root.dataset.place = ['intro', 'prologue', 'travel', 'home'].includes(mode) ? 'bridge' : 'valley'; root.dataset.guide = html.includes('class="tGuide"') ? 'on' : 'off';
    delete root.dataset.preview; root.style.setProperty('--transit', '0');
    document.querySelector('#app').inert = true; document.querySelector('#app').setAttribute('aria-hidden', 'true');
    root.style.setProperty('--future', '0'); root.style.setProperty('--protection', '0'); root.style.setProperty('--green-opacity', '0'); root.style.setProperty('--journey', '0');
    root.innerHTML = html;
    root.scrollTop = 0;
    CP.hud?.refresh(); CP.hud?.attach(root); CP.hud?.setVisible(mode !== 'intro' && mode !== 'prologue');
    const title = $('h1, h2'); if (title) { title.id = 'cinemaTitle'; root.setAttribute('aria-labelledby', title.id); }
    else root.setAttribute('aria-label', 'Zaman yolculuğu');
    CP.story?.bindVoices(root);
    root.focus();
    $('#cSound')?.addEventListener('click', () => setMuted(!muted));
    $('#cExit')?.addEventListener('click', () => { if (leave) leave(); });
  }
  function close() {
    CP.story?.stopVoice(); token++; active = false; leave = null; root.hidden = true; stopSound();
    document.querySelector('#app').inert = false; document.querySelector('#app').removeAttribute('aria-hidden');
    CP.hud?.attach(); CP.hud?.setVisible(true);
    const target = oldFocus?.isConnected && oldFocus !== document.body && !oldFocus.disabled && !oldFocus.closest('[hidden],.hidden,[inert]') ? oldFocus
      : document.querySelector('#btnJump:not(:disabled)') || document.querySelector('#btnBridge:not(:disabled):not([hidden])') || document.querySelector('#btnBook:not(:disabled)');
    target?.focus();
  }
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && leave) { e.preventDefault(); leave(); return; }
    if (root.dataset.mode === 'prologue' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); $(e.key === 'ArrowRight' ? '#cProNext' : '#cProBack')?.click(); return; }
    if (e.key !== 'Tab') return;
    const buttons = [...root.querySelectorAll('button:not(:disabled),input,summary')].filter((e) => !e.hidden);
    if (!buttons.length) { e.preventDefault(); return; }
    if (e.shiftKey && (document.activeElement === buttons[0] || document.activeElement === root)) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
    else if (!e.shiftKey && (document.activeElement === buttons[buttons.length - 1] || document.activeElement === root)) { e.preventDefault(); buttons[0].focus(); }
  });
  function showState(snapshot, id = 'ana') {
    const state = CP.sceneState(snapshot, id);
    root.style.setProperty('--future', String(state.future)); root.style.setProperty('--protection', String(state.protection)); root.style.setProperty('--green-opacity', String(state.future * state.protection));
    return state;
  }
  const metric = (name, value, suffix = '') => `<div class="cMetric"><span>${name}</span><b>${num(value)}${suffix}</b></div>`;
  const researcher = (line, person = 'leyla') => CP.story ? CP.story.dialogue(person, line) : `<aside class="cResearcher"><img src="assets/cinema/researcher.png" alt=""><div><span>ALAN ARAŞTIRMACISI</span><p>${esc(line)}</p></div></aside>`;
  function intro(G, onGuide, resume = {}) {
    const saved = resume.summary;
    mount(`${background(true)}<header class="cHeader">${brand}${tools(false)}</header>
      <div class="cIntroCopy"><p class="cKicker"><i></i> YIL 2070 · TEMPORAL SHIFT</p><h1>Gelecek,<br>geçmişte<br><em>başlar.</em></h1>
      <p class="cSynopsis">Dünya ölüyor.<br>Onu kurtarmanın tek yolu, geçmişe dönmek.</p>
      ${saved ? `<p class="cSaveSummary">KAYITLI DÖNGÜ · ${saved.jumps} sıçrama · %${num(saved.energy)} enerji</p>` : ''}
      ${resume.notice ? `<p class="cSaveNote">${esc(resume.notice)}</p>` : ''}
      <button class="cPrimary" id="cBegin">${saved ? saved.over ? 'Son döngüyü gör' : 'Döngüye devam et' : 'Oyuna başla'} <span aria-hidden="true">→</span></button>
      ${saved ? '<button class="cText" id="cNewRun">Yeni döngüye başla</button>' : ''}</div>`, 'intro', null);
    root.dataset.hasSave = String(!!saved);
    root.dataset.hasNotice = String(!!resume.notice);
    $('#cBegin').onclick = () => { sound('bridge'); if (saved) resume.onResume(); else onGuide(); };
    if ($('#cNewRun')) $('#cNewRun').onclick = () => { sound('bridge'); onGuide(); };
  }
  // Açılış hikâyesi: kısa kartlar, aynı vadinin 2070 ve 430 hâli arasında geçiş.
  function prologue(onDone) {
    if (fast) return onDone();
    const scenes = CP.story.prologue, names = { city: 'bridge', bridge: 'bridge', core: 'bridge', dry: 'anatolia-dry', past: 'anatolia-430' };
    mount(`<div class="cBack pArt" aria-hidden="true">${Object.entries(names).map(([art, file]) => `<img data-art="${art}" src="assets/cinema/${file}.png" alt="">`).join('')}<div class="pCore"></div><div class="pFlash"></div><div class="pShade"></div></div>
      <header class="cHeader">${brand}${tools(false, '', '<button id="cStorySkip">Hikâyeyi atla <span aria-hidden="true">→</span></button>')}</header>
      <section class="pCopy" id="cProCopy" aria-live="polite"></section>
      <div class="pControls"><button class="cText" id="cProBack">← Geri</button><div class="pPips" aria-hidden="true">${scenes.map(() => '<i></i>').join('')}</div><button class="cPrimary" id="cProNext"></button></div>`, 'prologue', null);
    let at = -1;
    const show = (index) => {
      const scene = scenes[index], forward = index > at; at = index;
      root.querySelectorAll('.pArt [data-art]').forEach((img) => img.classList.toggle('on', img.dataset.art === scene.art));
      $('.pCore').classList.toggle('on', scene.art === 'core');
      root.dataset.scene = scene.art;
      const place = scene.art === 'dry' || scene.art === 'past' ? 'valley' : 'bridge';
      if (root.dataset.place !== place) { root.dataset.place = place; sound(place); }
      if (scene.jump && forward && !reduced) { const flash = $('.pFlash'); flash.classList.remove('run'); void flash.offsetWidth; flash.classList.add('run'); CP.sceneAudio?.cue('travel'); }
      $('#cProCopy').innerHTML = `${scene.person ? `<img class="pPerson" src="assets/cinema/${scene.person}" alt="Leyla Aras, kurmaca oyun karakteri">` : ''}<p class="cKicker">${esc(scene.kicker)}</p><h2 id="cinemaTitle">${esc(scene.title)}</h2>${scene.text.map((t) => `<p>${esc(t)}</p>`).join('')}${scene.items ? `<ul class="pItems">${scene.items.map(([name, note]) => `<li><b>${esc(name)}</b><span>${esc(note)}</span></li>`).join('')}</ul>` : ''}`;
      root.setAttribute('aria-labelledby', 'cinemaTitle');
      root.querySelectorAll('.pPips i').forEach((pip, i) => pip.classList.toggle('on', i <= index));
      $('#cProBack').hidden = index === 0;
      $('#cProNext').innerHTML = `${index === scenes.length - 1 ? 'Görevi al' : 'Devam'} <span aria-hidden="true">→</span>`;
      $('#cProNext').focus();
    };
    let finished = false;
    const finish = () => { if (!finished) { finished = true; onDone(); } };
    $('#cProNext').onclick = () => (at === scenes.length - 1 ? finish() : show(at + 1));
    $('#cProBack').onclick = () => { if (at > 0) show(at - 1); };
    $('#cStorySkip').onclick = finish;
    show(0);
  }
  function home(G, onPlan, onMap, onBook, saveNote = '') {
    const focus = CP.nextFocus(G), tracks = CP.tracks(G);
    const crew = Object.values(G.crew).reduce((a, b) => a + b, 0);
    const drops = G.ivs.filter((i) => i.kind === 'drop');
    const lastDrop = drops[drops.length - 1];
    const legacyLost = lastDrop && G.tl.log.some((e) => e.kind === 'legacy' && e.iv === lastDrop.id);
    const legacyStatus = legacyLost ? 'Mirası dağıldı' : lastDrop?.extractedAt ? 'Uzman geri alındı' : 'Kuruluşun mirası sürüyor';
    mount(`${background(true)}<header class="cHeader">${brand}${tools(true, 'Haritaya geç')}</header>
      <div class="cLocation"><span>TEMPORAL SHIFT / KOMUTA GÜVERTESİ</span><strong>2070</strong><small>SIÇRAMA ${G.jumps}</small></div>
      <div class="cHomeCopy"><p class="cKicker">${G.jumps ? 'SEFER KAYDI GÜNCELLENDİ' : 'BİR SONRAKİ KARAR SENİN'}</p>
      <h2>${G.jumps ? 'İzin geleceğe<br>ulaştı.' : 'Geçmiş seni<br>bekliyor.'}</h2>
      ${G.jumps === 1 ? '<p class="cHomeFirst">İlk görev bitti, artık serbestsin. Sıradaki görevin yerini, çağını ve uzmanını sen seçeceksin.</p>' : ''}
      <div class="cHomeMetrics">${metric('Çekirdek enerjisi', G.energy, '%')}${metric('Gemideki ekip', crew)}${metric('Geçmişteki kuruluş', drops.length)}</div>
      <div class="cNextFocus"><b>${esc(focus.label)}</b><p>${esc(focus.message)}</p></div>
      ${saveNote ? `<p class="cSaveNote">${esc(saveNote)}</p>` : ''}
      <button class="cPrimary" id="cPlanNext">${G.jumps === 0 ? 'Bir görev planla' : 'Sonraki görevi planla'} <span aria-hidden="true">→</span></button>
      <button class="cText" id="cMap">Dünya haritasını aç</button></div>
      <aside class="cHomeState"><p class="cKicker">İKİNCİ PROTOTİP</p><h3>Üç kol, tek gelecek.</h3><div class="cTracks">${Object.entries(CP.TRACKS).map(([k, n]) => `<div><span>${n}</span><b>%${num(tracks[k])}</b></div>`).join('')}</div>
      <p class="cHomeHint">Her kol %100 olduğunda ikinci prototip tamamlanır. Enerjin ve ekibin bitmeden üçünü birlikte ilerlet.</p>
      ${lastDrop ? `<div class="cHomeLegacy"><span>SON BIRAKTIĞIN KURULUŞ</span><b>${esc(CP.missionById(lastDrop.mission).name)}</b><p>${lastDrop.year} · ${esc(CP.REGIONS.find((r) => r.id === lastDrop.region).name)}</p><small>${legacyStatus}</small></div>` : ''}
      <button class="cText" id="cBook">Tarih Kitabı’nı aç ↗</button></aside>
      <footer class="cSceneFoot"><span>GÖREVLER ARASINDA / KOMUTA MERKEZİ</span><span>Dünya Nabzı, vardiya ve kartlar harita ekranında.</span></footer>`, 'home', onMap);
    $('#cPlanNext').onclick = onPlan; $('#cMap').onclick = onMap; $('#cBook').onclick = onBook; sound('bridge');
  }
  function briefing(G, plan, onStart, align) {
    const water = num(G.tl.final.regions.ana.water);
    mount(`${background()}<header class="cHeader">${brand}${tools(false)}</header>
      <div class="cBriefCopy"><p class="cKicker">İLK GÖREV · SUYUN İZİ</p><h2>Su Meclisi’ni kur.</h2>
      <p>2070’te Kızılırmak havzasının suyu <b>100 üzerinden ${water}</b>. Karbonu 430’dan düzeltemezsin; o iş sanayi çağında. Ama suyu paylaşma kültürünü <b>M.S. 430</b>’da başlatabilirsin.</p>
      <ol class="cBriefSteps"><li>Leyla’yı 430 yılına bırakırsın.</li><li>Leyla çoban ve çiftçilerle bir Su Meclisi kurar. Zor anlarda <b>üç kararı sen verirsin</b>.</li><li>Kural kuşaktan kuşağa geçer. Tarih 2070’e akar, suya ne olduğunu görürsün.</li></ol>
      <div class="cMissionFacts"><span><small>GİDECEĞİN YIL</small>M.S. 430</span><span><small>GİDEN KİŞİ</small>Leyla, araştırmacı</span><span><small>BEDEL</small>20 enerji</span></div>
      <button class="cPrimary" id="cTravel">M.S. 430’a git <span aria-hidden="true">↗</span></button></div>
      <div class="cBriefLeyla">${researcher('Komutan, ben Leyla. Nehri çitle koruyamam; çit 1640 yıl dayanmaz. Ama suyu paylaşma kuralı dayanabilir. Beni 430’a bırak, zor anlarda kararı sana soracağım.')}<p class="cHudNote">Üstteki şeritte enerjin, gemideki ekibin ve üç hedefin var. Üçü de %100 olunca ikinci makine tamamlanır.</p></div>
      ${guide(0, '2070 · Gemide', 'Görevi oku, sonra geçmişe git.')}`, 'briefing', null);
    showState(G.tl.final); sound('valley');
    $('#cTravel').onclick = () => (align ? align(() => travel(onStart)) : travel(onStart));
  }
  function travel(onArrive) {
    if (fast || reduced) return onArrive();
    mount(`${background(true)}<div class="cBack" aria-hidden="true"><div class="cTravelTarget"></div></div><header class="cHeader">${brand}${tools(false)}</header>
      <div class="cTravelLabel"><p class="cKicker">ZAMANDA GERİ GİDİYORSUN · 1640 YIL</p><h2>M.S. 430</h2><p>Kızılırmak kıyısı, Anadolu</p></div>
      <footer class="cSceneFoot"><span>2070’TEN AYRILIYORSUN</span><button class="cText" id="cSkipTravel">Geçişi atla →</button></footer>`, 'travel', null);
    const travelToken = token, start = performance.now(); let done = false;
    const arrive = () => { if (done || token !== travelToken) return; done = true; onArrive(); };
    $('#cSkipTravel').onclick = arrive;
    function tick(now) {
      if (done || token !== travelToken) return;
      const p = Math.min(1, (now - start) / 2800);
      root.style.setProperty('--transit', String(p));
      if (p < 1) requestAnimationFrame(tick); else arrive();
    }
    sound('bridge'); CP.sceneAudio?.cue('travel'); requestAnimationFrame(tick);
  }
  function stage(G, plan, index, onChoose, onCancel) {
    const step = plan.stages[index], story = CP.story, labels = ['İlk temas', 'Birlikte yaşamak', 'Senden sonra'];
    const speaker = story.stageSpeaker(plan, index), line = story.stageLine(plan, index);
    const prior = plan.choices.length ? `<p class="cPrevious">Önceki kararın: ${esc(plan.choices.at(-1).t)}</p>` : '';
    mount(`${background(!plan.tutorial)}<header class="cHeader">${brand}${tools(true, plan.tutorial ? 'Brifinge dön' : 'Hazırlığa dön')}</header>
      <div class="storyDecisionShell"><section class="storyConversation"><p class="cKicker">${esc(CP.regionName(plan.region, plan.year))} · ${plan.year < 1000 ? 'M.S. ' : ''}${plan.year} · KARAR ${index + 1} / 3</p>
      <h2>${esc(step.title)}</h2>${researcher(line, speaker)}${prior}<p class="storyInstruction">${plan.tutorial ? 'Bir yolu seç. Ne olacağını yanda gör, sonra onayla.' : 'Bir yolu seç. Ekibin ne yapacağını gör, sonra onayla.'}</p>
      <div class="cChoices storyOptions" role="group" aria-label="${esc(step.title)} için yollar">${step.opts.map((o, i) => `<button class="cChoice" data-choice="${i}" aria-pressed="false"><img src="assets/cinema/${story.visual(o, plan).image}" alt="${esc(story.visual(o, plan).caption)}"><span class="storyOptionText"><span class="cChoiceNum">0${i + 1}</span><h3>${esc(o.t)}</h3><span>${esc(story.tutorialHint(plan, index, o) || CP.fill(o.log, plan.region, plan.year) + '.')}</span></span><span class="cChoiceArrow" aria-hidden="true">→</span></button>`).join('')}</div></section>
      <section class="storyPreview" aria-label="Seçtiğin yolun açıklaması"><div id="cChoiceVisual"><div class="storyArt storyWaiting"><img src="assets/cinema/${plan.tutorial ? 'anatolia-430' : 'bridge'}.png" alt="Görevin temsili sahnesi"><span>Önce bir yol seç.</span></div></div><div id="cChoiceDetails" aria-live="polite"><p class="cKicker">${labels[index]}</p><h3>Ne yapmamızı istiyorsun?</h3><p>Seçeneklerden birine dokunduğunda uygulayacağımız eylemi, faydasını ve bedelini burada göreceksin.</p></div>
      <button class="cPrimary" id="cConfirm" disabled>Önce bir yol seç</button><p class="storyCommitNote">${index < 2 ? 'Bu adım yalnız hazırlık. Enerji henüz harcanmaz.' : `Bu son kararı onaylayınca ${decimal(CP.jumpCost(G, plan))} enerji harcanır; 1 ${CP.ROLES[plan.role].name.toLocaleLowerCase('tr-TR')} geçmişte kalır.`}</p></section></div>
      ${plan.tutorial ? guide(2, 'M.S. 430 · Kızılırmak kıyısı', `${['Leyla yeni vardı.', 'Bölge halkı tepkili.', 'Leyla yaşlandı.'][index]} ${index + 1}. kararı ver.`) : `<footer class="cSceneFoot"><span>${index < 2 ? 'HAZIRLIK · HENÜZ ENERJİ HARCANMADI' : `${decimal(CP.jumpCost(G, plan))} ENERJİ · 1 UZMAN`}</span><span>Canlandırma eylemi anlatır. Sonucu tarih belirler.</span></footer>`}`, 'decision', onCancel);
    sound(plan.tutorial ? 'valley' : 'bridge');
    if (index === 0) CP.sceneAudio?.cue('arrival');
    let selected = null, cancelArt = () => {}, committed = false;
    const plain = (text) => plan.tutorial ? text.replace('Mirasın dağılma riski', 'Zamanla unutulma riski') : text;
    root.querySelectorAll('[data-choice]').forEach(button => {
      button.onclick = () => {
        selected = step.opts[+button.dataset.choice];
        root.querySelectorAll('[data-choice]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        const meaning = CP.choicePreview(plan, selected);
        $('#cChoiceVisual').innerHTML = story.art(selected, plan); cancelArt(); cancelArt = story.animateArt($('#cChoiceVisual .storyArt'));
        $('#cChoiceDetails').innerHTML = `<p class="cKicker">EKİBİN YAPACAĞI</p><h3>${esc(selected.t)}</h3><p class="cChoiceAction">${esc(story.choiceLead(selected, meaning))}</p><div class="storyTradeoffs"><div class="cChoiceEffect"><b>NE KAZANIRIZ?</b><ul>${(meaning.gains.length ? meaning.gains : ['Görevin devamını destekler.']).map(g => `<li>${esc(plain(g))}</li>`).join('')}</ul></div><div class="cChoiceCost"><b>NEYE MAL OLUR?</b><ul>${(meaning.costs.length ? meaning.costs : [meaning.caveat]).map(g => `<li>${esc(plain(g))}</li>`).join('')}</ul></div></div>
        ${meaning.notes.map(n => `<p class="cChoiceNote">${esc(n)}</p>`).join('')}<details class="storyRisk"><summary>${plan.tutorial ? 'Bu iz 2070’e kadar yaşar mı?' : 'Kalıcılık öngörüsü'}</summary><p class="cLegacyForecast">${CP.YEARS.end}’e kadar dağılma öngörüsü ≈%${decimal(meaning.before.total * 100)} → ≈%${decimal(meaning.after.total * 100)}. Gerçekleşecek sonucu söylemez.</p></details>`;
        $('#cConfirm').disabled = false; $('#cConfirm').textContent = index === 2 ? 'Bu yolu uygula ve tarihi gör →' : 'Bu kararı onayla →';
        CP.sceneAudio?.cue('select');
        if (matchMedia('(max-width: 999px)').matches) $('#cChoiceVisual').scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      };
    });
    $('#cConfirm').onclick = () => {
      if (!selected || committed) return;
      committed = true; cancelArt(); CP.story.stopVoice();
      root.querySelectorAll('[data-choice],#cConfirm').forEach(b => { b.disabled = true; });
      onChoose(selected); CP.sceneAudio?.cue('confirm');
    };
  }
  function replay(G, rep, onDone) {
    const sequence = CP.sceneReplay(rep), duration = fast || reduced ? 80 : 10500;
    mount(`${background()}<header class="cHeader">${brand}${tools(false)}</header>
      <div class="cJourneyCopy"><p class="cKicker">TARİH YENİDEN YAZILIYOR</p><h2>Bir karar,<br>yüzyıllar süren bir iz.</h2></div>
      <div class="cYear"><b id="cYear">430</b><span>ANADOLU / KIZILIRMAK HAVZASI</span></div>
      <div class="cTimeline"><i id="cTimeFill"></i><span>430</span><span>1880</span><span>1970</span><span>${rep.after.final.y}</span></div>
      <p id="cTrace" class="cTrace" aria-live="polite">Kurduğun kuruluşun ilk yılları…</p>
      <div class="cReplayMetrics" id="cReplayMetrics"></div>
      <footer class="cSceneFoot"><span></span><button class="cText" id="cSkip">Sonucu gör →</button></footer>
      ${guide(3, 'Zaman akıyor · 430 → 2070', 'Sadece izle. Kararlarının yüzyıllar içindeki etkisi bu.')}`, 'replay', null);
    const currentToken = token; let ended = false;
    const finish = () => { if (ended || currentToken !== token) return; ended = true; onDone(); };
    $('#cSkip').onclick = finish;
    const start = performance.now(); let lastIndex = -1;
    function tick(now) {
      if (ended || currentToken !== token) return;
      const progress = Math.min(1, (now - start) / duration);
      const index = Math.min(sequence.history.length - 1, Math.floor(progress * sequence.history.length));
      root.style.setProperty('--journey', String(progress));
      $('#cTimeFill').style.width = progress * 100 + '%';
      if (index !== lastIndex) {
        lastIndex = index;
        const snap = sequence.history[index], state = showState(snap, rep.iv.region);
        $('#cYear').textContent = snap.y;
        const trace = [...sequence.traces].reverse().find((e) => e.y <= snap.y);
        const caption = trace ? `${trace.y} · ${trace.text}` : 'Kuruluşun mirası, tarih boyunca etkisini arıyor…';
        if ($('#cTrace').textContent !== caption) $('#cTrace').textContent = caption;
        $('#cReplayMetrics').innerHTML = metric('Su', state.water) + metric('Yaban hayatı', state.bio) + metric('Toprak', state.soil);
      }
      if (progress < 1) requestAnimationFrame(tick); else finish();
    }
    sound('valley'); requestAnimationFrame(tick);
  }
  function result(G, rep, onContinue, onDetails) {
    const story = CP.reportStory(rep), tracks = CP.reportTracks(G, rep), localBefore = rep.before.final.regions.ana, localAfter = rep.after.final.regions.ana;
    const focus = CP.nextFocus(G);
    const deltas = [localAfter.water - localBefore.water, localAfter.bio - localBefore.bio, localAfter.soil - localBefore.soil,
      localBefore.unrest - localAfter.unrest, ...Object.keys(CP.TRACKS).map((k) => tracks.after[k] - tracks.before[k])];
    const hasGain = deltas.some((d) => d >= 0.5), hasLoss = deltas.some((d) => d <= -0.5);
    const title = hasGain && hasLoss ? 'Tarih, bedelleriyle değişti.' : hasGain ? 'Geçmişte bıraktığın iz.' : hasLoss ? 'Her iz, iyileşme getirmiyor.' : 'Tarih sessiz kaldı.';
    const trace = story.traces.length ? story.traces[story.traces.length - 1] : null;
    const cards = G.offers.map((id) => CP.CARDS.find((c) => c.id === id));
    mount(`${background()}<header class="cHeader">${brand}${tools(false)}</header>
      <div class="cLocation"><span>KIZILIRMAK HAVZASI</span><strong id="cCompareYear">${rep.after.final.y}</strong><small id="cCompareLabel">SENİN ZAMAN ÇİZGİN</small></div>
      <div class="cResultCopy"><p class="cKicker">İLK SIÇRAMA TAMAMLANDI</p><h2>${title}</h2><p>${esc(trace ? trace.text : 'Ayrı bir tarihsel yankı kaydedilmedi. Önceki ve yeni çizginin ölçümlerini karşılaştır.')}</p>
      <p class="cResultExplain"><b>Önceki çizgi:</b> sen gitmeden önceki 2070. <b>Senin çizgin:</b> kararlarından sonraki 2070.</p><div class="cCompare" role="group" aria-label="Zaman çizgisi karşılaştırması"><button id="cBefore" aria-pressed="false">Önceki çizgi</button><button class="selected" id="cAfter" aria-pressed="true">Senin çizgin</button></div>
      <div id="cResultMetrics" class="cResultMetrics"></div>
      <div id="cTension" class="cTension"></div>
      <p class="cArtNote">Görseller havza durumunun temsili canlandırmasıdır. Sayılar gerçek oyun ölçümleridir.</p></div>
      <aside class="cDebrief"><p class="cKicker">GEMİYE DÖNMEDEN ÖNCE</p><h3>Bir sonraki adımın.</h3><p>Teknoloji, Ekosistem ve Barış’ın üçü de %100’e ulaşmalı. Geride kalan kolu sonraki görevinle destekle.</p>
      <div class="cTracks">${Object.entries(CP.TRACKS).map(([k, name]) => `<div><span>${name}</span><b>%${num(tracks.before[k])} <i>→</i> %${num(tracks.after[k])}</b></div>`).join('')}</div>
      ${rep.resources ? `<div class="cEnergyLedger"><span>BU SIÇRAMANIN ENERJİSİ</span><b>${decimal(rep.resources.energyBefore)} → ${decimal(rep.resources.energyAfter)}</b><p>−${decimal(rep.resources.spent)} sıçrama · +${decimal(rep.resources.recovered)} ikmal</p>${rep.resources.shipResearch ? `<small>Gemideki araştırma: +${decimal(rep.resources.shipResearch)} teknoloji bonusu.</small>` : ''}</div>` : ''}
      <div class="cNextFocus"><b>${esc(focus.label)}</b><p>${esc(focus.message)}</p></div>
      <p class="cCardLabel">Bir destek kartı seç · sonraki görevlerde kullanırsın</p><div class="cRewardCards">${cards.map((c) => `<button data-reward="${c.id}" ${G.hand.length >= 4 ? 'disabled' : ''}><b>${esc(c.name)}</b><span>${esc(c.desc)}</span></button>`).join('')}</div>
      <button class="cPrimary" id="cContinue">Komuta merkezine dön <span aria-hidden="true">→</span></button><button class="cText" id="cDetails">Karar zincirini ve tüm ölçümleri aç</button></aside>
      ${guide(4, '2070 · Gemiye döndün', 'İki 2070’i karşılaştır, sonra kartını seç.')}`, 'result', null);
    const renderMetrics = (before) => {
      showState(before ? rep.before.final : rep.after.final);
      const r = before ? localBefore : localAfter;
      $('#cCompareYear').textContent = before ? rep.before.final.y : rep.after.final.y;
      $('#cCompareLabel').textContent = before ? 'ÖNCEKİ ZAMAN ÇİZGİSİ' : 'SENİN ZAMAN ÇİZGİN';
      $('#cResultMetrics').innerHTML = [['water', 'Su'], ['bio', 'Yaban hayatı'], ['soil', 'Toprak']].map(([k, n]) => `<div class="cMetric"><span>${n}</span><b>${num(r[k])}<small>/100</small></b><em>${num(localBefore[k])} → ${num(localAfter[k])}</em></div>`).join('');
      $('#cTension').innerHTML = `<span>Toplumsal gerilim</span><b>${num(r.unrest)}<small>/100</small></b><em>${num(localBefore.unrest)} → ${num(localAfter.unrest)}</em>`;
      $('#cTension').classList.toggle('hasCost', localAfter.unrest - localBefore.unrest >= 0.5);
      $('#cBefore').setAttribute('aria-pressed', String(before)); $('#cAfter').setAttribute('aria-pressed', String(!before));
      $('#cBefore').classList.toggle('selected', before); $('#cAfter').classList.toggle('selected', !before);
    };
    $('#cBefore').onclick = () => renderMetrics(true); $('#cAfter').onclick = () => renderMetrics(false);
    root.querySelectorAll('[data-reward]').forEach((b) => { b.onclick = () => { root.querySelectorAll('[data-reward]').forEach((x) => { x.disabled = true; }); onContinue(b.dataset.reward); }; });
    $('#cContinue').onclick = () => onContinue(null); $('#cDetails').onclick = onDetails;
    renderMetrics(false); sound('valley'); CP.sceneAudio?.cue(hasLoss ? 'caution' : hasGain ? 'positive' : 'neutral');
  }
  CP.cinema = { intro, prologue, home, briefing, stage, replay, result, close, setMuted, get active() { return active; }, get ready() { return readyImages; } };
})();
