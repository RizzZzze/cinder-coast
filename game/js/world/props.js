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
      var palms = CC.geo.instanced(palmGeo, palmMat, 160);
      var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      for (var i = 0; i < 160; i++) {
        var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var along = rng.range(road.from + 20, road.to - 20);
        if (road.axis === 'ew') p.set(along, 0, road.at + (rng.chance(0.5) ? 9 : -9));
        else p.set(road.at + (rng.chance(0.5) ? 9 : -9), 0, along);
        if (p.z > 290) { p.z = 270; }
        m4.compose(p, q, s); palms.setMatrixAt(i, m4);
      }
      palms.castShadow = true; scene.add(palms);
      var lampMat = new THREE.MeshLambertMaterial({ color: 0x2B2B33 });
      var lamps = CC.geo.instanced(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), lampMat, 60);
      for (var j = 0; j < 60; j++) {
        var r2 = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var a2 = rng.range(r2.from + 20, r2.to - 20);
        if (r2.axis === 'ew') p.set(a2, 3, r2.at + 8); else p.set(r2.at + 8, 3, a2);
        m4.compose(p, q, s); lamps.setMatrixAt(j, m4);
      }
      scene.add(lamps);
      var stallCols = [0xC8643B, 0xF2A81D, 0x2BB3B0, 0xE0433A];
      var postMat = new THREE.MeshLambertMaterial({ color: 0x5A4632 });
      for (var k = 0; k < 10; k++) {
        var stall = new THREE.Group();
        var awn = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 4),
          new THREE.MeshLambertMaterial({ color: stallCols[k % 4] }));
        awn.position.y = 2.6; stall.add(awn);
        var counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 2.4),
          new THREE.MeshLambertMaterial({ color: 0x8A6B4A }));
        counter.position.y = 0.55; stall.add(counter);
        // Four posts hold the awning: counter top (y 1.1) to awning (y 2.45).
        [[-2.1, -1.7], [2.1, -1.7], [-2.1, 1.7], [2.1, 1.7]].forEach(function (pc) {
          var post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), postMat);
          post.position.set(pc[0], 1.8, pc[1]); stall.add(post);
        });
        stall.position.set(-120 + k * 12, 0, 96 + (k % 2) * 6);
        scene.add(stall);
        CC.spatial.addBox(stall.position.x, stall.position.z, 2.4, 1.6);
      }
      var barrierMat = new THREE.MeshLambertMaterial({ color: 0xF2A81D });
      for (var b = 0; b < 8; b++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), barrierMat);
        bar.position.set(-40 + b * 4, 0.5, 240); scene.add(bar);
      }
      var sign = CC.geo.textSign('PORT CALIDA', 10, 1.8);
      sign.position.set(-232, 10, 258); scene.add(sign);
      // Two posts carry the sign down to the ground, it no longer floats.
      [-235.5, -228.5].forEach(function (sx) {
        var spost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.5, 0.3), postMat);
        spost.position.set(sx, 4.25, 258); scene.add(spost);
      });
      // Ground-level street detail: planters, crates, bollards, benches.
      (function () {
        var _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
        var planterBase = CC.geo.instanced(new THREE.BoxGeometry(1.6, 0.7, 1.6),
          new THREE.MeshLambertMaterial({ color: 0x8A6B4A }), 60);
        var planterTop = CC.geo.instanced(new THREE.BoxGeometry(1.4, 0.5, 1.4),
          new THREE.MeshLambertMaterial({ color: 0x5E9A4A }), 60);
        for (var pi = 0; pi < 60; pi++) {
          var pr = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
          var pa = rng.range(pr.from + 20, pr.to - 20);
          if (pr.axis === 'ew') _p.set(pa, 0, pr.at + (rng.chance(0.5) ? 9.5 : -9.5));
          else _p.set(pr.at + (rng.chance(0.5) ? 9.5 : -9.5), 0, pa);
          if (_p.z > 290) _p.z = 270;
          _q.identity(); _s.set(1, 1, 1);
          _p.y = 0.35; _m4.compose(_p, _q, _s); planterBase.setMatrixAt(pi, _m4);
          _p.y = 0.9; _m4.compose(_p, _q, _s); planterTop.setMatrixAt(pi, _m4);
        }
        planterBase.instanceMatrix.needsUpdate = true; planterTop.instanceMatrix.needsUpdate = true;
        scene.add(planterBase); scene.add(planterTop);
        var crates = CC.geo.instanced(new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshLambertMaterial({ color: 0x8A6B4A }), 28);
        var crng = CC.rng.make(seed + 300);
        var cratePos = [];
        for (var ci = 0; ci < 28; ci++) {
          var cpos;
          if (ci % 3 === 2 && cratePos.length > 0) {
            // Stacked on the previous crate, never floating.
            cpos = cratePos[cratePos.length - 1];
            _p.set(cpos.x, 1.5, cpos.z);
          } else {
            cpos = { x: -260 + crng.range(0, 90), z: 250 + crng.range(0, 30) };
            cratePos.push(cpos);
            _p.set(cpos.x, 0.5, cpos.z);
          }
          _q.identity(); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); crates.setMatrixAt(ci, _m4);
        }
        crates.instanceMatrix.needsUpdate = true; scene.add(crates);
        var bollards = CC.geo.instanced(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 6),
          new THREE.MeshLambertMaterial({ color: 0x2B2B33 }), 50);
        for (var bi = 0; bi < 50; bi++) {
          _p.set(-300 + bi * 12, 0.45, 286); _q.identity(); _s.set(1, 1, 1);
          _m4.compose(_p, _q, _s); bollards.setMatrixAt(bi, _m4);
        }
        bollards.instanceMatrix.needsUpdate = true; scene.add(bollards);
        var benchSeat = CC.geo.instanced(new THREE.BoxGeometry(2.4, 0.9, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x6B4A2F }), 24);
        var benchBack = CC.geo.instanced(new THREE.BoxGeometry(2.4, 0.9, 0.14),
          new THREE.MeshLambertMaterial({ color: 0x6B4A2F }), 24);
        for (var bei = 0; bei < 24; bei++) {
          var bx = -240 + (bei % 8) * 30, bz = 60 + Math.floor(bei / 8) * 70;
          _q.identity(); _s.set(1, 1, 1);
          _p.set(bx, 0.45, bz); _m4.compose(_p, _q, _s); benchSeat.setMatrixAt(bei, _m4);
          _p.set(bx, 0.9, bz - 0.4); _m4.compose(_p, _q, _s); benchBack.setMatrixAt(bei, _m4);
        }
        benchSeat.instanceMatrix.needsUpdate = true; benchBack.instanceMatrix.needsUpdate = true;
        scene.add(benchSeat); scene.add(benchBack);
        // Hydrants and bins along the kerbs, so sidewalks carry street furniture.
        var hydrants = CC.geo.instanced(new THREE.CylinderGeometry(0.28, 0.34, 0.9, 8),
          new THREE.MeshLambertMaterial({ color: 0xE0433A }), 24);
        var bins = CC.geo.instanced(new THREE.CylinderGeometry(0.4, 0.36, 1.0, 8),
          new THREE.MeshLambertMaterial({ color: 0x3A5A3A }), 24);
        for (var hi = 0; hi < 24; hi++) {
          var hr = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
          var ha = rng.range(hr.from + 20, hr.to - 20);
          if (hr.axis === 'ew') { _p.set(ha, 0.45, hr.at + (rng.chance(0.5) ? 9.5 : -9.5)); }
          else { _p.set(hr.at + (rng.chance(0.5) ? 9.5 : -9.5), 0.45, ha); }
          if (_p.z > 290) _p.z = 270;
          _q.identity(); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); hydrants.setMatrixAt(hi, _m4);
          var hr2 = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
          var ha2 = rng.range(hr2.from + 20, hr2.to - 20);
          if (hr2.axis === 'ew') { _p.set(ha2, 0.5, hr2.at + (rng.chance(0.5) ? 9.5 : -9.5)); }
          else { _p.set(hr2.at + (rng.chance(0.5) ? 9.5 : -9.5), 0.5, ha2); }
          if (_p.z > 290) _p.z = 270;
          _m4.compose(_p, _q, _s); bins.setMatrixAt(hi, _m4);
        }
        hydrants.instanceMatrix.needsUpdate = true; bins.instanceMatrix.needsUpdate = true;
        scene.add(hydrants); scene.add(bins);
      })();
      return true;
    }
  };
})();
