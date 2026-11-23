// Cinder Coast props: palms, lamps, signs, barriers, water, cranes.
(function () {
  var CC = window.CinderCoast;
  CC.props = {
    build: function (scene, seed) {
      var rng = CC.rng.make(seed + 100);
      var cfg = CC.config;
      var water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 320),
        new THREE.MeshLambertMaterial({ color: cfg.palette.water }));
      water.rotation.x = -Math.PI / 2; water.position.set(0, 0.1, 460); scene.add(water);
      var water2 = new THREE.Mesh(new THREE.PlaneGeometry(320, 1400),
        new THREE.MeshLambertMaterial({ color: cfg.palette.water }));
      water2.rotation.x = -Math.PI / 2; water2.position.set(480, 0.1, 0); scene.add(water2);
      var palmGeo = CC.geo.mergeParts([
        { shape: 'cyl', rTop: 0.12, rBot: 0.2, h: 5.5, x: 0, y: 2.75, z: 0, color: 0x8A6B4A },
        { shape: 'cone', r: 1.6, h: 1.6, x: 0, y: 5.9, z: 0, color: 0x5E9A4A },
        { shape: 'cone', r: 1.2, h: 1.2, x: 0, y: 6.6, z: 0, color: 0x6FAE56 }
      ]);
      var palmMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
      var palms = new THREE.InstancedMesh(palmGeo, palmMat, 90);
      var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      for (var i = 0; i < 90; i++) {
        var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var along = rng.range(road.from + 20, road.to - 20);
        if (road.axis === 'ew') p.set(along, 0, road.at + (rng.chance(0.5) ? 9 : -9));
        else p.set(road.at + (rng.chance(0.5) ? 9 : -9), 0, along);
        if (p.z > 290) { p.z = 270; }
        m4.compose(p, q, s); palms.setMatrixAt(i, m4);
      }
      palms.castShadow = true; scene.add(palms);
      var lampMat = new THREE.MeshLambertMaterial({ color: 0x2B2B33 });
      var lamps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), lampMat, 60);
      for (var j = 0; j < 60; j++) {
        var r2 = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var a2 = rng.range(r2.from + 20, r2.to - 20);
        if (r2.axis === 'ew') p.set(a2, 3, r2.at + 8); else p.set(r2.at + 8, 3, a2);
        m4.compose(p, q, s); lamps.setMatrixAt(j, m4);
      }
      scene.add(lamps);
      var stallCols = [0xC8643B, 0xF2A81D, 0x2BB3B0, 0xE0433A];
      for (var k = 0; k < 10; k++) {
        var stall = new THREE.Group();
        var awn = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 4),
          new THREE.MeshLambertMaterial({ color: stallCols[k % 4] }));
        awn.position.y = 2.6; awn.rotation.z = 0.18; stall.add(awn);
        var counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.4),
          new THREE.MeshLambertMaterial({ color: 0x8A6B4A }));
        counter.position.y = 0.55; stall.add(counter);
        stall.position.set(-120 + k * 12, 0, 96 + (k % 2) * 6);
        scene.add(stall);
        CC.spatial.addBox(stall.position.x, stall.position.z, 2.4, 1.6);
      }
      var barrierMat = new THREE.MeshLambertMaterial({ color: 0xF2A81D });
      for (var b = 0; b < 8; b++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), barrierMat);
        bar.position.set(-40 + b * 4, 0.5, 240); scene.add(bar);
      }
      var sign = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.4),
        new THREE.MeshLambertMaterial({ color: 0xF4E6C8 }));
      sign.position.set(-200, 10, 232); scene.add(sign);
      return true;
    }
  };
})();
