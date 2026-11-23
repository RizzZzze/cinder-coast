// Cinder Coast effects: muzzle flash, tracers, sparks, smoke, dust, explosions.
// Fresh Stage 2 write from BRIEF-04. Pooled meshes, density follows the
// quality governor, nothing allocates per frame in steady play.
(function () {
  var CC = window.CinderCoast;
  var pool = [], tracers = [], flashes = [], rings = [], lights = [];
  var sceneRef = null, glowTex = null;
  function makeGlowTex() {
    var cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    var cx = cv.getContext('2d');
    var g = cx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.4, 'rgba(255,180,80,0.8)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    cx.fillStyle = g;
    cx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  CC.fx = {
    density: 1,
    init: function (scene) {
      sceneRef = scene;
      glowTex = makeGlowTex();
      for (var i = 0; i < 48; i++) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshBasicMaterial({ color: 0xFFD166 }));
        m.visible = false;
        scene.add(m);
        pool.push({ mesh: m, life: 0, vx: 0, vy: 0, vz: 0, grav: 0 });
      }
      for (var t = 0; t < 10; t++) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
        var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0 }));
        line.visible = false;
        scene.add(line);
        tracers.push({ line: line, life: 0 });
      }
      for (var f = 0; f < 4; f++) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false }));
        sp.visible = false;
        scene.add(sp);
        flashes.push({ sprite: sp, life: 0 });
      }
      for (var r = 0; r < 4; r++) {
        var ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 24),
          new THREE.MeshBasicMaterial({ color: 0xFFD166, transparent: true, opacity: 0, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.visible = false;
        scene.add(ring);
        rings.push({ mesh: ring, life: 0 });
      }
    },
    spawn: function (x, y, z, colour, n, speed, grav, life) {
      if (!sceneRef) return;
      var count = Math.max(1, Math.round(n * CC.fx.density));
      for (var i = 0; i < count; i++) {
        var p = null;
        for (var j = 0; j < pool.length; j++) if (pool[j].life <= 0) { p = pool[j]; break; }
        if (!p) return;
        p.mesh.visible = true;
        p.mesh.material.color.setHex(colour);
        p.mesh.position.set(x, y, z);
        var a = Math.random() * Math.PI * 2, up = Math.random() * speed;
        p.vx = Math.cos(a) * speed * 0.6;
        p.vz = Math.sin(a) * speed * 0.6;
        p.vy = up;
        p.grav = grav;
        p.life = life * (0.7 + Math.random() * 0.6);
        p.maxLife = p.life;
      }
    },
    muzzle: function (x, y, z) {
      if (!sceneRef) return;
      for (var i = 0; i < flashes.length; i++) {
        if (flashes[i].life <= 0) {
          flashes[i].sprite.visible = true;
          flashes[i].sprite.position.set(x, y, z);
          flashes[i].sprite.scale.set(1.6, 1.6, 1);
          flashes[i].life = 0.07;
          return;
        }
      }
    },
    tracer: function (x1, y1, z1, x2, y2, z2) {
      if (!sceneRef) return;
      for (var i = 0; i < tracers.length; i++) {
        if (tracers[i].life <= 0) {
          var pos = tracers[i].line.geometry.attributes.position;
          pos.setXYZ(0, x1, y1, z1);
          pos.setXYZ(1, x2, y2, z2);
          pos.needsUpdate = true;
          tracers[i].line.visible = true;
          tracers[i].line.material.opacity = 0.9;
          tracers[i].life = 0.12;
          return;
        }
      }
    },
    sparks: function (x, y, z) { CC.fx.spawn(x, y, z, 0xFFD166, 6, 5, 9, 0.5); },
    dust: function (x, z) { CC.fx.spawn(x, 0.3, z, 0xC9A37A, 2, 1.2, -0.5, 0.7); },
    smoke: function (x, z) { CC.fx.spawn(x, 0.4, z, 0x8A8F98, 2, 0.8, -1.5, 0.9); },
    glass: function (x, y, z) { CC.fx.spawn(x, y, z, 0x9FC4D8, 10, 4, 12, 0.7); },
    tick: function (dt) {
      for (var i = 0; i < pool.length; i++) {
        var p = pool[i];
        if (p.life <= 0) continue;
        p.life -= dt;
        if (p.life <= 0) { p.mesh.visible = false; continue; }
        p.vy -= p.grav * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        if (p.mesh.position.y < 0.1) { p.mesh.position.y = 0.1; p.vy = 0; }
        p.mesh.material.opacity = Math.max(0, p.life / (p.maxLife || 1));
        p.mesh.material.transparent = true;
      }
      for (var t = 0; t < tracers.length; t++) {
        if (tracers[t].life <= 0) continue;
        tracers[t].life -= dt;
        tracers[t].line.material.opacity = Math.max(0, tracers[t].life / 0.12) * 0.9;
        if (tracers[t].life <= 0) tracers[t].line.visible = false;
      }
      for (var f = 0; f < flashes.length; f++) {
        if (flashes[f].life <= 0) continue;
        flashes[f].life -= dt;
        flashes[f].sprite.material.opacity = Math.max(0, flashes[f].life / 0.07);
        if (flashes[f].life <= 0) flashes[f].sprite.visible = false;
      }
      for (var r = 0; r < rings.length; r++) {
        if (rings[r].life <= 0) continue;
        rings[r].life -= dt;
        var s = 1 + (0.8 - rings[r].life) * 12;
        rings[r].mesh.scale.set(s, s, 1);
        rings[r].mesh.material.opacity = Math.max(0, rings[r].life / 0.8) * 0.8;
        if (rings[r].life <= 0) rings[r].mesh.visible = false;
      }
    },
    shockRing: function (x, z) {
      for (var i = 0; i < rings.length; i++) {
        if (rings[i].life <= 0) {
          rings[i].mesh.visible = true;
          rings[i].mesh.position.set(x, 0.4, z);
          rings[i].mesh.scale.set(1, 1, 1);
          rings[i].life = 0.8;
          return;
        }
      }
    }
  };
})();

