// Cinder Coast chunks: world split into 160 m chunks, loaded around the player.
// Fresh Stage 2 write from BRIEF-04. The static city is built once; chunks
// track which sector the player is in so streaming, culling and the map
// share one source of truth.
(function () {
  var CC = window.CinderCoast;
  var SIZE = 160;
  var loaded = {};
  function keyFor(x, z) {
    return Math.floor(x / SIZE) + ':' + Math.floor(z / SIZE);
  }
  CC.chunks = {
    size: SIZE,
    loaded: loaded,
    keyFor: keyFor,
    build: function (scene, seed) {
      loaded = {};
      CC.chunks.loaded = loaded;
      var cx = -320, cz = -560;
      while (cz <= 320) {
        cx = -320;
        while (cx <= 320) {
          loaded[keyFor(cx + SIZE / 2, cz + SIZE / 2)] = {
            x: cx, z: cz, built: true, active: false
          };
          cx += SIZE;
        }
        cz += SIZE;
      }
      CC.city.build(scene, seed);
      return true;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || !S.player) return;
      var k = keyFor(S.player.x, S.player.z);
      if (CC.chunks.current !== k) {
        CC.chunks.current = k;
        for (var key in loaded) loaded[key].active = (key === k);
      }
    },
    current: '0:0',
    count: function () {
      var n = 0;
      for (var k in loaded) n++;
      return n;
    }
  };
})();

// Chunk neighbours, used by the map and by spawn placement near the player.
(function () {
  var CC = window.CinderCoast;
  CC.chunks.neighbours = function (x, z) {
    var cx = Math.floor(x / CC.chunks.size), cz = Math.floor(z / CC.chunks.size);
    var out = [];
    for (var dx = -1; dx <= 1; dx++) {
      for (var dz = -1; dz <= 1; dz++) out.push((cx + dx) + ':' + (cz + dz));
    }
    return out;
  };
  CC.chunks.centreOf = function (key) {
    var p = key.split(':');
    return [parseInt(p[0], 10) * CC.chunks.size + CC.chunks.size / 2,
      parseInt(p[1], 10) * CC.chunks.size + CC.chunks.size / 2];
  };
})();
