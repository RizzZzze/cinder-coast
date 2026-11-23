// Cinder Coast vehicles: vehicle models, colours, parked-car instances.
(function () {
  var CC = window.CinderCoast;
  var parked = null, parkedData = [];
  CC.vehicles = {
    parkedData: parkedData,
    make: function (scene, key, x, z, heading, colour) {
      var def = CC.config.vehicles[key];
      var mesh = CC.geo.carBody(def, colour);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = heading || 0;
      scene.add(mesh);
      var v = {
        key: key, def: def, mesh: mesh, x: x, z: z, heading: heading || 0,
        speed: 0, steer: 0, damage: 0, hot: false, owned: false,
        towed: null, engineOn: true, smokeTimer: 0
      };
      return v;
    },
    buildParked: function (scene, seed) {
      var rng = CC.rng.make(seed + 200);
      var keys = ['sprint', 'spindle', 'cutter', 'nomad', 'courier'];
      var defs = keys.map(function (k) { return CC.config.vehicles[k]; });
      var geo = CC.geo.mergeParts([
        { shape: 'box', w: 1.9, h: 0.55, d: 4.2, x: 0, y: 0.55, z: 0, color: 0xFFFFFF },
        { shape: 'box', w: 1.75, h: 0.34, d: 1.26, x: 0, y: 0.88, z: 1.3, rx: 0.14, color: 0xFFFFFF },
        { shape: 'box', w: 1.52, h: 0.5, d: 1.85, x: 0, y: 1.05, z: -0.21, color: 0x9FC4D8 },
        { shape: 'box', w: 1.48, h: 0.08, d: 1.68, x: 0, y: 1.33, z: -0.21, color: 0xFFFFFF },
        { shape: 'box', w: 1.79, h: 0.3, d: 0.76, x: 0, y: 0.9, z: -1.6, color: 0xFFFFFF },
        { shape: 'box', w: 1.9, h: 0.16, d: 0.12, x: 0, y: 0.42, z: 2.1, color: 0x1A1A22 },
        { shape: 'box', w: 1.9, h: 0.16, d: 0.12, x: 0, y: 0.42, z: -2.1, color: 0x1A1A22 },
        { shape: 'box', w: 0.34, h: 0.14, d: 0.08, x: -0.57, y: 0.72, z: 2.11, color: 0xFFF2B0 },
        { shape: 'box', w: 0.34, h: 0.14, d: 0.08, x: 0.57, y: 0.72, z: 2.11, color: 0xFFF2B0 },
        { shape: 'box', w: 0.3, h: 0.12, d: 0.08, x: -0.57, y: 0.75, z: -2.11, color: 0xE0433A },
        { shape: 'box', w: 0.3, h: 0.12, d: 0.08, x: 0.57, y: 0.75, z: -2.11, color: 0xE0433A },
        { shape: 'cyl', rTop: 0.38, rBot: 0.38, h: 0.3, x: -0.9, y: 0.38, z: 1.34, rz: Math.PI / 2, color: 0x1A1A22 },
        { shape: 'cyl', rTop: 0.38, rBot: 0.38, h: 0.3, x: 0.9, y: 0.38, z: 1.34, rz: Math.PI / 2, color: 0x1A1A22 },
        { shape: 'cyl', rTop: 0.38, rBot: 0.38, h: 0.3, x: -0.9, y: 0.38, z: -1.34, rz: Math.PI / 2, color: 0x1A1A22 },
        { shape: 'cyl', rTop: 0.38, rBot: 0.38, h: 0.3, x: 0.9, y: 0.38, z: -1.34, rz: Math.PI / 2, color: 0x1A1A22 }
      ]);
      var mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
      parked = CC.geo.instanced(geo, mat, CC.config.caps.parked);
      var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      var col = new THREE.Color();
      parkedData.length = 0;
      for (var i = 0; i < CC.config.caps.parked; i++) {
        var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var along = rng.range(road.from + 15, road.to - 15);
        var side = rng.chance(0.5) ? 6.2 : -6.2;
        var x, z, heading;
        if (road.axis === 'ew') { x = along; z = road.at + side; heading = side > 0 ? Math.PI / 2 : -Math.PI / 2; }
        else { x = road.at + side; z = along; heading = side > 0 ? Math.PI : 0; }
        var key = rng.pick(keys);
        var c = new THREE.Color(rng.pick([0x7FA8C9, 0xC0392B, 0xD9A441, 0x5E9A4A, 0xF4E6C8, 0x8A8F98]));
        p.set(x, 0, z);
        q.setFromEuler(new THREE.Euler(0, heading, 0));
        m4.compose(p, q, s);
        parked.setMatrixAt(i, m4);
        parked.setColorAt(i, c);
        parkedData.push({ index: i, key: key, x: x, z: z, heading: heading, colour: c.getHex(), taken: false, driver: rng.chance(0.5) });
      }
      parked.instanceMatrix.needsUpdate = true;
      if (parked.instanceColor) parked.instanceColor.needsUpdate = true;
      scene.add(parked);
      CC.vehicles.parkedMesh = parked;
      return parked;
    },
    nearestParked: function (x, z, maxD) {
      var best = null, bd = maxD || 1e9;
      parkedData.forEach(function (d) {
        if (d.taken) return;
        var dist = Math.hypot(d.x - x, d.z - z);
        if (dist < bd) { bd = dist; best = d; }
      });
      return best;
    },
    takeParked: function (d) {
      d.taken = true;
      var m4 = new THREE.Matrix4();
      m4.makeScale(0, 0, 0);
      parked.setMatrixAt(d.index, m4);
      parked.instanceMatrix.needsUpdate = true;
    }
  };
})();
