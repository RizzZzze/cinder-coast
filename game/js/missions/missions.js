// Cinder Coast missions: mission runner — objectives, checkpoints, results.
// Mission 1 "Wrong Tow": hook the Vesper Sprint at Pier Nine, tow it to the
// Mercado garage while the police arrive, deliver it for the payout.
(function () {
  var CC = window.CinderCoast;
  var targetCar = null, targetMarker = null;
  CC.missions = {
    active: null,
    startMission1: function () {
      var S = CC.S;
      if (!S) return;
      S.mission = { id: 1, name: 'Wrong Tow', stage: 0, timer: 0 };
      CC.missions.active = S.mission;
      var car = CC.vehicles.make(S.scene, 'sprint', -200, 228, Math.PI / 2, 0x7FA8C9);
      targetCar = car;
      S.waypoint = { x: -200, z: 228, label: 'Pier Nine car' };
      if (CC.hud) CC.hud.setObjective('Hook the Vesper Sprint at Pier Nine');
      if (CC.notify) CC.notify.push('Mission 1 — Wrong Tow started');
      if (CC.save) CC.save.autosave();
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || !S.mission || S.mission.id !== 1) return;
      var m = S.mission;
      if (m.stage === 0) {
        var d = Math.hypot(S.player.x - (-200), S.player.z - 228);
        if (S.vehicle && S.vehicle.key === 'tow' && d < 12) {
          m.stage = 1;
          if (CC.hud) CC.hud.setObjective('Press F to hook the Vesper Sprint');
          if (CC.notify) CC.notify.push('Hook the car — press F near it');
        } else if (d < 12 && !S.vehicle) {
          if (CC.hud) CC.hud.setObjective('Get in your Tidewell Tow first (E)');
        }
      } else if (m.stage === 1) {
        if (S.vehicle && S.vehicle.towed === targetCar) {
          m.stage = 2;
          S.waypoint = { x: 180, z: -280, label: 'Mercado garage' };
          if (CC.hud) CC.hud.setObjective('Tow the Vesper to the Mercado garage');
          if (CC.wanted) CC.wanted.addHeat(20, 'Police on the way — 1 star');
          if (CC.notify) CC.notify.push('Police arriving — lose them on the way');
        }
      } else if (m.stage === 2) {
        var d2 = S.vehicle ? Math.hypot(S.vehicle.x - 180, S.vehicle.z - (-280)) : 999;
        if (CC.hud) CC.hud.setProgress(1 - Math.min(1, d2 / 520));
        if (d2 < 16 && S.vehicle && S.vehicle.towed === targetCar) {
          CC.missions.complete(1);
        }
        if (!targetCar || targetCar.damage >= 100) CC.missions.fail(1, 'The towed car was destroyed');
      }
    },
    tryHook: function () {
      var S = CC.S;
      if (!S || !S.mission || S.mission.id !== 1 || S.mission.stage !== 1) return false;
      if (!S.vehicle || S.vehicle.key !== 'tow') return false;
      var d = Math.hypot(S.vehicle.x - targetCar.x, S.vehicle.z - targetCar.z);
      if (d > 10) return false;
      S.vehicle.towed = targetCar;
      if (CC.notify) CC.notify.push('Car hooked — tow it north');
      if (CC.sfx) CC.sfx.honk();
      return true;
    },
    complete: function (id) {
      var S = CC.S;
      if (!S) return;
      var def = CC.story.missions[id - 1];
      S.cash += def.payout;
      S.standing = Math.min(100, S.standing + def.standing);
      S.chapter = Math.max(S.chapter, 2);
      S.missionFlags = S.missionFlags || {};
      S.missionFlags[id] = 'complete';
      if (S.vehicle && S.vehicle.towed) {
        CC.ownership.storeInGarage(S.vehicle.towed);
        S.vehicle.towed = null;
      }
      S.mission = null; CC.missions.active = null;
      S.waypoint = null;
      if (CC.hud) { CC.hud.setObjective(''); CC.hud.setProgress(0); }
      if (CC.menu) CC.menu.showResult(true, def.name, def.payout, def.standing);
      if (CC.save) CC.save.autosave();
    },
    fail: function (id, reason) {
      var S = CC.S;
      if (!S) return;
      var def = CC.story.missions[id - 1];
      S.mission = null; CC.missions.active = null;
      S.waypoint = null;
      if (CC.hud) { CC.hud.setObjective(''); CC.hud.setProgress(0); }
      if (CC.menu) CC.menu.showResult(false, def.name, 0, 0, reason);
    }
  };
})();
