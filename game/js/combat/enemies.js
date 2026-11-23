// Cinder Coast enemies: armed NPCs for mission combat stages.
// Fresh Stage 2 write from BRIEF-04. They advance, take cover in bursts
// and fire within 30 m; hits flinch them, death clears the stage.
(function () {
  var CC = window.CinderCoast;
  var list = [];
  CC.enemies = {
    list: list,
    spawn: function (scene, x, z, opts) {
      opts = opts || {};
      var mesh = CC.geo.personMesh(opts.boss ? 0x1F3A5F : 0xE0433A, 0xE8B88A);
      mesh.position.set(x, 0, z);
      scene.add(mesh);
      var e = {
        mesh: mesh, x: x, z: z, heading: 0, health: opts.boss ? 160 : 70,
        shootTimer: 1 + Math.random(), burst: 0, state: 'advance',
        flinch: 0, boss: !!opts.boss, speed: opts.boss ? 2.6 : 3.4
      };
      list.push(e);
      return e;
    },
    spawnSquad: function (scene, x, z, count, boss) {
      var rng = CC.rng.make(CC.config.seed + 800 + Math.floor(x) + Math.floor(z));
      for (var i = 0; i < count; i++) {
        var a = rng.range(0, Math.PI * 2), d = rng.range(4, 12);
        CC.enemies.spawn(scene, x + Math.cos(a) * d, z + Math.sin(a) * d,
          { boss: boss && i === 0 });
      }
      return list.length;
    },
    aliveCount: function () { return list.length; },
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (e.flinch > 0) { e.flinch -= dt; continue; }
        var dx = S.player.x - e.x, dz = S.player.z - e.z;
        var d = Math.hypot(dx, dz) || 1;
        if (d > 26) {
          e.x += (dx / d) * e.speed * dt;
          e.z += (dz / d) * e.speed * dt;
          e.mesh.rotation.y = Math.atan2(dx, dz);
        } else if (d < 8) {
          e.x -= (dx / d) * e.speed * 0.6 * dt;
          e.z -= (dz / d) * e.speed * 0.6 * dt;
        }
        e.mesh.position.set(e.x, 0, e.z);
        e.shootTimer -= dt;
        if (d < 30 && e.shootTimer <= 0) {
          e.shootTimer = e.boss ? 0.9 : 1.4;
          if (CC.fx) CC.fx.tracer(e.x, 1.4, e.z, S.player.x, 1.2, S.player.z);
          if (CC.damage) CC.damage.hurtPlayer(e.boss ? 9 : 6, 'enemy');
          if (CC.sfx) CC.sfx.gunshot('kestrel');
        }
      }
    },
    damage: function (e, n) {
      e.health -= n;
      e.flinch = 0.35;
      if (CC.fx) CC.fx.sparks(e.x, 1.2, e.z);
      if (e.health <= 0) CC.enemies.remove(e);
    },
    remove: function (e) {
      var idx = list.indexOf(e);
      if (idx < 0) return;
      if (e.mesh) e.mesh.parent.remove(e.mesh);
      list.splice(idx, 1);
      if (CC.wanted) CC.wanted.reportCrime('killWitnessed');
    },
    clear: function () {
      while (list.length) {
        var e = list[0];
        if (e.mesh) e.mesh.parent.remove(e.mesh);
        list.splice(0, 1);
      }
    }
  };
})();

// Enemy helpers: nearest enemy and melee range check.
(function () {
  var CC = window.CinderCoast;
  var E = CC.enemies;
  E.nearest = function (x, z, maxD) {
    var best = null, bd = maxD || 1e9;
    E.list.forEach(function (e) {
      var d = Math.hypot(e.x - x, e.z - z);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  };
  E.melee = function () {
    var S = CC.S;
    if (!S) return false;
    var e = E.nearest(S.player.x, S.player.z, 2.2);
    if (!e) return false;
    E.damage(e, 40);
    if (CC.sfx) CC.sfx.impact(0.6);
    return true;
  };
})();
