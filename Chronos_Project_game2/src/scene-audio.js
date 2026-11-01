// Sahnenin prosedürel sesi. Harici dosya/API yok; kullanıcı etkileşimiyle başlar.
globalThis.CP = globalThis.CP || {};
(() => {
  let ctx = null, bus = null, hum = null, air = null, timer = null, muted = false, playing = false;
  const voices = new Set();
  const promise = (p) => p?.catch?.(() => {});
  function ensure() {
    if (ctx && ctx.state !== 'closed') return true;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      ctx = new Audio(); bus = ctx.createGain(); bus.gain.value = 0; bus.connect(ctx.destination);
      hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55;
      const gain = ctx.createGain(); gain.gain.value = 0.22; hum.connect(gain); gain.connect(bus); hum.start();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = CP.hash01('air', i) * 2 - 1;
      const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      air = ctx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = 450;
      source.connect(air); air.connect(bus); source.start();
      return true;
    } catch (_) { if (ctx) promise(ctx.close?.()); ctx = null; return false; }
  }
  function clearIdle() { if (timer != null) { clearTimeout(timer); timer = null; } }
  function play(mode = 'valley') {
    if (muted || document.hidden || !ensure()) return false;
    clearIdle(); playing = true; promise(ctx.resume?.());
    const t = ctx.currentTime;
    hum.frequency.setTargetAtTime(mode === 'bridge' ? 55 : 82.4, t, 0.6);
    air.frequency.setTargetAtTime(mode === 'bridge' ? 380 : 1200, t, 0.6);
    bus.gain.cancelScheduledValues(t); bus.gain.setTargetAtTime(0.045, t, 0.2);
    return true;
  }
  function cancelCues() {
    if (!ctx || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    for (const voice of voices) {
      try { voice.gain.gain.cancelScheduledValues(t); voice.gain.gain.setTargetAtTime(0, t, 0.01); voice.osc.stop(t + 0.04); } catch (_) { /* Ses zaten bitmiş olabilir. */ }
    }
    voices.clear();
  }
  function stop() {
    playing = false; clearIdle();
    if (!ctx || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t); bus.gain.setTargetAtTime(0, t, 0.06);
    cancelCues();
    timer = setTimeout(() => { timer = null; if (!playing && ctx?.state === 'running') promise(ctx.suspend?.()); }, 320);
  }
  function note(frequency, offset, duration, volume, endFrequency, type = 'sine') {
    const o = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + offset;
    o.type = type; o.frequency.setValueAtTime(frequency, start);
    if (endFrequency) o.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start); gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.06, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(gain); gain.connect(bus);
    const voice = { osc: o, gain }; voices.add(voice);
    o.onended = () => { voices.delete(voice); o.disconnect(); gain.disconnect(); };
    o.start(start); o.stop(start + duration + 0.02);
  }
  function cue(name) {
    if (!ctx || !playing || muted || document.hidden || ctx.state === 'closed') return false;
    if (name === 'hover') note(620, 0, 0.045, 0.035, 570, 'triangle');
    else if (name === 'select') { note(330, 0, 0.12, 0.09, null, 'triangle'); note(440, 0.04, 0.15, 0.06); }
    else if (name === 'open') { note(220, 0, 0.2, 0.08, null, 'triangle'); note(330, 0.07, 0.22, 0.05); }
    else if (name === 'back') note(260, 0, 0.17, 0.07, 195, 'triangle');
    else if (name === 'confirm') { note(261.63, 0, 0.35, 0.1, null, 'triangle'); note(392, 0.08, 0.3, 0.07); }
    else if (name === 'letter') { note(660, 0, 0.2, 0.06); note(523, 0.12, 0.25, 0.06); }
    else if (name === 'travel') note(65, 0, 1.6, 0.19, 260);
    else if (name === 'arrival') { note(196, 0, 0.5, 0.09); note(293.66, 0.12, 0.55, 0.07); }
    else if (name === 'positive') [392, 523.25, 659.25].forEach((f, i) => note(f, i * 0.12, 0.65, 0.08));
    else if (name === 'caution') { note(196, 0, 0.7, 0.09); note(233.08, 0.18, 0.65, 0.06); }
    else if (name === 'neutral') note(261.63, 0, 0.5, 0.08);
    else note(440, 0, 0.12, 0.12);
    return true;
  }
  function mute(value) { muted = !!value; if (muted) stop(); }
  function dispose() { stop(); clearIdle(); if (ctx) promise(ctx.close?.()); ctx = null; bus = null; hum = null; air = null; }
  CP.sceneAudio = { play, stop, cue, cancelCues, mute, dispose, get initialized() { return !!ctx; }, get playing() { return playing; } };
})();
