// Cinder Coast districts (Stage 2): the five remaining districts, each built
// as merged-geometry blocks so a whole district is a handful of draw calls.
// Every part is grounded: roofs sit on walls, posts reach the ground, awnings
// sit on posts. Palette stays sandstone / stucco / terracotta / turquoise.
(function () {
  var CC = window.CinderCoast;
  function roofR(w, d) { return Math.sqrt(w * w + d * d) / 2; }
  function building(parts, x, z, w, d, h, color, roofH, roofColor) {
    parts.push({ shape: 'box', w: w, h: h, d: d, x: x, y: h / 2, z: z, color: color });
    // Parapet cap, slightly wider than the walls, on top of the walls.
    parts.push({ shape: 'box', w: w + 0.4, h: 0.5, d: d + 0.4, x: x, y: h + 0.25, z: z, color: 0xF4E6C8 });
    if (roofH > 0) {
      parts.push({ shape: 'cone', r: roofR(w, d), h: roofH, seg: 4, x: x, y: h + 0.5 + roofH / 2, z: z, ry: Math.PI / 4, color: roofColor || 0xC8643B });
      parts.push({ shape: 'box', w: 0.9, h: 2.2, d: 0.9, x: x + w * 0.25, y: h + roofH * 0.6, z: z + d * 0.15, color: 0x8A5A40 });
    }
    // Window grid on the front and back faces, storefront glass at street level.
    var rows = Math.max(1, Math.floor((h - 3) / 3.2));
    for (var r = 0; r < rows; r++) {
      var wy = 2.6 + r * 3.2;
      if (wy > h - 1) break;
      var cols = Math.max(1, Math.floor((w - 4) / 3.4));
      for (var c = 0; c < cols; c++) {
        var wx = x - w / 2 + 2.4 + c * 3.4;
        parts.push({ shape: 'box', w: 1.3, h: 1.7, d: 0.12, x: wx, y: wy, z: z + d / 2 + 0.03, color: 0x2E4A5E });
        parts.push({ shape: 'box', w: 1.3, h: 1.7, d: 0.12, x: wx, y: wy, z: z - d / 2 - 0.03, color: 0x2E4A5E });
      }
    }
    parts.push({ shape: 'box', w: Math.min(w * 0.55, 7), h: 2.4, d: 0.12, x: x, y: 1.5, z: z + d / 2 + 0.03, color: 0x1E3A4A });
    parts.push({ shape: 'box', w: Math.min(w * 0.6, 7), h: 0.18, d: 1.8, x: x, y: 3.1, z: z + d / 2 + 0.95, rx: -0.22, color: 0xF2A81D });
    CC.spatial.addBox(x, z, w / 2, d / 2);
  }
  function stall(parts, x, z, color) {
    parts.push({ shape: 'box', w: 4.4, h: 1.1, d: 2.4, x: x, y: 0.55, z: z, color: 0x8A6B4A });
    parts.push({ shape: 'box', w: 5, h: 0.3, d: 4, x: x, y: 2.6, z: z, color: color });
    [[-2.1, -1.7], [2.1, -1.7], [-2.1, 1.7], [2.1, 1.7]].forEach(function (pc) {
      parts.push({ shape: 'box', w: 0.14, h: 1.5, d: 0.14, x: x + pc[0], y: 1.8, z: z + pc[1], color: 0x5A4632 });
    });
    CC.spatial.addBox(x, z, 2.4, 1.6);
  }
  function flush(parts, group) {
    if (!parts.length) return;
    var mesh = CC.geo.meshFromParts(parts);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  CC.districts = {
    funicular: null,
    build: function (group, seed) {
      CC.districts.buildMercado(group, seed);
      CC.districts.buildLanternPark(group, seed);
      CC.districts.buildSunfield(group, seed);
    },
    buildMercado: function (group, seed) {
      var rng = CC.rng.make(seed + 700);
      var parts = [];
      var palette = [0xE9C98F, 0xF4E6C8, 0xD9B380, 0xE8D9B0];
      // Market-lane buildings around the Mercado centre (-160, -40).
      var plots = [
        [-196, -72, 18, 16, 11], [-168, -76, 16, 14, 14], [-140, -74, 20, 15, 9],
        [-196, -16, 17, 15, 13], [-140, -14, 19, 16, 10], [-200, -44, 15, 13, 8],
        [-132, -44, 14, 12, 12], [-168, -8, 16, 14, 7], [-184, -40, 12, 10, 9]
      ];
      plots.forEach(function (p, i) {
        building(parts, p[0], p[1], p[2], p[3], p[4], palette[i % palette.length], rng.range(2.5, 4.5));
      });
      // Arcades: a colonnade lane at z -56..-24, posts from the ground to a
      // flat slab roof, so the arcade reads as a covered walk, never floating.
      for (var ax = -192; ax <= -128; ax += 8) {
        [-56, -24].forEach(function (az) {
          parts.push({ shape: 'box', w: 0.6, h: 4.4, d: 0.6, x: ax, y: 2.2, z: az, color: 0xF4E6C8 });
        });
      }
      parts.push({ shape: 'box', w: 68, h: 0.5, d: 36, x: -160, y: 4.65, z: -40, color: 0xC8643B });
      // Covered food hall at the west end: low walls, columns, pyramid roof.
      parts.push({ shape: 'box', w: 26, h: 5, d: 18, x: -212, y: 2.5, z: -64, color: 0xF4E6C8 });
      parts.push({ shape: 'cone', r: roofR(26, 18), h: 5, seg: 4, x: -212, y: 5.5 + 2.5, z: -64, ry: Math.PI / 4, color: 0xC8643B });
      CC.spatial.addBox(-212, -64, 13, 9);
      // Awning stalls down the two market lanes.
      var cols = [0xC8643B, 0xF2A81D, 0x2BB3B0, 0xE0433A];
      for (var s = 0; s < 10; s++) {
        stall(parts, -188 + s * 7, -48 + (s % 2) * 14, cols[s % 4]);
      }
      flush(parts, group);
    },
    buildLanternPark: function (group, seed) {
      var rng = CC.rng.make(seed + 710);
      var parts = [];
      // Central plaza paving, a flat disc grounded on the street.
      parts.push({ shape: 'cyl', rTop: 42, rBot: 42, h: 0.3, seg: 24, x: 0, y: 0.15, z: -160, color: 0xE8D9B0 });
      // Fountain at the plaza centre: basin, water, central column, top bowl.
      parts.push({ shape: 'cyl', rTop: 8, rBot: 8.5, h: 1.2, seg: 16, x: 0, y: 0.6, z: -160, color: 0xF4E6C8 });
      parts.push({ shape: 'cyl', rTop: 7.4, rBot: 7.4, h: 0.2, seg: 16, x: 0, y: 1.2, z: -160, color: 0x2BB3B0 });
      parts.push({ shape: 'cyl', rTop: 0.8, rBot: 1.1, h: 4.5, seg: 10, x: 0, y: 3.4, z: -160, color: 0xF4E6C8 });
      parts.push({ shape: 'sphere', r: 1.6, x: 0, y: 6.2, z: -160, color: 0xFFD166 });
      CC.spatial.addBox(0, -160, 8.5, 8.5);
      // Palm avenues along the plaza's north and south edges.
      for (var px = -56; px <= 56; px += 16) {
        [-118, -202].forEach(function (pz) {
          parts.push({ shape: 'cyl', rTop: 0.12, rBot: 0.2, h: 5.5, x: px, y: 2.75, z: pz, color: 0x8A6B4A });
          parts.push({ shape: 'cone', r: 1.6, h: 1.6, x: px, y: 5.9, z: pz, color: 0x5E9A4A });
          parts.push({ shape: 'cone', r: 1.2, h: 1.2, x: px, y: 6.6, z: pz, color: 0x6FAE56 });
        });
      }
      // Civic ring: six stucco civic buildings around the plaza.
      var ring = [[-64, -160], [64, -160], [-48, -208], [48, -208], [-48, -112], [48, -112]];
      ring.forEach(function (p, i) {
        building(parts, p[0], p[1], 18, 14, 12 + (i % 3) * 4, 0xF4E6C8, rng.range(2.5, 4), 0xFFD166);
      });
      // Halo Tower observation deck: a disc platform and glass ring at y 120,
      // sitting on the tower shaft that already rises from the ground.
      parts.push({ shape: 'cyl', rTop: 12, rBot: 12, h: 1, seg: 20, x: 0, y: 120.5, z: -200, color: 0xF4E6C8 });
      parts.push({ shape: 'cyl', rTop: 11, rBot: 11, h: 2.4, seg: 20, x: 0, y: 122.2, z: -200, color: 0x9FC4D8 });
      // Benches around the plaza, all grounded.
      for (var b = 0; b < 8; b++) {
        var a = b * Math.PI / 4;
        parts.push({ shape: 'box', w: 3, h: 0.5, d: 1, x: Math.cos(a) * 26, y: 0.5, z: -160 + Math.sin(a) * 26, color: 0x8A6B4A });
      }
      flush(parts, group);
    },
    buildSunfield: function (group, seed) {
      var rng = CC.rng.make(seed + 720);
      var parts = [];
      // Beachfront boulevard hotels: tall stucco and glass towers with
      // varied rooflines — flat parapets, pyramid caps, one stepped crown.
      var hotels = [
        [268, -120, 20, 18, 30, 0xF4E6C8, 4], [268, -80, 18, 16, 22, 0x9FC4D8, 0],
        [268, -40, 22, 18, 34, 0xF4E6C8, 5], [268, 0, 18, 16, 26, 0xE9C98F, 3],
        [268, 40, 20, 18, 20, 0x9FC4D8, 0], [268, 80, 18, 16, 28, 0xF4E6C8, 4]
      ];
      hotels.forEach(function (h) {
        building(parts, h[0], h[1], h[2], h[3], h[4], h[5], h[6]);
        // Glass front facing the boulevard (west face).
        parts.push({ shape: 'box', w: 0.12, h: h[4] - 4, d: h[3] * 0.7, x: h[0] - h[2] / 2 - 0.03, y: h[4] / 2 + 1, z: h[1], color: 0x9FC4D8 });
      });
      // Cafes along the boulevard with striped awnings and balconies.
      var cafes = [[296, -100], [296, -60], [296, -20], [296, 20], [296, 60]];
      cafes.forEach(function (c, i) {
        building(parts, c[0], c[1], 12, 10, 7, i % 2 ? 0xF4E6C8 : 0xE9C98F, 2.5);
        parts.push({ shape: 'box', w: 10, h: 0.4, d: 2.2, x: c[0], y: 4.6, z: c[1] + 5.5, color: 0xF4E6C8 });
      });
      // Boardwalk: timber planks along the beach edge, grounded at y 0.15.
      parts.push({ shape: 'box', w: 8, h: 0.3, d: 320, x: 332, y: 0.15, z: 0, color: 0xC9A37A });
      for (var pz = -150; pz <= 150; pz += 12) {
        parts.push({ shape: 'box', w: 8, h: 0.05, d: 0.3, x: 332, y: 0.32, z: pz, color: 0x8A6B4A });
      }
      // Palm row between boulevard and boardwalk.
      for (var px = -140; px <= 100; px += 20) {
        parts.push({ shape: 'cyl', rTop: 0.12, rBot: 0.2, h: 5.5, x: 316, y: 2.75, z: px, color: 0x8A6B4A });
        parts.push({ shape: 'cone', r: 1.6, h: 1.6, x: 316, y: 5.9, z: px, color: 0x5E9A4A });
      }
      flush(parts, group);
    }
  };
})();
