// Cinder Coast city: district layout, road network, building plots, landmarks.
// Stage 1 builds Saltmarsh Quay and the Corvane Bridge approach in full;
// the other districts exist as a distant skyline so the city reads whole.
(function () {
  var CC = window.CinderCoast;
  var cfg, rng;
  function roadLines() {
    var lines = [];
    var every = 80, half = 320;
    for (var z = -240; z <= 240; z += every) lines.push({ axis: 'ew', at: z, from: -half, to: half });
    for (var x = -240; x <= 240; x += every) lines.push({ axis: 'ns', at: x, from: -half, to: half });
    lines.push({ axis: 'ew', at: 280, from: -320, to: 320 });
    lines.push({ axis: 'ns', at: 180, from: -560, to: 280 });
    return lines;
  }
  function nearestRoadPoint(x, z) {
    var best = null, bd = 1e9;
    roadLines().forEach(function (r) {
      var px, pz, d;
      if (r.axis === 'ew') { px = Math.max(r.from, Math.min(x, r.to)); pz = r.at; d = Math.abs(z - r.at); }
      else { px = r.at; pz = Math.max(r.from, Math.min(z, r.to)); d = Math.abs(x - r.at); }
      if (d < bd) { bd = d; best = { x: px, z: pz, axis: r.axis, at: r.at, dist: d }; }
    });
    return best;
  }
  CC.city = {
    roads: roadLines(),
    nearestRoadPoint: nearestRoadPoint,
    isOnRoad: function (x, z) { return nearestRoadPoint(x, z).dist < 8; },
    build: function (scene, seed) {
      cfg = CC.config; rng = CC.rng.make(seed);
      CC.spatial.clear();
      var group = new THREE.Group();
      group.name = 'city';
      var roadMat = new THREE.MeshLambertMaterial({ color: cfg.palette.asphalt });
      var kerbMat = new THREE.MeshLambertMaterial({ color: cfg.palette.kerb });
      var groundMat = new THREE.MeshLambertMaterial({ color: 0x9C8F7A });
      // Canvas ground texture at load time: paving blocks and speckle so
      // the ground reads as a built city, not an empty beige plain.
      (function () {
        var cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
        var g = cv.getContext('2d');
        g.fillStyle = '#9C8F7A'; g.fillRect(0, 0, 256, 256);
        var grng = CC.rng.make(seed + 500);
        for (var i = 0; i < 900; i++) {
          g.fillStyle = grng.chance(0.5) ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
          g.fillRect(grng.range(0, 256), grng.range(0, 256), grng.range(1, 3), grng.range(1, 3));
        }
        g.strokeStyle = 'rgba(0,0,0,0.10)'; g.lineWidth = 2;
        for (var x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
        for (var y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(48, 48);
        groundMat.map = tex;
      })();
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), groundMat);
      ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 0); ground.receiveShadow = true;
      group.add(ground);
      var dashList = [], walkList = [], crossList = [];
      roadLines().forEach(function (r) {
        var len = r.to - r.from;
        var road = new THREE.Mesh(new THREE.PlaneGeometry(r.axis === 'ew' ? len : 14, r.axis === 'ew' ? 14 : len), roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(r.axis === 'ew' ? (r.from + r.to) / 2 : r.at, 0, r.axis === 'ew' ? r.at : (r.from + r.to) / 2);
        road.receiveShadow = true; group.add(road);
        for (var s = r.from + 10; s < r.to; s += 20) {
          dashList.push({ axis: r.axis, x: r.axis === 'ew' ? s : r.at, z: r.axis === 'ew' ? r.at : s });
        }
        // Sidewalk strips flanking the road, 3 m wide, kerb colour.
        [-8.5, 8.5].forEach(function (off) {
          walkList.push({ axis: r.axis, x: r.axis === 'ew' ? (r.from + r.to) / 2 : r.at + off, z: r.axis === 'ew' ? r.at + off : (r.from + r.to) / 2, len: len });
        });
      });
      // Crosswalk stripes at every grid junction: bars across each road.
      [-240, -160, -80, 0, 80, 160, 240].forEach(function (jx) {
        [-240, -160, -80, 0, 80, 160, 240].forEach(function (jz) {
          for (var k = -2; k <= 2; k++) {
            crossList.push({ x: jx + k * 1.4, z: jz, ry: 0 });
            crossList.push({ x: jx, z: jz + k * 1.4, ry: Math.PI / 2 });
          }
        });
      });
      var _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
      (function () {
        var inst = CC.geo.instanced(new THREE.PlaneGeometry(4, 0.4), new THREE.MeshLambertMaterial({ color: 0xE8E0C8 }), dashList.length);
        dashList.forEach(function (d, i) {
          _e.set(-Math.PI / 2, 0, d.axis === 'ew' ? 0 : Math.PI / 2); _q.setFromEuler(_e);
          _p.set(d.x, 0.02, d.z); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); inst.setMatrixAt(i, _m4);
        });
        inst.instanceMatrix.needsUpdate = true; group.add(inst);
        var win = CC.geo.instanced(new THREE.BoxGeometry(1, 0.12, 1), kerbMat, walkList.length);
        walkList.forEach(function (w, i) {
          _q.identity();
          _p.set(w.x, 0.06, w.z); _s.set(w.axis === 'ew' ? w.len : 3, 1, w.axis === 'ew' ? 3 : w.len);
          _m4.compose(_p, _q, _s); win.setMatrixAt(i, _m4);
        });
        win.instanceMatrix.needsUpdate = true; win.receiveShadow = true; group.add(win);
        var cin = CC.geo.instanced(new THREE.PlaneGeometry(0.7, 12), new THREE.MeshLambertMaterial({ color: 0xF4F2E8 }), crossList.length);
        crossList.forEach(function (c, i) {
          _e.set(-Math.PI / 2, 0, c.ry); _q.setFromEuler(_e);
          _p.set(c.x, 0.03, c.z); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); cin.setMatrixAt(i, _m4);
        });
        cin.instanceMatrix.needsUpdate = true; group.add(cin);
      })();
      var palette = [cfg.palette.sandstone, cfg.palette.stucco, 0xD9B380, 0xE8D9B0];
      var archetypes = [];
      for (var bx = -240; bx <= 240; bx += 80) {
        for (var bz = -240; bz <= 240; bz += 80) {
          var cx = bx + 40, cz = bz + 40;
          if (Math.abs(cx) < 12 || Math.abs(cz) < 12) continue;
          var n = rng.int(2, 4);
          for (var i = 0; i < n; i++) {
            var w = rng.range(14, 26), d = rng.range(14, 26), h = rng.range(7, 26);
            if (Math.abs(cx) < 60 && Math.abs(cz + 200) < 60) h = rng.range(26, 42);
            var x = cx + rng.range(-12, 12), z = cz + rng.range(-12, 12);
            var col = rng.chance(0.2) ? rng.pick([0x2BB3B0, 0xC8643B, 0x7FA8C9]) : rng.pick(palette);
            archetypes.push({ x: x, z: z, w: w, d: d, h: h, color: col, roofH: rng.chance(0.7) ? rng.range(2.5, 5) : 0 });
            CC.spatial.addBox(x, z, w / 2, d / 2);
          }
        }
      }
      var boxGeo = new THREE.BoxGeometry(1, 1, 1);
      var roofGeo = CC.geo.pyramidGeometry();
      var byColour = {};
      archetypes.forEach(function (b) {
        var key = b.color;
        (byColour[key] = byColour[key] || []).push(b);
      });
      Object.keys(byColour).forEach(function (key) {
        var list = byColour[key];
        var mat = new THREE.MeshLambertMaterial({ color: list[0].color, flatShading: true });
        var inst = CC.geo.instanced(boxGeo, mat, list.length);
        var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
        list.forEach(function (b, i) {
          p.set(b.x, b.h / 2, b.z); s.set(b.w, b.h, b.d);
          m4.compose(p, q, s); inst.setMatrixAt(i, m4);
        });
        inst.instanceMatrix.needsUpdate = true;
        inst.castShadow = true; inst.receiveShadow = true;
        group.add(inst);
      });
      // Roofs: one instanced pyramid per roofed building. The pyramid base
      // is exactly the building footprint and sits at y = h, so no roof can
      // hover, gap or float from any angle.
      var roofed = archetypes.filter(function (b) { return b.roofH > 0; });
      var rinst = CC.geo.instanced(roofGeo,
        new THREE.MeshLambertMaterial({ color: cfg.palette.terracotta, flatShading: true }), roofed.length);
      roofed.forEach(function (b, i) {
        _p.set(b.x, b.h, b.z); _s.set(b.w, b.roofH, b.d); _q.identity();
        _m4.compose(_p, _q, _s); rinst.setMatrixAt(i, _m4);
      });
      rinst.instanceMatrix.needsUpdate = true; rinst.castShadow = true; group.add(rinst);
      // Facade detail, all instanced: window grids, parapet caps,
      // storefront glass with awnings, and chimneys through the roof slope.
      var winList = [], capList = [], shopList = [], awnList = [], chimList = [];
      var awnCols = [cfg.palette.terracotta, 0xF2A81D, 0x2BB3B0, 0xE0433A];
      archetypes.forEach(function (b) {
        capList.push(b);
        var rows = Math.max(1, Math.floor((b.h - 3) / 3.2));
        var colsZ = Math.max(1, Math.floor((b.w - 3) / 3.5));
        var colsX = Math.max(1, Math.floor((b.d - 3) / 3.5));
        for (var ry = 0; ry < rows; ry++) {
          var wy = 2.4 + ry * 3.2;
          if (wy > b.h - 1.2) break;
          for (var cx = 0; cx < colsZ; cx++) {
            winList.push({ x: b.x - b.w / 2 + 2 + cx * 3.5, y: wy, z: b.z + b.d / 2 + 0.06, ry: 0 });
            winList.push({ x: b.x - b.w / 2 + 2 + cx * 3.5, y: wy, z: b.z - b.d / 2 - 0.06, ry: Math.PI });
          }
          for (var cz = 0; cz < colsX; cz++) {
            winList.push({ x: b.x + b.w / 2 + 0.06, y: wy, z: b.z - b.d / 2 + 2 + cz * 3.5, ry: Math.PI / 2 });
            winList.push({ x: b.x - b.w / 2 - 0.06, y: wy, z: b.z - b.d / 2 + 2 + cz * 3.5, ry: -Math.PI / 2 });
          }
        }
        if (b.h <= 16 && rng.chance(0.5)) {
          shopList.push(b);
          awnList.push({ x: b.x, y: 3.1, z: b.z + b.d / 2 + 0.95, w: Math.min(b.w * 0.6, 7), color: rng.pick(awnCols) });
        }
        if (b.roofH > 0 && rng.chance(0.4)) {
          chimList.push({ x: b.x + b.w * 0.28, y: b.h + 0.44 * b.roofH, z: b.z + b.d * 0.18 });
        }
      });
      (function () {
        var win = CC.geo.instanced(new THREE.PlaneGeometry(1.4, 1.8),
          new THREE.MeshLambertMaterial({ color: 0x2E4A5E }), winList.length);
        winList.forEach(function (w, i) {
          _e.set(0, w.ry, 0); _q.setFromEuler(_e);
          _p.set(w.x, w.y, w.z); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); win.setMatrixAt(i, _m4);
        });
        win.instanceMatrix.needsUpdate = true; group.add(win);
        var cap = CC.geo.instanced(boxGeo,
          new THREE.MeshLambertMaterial({ color: 0xFFFFFF, flatShading: true }), capList.length);
        var cc = new THREE.Color();
        capList.forEach(function (b, i) {
          _q.identity(); _p.set(b.x, b.h + 0.25, b.z); _s.set(b.w + 0.4, 0.5, b.d + 0.4);
          _m4.compose(_p, _q, _s); cap.setMatrixAt(i, _m4);
          cc.setHex(b.color).multiplyScalar(0.72); cap.setColorAt(i, cc);
        });
        cap.instanceMatrix.needsUpdate = true;
        if (cap.instanceColor) cap.instanceColor.needsUpdate = true;
        group.add(cap);
        var shop = CC.geo.instanced(new THREE.PlaneGeometry(1, 1),
          new THREE.MeshLambertMaterial({ color: 0x1E3A4A }), shopList.length);
        shopList.forEach(function (b, i) {
          _q.identity(); _p.set(b.x, 1.5, b.z + b.d / 2 + 0.05); _s.set(Math.min(b.w * 0.55, 7), 2.6, 1);
          _m4.compose(_p, _q, _s); shop.setMatrixAt(i, _m4);
        });
        shop.instanceMatrix.needsUpdate = true; group.add(shop);
        var awn = CC.geo.instanced(boxGeo,
          new THREE.MeshLambertMaterial({ color: 0xFFFFFF, flatShading: true }), awnList.length);
        awnList.forEach(function (a, i) {
          _e.set(-0.22, 0, 0); _q.setFromEuler(_e);
          _p.set(a.x, a.y, a.z); _s.set(a.w, 0.18, 1.8); _m4.compose(_p, _q, _s); awn.setMatrixAt(i, _m4);
          cc.setHex(a.color); awn.setColorAt(i, cc);
        });
        awn.instanceMatrix.needsUpdate = true;
        if (awn.instanceColor) awn.instanceColor.needsUpdate = true;
        group.add(awn);
        var chim = CC.geo.instanced(boxGeo,
          new THREE.MeshLambertMaterial({ color: 0x8A5A40, flatShading: true }), chimList.length);
        chimList.forEach(function (c, i) {
          _q.identity(); _p.set(c.x, c.y, c.z); _s.set(0.9, 2.4, 0.9);
          _m4.compose(_p, _q, _s); chim.setMatrixAt(i, _m4);
        });
        chim.instanceMatrix.needsUpdate = true; group.add(chim);
      })();
      CC.city.buildings = archetypes;
      CC.city.buildLandmarks(group);
      scene.add(group);
      CC.city.group = group;
      return group;
    },
    buildLandmarks: function (group) {
      var cfg2 = CC.config;
      var tower = new THREE.Mesh(new THREE.CylinderGeometry(6, 9, 140, 12),
        new THREE.MeshLambertMaterial({ color: cfg2.palette.stucco, flatShading: true }));
      tower.position.set(0, 70, -200); tower.castShadow = true; group.add(tower);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(10, 1.6, 8, 24),
        new THREE.MeshLambertMaterial({ color: cfg2.palette.missionGold }));
      ring.rotation.x = Math.PI / 2; ring.position.set(0, 128, -200); group.add(ring);
      var hotel = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 70, 16, 1, false, 0, Math.PI),
        new THREE.MeshLambertMaterial({ color: 0x9FC4D8, flatShading: true }));
      hotel.position.set(320, 35, -160); group.add(hotel);
      CC.spatial.addBox(320, -160, 22, 22);
      var pier = new THREE.Mesh(new THREE.BoxGeometry(48, 14, 26),
        new THREE.MeshLambertMaterial({ color: 0xB9B1A3 }));
      pier.position.set(-200, 7, 240); pier.castShadow = true; group.add(pier);
      CC.spatial.addBox(-200, 240, 24, 13);
      var light = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4, 26, 10),
        new THREE.MeshLambertMaterial({ color: 0xF4E6C8 }));
      light.position.set(280, 13, 300); group.add(light);
      var top = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 8),
        new THREE.MeshLambertMaterial({ color: cfg2.palette.missionGold, emissive: 0x664400 }));
      top.position.set(280, 28, 300); group.add(top);
      var deckMat = new THREE.MeshLambertMaterial({ color: cfg2.palette.asphalt });
      var deck = new THREE.Mesh(new THREE.BoxGeometry(24, 2, 240), deckMat);
      deck.position.set(180, 9, -440); deck.castShadow = true; group.add(deck);
      var ramp = new THREE.Mesh(new THREE.BoxGeometry(24, 2, 60), deckMat);
      ramp.position.set(180, 4.5, -290); ramp.rotation.x = 0.16; group.add(ramp);
      [-380, -500].forEach(function (z) {
        // Towers run from the ground (y 0) to above the deck, never floating.
        var tower2 = new THREE.Mesh(new THREE.BoxGeometry(4, 55, 4),
          new THREE.MeshLambertMaterial({ color: 0xF4E6C8 }));
        tower2.position.set(180, 27.5, z); group.add(tower2);
        // Cables run from the tower top (y 50) down to the deck (y 10).
        var cable = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 53, 6),
          new THREE.MeshLambertMaterial({ color: 0x2B2B33 }));
        cable.position.set(168, 30, z + 17.5); cable.rotation.x = -0.72; group.add(cable);
        var cable2 = cable.clone(); cable2.position.x = 192; cable2.position.z = z - 17.5; cable2.rotation.x = 0.72; group.add(cable2);
      });
      var craneMat = new THREE.MeshLambertMaterial({ color: cfg2.palette.policeAmber });
      [[-240, 280], [-160, 285]].forEach(function (c) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(3, 34, 3), craneMat);
        leg.position.set(c[0], 17, c[1]); group.add(leg);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 40), craneMat);
        arm.position.set(c[0], 33, c[1] - 12); group.add(arm);
      });
      var contCols = [0xC8643B, 0x2BB3B0, 0x5E9A4A, 0xF2A81D];
      var crng = CC.rng.make(11);
      for (var i = 0; i < 24; i++) {
        var cont = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.6),
          new THREE.MeshLambertMaterial({ color: contCols[i % 4] }));
        cont.position.set(-260 + (i % 6) * 8, 1.3 + Math.floor(i / 6) * 2.7, 260 + crng.range(-6, 6));
        cont.castShadow = true; group.add(cont);
      }
    }
  };
})();
