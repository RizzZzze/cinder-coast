// Cinder Coast wanted: heat points, stars, decay, sight checks, response levels.
(function () {
  var CC = window.CinderCoast;
  CC.wanted = {
    starsFor: function (heat) {
      var th = CC.config.heatThresholds, s = 0;
      for (var i = 0; i < th.length; i++) if (heat >= th[i]) s = i;
      return s;
    },
    addHeat: function (points, label) {
      var S = CC.S;
      if (!S) return;
      var before = S.stars;
      S.heat = Math.min(300, S.heat + points);
      S.stars = CC.wanted.starsFor(S.heat);
      S.lastSeenAt = S.time;
      if (label && CC.notify) CC.notify.push(label);
      if (S.stars > before) {
        if (CC.police) CC.police.onStarsUp(S.stars);
        if (CC.sfx) CC.sfx.sirenBurst();
      }
      if (CC.hud) CC.hud.refreshStars();
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      var seen = false;
      if (S.police) {
        for (var i = 0; i < S.police.length; i++) {
          var u = S.police[i];
          var d = Math.hypot(u.x - S.player.x, u.z - S.player.z);
          if (d < CC.config.tuning.policeSight) { seen = true; break; }
        }
      }
      if (seen) { S.lastSeenAt = S.time; S.outOfSightFor = 0; }
      else {
        S.outOfSightFor = (S.outOfSightFor || 0) + dt;
        var delay = CC.config.tuning.heatDecayDelay[Math.min(S.stars, 4)] || 20;
        var far = true;
        if (S.police) {
          for (var j = 0; j < S.police.length; j++) {
            if (Math.hypot(S.police[j].x - S.player.x, S.police[j].z - S.player.z) < 60) { far = false; break; }
          }
        }
        if (far && S.outOfSightFor > delay && S.heat > 0) {
          S.heat = Math.max(0, S.heat - 12 * dt);
          var ns = CC.wanted.starsFor(S.heat);
          if (ns !== S.stars) {
            S.stars = ns;
            if (CC.hud) CC.hud.refreshStars();
            if (CC.notify && ns === 0) CC.notify.push('You lost them — heat clear');
          }
        }
      }
    }
  };
})();
