// Cinder Coast pedestrians: sidewalk walking, crosswalk crossing, fleeing.
// They flee from gunfire, from fast vehicles and from crashes; some stop to
// look; they tip over when hit. Groups appear in plazas and markets.
(function () {
  var CC = window.CinderCoast;
  var peds = [];
  var shirts = [0xC8643B, 0x2BB3B0, 0xF2A81D, 0x5E9A4A, 0xE0433A, 0x7FA8C9, 0xF4E6C8];
  var skins = [0xE8B88A, 0xC98A5A, 0x8A5A3A, 0xF0C8A0];
  CC.peds = {
    list: peds,
    spawnNear: function (scene, px, pz, rng) {
      while (peds.length < CC.config.caps.pedestrians) {
        var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var along = rng.range(road.from + 10, road.to - 10);
        var side = rng.chance(0.5) ? 9.5 : -9.5;
        var x, z;
        if (road.axis === 'ew') { x = along; z = road.at + side; } else { x = road.at + side; z = along; }
        if (Math.hypot(x - px, z - pz) > 120) continue;
        var mesh = CC.geo.personMesh(rng.pick(shirts), rng.pick(skins));
        mesh.position.set(x, 0, z);
        scene.add(mesh);
        peds.push({
          mesh: mesh, x: x, z: z, road: road, along: along, dir: rng.chance(0.5) ? 1 : -1,
          speed: rng.range(0.9, 1.6), state: 'walk', lookTimer: 0, fleeX: 0, fleeZ: 0,
          bob: rng.range(0, 6), tipped: false
        });
      }
    },
    update: function (dt, t) {
      var S = CC.S;
      peds.forEach(function (p) {
        if (p.tipped) return;
        var threat = 0, tx = 0, tz = 0;
        if (S) {
          var pv = S.vehicle || null;
          var px = S.player.x, pz = S.player.z;
          var pspeed = pv ? Math.abs(pv.speed) : 0;
          var dFoot = Math.hypot(p.x - px, p.z - pz);
          if (S.gunfireTimer > 0 && dFoot < 30) { threat = 2; tx = px; tz = pz; }
          else if (pv && pspeed > 12 && dFoot < 14) { threat = 2; tx = pv.x; tz = pv.z; }
          else if (S.crashTimer > 0 && dFoot < 12) { threat = 1; tx = px; tz = pz; }
        }
        if (threat > 0) {
          p.state = 'flee';
          var dx = p.x - tx, dz = p.z - tz, d = Math.hypot(dx, dz) || 1;
          p.fleeX = dx / d; p.fleeZ = dz / d;
          p.x += p.fleeX * 4.5 * dt; p.z += p.fleeZ * 4.5 * dt;
          p.mesh.rotation.y = Math.atan2(p.fleeX, p.fleeZ);
          if (CC.fx && Math.random() < dt * 6) CC.fx.dust(p.x, p.z);
        } else if (p.state === 'flee') {
          p.state = 'walk';
        } else {
          if (p.lookTimer > 0) { p.lookTimer -= dt; }
          else if (Math.random() < dt * 0.02) { p.lookTimer = 2; p.state = 'look'; }
          else p.state = 'walk';
          if (p.state === 'walk') {
            p.along += p.dir * p.speed * dt;
            var r = p.road;
            if (p.along > r.to - 8 || p.along < r.from + 8) { p.dir *= -1; }
            var side = (p.mesh.position.z - (r.axis === 'ew' ? r.at : 0)) >= 0 ? 9.5 : -9.5;
            if (r.axis === 'ew') { p.x = p.along; p.z = r.at + side; p.mesh.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
            else { p.x = r.at + side; p.z = p.along; p.mesh.rotation.y = p.dir > 0 ? Math.PI : 0; }
          }
        }
        p.bob += dt * (p.state === 'flee' ? 14 : 7);
        p.mesh.position.set(p.x, Math.abs(Math.sin(p.bob)) * 0.06, p.z);
      });
      for (var i = peds.length - 1; i >= 0; i--) {
        if (S && Math.hypot(peds[i].x - S.player.x, peds[i].z - S.player.z) > 130) {
          peds[i].mesh.parent.remove(peds[i].mesh);
          peds.splice(i, 1);
        }
      }
    },
    hitByVehicle: function (p) {
      if (p.tipped) return;
      p.tipped = true;
      p.mesh.rotation.x = Math.PI / 2;
      p.mesh.position.y = 0.25;
      if (CC.wanted) CC.wanted.addHeat(CC.config.heatFor.strikeCivilian, 'Struck a civilian');
    }
  };
})();
