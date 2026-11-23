// Cinder Coast quality governor: watches frame rate, scales effects density
// and draw distance so the game holds 60 fps and never falls below 40.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  var ema = 60, level = 0, cooldown = 0;
  var LEVELS = [
    { density: 1.0, fogFar: 900, shadow: 2048 },
    { density: 0.6, fogFar: 650, shadow: 1024 },
    { density: 0.3, fogFar: 450, shadow: 512 }
  ];
  CC.quality = {
    level: 0,
    fps: 60,
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      if (dt > 0) ema = ema * 0.95 + (1 / dt) * 0.05;
      CC.quality.fps = ema;
      S.fps = ema;
      cooldown -= dt;
      if (cooldown > 0) return;
      if (ema < 48 && level < 2) { level++; cooldown = 3; CC.quality.apply(); }
      else if (ema > 58 && level > 0) { level--; cooldown = 5; CC.quality.apply(); }
    },
    apply: function () {
      var S = CC.S;
      CC.quality.level = level;
      var L = LEVELS[level];
      if (CC.fx) CC.fx.density = L.density;
      if (S && S.scene && S.scene.fog) S.scene.fog.far = L.fogFar;
      if (S && S.renderer) S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, level === 0 ? 2 : 1.25));
    },
    drawCalls: function () {
      var S = CC.S;
      if (!S || !S.renderer) return 0;
      return S.renderer.info.render.calls;
    },
    heapMB: function () {
      if (window.performance && performance.memory) return performance.memory.usedJSHeapSize / 1048576;
      return 0;
    }
  };
})();

// Quality reporting: budget status for the HUD and verification runs.
(function () {
  var CC = window.CinderCoast;
  var Q = CC.quality;
  Q.withinBudget = function () {
    return Q.fps >= 40 && Q.drawCalls() <= 250 && Q.heapMB() <= 300;
  };
  Q.statusLine = function () {
    return 'fps ' + Math.round(Q.fps) + ' · calls ' + Q.drawCalls() +
      ' · heap ' + Math.round(Q.heapMB()) + ' MB · level ' + Q.level;
  };
})();
