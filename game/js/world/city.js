// Cinder Coast city: ground, road grid, ring road, Corvane Bridge, sea edge.
// Fresh Stage 2 write from BRIEF-04. Six districts join on one road network.
(function () {
  var CC = window.CinderCoast;
  var roads = [];
  function buildRoads() {
    roads.length = 0;
    var ewAt = [-480, -320, -240, -160, -80, 0, 80, 160, 240, 320];
    var nsAt = [-320, -240, -160, -80, 0, 80, 160, 240, 320];
    ewAt.forEach(function (z) { roads.push({ axis: 'ew', at: z, from: -320, to: 320 }); });
    nsAt.forEach(function (x) { roads.push({ axis: 'ns', at: x, from: -540, to: 320 }); });
    roads.push({ axis: 'ew', at: -540, from: -320, to: 320 });
    roads.push({ axis: 'ns', at: -320, from: -540, to: 320 });
    roads.push({ axis: 'ns', at: 320, from: -540, to: 320 });
    return roads;
  }
  CC.city = {
    roads: roads,
    build: function (scene, seed) {
      buildRoads();
      var cfg = CC.config;
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(680, 900),
        new THREE.MeshLambertMaterial({ color: 0xC9A37A }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, 0, -110);
      ground.receiveShadow = true;
      scene.add(ground);
      var beach = new THREE.Mesh(new THREE.PlaneGeometry(60, 900),
        new THREE.MeshLambertMaterial({ color: 0xE8D8B8 }));
      beach.rotation.x = -Math.PI / 2;
      beach.position.set(350, 0.05, -110);
      scene.add(beach);
      roads.forEach(function (r) {
        var len = r.to - r.from;
        var mid = (r.from + r.to) / 2;
        var mat = new THREE.MeshLambertMaterial({ color: cfg.palette.asphalt });
        var m;
        if (r.axis === 'ew') {
          m = new THREE.Mesh(new THREE.PlaneGeometry(len, 14), mat);
          m.rotation.x = -Math.PI / 2;
          m.position.set(mid, 0.06, r.at);
        } else {
          m = new THREE.Mesh(new THREE.PlaneGeometry(14, len), mat);
          m.rotation.x = -Math.PI / 2;
          m.position.set(r.at, 0.06, mid);
        }
        m.receiveShadow = true;
        scene.add(m);
        // Warm sidewalks on both kerbs, so no road sits on bare sand.
        var walkMat = new THREE.MeshLambertMaterial({ color: 0xE8C9A0 });
        [-9.5, 9.5].forEach(function (off) {
          var w;
          if (r.axis === 'ew') {
            w = new THREE.Mesh(new THREE.PlaneGeometry(len, 3), walkMat);
            w.rotation.x = -Math.PI / 2;
            w.position.set(mid, 0.08, r.at + off);
          } else {
            w = new THREE.Mesh(new THREE.PlaneGeometry(3, len), walkMat);
            w.rotation.x = -Math.PI / 2;
            w.position.set(r.at + off, 0.08, mid);
          }
          w.receiveShadow = true;
          scene.add(w);
        });
        var dashMat = new THREE.MeshBasicMaterial({ color: 0xF4E6C8 });
        var n = Math.floor(len / 12);
        for (var i = 0; i < n; i += 2) {
          var d = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.35), dashMat);
          d.rotation.x = -Math.PI / 2;
          if (r.axis === 'ew') d.position.set(r.from + 6 + i * 12, 0.09, r.at);
          else { d.position.set(r.at, 0.09, r.from + 6 + i * 12); d.rotation.z = Math.PI / 2; }
          scene.add(d);
        }
      });
      var ringMat = new THREE.MeshLambertMaterial({ color: 0x4A4A55 });
      var ringParts = [
        { geo: [680, 10], x: 0, z: 325 }, { geo: [680, 10], x: 0, z: -545 },
        { geo: [10, 880], x: -325, z: -110 }, { geo: [10, 880], x: 325, z: -110 }
      ];
      ringParts.forEach(function (rp) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(rp.geo[0], rp.geo[1]), ringMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(rp.x, 0.07, rp.z);
        scene.add(m);
      });
      var deck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 320),
        new THREE.MeshLambertMaterial({ color: 0x8A8F98 }));
      deck.position.set(0, 0.25, -320);
      deck.receiveShadow = true;
      scene.add(deck);
      var deckTop = new THREE.Mesh(new THREE.PlaneGeometry(22, 320),
        new THREE.MeshLambertMaterial({ color: cfg.palette.asphalt }));
      deckTop.rotation.x = -Math.PI / 2;
      deckTop.position.set(0, 0.51, -320);
      scene.add(deckTop);
      var towerMat = new THREE.MeshLambertMaterial({ color: 0xF4E6C8 });
      [-460, -180].forEach(function (z) {
        var t = new THREE.Mesh(new THREE.BoxGeometry(3, 42, 3), towerMat);
        t.position.set(-11, 21, z);
        scene.add(t);
        var t2 = new THREE.Mesh(new THREE.BoxGeometry(3, 42, 3), towerMat);
        t2.position.set(11, 21, z);
        scene.add(t2);
        var beam = new THREE.Mesh(new THREE.BoxGeometry(26, 3, 3), towerMat);
        beam.position.set(0, 42, z);
        scene.add(beam);
        var bsign = CC.geo.textSign('CORVANE BRIDGE', 20, 2.0);
        bsign.position.set(0, 38.5, z + 1.7);
        scene.add(bsign);
      });
      var water = new THREE.Mesh(new THREE.PlaneGeometry(120, 40),
        new THREE.MeshLambertMaterial({ color: cfg.palette.water }));
      water.rotation.x = -Math.PI / 2;
      water.position.set(0, 0.15, -320);
      scene.add(water);
      CC.districts.buildAll(scene, seed);
      if (CC.props) CC.props.build(scene, seed);
      if (CC.sky) CC.sky.build(scene);
      if (CC.lights) CC.lights.build(scene);
      return true;
    },
    districtAt: function (x, z) { return CC.config.districtAt(x, z); },
    nearestRoad: function (x, z) {
      var best = roads[0], bd = 1e9;
      roads.forEach(function (r) {
        var d = r.axis === 'ew' ? Math.abs(z - r.at) : Math.abs(x - r.at);
        if (d < bd) { bd = d; best = r; }
      });
      return best;
    },
    onBridge: function (x, z) { return Math.abs(x) < 13 && z > -480 && z < -160; },
    inWater: function (x, z) { return (x > 380 || z < -560 || z > 340) && !(x > 330 && z > -540); }
  };
})();

// City helpers: landmark lookups and road points for missions and shots.
(function () {
  var CC = window.CinderCoast;
  CC.city.landmark = function (name) {
    var lm = CC.config.landmarks[name];
    if (!lm) return [0, 0];
    return [lm[0], lm[1]];
  };
  CC.city.roadPoint = function (rng, axis, at, from, to) {
    var along = rng ? rng.range(from, to) : (from + to) / 2;
    if (axis === 'ew') return [along, at];
    return [at, along];
  };
  CC.city.spawnPoint = function (districtId) {
    var d = null;
    CC.config.districts.forEach(function (dd) { if (dd.id === districtId) d = dd; });
    if (!d) return [CC.config.spawn.x, CC.config.spawn.z];
    return [d.cx, d.cz + 40];
  };
  CC.city.clampToWorld = function (p) {
    p.x = Math.max(-330, Math.min(330, p.x));
    p.z = Math.max(-560, Math.min(330, p.z));
    return p;
  };
})();
