// Cinder Coast weapons: hitscan guns, spread, ammo, reload, aim zoom.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  var cooldown = 0, reloadTimer = 0;
  CC.weapons = {
    currentDef: function () {
      var S = CC.S;
      if (!S || !S.weapons.current) return null;
      return CC.config.weapons[S.weapons.current];
    },
    ammo: function () {
      var S = CC.S;
      if (!S || !S.weapons.current) return [0, 0];
      var w = S.weapons.owned[S.weapons.current];
      return w ? [w.ammo, w.reserve] : [0, 0];
    },
    switchTo: function (key) {
      var S = CC.S;
      if (!S || !(S.weapons.owned || {})[key]) return false;
      S.weapons.current = key;
      reloadTimer = 0;
      if (CC.hud) CC.hud.refresh();
      return true;
    },
    cycle: function () {
      var S = CC.S;
      if (!S) return;
      var keys = Object.keys(S.weapons.owned || {});
      if (!keys.length) return;
      var i = keys.indexOf(S.weapons.current);
      CC.weapons.switchTo(keys[(i + 1) % keys.length]);
    },
    startReload: function () {
      var S = CC.S;
      if (!S || !S.weapons.current) return;
      var w = S.weapons.owned[S.weapons.current];
      var def = CC.config.weapons[S.weapons.current];
      if (!w || w.reserve <= 0 || w.ammo >= def.mag) return;
      reloadTimer = 1.2;
      if (CC.sfx) CC.sfx.reload();
    },
    fire: function () {
      var S = CC.S;
      if (!S || !S.weapons.current || S.mode !== 'play') return false;
      if (cooldown > 0 || reloadTimer > 0) return false;
      var def = CC.config.weapons[S.weapons.current];
      var w = S.weapons.owned[S.weapons.current];
      if (!w || w.ammo <= 0) { CC.weapons.startReload(); return false; }
      cooldown = def.rate;
      w.ammo--;
      var cam = S.camera;
      var spread = def.spread * (S.player.moving ? 1.8 : 1) * (S.aiming ? 0.55 : 1);
      var dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      dir.x += (Math.random() - 0.5) * spread * 2;
      dir.y += (Math.random() - 0.5) * spread * 2;
      dir.z += (Math.random() - 0.5) * spread * 2;
      dir.normalize();
      var origin = S.player.inVehicle && S.vehicle
        ? new THREE.Vector3(S.vehicle.x, 1.4, S.vehicle.z)
        : new THREE.Vector3(S.player.x, 1.5, S.player.z);
      if (CC.fx) CC.fx.muzzle(origin.x, origin.y, origin.z);
      if (CC.sfx) CC.sfx.gunshot(S.weapons.current);
      S.gunfireTimer = 1.5;
      var pellets = def.pellets || 1;
      var hitAny = false;
      for (var p = 0; p < pellets; p++) {
        if (CC.weapons.raycast(origin, dir, def)) hitAny = true;
      }
      if (CC.wanted && CC.wanted.inSight()) CC.wanted.reportCrime('fireInView');
      if (w.ammo <= 0) CC.weapons.startReload();
      if (CC.hud) CC.hud.refresh();
      return hitAny;
    },
    tick: function (dt) {
      if (cooldown > 0) cooldown -= dt;
      if (reloadTimer > 0) {
        reloadTimer -= dt;
        if (reloadTimer <= 0) {
          var S = CC.S;
          if (S && S.weapons.current) {
            var w = S.weapons.owned[S.weapons.current];
            var def = CC.config.weapons[S.weapons.current];
            if (w && def) {
              var need = def.mag - w.ammo;
              var take = Math.min(need, w.reserve);
              w.ammo += take; w.reserve -= take;
              if (CC.hud) CC.hud.refresh();
            }
          }
        }
      }
    }
  };
})();

// Hitscan raycast against enemies, police, the mission lorry and the world.
(function () {
  var CC = window.CinderCoast;
  var W = CC.weapons;
  // Cooldown and reload ticking live in the first block (closure timers).
  W.raycast = function (origin, dir, def) {
    var S = CC.S;
    var targets = [];
    if (CC.enemies) CC.enemies.list.forEach(function (e) { targets.push({ mesh: e.mesh, ref: e, kind: 'enemy' }); });
    if (S && S.police) S.police.forEach(function (u) {
      if (u.mesh && u.kind !== 'heli') targets.push({ mesh: u.mesh, ref: u, kind: 'police' });
    });
    var meshes = targets.map(function (t) { return t.mesh; });
    var lorry = S && S.mission && S.mission.lorry ? S.mission.lorry : null;
    if (lorry && lorry.mesh) meshes.push(lorry.mesh);
    if (!meshes.length) {
      if (CC.fx) CC.fx.tracer(origin.x, origin.y, origin.z, origin.x + dir.x * def.range, origin.y + dir.y * def.range, origin.z + dir.z * def.range);
      return false;
    }
    var ray = new THREE.Raycaster(origin, dir, 0.1, def.range);
    var hits = ray.intersectObjects(meshes, false);
    if (!hits.length) {
      if (CC.fx) CC.fx.tracer(origin.x, origin.y, origin.z, origin.x + dir.x * def.range, origin.y + dir.y * def.range, origin.z + dir.z * def.range);
      return false;
    }
    var hit = hits[0];
    var pt = hit.point;
    if (CC.fx) {
      CC.fx.tracer(origin.x, origin.y, origin.z, pt.x, pt.y, pt.z);
      CC.fx.sparks(pt.x, pt.y, pt.z);
    }
    var idx = meshes.indexOf(hit.object);
    var t0 = targets[idx];
    if (t0 && t0.kind === 'enemy' && CC.enemies) CC.enemies.damage(t0.ref, def.damage);
    else if (t0 && t0.kind === 'police' && CC.police) CC.police.damageUnit(t0.ref, def.damage);
    else if (lorry && hit.object === lorry.mesh) {
      lorry.engineHealth -= def.damage;
      if (CC.fx) CC.fx.sparks(pt.x, pt.y, pt.z);
    }
    return true;
  };
})();
