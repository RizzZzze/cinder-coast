// Cinder Coast activities: tow calls, courier runs, chop orders.
// Stage 1 plays Tow Calls end to end; Courier and Chop are listed on the
// start screen and unlock with their districts in Stage 2.
(function () {
  var CC = window.CinderCoast;
  CC.activities = {
    active: null,
    startTowCall: function () {
      var S = CC.S;
      if (!S || S.mission) return false;
      var rng = CC.rng.make(S.seed + 400 + Math.floor(S.time));
      var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
      var along = rng.range(road.from + 40, road.to - 40);
      var x = road.axis === 'ew' ? along : road.at;
      var z = road.axis === 'ew' ? road.at : along;
      var car = CC.vehicles.make(S.scene, 'sprint', x, z, 0, 0x8A8F98);
      S.activity = { id: 'tow', name: 'Tow Call', stage: 0, timer: 120, target: car, x: x, z: z };
      CC.activities.active = S.activity;
      S.waypoint = { x: x, z: z, label: 'Broken-down car' };
      if (CC.hud) CC.hud.setObjective('Tow Call: reach the broken-down car');
      if (CC.notify) CC.notify.push('Tow Call — 120 s on the clock');
      return true;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || !S.activity) return;
      var a = S.activity;
      a.timer -= dt;
      if (a.timer <= 0) { CC.activities.fail('Time ran out'); return; }
      if (a.id === 'tow' && a.stage === 0) {
        var d = Math.hypot(S.player.x - a.x, S.player.z - a.z);
        if (S.vehicle && S.vehicle.key === 'tow' && d < 12) {
          a.stage = 1;
          S.waypoint = { x: 180, z: -280, label: 'Drop-off' };
          if (CC.hud) CC.hud.setObjective('Tow it to the drop-off');
        }
      } else if (a.id === 'tow' && a.stage === 1) {
        if (S.vehicle && S.vehicle.towed === a.target) {
          var d2 = Math.hypot(S.vehicle.x - 180, S.vehicle.z - (-280));
          if (d2 < 16) CC.activities.complete();
        }
      }
    },
    tryHook: function () {
      var S = CC.S;
      if (!S || !S.activity || S.activity.id !== 'tow' || S.activity.stage !== 0) return false;
      if (!S.vehicle || S.vehicle.key !== 'tow') return false;
      var a = S.activity;
      var d = Math.hypot(S.vehicle.x - a.target.x, S.vehicle.z - a.target.z);
      if (d > 10) return false;
      S.vehicle.towed = a.target;
      a.stage = 1;
      S.waypoint = { x: 180, z: -280, label: 'Drop-off' };
      if (CC.hud) CC.hud.setObjective('Tow it to the drop-off');
      return true;
    },
    complete: function () {
      var S = CC.S;
      var a = S.activity;
      S.cash += CC.config.prices.towCall;
      S.standing = Math.min(100, S.standing + 3);
      if (S.vehicle) S.vehicle.towed = null;
      S.activity = null; CC.activities.active = null; S.waypoint = null;
      if (CC.hud) CC.hud.setObjective('');
      if (CC.notify) CC.notify.push('Tow Call complete — +180 cr');
      if (CC.menu) CC.menu.showResult(true, a.name, CC.config.prices.towCall, 3);
      if (CC.save) CC.save.autosave();
    },
    fail: function (reason) {
      var S = CC.S;
      var a = S.activity;
      S.activity = null; CC.activities.active = null; S.waypoint = null;
      if (CC.hud) CC.hud.setObjective('');
      if (CC.menu) CC.menu.showResult(false, a.name, 0, 0, reason);
    }
  };
})();
