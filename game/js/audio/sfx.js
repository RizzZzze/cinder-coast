// Cinder Coast sfx: synthesised sound effects (Web Audio, no files).
(function () {
  var CC = window.CinderCoast;
  var sirenOsc = null, sirenGain = null, sirenOn = false;
  function noiseBuffer(ctx, dur) {
    var buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function burst(dur, freq, gain, type) {
    var ctx = CC.audio.getCtx();
    if (!ctx) return;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, dur);
    var f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(CC.audio.getSfxBus());
    src.start();
  }
  CC.sfx = {
    gunshot: function (key) {
      if (key === 'harrow') burst(0.28, 500, 0.5, 'lowpass');
      else if (key === 'brisk') burst(0.09, 1800, 0.25);
      else burst(0.14, 1200, 0.35);
    },
    click: function () { burst(0.03, 3000, 0.12, 'highpass'); },
    reload: function () { burst(0.08, 900, 0.15); },
    impact: function (a) { burst(0.18, 300, 0.3 + a * 0.3, 'lowpass'); },
    honk: function () {
      var ctx = CC.audio.getCtx();
      if (!ctx) return;
      var o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 370;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      o.connect(g); g.connect(CC.audio.getSfxBus());
      o.start(); o.stop(ctx.currentTime + 0.35);
    },
    explosion: function () { burst(0.8, 220, 0.6, 'lowpass'); },
    sirenBurst: function () { CC.sfx.setSiren(true); setTimeout(function () { CC.sfx.setSiren(false); }, 2500); },
    setSiren: function (on) {
      var ctx = CC.audio.getCtx();
      if (!ctx) return;
      if (on && !sirenOn) {
        sirenOn = true;
        sirenOsc = ctx.createOscillator(); sirenOsc.type = 'sine'; sirenOsc.frequency.value = 800;
        var lfo = ctx.createOscillator(); lfo.frequency.value = 0.7;
        var lfoGain = ctx.createGain(); lfoGain.gain.value = 350;
        lfo.connect(lfoGain); lfoGain.connect(sirenOsc.frequency);
        sirenGain = ctx.createGain(); sirenGain.gain.value = 0.05;
        var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        sirenOsc.connect(sirenGain);
        if (pan) { sirenGain.connect(pan); pan.connect(CC.audio.getSfxBus()); }
        else sirenGain.connect(CC.audio.getSfxBus());
        sirenOsc.start(); lfo.start();
        sirenOsc._lfo = lfo;
      } else if (!on && sirenOn) {
        sirenOn = false;
        try { sirenOsc.stop(); sirenOsc._lfo.stop(); } catch (e) {}
        sirenOsc = null;
      }
    },
    startAmbient: function () {
      var ctx = CC.audio.getCtx();
      if (!ctx) return;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 2); src.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      var g = ctx.createGain(); g.gain.value = 0.03;
      src.connect(f); f.connect(g); g.connect(CC.audio.getSfxBus());
      src.start();
    }
  };
})();
