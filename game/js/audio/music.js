// Cinder Coast music: original procedural loop at 96 BPM — bass line,
// plucked marimba-like voices, warm pad; a tense percussion layer fades in
// at 3+ stars.
(function () {
  var CC = window.CinderCoast;
  var timer = null, step = 0;
  var bassNotes = [55, 0, 55, 65.4, 0, 55, 49, 58.3, 55, 0, 55, 65.4, 0, 73.4, 65.4, 49];
  var pluckNotes = [220, 0, 261.6, 329.6, 0, 293.7, 261.6, 0, 220, 0, 261.6, 329.6, 392, 329.6, 293.7, 261.6];
  function note(freq, dur, type, gain) {
    var ctx = CC.audio.getCtx();
    if (!ctx) return;
    var o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(CC.audio.getMusicBus());
    o.start(); o.stop(ctx.currentTime + dur);
  }
  CC.music = {
    start: function () {
      if (timer) return;
      var spb = 60 / 96 / 2;
      timer = setInterval(function () {
        var S = CC.S;
        if (!S || S.mode === 'title') { step = (step + 1) % 16; return; }
        var b = bassNotes[step % 16];
        if (b) note(b, spb * 1.8, 'sine', 0.22);
        var p = pluckNotes[step % 16];
        if (p) note(p, spb * 0.9, 'triangle', 0.12);
        if (step % 16 === 0) note(110, spb * 8, 'sawtooth', 0.03);
        if (S.stars >= 3 && step % 2 === 0) note(step % 4 === 0 ? 120 : 90, 0.08, 'square', 0.06);
        step = (step + 1) % 16;
      }, spb * 1000);
    }
  };
})();
