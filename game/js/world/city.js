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
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), groundMat);
      ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 0); ground.receiveShadow = true;
      group.add(ground);
      roadLines().forEach(function (r) {
        var len = r.to - r.from;
        var road = new THREE.Mesh(new THREE.PlaneGeometry(r.axis === 'ew' ? len : 14, r.axis === 'ew' ? 14 : len), roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(r.axis === 'ew' ? (r.from + r.to) / 2 : r.at, 0, r.axis === 'ew' ? r.at : (r.from + r.to) / 2);
        road.receiveShadow = true; group.add(road);
        for (var s = r.from + 10; s < r.to; s += 20) {
          var dash = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.4), kerbMat);
          dash.rotation.x = -Math.PI / 2;
          if (r.axis === 'ew') { dash.position.set(s, 0.02, r.at); dash.rotation.z = 0; }
          else { dash.position.set(r.at, 0.02, s); dash.rotation.z = Math.PI / 2; }
          group.add(dash);
        }
      });
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
            archetypes.push({ x: x, z: z, w: w, d: d, h: h, color: col, roof: rng.chance(0.6) });
            CC.spatial.addBox(x, z, w / 2, d / 2);
          }
        }
      }
      var boxGeo = new THREE.BoxGeometry(1, 1, 1);
      var roofGeo = new THREE.ConeGeometry(0.72, 1, 4);
      var byColour = {};
      archetypes.forEach(function (b) {
        var key = b.color + ':' + (b.roof ? 'r' : 'f');
        (byColour[key] = byColour[key] || []).push(b);
      });
      Object.keys(byColour).forEach(function (key) {
        var list = byColour[key];
        var mat = new THREE.MeshLambertMaterial({ color: list[0].color, flatShading: true });
        var inst = new THREE.InstancedMesh(boxGeo, mat, list.length);
        var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
        list.forEach(function (b, i) {
          p.set(b.x, b.h / 2, b.z); s.set(b.w, b.h, b.d);
          m4.compose(p, q, s); inst.setMatrixAt(i, m4);
        });
        inst.instanceMatrix.needsUpdate = true;
        inst.castShadow = true; inst.receiveShadow = true;
        inst.userData.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 500);
        group.add(inst);
        if (list[0].roof) {
          var rmat = new THREE.MeshLambertMaterial({ color: cfg.palette.terracotta, flatShading: true });
          var rinst = new THREE.InstancedMesh(roofGeo, rmat, list.length);
          list.forEach(function (b, i) {
            p.set(b.x, b.h + 3, b.z); s.set(b.w * 0.68, 6, b.d * 0.68);
            q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
            m4.compose(p, q, s); rinst.setMatrixAt(i, m4);
            q.identity();
          });
          rinst.instanceMatrix.needsUpdate = true;
          group.add(rinst);
        }
      });
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
        var tower2 = new THREE.Mesh(new THREE.BoxGeometry(4, 46, 4),
          new THREE.MeshLambertMaterial({ color: 0xF4E6C8 }));
        tower2.position.set(180, 32, z); group.add(tower2);
        var cable = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 60, 6),
          new THREE.MeshLambertMaterial({ color: 0x2B2B33 }));
        cable.position.set(168, 26, z + 30); cable.rotation.x = 0.7; group.add(cable);
        var cable2 = cable.clone(); cable2.position.x = 192; cable2.rotation.x = -0.7; group.add(cable2);
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
