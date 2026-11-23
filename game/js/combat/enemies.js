// Cinder Coast enemies: armed NPCs for missions 2-8 — syndicate gunmen,
// Roque's officers, Odile's guards. They advance on the player, take cover
// distance, and fire in bursts. Hits flinch them; death removes them.
(function () {
  var CC = window.CinderCoast;
  var list = [];
  CC.enemies = {
    list: list,
    count: function () { return list.length; },
    spawn: function (scene, x, z, opts) {
      opts = opts || {};
      var shirt = opts.boss ? 0x1F3A5F : (opts.syndicate ? 0x8A2A2A : 0x2B2B33);
      var mesh = CC.geo.personMesh(shirt, 0xE8B88A);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      var e = {
        mesh: mesh, x: x, z: z, name: opts.name || 'Gunman',
        health: opts.health || 60, maxHealth: opts.health || 60,
        shootTimer: 1 + Math.random() * 1.5, flinch: 0,
        speed: opts.boss ? 2.2 : 3.2, rifle: !!opts.rifle, boss: !!opts.boss,
        burstLeft: 0, burstTimer: 0
      };
      list.push(e);
      return e;
    },
    damage: function (e, amount) {
      if (!e || e.health <= 0) return false;
      e.health -= amount;
      e.flinch = 0.3;
      if (CC.fx) CC.fx.sparks(e.x, e.z);
      if (CC.hud) CC.hud.hitMarker();
      if (e.health <= 0) {
        if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
        var i = list.indexOf(e);
        if (i >= 0) list.splice(i, 1);
        return true;
      }
      return false;
    },
    nearestInCone: function (ox, oz, dirX, dirZ, range, dotMin) {
      var best = null, bd = range;
      list.forEach(function (e) {
        var dx = e.x - ox, dz = e.z - oz, d = Math.hypot(dx, dz);
        if (d > range || d < 0.01) return;
        var dot = (dx * dirX + dz * dirZ) / d;
        if (dot > (dotMin || 0.96) && d < bd) { bd = d; best = { enemy: e, dist: d }; }
      });
      return best;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      list.forEach(function (e) {
        if (e.flinch > 0) { e.flinch -= dt; return; }
        var dx = S.player.x - e.x, dz = S.player.z - e.z;
        var d = Math.hypot(dx, dz) || 1;
        if (d > 14) {
          e.x += dx / d * e.speed * dt;
          e.z += dz / d * e.speed * dt;
        } else if (d < 6) {
          e.x -= dx / d * e.speed * 0.5 * dt;
          e.z -= dz / d * e.speed * 0.5 * dt;
        }
        e.mesh.position.set(e.x, 0, e.z);
        e.mesh.rotation.y = Math.atan2(dx, dz);
        e.shootTimer -= dt;
        if (e.burstLeft > 0) {
          e.burstTimer -= dt;
          if (e.burstTimer <= 0) {
            e.burstTimer = 0.14;
            e.burstLeft--;
            if (CC.fx) CC.fx.tracer(e.x, e.z, S.player.x, S.player.z);
            if (Math.random() < 0.3) CC.damage.hurt(e.rifle ? 8 : 5, e.name + ' fire');
          }
        } else if (d < 45 && e.shootTimer <= 0) {
          e.shootTimer = e.rifle ? 1.6 : 2.2;
          e.burstLeft = e.rifle ? 4 : 3;
          e.burstTimer = 0;
        }
      });
    },
    clear: function () {
      list.forEach(function (e) { if (e.mesh.parent) e.mesh.parent.remove(e.mesh); });
      list.length = 0;
    }
  };
})();
