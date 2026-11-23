// Cinder Coast player: on-foot movement, collision, health.
(function () {
  var CC = window.CinderCoast;
  CC.player = {
    buildMesh: function (scene) {
      var mesh = CC.geo.personMesh(0xE8A33D, 0xE8B88A);
      scene.add(mesh);
      return mesh;
    },
    update: function (dt, input, camYaw) {
      var S = CC.S;
      if (!S || S.player.inVehicle) return;
      var p = S.player;
      var cfg = CC.config.tuning;
      var speed = input.sprint ? cfg.sprintSpeed : cfg.walkSpeed;
      var mx = 0, mz = 0;
      if (input.forward) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
      if (input.back) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
      if (input.left) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
      if (input.right) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
      var len = Math.hypot(mx, mz);
      if (len > 0) {
        mx /= len; mz /= len;
        p.x += mx * speed * dt;
        p.z += mz * speed * dt;
        p.heading = Math.atan2(mx, mz);
        p.moving = true;
      } else p.moving = false;
      if (input.jump && p.y <= 0.01) p.vy = cfg.jumpSpeed;
      p.vy -= cfg.gravity * dt;
      p.y += p.vy * dt;
      if (p.y < 0) { p.y = 0; p.vy = 0; }
      var before = { x: p.x, z: p.z };
      if (CC.spatial.pushOut(p, 0.6)) {
        if (Math.abs(p.x - before.x) > 0.01 || Math.abs(p.z - before.z) > 0.01) { /* bumped */ }
      }
      if (p.x > 330) p.x = 330; if (p.x < -330) p.x = -330;
      if (p.z > 330) p.z = 330; if (p.z < -560) p.z = -560;
      if (p.mesh) {
        p.mesh.position.set(p.x, p.y, p.z);
        p.mesh.rotation.y = p.heading;
        p.mesh.visible = true;
      }
      if (S.health < 100 && tNow() - S.lastDamageAt > 6) {
        S.health = Math.min(100, S.health + 6 * dt);
      }
      function tNow() { return S.time; }
    }
  };
})();
