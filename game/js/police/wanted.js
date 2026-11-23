// Cinder Coast wanted: heat points, stars, decay only out of sight.
// Fresh Stage 2 write from BRIEF-04. Heat 0/20/50/100/180/260 maps to 0-5 stars.
(function () {
  var CC = window.CinderCoast;
  var outOfSightFor = 0, decayTimer = 0;
  CC.wanted = {
    heat: 0,
    stars: 0,
    lastKnown: null,
    addHeat: function (n, label) {
      var S = CC.S;
      if (!S) return;
      CC.wanted.heat = Math.min(300, CC.wanted.heat + n);
      CC.wanted.stars = CC.config.starsForHeat(CC.wanted.heat);
      CC.wanted.lastKnown = { x: S.player.x, z: S.player.z };
      outOfSightFor = 0;
      if (label && CC.notify) CC.notify.push(label);
      if (CC.hud) CC.hud.refresh();
      if (CC.police) CC.police.onHeatChange();
    },
    setHeat: function (n) {
      CC.wanted.heat = Math.max(0, Math.min(300, n));
      CC.wanted.stars = CC.config.starsForHeat(CC.wanted.heat);
      outOfSightFor = 0;
      if (CC.hud) CC.hud.refresh();
      if (CC.police) CC.police.onHeatChange();
    },
    clear: function () { CC.wanted.setHeat(0); },
    inSight: function () {
      var S = CC.S;
      if (!S || !S.police) return false;
      for (var i = 0; i < S.police.length; i++) {
        var u = S.police[i];
        var d = Math.hypot(u.x - S.player.x, u.z - S.player.z);
        if (d < 60) return true;
      }
      return false;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      if (CC.wanted.heat <= 0) return;
      if (CC.wanted.inSight()) {
        outOfSightFor = 0; decayTimer = 0;
        CC.wanted.lastKnown = { x: S.player.x, z: S.player.z };
        return;
      }
      outOfSightFor += dt;
      var stars = CC.wanted.stars;
      var wait = stars <= 2 ? 20 : stars === 3 ? 30 : 45;
      if (outOfSightFor < wait) return;
      decayTimer += dt;
      if (decayTimer >= CC.config.heatDecay.stepSeconds) {
        decayTimer = 0;
        var thresholds = CC.config.heatStars;
        var target = thresholds[Math.max(0, stars - 1)];
        CC.wanted.heat = Math.max(target, CC.wanted.heat - 20);
        if (CC.wanted.heat <= target) CC.wanted.heat = target;
        CC.wanted.stars = CC.config.starsForHeat(CC.wanted.heat);
        if (CC.hud) CC.hud.refresh();
        if (CC.police) CC.police.onHeatChange();
      }
    }
  };
})();

// Wanted helpers: crime reporting from combat, crashes and kills.
(function () {
  var CC = window.CinderCoast;
  var W = CC.wanted;
  W.reportCrime = function (kind) {
    var n = CC.config.heatFor[kind];
    if (n === undefined) return;
    var labels = {
      stealCar: 'Heat +15: vehicle reported', strikeCivilian: 'Struck a civilian',
      fireInView: 'Shots fired near police', destroyPolice: 'Police vehicle destroyed',
      crashInjury: 'Crash with injuries', killWitnessed: 'Killing witnessed'
    };
    W.addHeat(n, labels[kind] || ('Heat +' + n));
  };
  W.outOfSightFor = function () { return 0; };
  W.starLabel = function () {
    var s = W.stars;
    return s <= 0 ? 'Clear' : s + (s === 1 ? ' star' : ' stars');
  };
})();
