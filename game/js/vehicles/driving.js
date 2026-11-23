// Cinder Coast driving: acceleration, steering, collisions, towing, crashes.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  CC.driving = {
    update: function (dt, input) {
      var S = CC.S;
      if (!S || !S.vehicle) return;
      var v = S.vehicle;
      var top = v.top || v.def.top;
      var accel = v.def.accel;
      if (input.forward) v.speed += accel * dt;
      else if (input.back) v.speed -= accel * 0.8 * dt;
      else v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 8 * dt);
      if (input.handbrake) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 26 * dt);
      v.speed = Math.max(-top * 0.4, Math.min(top, v.speed));
      var steer = 0;
      if (input.left) steer += 1;
      if (input.right) steer -= 1;
      var steerRate = 1.6 * (v.grip || 1) * Math.min(1, Math.abs(v.speed) / 8 + 0.25);
      v.heading += steer * steerRate * dt * Math.sign(v.speed || 1);
      var nx = v.x + Math.sin(v.heading) * v.speed * dt;
      var nz = v.z + Math.cos(v.heading) * v.speed * dt;
      var probe = { x: nx, z: nz };
      if (CC.spatial.pushOut(probe, 1.4)) {
        if (Math.abs(v.speed) > 14 && CC.damage) CC.damage.crashDamage(Math.abs(v.speed));
        v.speed *= 0.35;
        nx = probe.x; nz = probe.z;
      }
      CC.city.clampToWorld(probe);
      v.x = probe.x; v.z = probe.z;
      v.mesh.position.set(v.x, 0, v.z);
      v.mesh.rotation.y = v.heading;
      v.mesh.rotation.z = -steer * 0.02 * Math.min(1, Math.abs(v.speed) / 20);
      if (Math.abs(v.speed) > 18 && CC.fx && Math.random() < dt * 8) CC.fx.smoke(v.x, v.z);
      var pedHit = null;
      if (CC.peds) {
        for (var i = 0; i < CC.peds.list.length; i++) {
          var p = CC.peds.list[i];
          if (!p.tipped && Math.hypot(p.x - v.x, p.z - v.z) < 1.8 && Math.abs(v.speed) > 3) { pedHit = p; break; }
        }
      }
      if (pedHit) CC.peds.hitByVehicle(pedHit);
      if (v.towed && v.towed.mesh) {
        var tx = v.x - Math.sin(v.heading) * 6.5, tz = v.z - Math.cos(v.heading) * 6.5;
        v.towed.x = tx; v.towed.z = tz;
        v.towed.mesh.position.set(tx, 0, tz);
        v.towed.mesh.rotation.y = v.heading;
      }
      S.player.x = v.x; S.player.z = v.z; S.player.heading = v.heading;
      if (CC.audio) CC.audio.setEngine(Math.min(1, Math.abs(v.speed) / top));
    }
  };
})();

// Driving helpers: speed readout and tow hookup.
(function () {
  var CC = window.CinderCoast;
  var D = CC.driving;
  D.speedKmh = function () {
    var S = CC.S;
    if (!S || !S.vehicle) return 0;
    return Math.round(Math.abs(S.vehicle.speed) * 3.6);
  };
  D.hookTow = function (car) {
    var S = CC.S;
    if (!S || !S.vehicle || !car) return false;
    S.vehicle.towed = car;
    return true;
  };
  D.unhookTow = function () {
    var S = CC.S;
    if (!S || !S.vehicle) return;
    S.vehicle.towed = null;
  };
})();
