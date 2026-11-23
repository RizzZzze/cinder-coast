// Cinder Coast police: police unit AI — pursuit, search, roadblocks, shooting.
// Response spawns out of view, 150–250 m away. 1–2 stars: cruiser pairs that
// search the last known position. 3 stars: a roadblock of three cruisers and
// four foot officers behind barriers. 4–5 stars are Stage 2 (SWAT, helicopter).
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
        S.roadblock.units.push({ kind: 'foot', mesh: off, x: rp.x - 12 + j * 8, z: rp.z + 6, heading: 0, speed: 0, health: 60, state: 'block', shootTimer: j * 0.4 });
      }
      if (CC.notify) CC.notify.push('Roadblock ahead — 3 stars');
    },
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      S.police.forEach(function (u) {
        var dx = S.player.x - u.x, dz = S.player.z - u.z;
        var d = Math.hypot(dx, dz) || 1;
        if (u.kind === 'cruiser') {
          var wantHeading = Math.atan2(dx, dz);
          var dh = wantHeading - u.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          u.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
          var target = d > 18 ? 26 : (d < 8 ? -6 : 0);
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
        }
      });
      if (S.roadblock) {
        S.roadblock.units.forEach(function (u) {
          if (u.kind !== 'foot') return;
          u.shootTimer -= dt;
          var d = Math.hypot(S.player.x - u.x, S.player.z - u.z);
          if (d < 45 && u.shootTimer <= 0) {
            u.shootTimer = 1.1;
            if (CC.fx) CC.fx.tracer(u.x, u.z, S.player.x, S.player.z);
            if (Math.random() < 0.3) CC.damage.hurt(5, 'police fire');
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
