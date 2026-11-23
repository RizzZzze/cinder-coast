// Cinder Coast police: pursuit, roadblocks, SWAT, helicopter.
// Fresh Stage 2 write from BRIEF-04. Units spawn out of view, 150-250 m away,
// drive to the last known position, pursue at speed and shoot within 25 m.
(function () {
  var CC = window.CinderCoast;
  function spawnPos(rng) {
    var S = CC.S;
    var a = rng.range(0, Math.PI * 2);
    var d = rng.range(150, 250);
    return [S.player.x + Math.cos(a) * d, S.player.z + Math.sin(a) * d];
  }
  CC.police = {
    onHeatChange: function () {
      var S = CC.S;
      if (!S) return;
      if (CC.wanted.stars >= 3 && !S.roadblock && !S.shotMode) CC.police.makeRoadblock();
      if (CC.wanted.stars < 3) S.roadblock = null;
      if (CC.sfx) CC.sfx.setSiren(CC.wanted.stars >= 1);
    },
    spawnUnit: function (kind) {
      var S = CC.S;
      if (!S || S.police.length >= CC.config.caps.police) return null;
      var rng = CC.rng.make(CC.config.seed + 700 + S.police.length * 31 + Math.floor(S.time));
      var p = spawnPos(rng);
      var mesh, unit;
      if (kind === 'foot') {
        mesh = CC.geo.personMesh(0x1F3A5F, 0xE8B88A);
        mesh.position.set(p[0], 0, p[1]);
        S.scene.add(mesh);
        unit = { kind: 'foot', x: p[0], z: p[1], heading: 0, speed: 0, mesh: mesh, shootTimer: 1, health: 50 };
      } else if (kind === 'heli') {
        mesh = CC.geo.meshFromParts([
          { shape: 'box', w: 2, h: 1.4, d: 5, x: 0, y: 0, z: 0, color: 0x1F3A5F },
          { shape: 'box', w: 6, h: 0.12, d: 0.4, x: 0, y: 1.0, z: 0, color: 0x2B2B33 },
          { shape: 'box', w: 1.2, h: 0.5, d: 1.2, x: 0, y: -0.6, z: 1.5, color: 0xF2A81D }
        ]);
        mesh.position.set(p[0], 60, p[1]);
        S.scene.add(mesh);
        var cone = new THREE.Mesh(new THREE.ConeGeometry(9, 60, 12, 1, true),
          new THREE.MeshBasicMaterial({ color: 0xFFF2B0, transparent: true, opacity: 0.14, side: THREE.DoubleSide }));
        cone.position.set(p[0], 30, p[1]);
        S.scene.add(cone);
        unit = { kind: 'heli', x: p[0], z: p[1], y: 60, heading: 0, speed: 0, mesh: mesh, cone: cone, angle: 0, shootTimer: 0, health: 200 };
      } else {
        var key = kind === 'swat' ? 'swat' : 'ardent';
        mesh = CC.geo.carBody(CC.config.vehicles[key]);
        mesh.position.set(p[0], 0, p[1]);
        S.scene.add(mesh);
        unit = { kind: kind, key: key, x: p[0], z: p[1], heading: 0, speed: 0, mesh: mesh, shootTimer: 1, health: kind === 'swat' ? 150 : 80 };
      }
      unit.lightA = null;
      S.police.push(unit);
      return unit;
    },
    makeRoadblock: function () {
      var S = CC.S;
      if (!S) return;
      var lk = (CC.wanted && CC.wanted.lastKnown) || { x: S.player.x + 60, z: S.player.z };
      S.roadblock = { x: lk.x, z: lk.z };
      for (var i = 0; i < 3; i++) {
        var u = CC.police.spawnUnit('cruiser');
        if (u) { u.x = lk.x - 8 + i * 8; u.z = lk.z; u.roadblock = true; u.mesh.position.set(u.x, 0, u.z); u.mesh.rotation.y = Math.PI / 2 + (i - 1) * 0.5; }
      }
      for (var f = 0; f < 4; f++) {
        var fo = CC.police.spawnUnit('foot');
        if (fo) { fo.x = lk.x - 6 + f * 4; fo.z = lk.z + 6; fo.roadblock = true; fo.mesh.position.set(fo.x, 0, fo.z); }
      }
      if (CC.notify) CC.notify.push('Roadblock ahead');
    }
  };
})();

