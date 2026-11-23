// Cinder Coast weapons: weapon stats, ammo, reload, spread, recoil.
(function () {
  var CC = window.CinderCoast;
  var order = ['fists', 'kestrel', 'brisk', 'harrow'];
  var current = 1, cooldown = 0, spread = 0;
  CC.weapons = {
    order: order,
    currentKey: function () { return order[current]; },
    currentDef: function () { return CC.config.weapons[order[current]]; },
    select: function (i) {
      if (i >= 0 && i < order.length) { current = i; if (CC.hud) CC.hud.refreshWeapon(); }
    },
    cycle: function (d) {
      current = (current + d + order.length) % order.length;
      if (CC.hud) CC.hud.refreshWeapon();
    },
    reload: function () {
      var S = CC.S;
      if (!S) return;
      var key = order[current];
      var def = CC.config.weapons[key];
      if (!def.mag) return;
      var ammo = S.ammo[key];
      if (!ammo || ammo.mag >= def.mag || ammo.reserve <= 0) return;
      var need = def.mag - ammo.mag;
      var take = Math.min(need, ammo.reserve);
      ammo.mag += take; ammo.reserve -= take;
      if (CC.sfx) CC.sfx.reload();
      if (CC.hud) CC.hud.refreshWeapon();
    },
    update: function (dt) {
      cooldown = Math.max(0, cooldown - dt);
      spread = Math.max(0, spread - dt * 0.03);
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      var firing = CC.input.pressed.Mouse0;
      if (firing && cooldown <= 0) CC.weapons.fire();
    },
    fire: function () {
      var S = CC.S;
      if (!S) return;
      var key = order[current];
      var def = CC.config.weapons[key];
      cooldown = 1 / def.rate;
      var p = S.player;
      if (key === 'fists') {
        S.gunfireTimer = 0;
        return;
      }
      var ammo = S.ammo[key];
      if (!ammo || ammo.mag <= 0) { if (CC.sfx) CC.sfx.click(); CC.weapons.reload(); return; }
      ammo.mag--;
      spread = Math.min(0.09, spread + 0.012 + (p.moving ? 0.01 : 0));
      var yaw = CC.camera3.getYaw();
      var dirX = Math.sin(yaw) + (Math.random() - 0.5) * spread * 4;
      var dirZ = Math.cos(yaw) + (Math.random() - 0.5) * spread * 4;
      var ox = S.vehicle ? S.vehicle.x : p.x, oz = S.vehicle ? S.vehicle.z : p.z;
      if (CC.fx) CC.fx.muzzle(ox, oz, yaw);
      if (CC.sfx) CC.sfx.gunshot(key);
      S.gunfireTimer = 0.8;
      S.shake = Math.max(S.shake || 0, 0.15);
      var hit = null, best = def.range;
      if (S.police) {
        S.police.forEach(function (u) {
          var dx = u.x - ox, dz = u.z - oz, d = Math.hypot(dx, dz);
          if (d > def.range) return;
          var dot = (dx * dirX + dz * dirZ) / (d || 1);
          if (dot > 0.96 && d < best) { best = d; hit = { kind: 'police', unit: u, dist: d }; }
        });
      }
      if (hit) {
        hit.unit.health -= def.damage;
        if (CC.fx) CC.fx.sparks(hit.unit.x, hit.unit.z);
        if (CC.hud) CC.hud.hitMarker();
        if (hit.unit.health <= 0) {
          if (CC.wanted) CC.wanted.addHeat(CC.config.heatFor.witnessedKill, 'Officer down — witnessed');
          var i = S.police.indexOf(hit.unit);
          if (i >= 0) { hit.unit.mesh.parent.remove(hit.unit.mesh); S.police.splice(i, 1); }
        }
      } else {
        var ex = ox + dirX * def.range, ez = oz + dirZ * def.range;
        if (CC.fx) CC.fx.tracer(ox, oz, ex, ez);
      }
      if (CC.hud) CC.hud.refreshWeapon();
      if (S.police && S.police.length && CC.wanted) {
        var near = S.police.some(function (u) { return Math.hypot(u.x - ox, u.z - oz) < 60; });
        if (near) CC.wanted.addHeat(CC.config.heatFor.fireNearPolice, 'Shots fired near police');
      }
    }
  };
})();
