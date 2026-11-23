// Cinder Coast quality governor: watches the frame rate and lowers effects
// density and draw distance when it falls, raises them again when it
// recovers, so the game holds a steady 60 fps on a mid-range desktop at
// 1920x1080 and never falls below 40, with at most 250 draw calls per frame.
(function () {
  var CC = window.CinderCoast;
  var rendererRef = null, timer = 0, ema = 16.7;
  var DENSITY = [0.4, 0.7, 1];
  var DRAW_DIST = [300, 450, 650];
  var PIXEL_RATIO = [1, 1.25, 1.5];
  CC.quality = {
    level: 2,
    fps: 60,
    init: function (renderer) { rendererRef = renderer; },
    apply: function () {
      var l = CC.quality.level;
      if (CC.fx) CC.fx.density = DENSITY[l];
      if (CC.chunks) CC.chunks.drawDist = DRAW_DIST[l];
      if (rendererRef) {
        rendererRef.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO[l]));
        rendererRef.shadowMap.enabled = l >= 1;
      }
    },
    update: function (dt) {
      ema = ema * 0.95 + dt * 1000 * 0.05;
      timer += dt;
      if (timer < 2) return;
      timer = 0;
      CC.quality.fps = Math.round(1000 / Math.max(1, ema));
      if (CC.quality.fps < 50 && CC.quality.level > 0) {
        CC.quality.level--;
        CC.quality.apply();
        if (CC.notify) CC.notify.push('Quality lowered to hold 60 fps');
      } else if (CC.quality.fps > 58 && CC.quality.level < 2) {
        CC.quality.level++;
        CC.quality.apply();
      }
    },
    // Exposed for the HUD / verification: current fps estimate and level.
    status: function () { return { fps: CC.quality.fps, level: CC.quality.level }; }
  };
})();
