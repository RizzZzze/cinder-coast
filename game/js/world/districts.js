// Cinder Coast districts: five Stage 2 districts, facade detail, grounded roofs.
// Fresh Stage 2 write from BRIEF-04. Every roof sits on its walls, every
// building shows windows, storefronts, awnings, parapets and chimneys.
(function () {
  var CC = window.CinderCoast;
  var WALL = 0xD8B98A, STUCCO = 0xF4E6C8, TERRA = 0xC8643B, GLASS = 0x9FC4D8;
  var DARK = 0x2B2B33, CREAM = 0xF4E6C8;
  function facade(rng, parts, x, z, w, h, wall, roof, opts) {
    opts = opts || {};
    var d = w;
    parts.push({ shape: 'box', w: w, h: h, d: d, x: x, y: h / 2, z: z, color: wall });
    if (opts.flat) {
      parts.push({ shape: 'box', w: w + 0.4, h: 0.5, d: d + 0.4, x: x, y: h + 0.25, z: z, color: roof });
      parts.push({ shape: 'box', w: w, h: 0.9, d: 0.3, x: x, y: h + 0.7, z: z + d / 2 - 0.15, color: wall });
      parts.push({ shape: 'box', w: w, h: 0.9, d: 0.3, x: x, y: h + 0.7, z: z - d / 2 + 0.15, color: wall });
    } else {
      var rh = opts.roofH || 3;
      parts.push({ shape: 'cone', r: w * 0.7071, h: rh, seg: 4, x: x, y: h + rh / 2, z: z, ry: Math.PI / 4, color: roof });
    }
    var rows = Math.max(1, Math.floor((h - 3) / 3.2));
    var cols = Math.max(2, Math.floor(w / 3));
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var wx = x - w / 2 + (c + 0.5) * (w / cols);
        var wy = 3.4 + r * 3.2;
        if (wy > h - 1) continue;
        parts.push({ shape: 'box', w: 1.2, h: 1.4, d: 0.12, x: wx, y: wy, z: z + d / 2 + 0.04, color: GLASS });
        if (opts.bothSides) parts.push({ shape: 'box', w: 1.2, h: 1.4, d: 0.12, x: wx, y: wy, z: z - d / 2 - 0.04, color: GLASS });
      }
    }
    if (opts.shop) {
      parts.push({ shape: 'box', w: w * 0.7, h: 2.0, d: 0.14, x: x, y: 1.2, z: z + d / 2 + 0.05, color: GLASS });
      parts.push({ shape: 'box', w: w * 0.78, h: 0.16, d: 2.0, x: x, y: 3.1, z: z + d / 2 + 0.9, rx: 0.28, color: opts.awning || 0xF2A81D });
      parts.push({ shape: 'box', w: 0.14, h: 1.6, d: 0.14, x: x - w * 0.36, y: 2.2, z: z + d / 2 + 1.7, color: DARK });
      parts.push({ shape: 'box', w: 0.14, h: 1.6, d: 0.14, x: x + w * 0.36, y: 2.2, z: z + d / 2 + 1.7, color: DARK });
    }
    if (opts.chimney) parts.push({ shape: 'box', w: 0.9, h: 2.2, d: 0.9, x: x + w * 0.28, y: h + 1.0, z: z - d * 0.2, color: 0x8A6B4A });
    if (opts.balcony) {
      parts.push({ shape: 'box', w: w * 0.6, h: 0.18, d: 1.6, x: x, y: 4.6, z: z + d / 2 + 0.7, color: STUCCO });
      parts.push({ shape: 'box', w: w * 0.6, h: 0.9, d: 0.1, x: x, y: 5.1, z: z + d / 2 + 1.45, color: DARK });
    }
    CC.spatial.addBox(x, z, w / 2, d / 2);
  }
  function stall(parts, x, z, col) {
    parts.push({ shape: 'box', w: 5, h: 0.3, d: 4, x: x, y: 2.6, z: z, color: col });
    parts.push({ shape: 'box', w: 4.4, h: 1.1, d: 2.4, x: x, y: 0.55, z: z, color: 0x8A6B4A });
    [[-2.1, -1.7], [2.1, -1.7], [-2.1, 1.7], [2.1, 1.7]].forEach(function (pc) {
      parts.push({ shape: 'box', w: 0.14, h: 1.4, d: 0.14, x: x + pc[0], y: 1.8, z: z + pc[1], color: DARK });
    });
    CC.spatial.addBox(x, z, 2.4, 1.6);
  }
  var builders = {};
  builders.mercado = function (parts, rng) {
    var cols = [0xC8643B, 0xF2A81D, 0x2BB3B0, 0xE0433A];
    for (var i = 0; i < 16; i++) {
      var x = -220 + (i % 4) * 52 + rng.range(-6, 6);
      var z = -20 + Math.floor(i / 4) * 44 + rng.range(-5, 5);
      facade(rng, parts, x, z, rng.range(9, 13), rng.range(7, 12), i % 3 ? WALL : STUCCO,
        i % 2 ? TERRA : 0x8A5A3A, { shop: true, awning: cols[i % 4], chimney: rng.chance(0.4), balcony: rng.chance(0.4), bothSides: true });
    }
    for (var s = 0; s < 10; s++) stall(parts, -200 + s * 16, 96 + (s % 2) * 10, cols[s % 4]);
    parts.push({ shape: 'box', w: 30, h: 9, d: 20, x: -120, y: 4.5, z: 60, color: STUCCO });
    parts.push({ shape: 'cone', r: 21.2, h: 4, seg: 4, x: -120, y: 11, z: 60, ry: Math.PI / 4, color: TERRA });
    parts.push({ shape: 'box', w: 12, h: 3.4, d: 0.14, x: -120, y: 1.9, z: 70.05, color: GLASS });
    parts.push({ shape: 'box', w: 24, h: 0.16, d: 3.4, x: -120, y: 4.4, z: 71.4, rx: 0.28, color: 0xF2A81D });
    CC.spatial.addBox(-120, 60, 15, 10);
  };
  builders.lantern = function (parts, rng) {
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      var x = 60 + Math.cos(a) * 62, z = Math.sin(a) * 48;
      facade(rng, parts, x, z, rng.range(10, 13), rng.range(9, 15), STUCCO, TERRA,
        { shop: i % 2 === 0, bothSides: true, balcony: true, chimney: rng.chance(0.3) });
    }
    parts.push({ shape: 'cyl', rTop: 7, rBot: 9, h: 140, seg: 10, x: 60, y: 70, z: 0, color: STUCCO });
    parts.push({ shape: 'cyl', rTop: 13, rBot: 13, h: 4, seg: 10, x: 60, y: 122, z: 0, color: GLASS });
    parts.push({ shape: 'cyl', rTop: 9, rBot: 13, h: 5, seg: 10, x: 60, y: 127, z: 0, color: TERRA });
    parts.push({ shape: 'cyl', rTop: 4, rBot: 5, h: 6, seg: 8, x: 60, y: 40, z: 0, color: 0xFFD166 });
    parts.push({ shape: 'box', w: 16, h: 1.2, d: 16, x: 60, y: 0.6, z: 0, color: 0x7FC4E0 });
    parts.push({ shape: 'box', w: 10, h: 1.0, d: 10, x: 60, y: 1.6, z: 0, color: 0x9FC4D8 });
    CC.spatial.addBox(60, 0, 9, 9);
    CC.spatial.addBox(60, 0, 8, 8);
  };

  builders.sunfield = function (parts, rng) {
    for (var i = 0; i < 12; i++) {
      var x = 180 + (i % 3) * 52 + rng.range(-4, 4);
      var z = -60 + Math.floor(i / 3) * 62 + rng.range(-5, 5);
      facade(rng, parts, x, z, rng.range(10, 14), rng.range(10, 18), i % 2 ? 0xF4E6C8 : 0xE8D8B8,
        0x2BB3B0, { shop: true, flat: i % 3 === 0, bothSides: true, balcony: true, awning: 0x2BB3B0 });
    }
    parts.push({ shape: 'box', w: 22, h: 42, d: 18, x: 240, y: 21, z: 80, color: GLASS });
    parts.push({ shape: 'cyl', rTop: 9, rBot: 9, h: 42, seg: 10, x: 240, y: 21, z: 92, color: 0xBFE0EA });
    parts.push({ shape: 'box', w: 24, h: 1.0, d: 20, x: 240, y: 42.5, z: 80, color: TERRA });
    parts.push({ shape: 'box', w: 18, h: 2.2, d: 0.14, x: 240, y: 1.3, z: 89.05, color: GLASS });
    parts.push({ shape: 'box', w: 20, h: 0.16, d: 3.0, x: 240, y: 3.6, z: 90.4, rx: 0.28, color: 0xE0433A });
    CC.spatial.addBox(240, 80, 12, 10);
    for (var b = 0; b < 14; b++) {
      parts.push({ shape: 'box', w: 3, h: 0.3, d: 8, x: 312, y: 0.35, z: -40 + b * 16, color: 0x8A6B4A });
    }
  };
  builders.heights = function (parts, rng) {
    for (var i = 0; i < 12; i++) {
      var x = -40 + (i % 4) * 48 + rng.range(-5, 5);
      var z = -220 - Math.floor(i / 4) * 62 + rng.range(-6, 6);
      facade(rng, parts, x, z, rng.range(10, 14), rng.range(8, 14), STUCCO, TERRA,
        { flat: i % 2 === 0, bothSides: true, balcony: true, chimney: rng.chance(0.5) });
    }
    for (var t = 0; t < 4; t++) {
      var tx = 90 + t * 28, tz = -260 - t * 40;
      parts.push({ shape: 'box', w: 12, h: 26, d: 12, x: tx, y: 13, z: tz, color: GLASS });
      parts.push({ shape: 'box', w: 12.6, h: 1, d: 12.6, x: tx, y: 26.5, z: tz, color: DARK });
      CC.spatial.addBox(tx, tz, 6, 6);
    }
    var n = 24;
    for (var s = 0; s <= n; s++) {
      var fx = 0 + (40 - 0) * (s / n), fz = -160 + (-480 + 160) * (s / n);
      parts.push({ shape: 'box', w: 0.3, h: 0.3, d: 2.2, x: fx - 1.2, y: 1.0 + s * 0.12, z: fz, color: DARK });
      parts.push({ shape: 'box', w: 0.3, h: 0.3, d: 2.2, x: fx + 1.2, y: 1.0 + s * 0.12, z: fz, color: DARK });
    }
    parts.push({ shape: 'box', w: 6, h: 4, d: 8, x: 0, y: 2, z: -160, color: 0xF2A81D });
    parts.push({ shape: 'box', w: 6, h: 4, d: 8, x: 40, y: 5, z: -480, color: 0xF2A81D });
    parts.push({ shape: 'box', w: 4, h: 3.4, d: 6, x: 20, y: 3.4, z: -320, color: 0xE0433A });
    CC.spatial.addBox(0, -160, 3, 4);
    CC.spatial.addBox(40, -480, 3, 4);
  };
  builders.ironbridge = function (parts, rng) {
    for (var i = 0; i < 8; i++) {
      var x = -280 + (i % 4) * 52, z = -320 + Math.floor(i / 4) * 70;
      parts.push({ shape: 'box', w: 22, h: 10, d: 16, x: x, y: 5, z: z, color: 0x8A8F98 });
      parts.push({ shape: 'box', w: 23, h: 0.8, d: 17, x: x, y: 10.4, z: z, color: 0x5A5A66 });
      parts.push({ shape: 'cyl', rTop: 1.2, rBot: 1.6, h: 14, seg: 8, x: x + 7, y: 17, z: z - 4, color: 0x6B4A2F });
      parts.push({ shape: 'box', w: 6, h: 3, d: 0.14, x: x, y: 2, z: z + 8.05, color: GLASS });
      CC.spatial.addBox(x, z, 11, 8);
    }
    for (var w = 0; w < 5; w++) {
      var wx = -260 + w * 18;
      parts.push({ shape: 'box', w: 10, h: 3.4, d: 3.4, x: wx, y: 2.4, z: -260, color: w % 2 ? 0x6B7A8A : 0x8A5A3A });
      parts.push({ shape: 'box', w: 10, h: 0.5, d: 3.6, x: wx, y: 4.3, z: -260, color: DARK });
      CC.spatial.addBox(wx, -260, 5, 1.8);
    }
    for (var h2 = 0; h2 < 4; h2++) {
      parts.push({ shape: 'cone', r: 4, h: 5, seg: 8, x: -140 + h2 * 12, y: 2.5, z: -180, color: 0x5A5A66 });
    }
    for (var r2 = 0; r2 < 20; r2++) {
      parts.push({ shape: 'box', w: 0.25, h: 0.25, d: 3, x: -160 - 1.1, y: 0.3, z: -260 + r2 * 8, color: DARK });
      parts.push({ shape: 'box', w: 0.25, h: 0.25, d: 3, x: -160 + 1.1, y: 0.3, z: -260 + r2 * 8, color: DARK });
    }
    parts.push({ shape: 'box', w: 8, h: 0.4, d: 0.4, x: -160, y: 3.2, z: -160, color: 0xE0433A });
    parts.push({ shape: 'box', w: 0.4, h: 3.2, d: 0.4, x: -164, y: 1.6, z: -160, color: DARK });
    parts.push({ shape: 'box', w: 0.4, h: 3.2, d: 0.4, x: -156, y: 1.6, z: -160, color: DARK });
  };
  CC.districts = {
    builders: builders,
    buildAll: function (scene, seed) {
      var rng = CC.rng.make(seed + 500);
      var ids = ['mercado', 'lantern', 'sunfield', 'heights', 'ironbridge'];
      ids.forEach(function (id) {
        var parts = [];
        builders[id](parts, CC.rng.make(seed + 500 + id.length * 17));
        if (!parts.length) return;
        var mesh = CC.geo.meshFromParts(parts);
        mesh.receiveShadow = true;
        scene.add(mesh);
      });
      return true;
    }
  };
})();
