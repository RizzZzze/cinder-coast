// Cinder Coast damage: hit resolution, health, armour, death and respawn.
(function () {
  var CC = window.CinderCoast;
  CC.damage = {
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
      S.heat = 0; S.stars = 0;
      if (CC.menu) CC.menu.hideAll();
      if (CC.notify) CC.notify.push('You wake at the Quay hospital');
    }
  };
})();
