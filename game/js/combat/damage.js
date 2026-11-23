// Cinder Coast damage: hit resolution, health, armour, death and respawn.
(function () {
  var CC = window.CinderCoast;
  var pickups = [];
  CC.damage = {
    buildPickups: function (scene) {
      pickups.length = 0;
      CC.config.armourPickups.forEach(function (p) {
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1.2),
          new THREE.MeshLambertMaterial({ color: 0x7FC4D8 }));
        mesh.position.set(p.x, 0.5, p.z);
        scene.add(mesh);
        pickups.push({ mesh: mesh, x: p.x, z: p.z, timer: 0, taken: false });
      });
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      // Health regenerates after 6 seconds with no damage.
      if (S.health > 0 && S.health < 100 && S.time - S.lastDamageAt > 6) {
        S.health = Math.min(100, S.health + 8 * dt);
      }
      pickups.forEach(function (pk) {
        if (pk.taken) {
          pk.timer -= dt;
          if (pk.timer <= 0) { pk.taken = false; pk.mesh.visible = true; }
          return;
        }
        if (Math.hypot(S.player.x - pk.x, S.player.z - pk.z) < 2.5 && S.armour < 50) {
          S.armour = 50;
          pk.taken = true; pk.timer = 60; pk.mesh.visible = false;
          if (CC.notify) CC.notify.push('Armour picked up (+50)');
          if (CC.sfx) CC.sfx.reload();
        }
      });
    },
    hurt: function (amount, source) {
      var S = CC.S;
      if (!S || S.mode !== 'play' || S.dead) return;
      var remaining = amount;
      if (S.armour > 0) {
        var absorbed = Math.min(S.armour, remaining);
        S.armour -= absorbed; remaining -= absorbed;
      }
      S.health -= remaining;
      S.lastDamageAt = S.time;
      S.shake = Math.max(S.shake || 0, 0.3);
      if (CC.hud) CC.hud.flashDamage();
      if (S.health <= 0) CC.damage.die(source);
    },
    heal: function (amount) {
      var S = CC.S;
      if (S) S.health = Math.min(100, S.health + amount);
    },
    die: function (source) {
      var S = CC.S;
      if (!S || S.dead) return;
      S.dead = true;
      S.mode = 'dead';
      var lost = Math.floor(S.cash * 0.1);
      S.cash -= lost;
      S.heat = 0; S.stars = 0;
      // Death ends the active mission and activity: weapons are kept, the
      // mission can be retried from the title screen or the result flow.
      if (S.mission) {
        if (CC.enemies) CC.enemies.clear();
        S.mission = null; CC.missions.active = null;
        S.missionHaul = null; S.missionNomad = null; S.missionTargets = null;
        S.waypoint = null;
        if (CC.hud) { CC.hud.setObjective(''); CC.hud.setProgress(0); }
      }
      if (S.activity) {
        S.activity = null; CC.activities.active = null; S.waypoint = null;
        if (CC.hud) CC.hud.setObjective('');
      }
      if (CC.menu) CC.menu.showDeath(lost, source || 'the streets');
      if (CC.save) CC.save.autosave();
    },
    respawn: function () {
      var S = CC.S;
      if (!S) return;
      S.health = 100; S.armour = 0; S.dead = false; S.mode = 'play';
      S.player.x = -120; S.player.z = 200; S.player.y = 0; S.player.inVehicle = false;
      S.vehicle = null;
      S.police.forEach(function (u) { if (u.mesh.parent) u.mesh.parent.remove(u.mesh); });
      S.police.length = 0;
      if (CC.police) CC.police.removeHeli();
      if (S.roadblock) {
        S.roadblock.units.forEach(function (u) { if (u.mesh.parent) u.mesh.parent.remove(u.mesh); });
        S.roadblock = null;
      }
      if (CC.enemies) CC.enemies.clear();
      S.heat = 0; S.stars = 0;
      if (CC.menu) CC.menu.hideAll();
      if (CC.notify) CC.notify.push('You wake at the Quay hospital');
    }
  };
})();
