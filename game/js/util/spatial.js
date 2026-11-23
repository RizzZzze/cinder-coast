// Cinder Coast spatial: grid index for colliders and nearby queries.
(function () {
  var CC = window.CinderCoast;
  var colliders = [];
  CC.spatial = {
    clear: function () { colliders = []; },
    addBox: function (x, z, hw, hd) { colliders.push({ x: x, z: z, hw: hw, hd: hd }); },
    collideCircle: function (x, z, r) {
      for (var i = 0; i < colliders.length; i++) {
        var b = colliders[i];
        var cx = Math.max(b.x - b.hw, Math.min(x, b.x + b.hw));
        var cz = Math.max(b.z - b.hd, Math.min(z, b.z + b.hd));
        var dx = x - cx, dz = z - cz;
        if (dx * dx + dz * dz < r * r) return b;
      }
      return null;
    },
    pushOut: function (p, r) {
      var b = CC.spatial.collideCircle(p.x, p.z, r);
      if (!b) return false;
      var dx = p.x - b.x, dz = p.z - b.z;
      var px = b.hw + r - Math.abs(dx), pz = b.hd + r - Math.abs(dz);
      if (px < pz) p.x = b.x + (dx >= 0 ? b.hw + r : -b.hw - r);
      else p.z = b.z + (dz >= 0 ? b.hd + r : -b.hd - r);
      return true;
    },
    count: function () { return colliders.length; }
  };
})();
