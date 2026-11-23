// Cinder Coast ownership: hijack, hot flags, garage storage, upgrades.
(function () {
  var CC = window.CinderCoast;
  var hijackTimer = 0, hijackTarget = null;
  CC.ownership = {
    hijackTimer: 0,
    tryHijack: function () {
      var S = CC.S;
      if (!S || S.vehicle) return false;
      var d = CC.vehicles.nearestParked(S.player.x, S.player.z, 4);
      if (d) {
        hijackTarget = d; hijackTimer = d.driver ? 1.5 : 0.4;
        S.hijacking = true;
        return true;
      }
      var car = CC.traffic.nearest(S.player.x, S.player.z, 4);
      if (car) {
        hijackTarget = { traffic: car }; hijackTimer = 1.5;
        S.hijacking = true;
        return true;
      }
      return false;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || !S.hijacking || !hijackTarget) return;
      hijackTimer -= dt;
      CC.ownership.hijackTimer = hijackTimer;
      if (hijackTimer > 0) return;
      S.hijacking = false;
      var v;
      if (hijackTarget.traffic) {
        var c = hijackTarget.traffic;
        var idx = CC.traffic.cars.indexOf(c);
        if (idx >= 0) CC.traffic.cars.splice(idx, 1);
        v = CC.vehicles.make(S.scene, c.key, c.x, c.z, c.heading);
        c.mesh.parent.remove(c.mesh);
      } else {
        CC.vehicles.takeParked(hijackTarget);
        v = CC.vehicles.make(S.scene, hijackTarget.key, hijackTarget.x, hijackTarget.z, hijackTarget.heading, hijackTarget.colour);
      }
      v.hot = true;
      S.vehicle = v;
      S.player.inVehicle = true;
      if (CC.wanted) CC.wanted.addHeat(CC.config.heatFor.stealCar, 'Heat +15: vehicle reported');
      if (CC.notify) CC.notify.push('Vehicle reported — heat +15');
      hijackTarget = null;
    },
    exitVehicle: function () {
      var S = CC.S;
      if (!S || !S.vehicle) return;
      var v = S.vehicle;
      S.player.x = v.x + Math.sin(v.heading + Math.PI / 2) * 2.5;
      S.player.z = v.z + Math.cos(v.heading + Math.PI / 2) * 2.5;
      S.player.heading = v.heading;
      S.player.inVehicle = false;
      S.vehicle = null;
      if (CC.audio) CC.audio.setEngine(0);
    },
    enterVehicle: function (v) {
      var S = CC.S;
      if (!S || S.vehicle) return;
      S.vehicle = v;
      S.player.inVehicle = true;
      S.player.x = v.x; S.player.z = v.z;
    },
    storeInGarage: function (v) {
      var S = CC.S;
      if (!S) return;
      S.garage = S.garage || [];
      if (S.garage.indexOf(v.key) < 0) S.garage.push(v.key);
      if (CC.notify) CC.notify.push(v.def.name + ' stored in the garage');
    }
  };
})();
