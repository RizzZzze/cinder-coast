// Cinder Coast weapons: weapon stats, ammo, reload, spread, recoil.
// Melee is fists at short range. Guns are hitscan raycasts with muzzle
// flash, tracers, impact sparks and hit flinches. Aiming zooms the camera
// slightly and narrows the crosshair; spread grows while moving.
(function () {
  var CC = window.CinderCoast;
  var order = ['fists', 'kestrel', 'brisk', 'harrow'];
  var current = 1, cooldown = 0, spread = 0;
  CC.weapons = {
    order: order,
    currentKey: function () { return order[current]; },
    currentDef: function () { return CC.config.weapons[order[current]]; },
    getSpread: function () { return spread; },
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
      var yaw = CC.camera3.getYaw();
      var ox = S.vehicle ? S.vehicle.x : p.x, oz = S.vehicle ? S.vehicle.z : p.z;
      if (key === 'fists') {
        // Melee: nearest enemy or officer in front, within 2.2 m.
        var best = null, bd = 2.2;
        function meleeCheck(x, z, obj, kind) {
          var dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz);
          if (d > 2.2 || d < 0.01) return;
          var dot = (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d;
          if (dot > 0.5 && d < bd) { bd = d; best = { obj: obj, kind: kind }; }
        }
        if (CC.enemies) CC.enemies.list.forEach(function (e) { meleeCheck(e.x, e.z, e, 'enemy'); });
        if (S.police) S.police.forEach(function (u) { meleeCheck(u.x, u.z, u, 'police'); });
        if (best) {
          if (best.kind === 'enemy') CC.enemies.damage(best.obj, def.damage);
          else {
            best.obj.health -= def.damage;
            if (CC.fx) CC.fx.sparks(best.obj.x, best.obj.z);
            if (CC.hud) CC.hud.hitMarker();
          }
          if (CC.sfx) CC.sfx.impact(0.5);
        }
        S.gunfireTimer = 0;
        return;
      }
      var ammo = S.ammo[key];
      if (!ammo || ammo.mag <= 0) { if (CC.sfx) CC.sfx.click(); CC.weapons.reload(); return; }
      ammo.mag--;
      spread = Math.min(0.09, spread + 0.012 + (p.moving ? 0.01 : 0));
      var aimTight = CC.input.state.aim ? 0.45 : 1;
      var dirX = Math.sin(yaw) + (Math.random() - 0.5) * spread * 4 * aimTight;
      var dirZ = Math.cos(yaw) + (Math.random() - 0.5) * spread * 4 * aimTight;
      if (CC.fx) CC.fx.muzzle(ox, oz, yaw);
      if (CC.sfx) CC.sfx.gunshot(key);
      S.gunfireTimer = 0.8;
      S.shake = Math.max(S.shake || 0, 0.15);
      var hit = null, bestD = def.range, hitKind = null;
      var eHit = CC.enemies ? CC.enemies.nearestInCone(ox, oz, dirX, dirZ, def.range) : null;
      if (eHit) { hit = eHit.enemy; bestD = eHit.dist; hitKind = 'enemy'; }
      if (S.police) {
        S.police.forEach(function (u) {
          var dx = u.x - ox, dz = u.z - oz, d = Math.hypot(dx, dz);
          if (d > def.range) return;
          var dot = (dx * dirX + dz * dirZ) / (d || 1);
          if (dot > 0.96 && d < bestD) { bestD = d; hit = u; hitKind = 'police'; }
        });
      }
      if (hitKind === 'enemy') {
        CC.enemies.damage(hit, def.damage);
        if (CC.fx) CC.fx.tracer(ox, oz, hit.x, hit.z);
      } else if (hitKind === 'police') {
        hit.health -= def.damage;
        if (CC.fx) { CC.fx.sparks(hit.x, hit.z); CC.fx.tracer(ox, oz, hit.x, hit.z); }
        if (CC.hud) CC.hud.hitMarker();
        if (hit.health <= 0) {
          if (CC.wanted) CC.wanted.addHeat(CC.config.heatFor.witnessedKill, 'Officer down — witnessed');
          var i = S.police.indexOf(hit);
          if (i >= 0) { hit.mesh.parent.remove(hit.mesh); S.police.splice(i, 1); }
        }
      } else if (CC.missions && CC.missions.damageTarget(def.damage, ox, oz, dirX, dirZ)) {
        if (CC.hud) CC.hud.hitMarker();
        if (CC.fx) CC.fx.tracer(ox, oz, ox + dirX * bestD, oz + dirZ * bestD);
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
