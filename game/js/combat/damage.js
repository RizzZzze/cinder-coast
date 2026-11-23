// Cinder Coast damage: player health and armour, vehicle damage, death.
// Fresh Stage 2 write from BRIEF-04. Health 100, armour up to 50, regen
// after 6 s without damage. Death wakes the player at the Quay hospital.
(function () {
  var CC = window.CinderCoast;
  CC.damage = {
    hurtPlayer: function (n, src) {
      var S = CC.S;
      if (!S || S.mode !== 'play' || S.dead) return;
      var remaining = n;
      if (S.armour > 0) {
        var absorbed = Math.min(S.armour, remaining);
        S.armour -= absorbed;
        remaining -= absorbed;
      }
      S.health -= remaining;
      S.lastDamageAt = S.time;
      var flash = document.getElementById('damage-flash');
      if (flash) { flash.style.opacity = '0.45'; setTimeout(function () { flash.style.opacity = '0'; }, 180); }
      if (CC.camera3) CC.camera3.addShake(0.4);
      if (S.health <= 0) CC.damage.die(src);
      if (CC.hud) CC.hud.refresh();
    },
    damageVehicle: function (v, n) {
      if (!v) return;
      v.health = (v.health === undefined ? 100 : v.health) - n;
      if (CC.fx) CC.fx.sparks(v.x, 1, v.z);
      if (v.health <= 0) CC.damage.destroyVehicle(v);
    },
    destroyVehicle: function (v) {
      var S = CC.S;
      if (CC.fx) CC.fx.explosion(v.x, v.z);
      if (CC.sfx) CC.sfx.explosion();
      if (S && S.vehicle === v) {
        S.vehicle = null;
        S.player.inVehicle = false;
        if (CC.audio) CC.audio.setEngine(0);
      }
      if (v.mesh) v.mesh.parent.remove(v.mesh);
      if (S && S.vehicle === v) CC.damage.hurtPlayer(25, 'explosion');
      if (CC.wanted && v.key === 'ardent') CC.wanted.reportCrime('destroyPolice');
    },
    die: function (src) {
      var S = CC.S;
      if (!S || S.dead) return;
      S.dead = true;
      var lost = Math.floor(S.cash * 0.1);
      S.cash -= lost;
      S.health = 100;
      S.armour = 0;
      if (CC.wanted) CC.wanted.setHeat(0);
      if (CC.police) CC.police.clear();
      if (CC.enemies) CC.enemies.clear();
      S.player.x = -240; S.player.z = 280; S.player.y = 0; S.player.heading = 0;
      S.player.inVehicle = false;
      S.vehicle = null;
      if (CC.missions && CC.missions.active) {
        var id = CC.missions.active.id;
        CC.missions.fail('You were killed');
        S.dead = false;
        return;
      }
      S.dead = false;
      if (CC.notify) CC.notify.push('You woke at the Quay hospital — lost ' + lost + ' crowns');
      if (CC.hud) CC.hud.refresh();
    }
  };
})();

// Damage helpers: pickups and fall/crash damage.
(function () {
  var CC = window.CinderCoast;
  var D = CC.damage;
  D.pickupArmour = function (n) {
    var S = CC.S;
    if (!S) return;
    S.armour = Math.min(50, S.armour + n);
    if (CC.notify) CC.notify.push('Armour +' + n);
    if (CC.hud) CC.hud.refresh();
  };
  D.pickupHealth = function (n) {
    var S = CC.S;
    if (!S) return;
    S.health = Math.min(100, S.health + n);
    if (CC.hud) CC.hud.refresh();
  };
  D.crashDamage = function (speed) {
    var S = CC.S;
    if (!S || speed < 14) return;
    D.hurtPlayer(Math.round((speed - 14) * 0.8), 'crash');
    S.crashTimer = 1;
    if (CC.wanted) CC.wanted.reportCrime('crashInjury');
  };
})();
