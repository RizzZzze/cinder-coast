// Cinder Coast camera: chase, close and far camera, aim camera, shake.
(function () {
  var CC = window.CinderCoast;
  var yaw = 0, pitch = 0.32, mode = 0, shakeT = 0;
  var modes = [
    { dist: 9.5, height: 3.9, fov: 60 },
    { dist: 5.5, height: 2.6, fov: 58 },
    { dist: 13, height: 5.2, fov: 64 }
  ];
  CC.camera3 = {
    yaw: 0,
    shotCam: null,
    getYaw: function () { return yaw; },
    setYaw: function (y) { yaw = y; },
    cycleMode: function () { mode = (mode + 1) % modes.length; if (CC.notify) CC.notify.push('Camera: ' + ['chase', 'close', 'far'][mode]); },
    addShake: function (a) { shakeT = Math.max(shakeT, a); },
    update: function (dt, camera, aiming) {
      var S = CC.S;
      if (!S) return;
      if (CC.camera3.shotCam) {
        var sc = CC.camera3.shotCam;
        camera.position.set(sc.pos[0], sc.pos[1], sc.pos[2]);
        camera.lookAt(sc.look[0], sc.look[1], sc.look[2]);
        camera.fov = 58; camera.updateProjectionMatrix();
        return;
      }
      var m = modes[mode];
      var target, heading;
      if (S.vehicle) {
        target = S.vehicle;
        heading = S.vehicle.heading;
        yaw += (heading - yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI > Math.PI ? 0 : 0;
        var dy = heading - yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        yaw += dy * Math.min(1, dt * 2.2);
      } else {
        target = S.player;
        heading = yaw;
      }
      var dist = aiming ? 3.2 : m.dist;
      if (S.vehicle && S.vehicle.towed) { dist += 11; }
      var height = aiming ? 2.0 : m.height;
      if (S.vehicle && S.vehicle.towed) height += 1.6;
      var cx = target.x - Math.sin(yaw) * dist;
      var cz = target.z - Math.cos(yaw) * dist;
      var cy = (target.y || 0) + height;
      if (S.vehicle) {
        var speedRatio = Math.min(1, Math.abs(S.vehicle.speed) / S.vehicle.def.top);
        camera.fov = 60 + speedRatio * 12;
        camera.updateProjectionMatrix();
      } else if (aiming) {
        camera.fov = 48; camera.updateProjectionMatrix();
      } else {
        camera.fov = 60; camera.updateProjectionMatrix();
      }
      shakeT = Math.max(0, shakeT - dt * 1.8);
      var sh = shakeT * shakeT * 0.5;
      cx += (Math.random() - 0.5) * sh;
      cy += (Math.random() - 0.5) * sh;
      camera.position.set(cx, cy, cz);
      var lookY = (target.y || 0) + (S.vehicle ? 1.6 : 1.5);
      camera.lookAt(target.x, lookY, target.z);
      CC.camera3.yaw = yaw;
    },
    orbit: function (dx, dy) {
      yaw -= dx * 0.0032;
      pitch = Math.max(0.05, Math.min(1.1, pitch + dy * 0.002));
    }
  };
})();
