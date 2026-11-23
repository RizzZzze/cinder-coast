// Cinder Coast effects: particle pools, tracers, muzzle flash, explosions.
(function () {
  var CC = window.CinderCoast;
  var particles = [], tracers = [], flashes = [];
  var sceneRef = null;
  function makePoints(n, colour, size) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    var mat = new THREE.PointsMaterial({ color: colour, size: size, transparent: true, opacity: 0.9, depthWrite: false });
    var pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return pts;
  }
  CC.fx = {
    density: 1,
    init: function (scene) {
      sceneRef = scene;
      var smoke = makePoints(120, 0x9A9A9A, 1.6);
      var sparks = makePoints(80, 0xFFD166, 0.5);
      var glass = makePoints(60, 0xD8F0F8, 0.45);
      scene.add(smoke); scene.add(sparks); scene.add(glass);
      particles.push({ pts: smoke, life: [], vel: [], max: 120, kind: 'smoke' });
      particles.push({ pts: sparks, life: [], vel: [], max: 80, kind: 'spark' });
      particles.push({ pts: glass, life: [], vel: [], max: 60, kind: 'glass' });
      particles.forEach(function (p) {
        for (var i = 0; i < p.max; i++) { p.life.push(0); p.vel.push([0, 0, 0]); }
      });
    },
    spawn: function (kind, x, z, n) {
      var idx = kind === 'smoke' ? 0 : kind === 'glass' ? 2 : 1;
      var p = particles[idx];
      if (!p) return;
      n = Math.max(1, Math.round(n * (CC.fx.density || 1)));
      var pos = p.pts.geometry.attributes.position;
      for (var k = 0; k < n; k++) {
        for (var i = 0; i < p.max; i++) {
          if (p.life[i] <= 0) {
            p.life[i] = kind === 'smoke' ? 1.2 : 0.4;
            pos.setXYZ(i, x + (Math.random() - 0.5), 0.8 + Math.random(), z + (Math.random() - 0.5));
            p.vel[i] = [(Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2];
            break;
          }
        }
      }
      pos.needsUpdate = true;
    },
    smoke: function (x, z) { CC.fx.spawn('smoke', x, z, 2); },
    dust: function (x, z) { CC.fx.spawn('smoke', x, z, 1); },
    sparks: function (x, z) { CC.fx.spawn('spark', x, z, 6); },
    glass: function (x, z) { CC.fx.spawn('glass', x, z, 14); },
    shockRing: function (x, z) {
      if (!sceneRef) return;
      var geo = new THREE.RingGeometry(0.5, 1, 24);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
      var m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.3, z);
      sceneRef.add(m);
      flashes.push({ mesh: m, life: 0.6, ring: true });
    },
    muzzle: function (x, z, yaw) {
      if (!sceneRef) return;
      var geo = new THREE.PlaneGeometry(1.2, 1.2);
      var mat = new THREE.MeshBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x + Math.sin(yaw) * 1.2, 1.4, z + Math.cos(yaw) * 1.2);
      m.rotation.y = yaw;
      sceneRef.add(m);
      flashes.push({ mesh: m, life: 0.07 });
    },
    tracer: function (x1, z1, x2, z2) {
      if (!sceneRef) return;
      var geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 1.3, z1), new THREE.Vector3(x2, 1.3, z2)
      ]);
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0.9 }));
      sceneRef.add(line);
      tracers.push({ line: line, life: 0.12 });
    },
    explosion: function (x, z) {
      CC.fx.spawn('spark', x, z, 30);
      CC.fx.spawn('smoke', x, z, 20);
      CC.fx.spawn('glass', x, z, 14);
      CC.fx.shockRing(x, z);
      if (!sceneRef) return;
      var ball = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xFF7A2A, transparent: true, opacity: 0.9 }));
      ball.position.set(x, 1.5, z);
      sceneRef.add(ball);
      flashes.push({ mesh: ball, life: 0.5, grow: true });
      if (CC.S) CC.S.shake = 1;
    },
    update: function (dt) {
      particles.forEach(function (p) {
        var pos = p.pts.geometry.attributes.position;
        var changed = false;
        for (var i = 0; i < p.max; i++) {
          if (p.life[i] > 0) {
            p.life[i] -= dt;
            pos.setXYZ(i, pos.getX(i) + p.vel[i][0] * dt, Math.max(0.2, pos.getY(i) + p.vel[i][1] * dt), pos.getZ(i) + p.vel[i][2] * dt);
            if (p.life[i] <= 0) pos.setXYZ(i, 0, -10, 0);
            changed = true;
          }
        }
        if (changed) pos.needsUpdate = true;
      });
      for (var i = flashes.length - 1; i >= 0; i--) {
        flashes[i].life -= dt;
        if (flashes[i].grow) flashes[i].mesh.scale.multiplyScalar(1 + dt * 6);
        if (flashes[i].ring) {
          flashes[i].mesh.scale.multiplyScalar(1 + dt * 14);
          flashes[i].mesh.material.opacity = Math.max(0, flashes[i].life / 0.6 * 0.85);
        }
        if (flashes[i].life <= 0) {
          sceneRef.remove(flashes[i].mesh);
          flashes.splice(i, 1);
        }
      }
      for (var j = tracers.length - 1; j >= 0; j--) {
        tracers[j].life -= dt;
        if (tracers[j].life <= 0) {
          sceneRef.remove(tracers[j].line);
          tracers.splice(j, 1);
        }
      }
      // Vehicle headlight glow at dusk: a warm sprite ahead of the player's
      // vehicle, visible only when the time of day is dusk or night.
      var S2 = CC.S;
      var dusk = !!(S2 && (S2.timeOfDay >= 17.5 || S2.timeOfDay < 6));
      if (dusk && S2.vehicle && S2.vehicle.mesh && !S2.vehicle.mesh.userData.headGlow) {
        var cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
        var cx = cv.getContext('2d');
        var g = cx.createRadialGradient(32, 32, 2, 32, 32, 30);
        g.addColorStop(0, 'rgba(255,240,180,0.9)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
        var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
        spr.scale.set(6, 3, 1);
        spr.position.set(0, 0.8, (S2.vehicle.def.len || 4) / 2 + 1.5);
        S2.vehicle.mesh.add(spr);
        S2.vehicle.mesh.userData.headGlow = spr;
      }
      if (S2 && S2.vehicle && S2.vehicle.mesh && S2.vehicle.mesh.userData.headGlow) {
        S2.vehicle.mesh.userData.headGlow.visible = dusk;
      }
    }
  };
})();
