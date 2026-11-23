// Cinder Coast police: police unit AI — pursuit, search, roadblocks, shooting.
// Response spawns out of view, 150–250 m away. 1–2 stars: cruiser pairs that
// search the last known position. 3 stars: a roadblock of three cruisers and
// four foot officers behind barriers. 4 stars: SWAT vans and rifle officers.
// 5 stars: a police helicopter that orbits with a spotlight.
(function () {
  var CC = window.CinderCoast;
  function spawnPos(S, rng) {
    for (var tries = 0; tries < 12; tries++) {
      var a = rng.range(0, Math.PI * 2), d = rng.range(150, 250);
      var x = S.player.x + Math.cos(a) * d, z = S.player.z + Math.sin(a) * d;
      if (Math.abs(x) > 330 || Math.abs(z) > 330) continue;
      var rp = CC.city.nearestRoadPoint(x, z);
      if (rp.dist < 12) return { x: rp.x, z: rp.z };
    }
    return { x: S.player.x + 160, z: S.player.z };
  }
  function makeFoot(S, x, z, rifle) {
    var mesh = CC.geo.personMesh(0x1F3A5F, 0xE8B88A);
    mesh.position.set(x, 0, z);
    S.scene.add(mesh);
    return { kind: 'foot', mesh: mesh, x: x, z: z, heading: 0, speed: 0, health: 60, state: 'search', shootTimer: Math.random(), rifle: !!rifle, burstLeft: 0, burstTimer: 0 };
  }
  CC.police = {
    onStarsUp: function (stars) {
      var S = CC.S;
      if (!S) return;
      var want = stars <= 0 ? 0 : stars === 1 ? 2 : stars === 2 ? 4 : 6;
      var rng = CC.rng.make(S.seed + 300 + stars);
      while (S.police.length < want) {
        var p = spawnPos(S, rng);
        var mesh = CC.geo.carBody(CC.config.vehicles.ardent);
        S.scene.add(mesh);
        S.police.push({
          kind: 'cruiser', mesh: mesh, x: p.x, z: p.z, heading: 0,
          speed: 0, health: 100, state: 'search', lastKnownX: S.player.x, lastKnownZ: S.player.z,
          shootTimer: 0, sirenPhase: rng.range(0, 6)
        });
      }
      if (stars >= 3 && !S.roadblock) CC.police.makeRoadblock();
      if (stars >= 4) {
        var swats = S.police.filter(function (u) { return u.kind === 'swat'; }).length;
        while (swats < 2) {
          var sp = spawnPos(S, rng);
          var sm = CC.geo.carBody(CC.config.vehicles.swatvan);
          S.scene.add(sm);
          S.police.push({ kind: 'swat', mesh: sm, x: sp.x, z: sp.z, heading: 0, speed: 0, health: 160, state: 'search', shootTimer: 0 });
          swats++;
        }
        var rifles = S.police.filter(function (u) { return u.kind === 'foot' && u.rifle; }).length;
        while (rifles < 4) {
          var rp = CC.city.nearestRoadPoint(S.player.x + rng.range(-40, 40), S.player.z + rng.range(-40, 40));
          S.police.push(makeFoot(S, rp.x, rp.z, true));
          rifles++;
        }
        if (CC.notify) CC.notify.push('SWAT deployed — 4 stars');
      }
      if (stars >= 5 && !S.heli) CC.police.makeHeli();
    },
    makeHeli: function () {
      var S = CC.S;
      if (!S) return;
      var group = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 7),
        new THREE.MeshLambertMaterial({ color: 0x1F3A5F }));
      group.add(body);
      var tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 5),
        new THREE.MeshLambertMaterial({ color: 0x1F3A5F }));
      tail.position.set(0, 0.3, -5); group.add(tail);
      var rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.15, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x2B2B33 }));
      rotor.position.y = 1.2; group.add(rotor);
      var cone = new THREE.Mesh(new THREE.ConeGeometry(6, 36, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      cone.position.y = -18; cone.rotation.x = Math.PI;
      group.add(cone);
      group.position.set(S.player.x + 45, 38, S.player.z);
      S.scene.add(group);
      S.heli = { mesh: group, rotor: rotor, angle: 0 };
      if (CC.notify) CC.notify.push('Police helicopter overhead — 5 stars');
    },
    removeHeli: function () {
      var S = CC.S;
      if (!S || !S.heli) return;
      if (S.heli.mesh.parent) S.heli.mesh.parent.remove(S.heli.mesh);
      S.heli = null;
    },
    makeRoadblock: function () {
      var S = CC.S;
      if (!S) return;
      var rp = CC.city.nearestRoadPoint(S.player.x + 60, S.player.z);
      S.roadblock = { x: rp.x, z: rp.z, units: [] };
      for (var i = 0; i < 3; i++) {
        var mesh = CC.geo.carBody(CC.config.vehicles.ardent);
        mesh.position.set(rp.x - 8 + i * 8, 0, rp.z);
        mesh.rotation.y = Math.PI / 2 + (i - 1) * 0.5;
        S.scene.add(mesh);
        S.roadblock.units.push({ kind: 'cruiser', mesh: mesh, x: rp.x - 8 + i * 8, z: rp.z, heading: 0, speed: 0, health: 100, state: 'block', shootTimer: 0 });
      }
      for (var j = 0; j < 4; j++) {
        var off = CC.geo.personMesh(0x1F3A5F, 0xE8B88A);
        off.position.set(rp.x - 12 + j * 8, 0, rp.z + 6);
        S.scene.add(off);
        S.roadblock.units.push({ kind: 'foot', mesh: off, x: rp.x - 12 + j * 8, z: rp.z + 6, heading: 0, speed: 0, health: 60, state: 'block', shootTimer: j * 0.4, rifle: false, burstLeft: 0, burstTimer: 0 });
      }
      if (CC.notify) CC.notify.push('Roadblock ahead — 3 stars');
    },
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      if (S.stars < 5 && S.heli) CC.police.removeHeli();
      if (S.heli) {
        var h = S.heli;
        h.angle += dt * 0.35;
        h.mesh.position.set(S.player.x + Math.cos(h.angle) * 45, 38, S.player.z + Math.sin(h.angle) * 45);
        h.rotor.rotation.y += dt * 18;
        h.mesh.lookAt(S.player.x, 0, S.player.z);
      }
      S.police.forEach(function (u) {
        var dx = S.player.x - u.x, dz = S.player.z - u.z;
        var d = Math.hypot(dx, dz) || 1;
        if (u.kind === 'cruiser' || u.kind === 'swat') {
          var wantHeading = Math.atan2(dx, dz);
          var dh = wantHeading - u.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          u.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
          var topSpeed = u.kind === 'swat' ? 20 : 26;
          var target = d > 18 ? topSpeed : (d < 8 ? -6 : 0);
          u.speed += (target - u.speed) * Math.min(1, dt * 1.2);
          u.x += Math.sin(u.heading) * u.speed * dt;
          u.z += Math.cos(u.heading) * u.speed * dt;
          u.mesh.position.set(u.x, 0, u.z);
          u.mesh.rotation.y = u.heading;
          u.shootTimer -= dt;
          if (d < CC.config.tuning.policeShootRange && u.shootTimer <= 0) {
            u.shootTimer = 0.9;
            if (CC.fx) CC.fx.tracer(u.x, u.z, S.player.x, S.player.z);
            if (Math.random() < 0.45) CC.damage.hurt(6, 'police fire');
          }
        } else if (u.kind === 'foot') {
          if (d > 16) {
            u.x += dx / d * 3 * dt;
            u.z += dz / d * 3 * dt;
            u.mesh.position.set(u.x, 0, u.z);
          }
          u.mesh.rotation.y = Math.atan2(dx, dz);
          u.shootTimer -= dt;
          if (u.burstLeft > 0) {
            u.burstTimer -= dt;
            if (u.burstTimer <= 0) {
              u.burstTimer = 0.16;
              u.burstLeft--;
              if (CC.fx) CC.fx.tracer(u.x, u.z, S.player.x, S.player.z);
              if (Math.random() < 0.3) CC.damage.hurt(u.rifle ? 8 : 5, 'police fire');
            }
          } else if (d < 45 && u.shootTimer <= 0) {
            u.shootTimer = u.rifle ? 1.7 : 2.2;
            u.burstLeft = u.rifle ? 4 : 3;
            u.burstTimer = 0;
          }
        }
      });
      // Cruisers avoid self-ramming: push overlapping units apart.
      for (var a = 0; a < S.police.length; a++) {
        for (var b = a + 1; b < S.police.length; b++) {
          var u1 = S.police[a], u2 = S.police[b];
          if (u1.kind === 'foot' || u2.kind === 'foot') continue;
          var sx = u2.x - u1.x, sz = u2.z - u1.z, sd = Math.hypot(sx, sz);
          if (sd < 6 && sd > 0.01) {
            var push = (6 - sd) / 2;
            u1.x -= sx / sd * push; u1.z -= sz / sd * push;
            u2.x += sx / sd * push; u2.z += sz / sd * push;
          }
        }
      }
      if (S.roadblock) {
        S.roadblock.units.forEach(function (u) {
          if (u.kind !== 'foot') return;
          u.shootTimer -= dt;
          var d = Math.hypot(S.player.x - u.x, S.player.z - u.z);
          if (u.burstLeft > 0) {
            u.burstTimer -= dt;
            if (u.burstTimer <= 0) {
              u.burstTimer = 0.16;
              u.burstLeft--;
              if (CC.fx) CC.fx.tracer(u.x, u.z, S.player.x, S.player.z);
              if (Math.random() < 0.3) CC.damage.hurt(5, 'police fire');
            }
          } else if (d < 45 && u.shootTimer <= 0) {
            u.shootTimer = 1.8;
            u.burstLeft = 3;
            u.burstTimer = 0;
          }
        });
      }
      for (var i = S.police.length - 1; i >= 0; i--) {
        var u2 = S.police[i];
        if (S.stars === 0 && Math.hypot(u2.x - S.player.x, u2.z - S.player.z) > 200) {
          u2.mesh.parent.remove(u2.mesh);
          S.police.splice(i, 1);
        }
      }
      if (S.stars < 3 && S.roadblock) {
        S.roadblock.units.forEach(function (u) { if (u.mesh.parent) u.mesh.parent.remove(u.mesh); });
        S.roadblock = null;
      }
    }
  };
})();
