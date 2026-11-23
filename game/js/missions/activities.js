// Cinder Coast activities: tow calls, courier runs, chop orders.
// Tow Calls (Stage 1) keep working unchanged. Courier Runs and Chop Orders
// (Stage 2) pay cash and Standing, with a timer and a clear fail state.
(function () {
  var CC = window.CinderCoast;
  var PAYS = { tow: 180, courier: 220, chop: 320 };
  var STAND = { tow: 3, courier: 4, chop: 5 };
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
    startCourier: function () {
      var S = CC.S;
      if (!S || S.mission || S.activity || S.chapter < 2) return false;
      var ds = CC.config.districts;
      var rng = CC.rng.make(S.seed + 410 + Math.floor(S.time));
      var a = ds[rng.int(0, ds.length - 1)], b = ds[rng.int(0, ds.length - 1)];
      if (b === a) b = ds[(ds.indexOf(a) + 2) % ds.length];
      S.activity = { id: 'courier', name: 'Courier Run', stage: 0, timer: 150, x: a.x, z: a.z, dx: b.x, dz: b.z, from: a.name, to: b.name };
      CC.activities.active = S.activity;
      S.waypoint = { x: a.x, z: a.z, label: 'Pickup — ' + a.name };
      if (CC.hud) CC.hud.setObjective('Courier Run: pick up the package in ' + a.name);
      if (CC.notify) CC.notify.push('Courier Run — ' + a.name + ' to ' + b.name + ', 150 s');
      return true;
    },
    startChop: function () {
      var S = CC.S;
      if (!S || S.mission || S.activity || S.chapter < 2) return false;
      var rng = CC.rng.make(S.seed + 420 + Math.floor(S.time));
      var keys = ['cutter', 'spindle', 'nomad'];
      var key = rng.pick(keys);
      var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
      var along = rng.range(road.from + 40, road.to - 40);
      var x = road.axis === 'ew' ? along : road.at;
      var z = road.axis === 'ew' ? road.at : along;
      var car = CC.vehicles.make(S.scene, key, x, z, 0);
      car.hot = true;
      var name = CC.config.vehicles[key].name;
      S.activity = { id: 'chop', name: 'Chop Order', stage: 0, timer: 240, target: car, key: key, x: x, z: z, vehicleName: name };
      CC.activities.active = S.activity;
      S.waypoint = { x: x, z: z, label: name + ' (steal it)' };
      if (CC.hud) CC.hud.setObjective('Chop Order: steal the ' + name);
      if (CC.notify) CC.notify.push('Chop Order — steal the ' + name + ', deliver it intact to the Mercado garage');
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
      } else if (a.id === 'courier' && a.stage === 0) {
        if (Math.hypot(S.player.x - a.x, S.player.z - a.z) < 10) {
          a.stage = 1;
          S.waypoint = { x: a.dx, z: a.dz, label: 'Deliver — ' + a.to };
          if (CC.hud) CC.hud.setObjective('Courier Run: deliver the package to ' + a.to);
          if (CC.notify) CC.notify.push('Package collected — deliver it to ' + a.to);
        }
      } else if (a.id === 'courier' && a.stage === 1) {
        if (Math.hypot(S.player.x - a.dx, S.player.z - a.dz) < 12) CC.activities.complete();
      } else if (a.id === 'chop' && a.stage === 0) {
        if (S.vehicle && S.vehicle.key === a.key && S.vehicle === a.target) {
          a.stage = 1;
          S.waypoint = { x: -160, z: -40, label: 'Mercado garage' };
          if (CC.hud) CC.hud.setObjective('Chop Order: deliver the ' + a.vehicleName + ' intact to the Mercado garage');
          if (CC.notify) CC.notify.push('Got it — keep it intact, deliver to the Mercado garage');
        }
      } else if (a.id === 'chop' && a.stage === 1) {
        if (!a.target || a.target.damage >= 100) { CC.activities.fail('The chop car was destroyed'); return; }
        if (S.vehicle === a.target && Math.hypot(S.vehicle.x - (-160), S.vehicle.z - (-40)) < 16) {
          if (a.target.damage >= 60) { CC.activities.fail('Delivered too damaged — the order is void'); return; }
          CC.activities.complete();
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
      var pay = PAYS[a.id] || 180, st = STAND[a.id] || 3;
      S.cash += pay;
      S.standing = Math.min(100, S.standing + st);
      if (a.id === 'chop' && S.vehicle === a.target) {
        CC.ownership.storeInGarage(a.target);
        S.vehicle = null; S.player.inVehicle = false;
      }
      if (S.vehicle) S.vehicle.towed = null;
      S.activity = null; CC.activities.active = null; S.waypoint = null;
      if (CC.hud) CC.hud.setObjective('');
      if (CC.notify) CC.notify.push(a.name + ' complete — +' + pay + ' cr');
      if (CC.menu) CC.menu.showResult(true, a.name, pay, st);
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