// Police update: pursuit steering, shooting, helicopter orbit, cleanup.
(function () {
  var CC = window.CinderCoast;
  var P = CC.police;
  P.update = function (dt, t) {
    var S = CC.S;
    if (!S) return;
    var stars = CC.wanted ? CC.wanted.stars : 0;
    if (stars <= 0) { P.clear(); return; }
    var wantCruisers = stars <= 2 ? 2 : stars === 3 ? 3 : 4;
    var cruisers = S.police.filter(function (u) { return u.kind === 'cruiser'; }).length;
    var swats = S.police.filter(function (u) { return u.kind === 'swat'; }).length;
    var helis = S.police.filter(function (u) { return u.kind === 'heli'; }).length;
    if (cruisers < wantCruisers) P.spawnUnit('cruiser');
    if (stars >= 4 && swats < 2) P.spawnUnit('swat');
    if (stars >= 5 && helis < 1) P.spawnUnit('heli');
    var target = (CC.wanted && CC.wanted.lastKnown) || { x: S.player.x, z: S.player.z };
    var pursuing = stars >= 2;
    for (var i = S.police.length - 1; i >= 0; i--) {
      var u = S.police[i];
      var dx = S.player.x - u.x, dz = S.player.z - u.z;
      var dist = Math.hypot(dx, dz);
      if (dist > 320) { P.removeUnit(i); continue; }
      if (u.kind === 'heli') {
        u.angle += dt * 0.5;
        u.x = S.player.x + Math.cos(u.angle) * 45;
        u.z = S.player.z + Math.sin(u.angle) * 45;
        u.mesh.position.set(u.x, 60, u.z);
        u.mesh.rotation.y = u.angle + Math.PI / 2;
        if (u.cone) u.cone.position.set(S.player.x, 30, S.player.z);
        continue;
      }
      if (u.kind === 'foot') {
        var tx = pursuing ? S.player.x : target.x, tz = pursuing ? S.player.z : target.z;
        var fdx = tx - u.x, fdz = tz - u.z, fd = Math.hypot(fdx, fdz);
        if (fd > 20 && !u.roadblock) {
          u.x += (fdx / fd) * 3.2 * dt; u.z += (fdz / fd) * 3.2 * dt;
          u.mesh.rotation.y = Math.atan2(fdx, fdz);
        }
        u.mesh.position.set(u.x, 0, u.z);
        u.shootTimer -= dt;
        if (dist < 25 && u.shootTimer <= 0) {
          u.shootTimer = 1.1;
          if (CC.fx) CC.fx.tracer(u.x, 1.4, u.z, S.player.x, 1.2, S.player.z);
          if (CC.damage) CC.damage.hurtPlayer(5, 'police');
        }
        continue;
      }
      var gx = pursuing ? S.player.x : target.x, gz = pursuing ? S.player.z : target.z;
      if (u.roadblock && stars < 3) u.roadblock = false;
      var wantHeading = Math.atan2(gx - u.x, gz - u.z);
      var dh = wantHeading - u.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      u.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, dh));
      var nearOther = false;
      for (var j = 0; j < S.police.length; j++) {
        if (j === i || S.police[j].kind === 'heli' || S.police[j].kind === 'foot') continue;
        if (Math.hypot(S.police[j].x - u.x, S.police[j].z - u.z) < 7) { nearOther = true; break; }
      }
      var top = u.kind === 'swat' ? 26 : 30;
      var wantSpeed = u.roadblock ? 0 : (nearOther ? top * 0.4 : top);
      u.speed += (wantSpeed - u.speed) * Math.min(1, dt * 1.5);
      u.x += Math.sin(u.heading) * u.speed * dt;
      u.z += Math.cos(u.heading) * u.speed * dt;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.heading;
      u.shootTimer -= dt;
      if (dist < 25 && u.shootTimer <= 0 && !S.vehicle) {
        u.shootTimer = 1.4;
        if (CC.fx) CC.fx.tracer(u.x, 1.4, u.z, S.player.x, 1.2, S.player.z);
        if (CC.damage) CC.damage.hurtPlayer(4, 'police');
      }
      if (dist < 4 && S.vehicle && Math.abs(u.speed) > 4) {
        if (CC.damage) CC.damage.damageVehicle(S.vehicle, 12);
        u.speed *= 0.4;
      }
    }
    if (CC.fx) CC.fx.policeLights(S.police, t);
  };
  P.removeUnit = function (i) {
    var S = CC.S;
    var u = S.police[i];
    if (u.mesh) u.mesh.parent.remove(u.mesh);
    if (u.cone) u.cone.parent.remove(u.cone);
    S.police.splice(i, 1);
  };
  P.clear = function () {
    var S = CC.S;
    if (!S) return;
    while (S.police.length) P.removeUnit(0);
    if (CC.sfx) CC.sfx.setSiren(false);
  };
  P.damageUnit = function (u, n) {
    u.health -= n;
    if (u.health <= 0) {
      var S = CC.S;
      var idx = S.police.indexOf(u);
      if (idx >= 0) P.removeUnit(idx);
      if (CC.fx) CC.fx.explosion(u.x, u.z);
      if (CC.wanted && (u.kind === 'cruiser' || u.kind === 'swat')) CC.wanted.reportCrime('destroyPolice');
    }
  };
})();
