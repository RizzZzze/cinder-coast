// Cinder Coast audio: audio context, buses, volume settings, unlock on input.
(function () {
  var CC = window.CinderCoast;
  var ctx = null, master = null, musicBus = null, sfxBus = null, engineOsc = null, engineGain = null;
  var volumes = { master: 0.8, music: 0.6, sfx: 0.8 };
  CC.audio = {
    volumes: volumes,
    unlock: function () {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); master.gain.value = volumes.master; master.connect(ctx.destination);
          musicBus = ctx.createGain(); musicBus.gain.value = volumes.music; musicBus.connect(master);
          sfxBus = ctx.createGain(); sfxBus.gain.value = volumes.sfx; sfxBus.connect(master);
          engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
          engineGain = ctx.createGain(); engineGain.gain.value = 0;
          var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 700;
          engineOsc.connect(filt); filt.connect(engineGain); engineGain.connect(sfxBus);
          engineOsc.start();
          if (CC.music) CC.music.start();
          if (CC.sfx) CC.sfx.startAmbient();
        } catch (e) { ctx = null; }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    getCtx: function () { return ctx; },
    getSfxBus: function () { return sfxBus; },
    getMusicBus: function () { return musicBus; },
    setMaster: function (v) { volumes.master = v; if (master) master.gain.value = v; if (CC.S) CC.S.options.master = v; },
    setMusic: function (v) { volumes.music = v; if (musicBus) musicBus.gain.value = v; if (CC.S) CC.S.options.music = v; },
    setSfx: function (v) { volumes.sfx = v; if (sfxBus) sfxBus.gain.value = v; if (CC.S) CC.S.options.sfx = v; },
    setEngine: function (rpm01) {
      if (!ctx || !engineOsc) return;
      engineOsc.frequency.value = 55 + rpm01 * 165;
      engineGain.gain.value = rpm01 > 0.02 ? 0.05 + rpm01 * 0.06 : 0;
    }
  };
})();