// Effects: explosions, police light bars, headlight glow, per-frame update.
(function () {
  var CC = window.CinderCoast;
  var F = CC.fx;
  F.explosion = function (x, z) {
    if (!CC.S) return;
    F.spawn(x, 1, z, 0xE0433A, 14, 7, 6, 0.9);
    F.spawn(x, 0.6, z, 0x2B2B33, 8, 3, 2, 1.2);
    if (F.shockRing) F.shockRing(x, z);
    if (CC.S.scene) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, transparent: true, opacity: 0.9, color: 0xFFB050, depthWrite: false }));
      sp.position.set(x, 2, z);
      sp.scale.set(6, 6, 1);
      CC.S.scene.add(sp);
      setTimeout(function () { if (sp.parent) sp.parent.remove(sp); }, 450);
    }
    if (CC.camera3) CC.camera3.addShake(0.8);
  };
  F.policeLights = function (units, t) {
    if (!CC.S || !CC.S.scene) return;
    units.forEach(function (u) {
      if (!u.mesh) return;
      if (!u._lights) {
        var red = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xE0433A }));
        var blue = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.4),
          new THREE.MeshBasicMaterial({ color: 0x2B5F9E }));
        u.mesh.add(red); u.mesh.add(blue);
        red.position.set(-0.3, 1.55, 0); blue.position.set(0.3, 1.55, 0);
        u._lights = { red: red, blue: blue };
      }
      var on = Math.floor(t * 4) % 2 === 0;
      u._lights.red.visible = on;
      u._lights.blue.visible = !on;
    });
  };
  F.headlightGlow = function (v) {
    if (!v || !v.mesh || v._headlights) return;
    var mat = new THREE.SpriteMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.5, depthWrite: false });
    [-0.6, 0.6].forEach(function (dx) {
      var sp = new THREE.Sprite(mat);
      sp.scale.set(1.4, 1.4, 1);
      sp.position.set(dx, 0.7, v.def.len / 2 + 0.4);
      v.mesh.add(sp);
    });
    v._headlights = true;
  };
  F.update = function (dt) {
    var S = CC.S;
    if (!S) return;
    if (F.tick) F.tick(dt);
    if (S.vehicle && S.timeOfDay >= 17.5) F.headlightGlow(S.vehicle);
  };
})();
