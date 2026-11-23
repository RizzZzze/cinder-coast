// Cinder Coast driving: arcade driving physics, damage, explosions.
// Throttle, brake/reverse, speed-sensitive steering, grip that loosens at
// speed, drift on handbrake, collision bounce, smoke then explosion.
(function () {
  var CC = window.CinderCoast;
  CC.driving = {
    update: function (v, input, dt) {
      if (!v || !v.engineOn) return;
      var def = v.def, cfg = CC.config.tuning;
      var top = def.top * (v.upgradeEngine || 1);
      var accel = def.accel;
      if (input.forward) v.speed += accel * dt;
      if (input.back) {
        if (v.speed > 0.5) v.speed -= cfg.brake * dt;
        else v.speed -= accel * 0.6 * dt;
      }
      if (!input.forward && !input.back) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 8 * dt);
      if (input.handbrake) v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 18 * dt);
      v.speed = Math.max(-cfg.reverseMax, Math.min(top, v.speed));
      var speedRatio = Math.min(1, Math.abs(v.speed) / top);
      var steerTarget = 0;
      if (input.left) steerTarget = 1;
      if (input.right) steerTarget = -1;
      var steerRate = input.handbrake ? 4 : 2.6;
      v.steer += (steerTarget * cfg.steerMax * (1 - speedRatio * 0.55) - v.steer) * Math.min(1, dt * steerRate);
      var grip = (input.handbrake ? cfg.handbrakeGrip : cfg.grip) * (def.handling || 1) * (v.upgradeGrip || 1);
      var turn = v.steer * (v.speed / top) * 2.4 * grip;
      if (v.speed < 0) turn = -turn;
      v.heading += turn * dt * (Math.abs(v.speed) > 0.1 ? 1 : 0);
      if (input.handbrake && Math.abs(v.speed) > 8 && Math.random() < dt * 8 && CC.fx) CC.fx.smoke(v.x, v.z);
      var nx = v.x + Math.sin(v.heading) * v.speed * dt;
      var nz = v.z + Math.cos(v.heading) * v.speed * dt;
      var hit = CC.spatial.collideCircle(nx, nz, def.wid / 2 + 0.3);
      if (hit) {
        v.speed *= -0.35;
        v.damage += Math.min(25, Math.abs(v.speed) * 0.4 + 4) * (CC.progress ? CC.progress.armourFactor(v) : 1);
        if (CC.fx) CC.fx.sparks(nx, nz);
        if (CC.sfx) CC.sfx.impact(Math.min(1, Math.abs(v.speed) / 20));
        if (CC.S) CC.S.crashTimer = 1.5;
        CC.spatial.pushOut(v, def.wid / 2 + 0.3);
        nx = v.x; nz = v.z;
      } else {
        v.x = nx; v.z = nz;
      }
      CC.traffic.cars.forEach(function (c) {
        var d = Math.hypot(c.x - v.x, c.z - v.z);
        if (d < 3.2 && d > 0.01) {
          var push = (3.2 - d) / 2;
          var dx = (v.x - c.x) / d, dz = (v.z - c.z) / d;
          v.x += dx * push; v.z += dz * push;
          v.speed *= 0.55; v.damage += 6 * (CC.progress ? CC.progress.armourFactor(v) : 1);
          if (CC.fx) CC.fx.sparks(v.x, v.z);
          if (CC.S) { CC.S.crashTimer = 1.5; }
        }
      });
      CC.peds.list.forEach(function (p) {
        if (p.tipped) return;
        if (Math.hypot(p.x - v.x, p.z - v.z) < 2.2 && Math.abs(v.speed) > 3) {
          CC.peds.hitByVehicle(p);
          v.speed *= 0.8;
          if (CC.S) CC.S.crashTimer = 1.5;
        }
      });
      if (v.towed) {
        var tx = v.x - Math.sin(v.heading) * (def.len / 2 + v.towed.def.len / 2 + 0.6);
        var tz = v.z - Math.cos(v.heading) * (def.len / 2 + v.towed.def.len / 2 + 0.6);
        v.towed.x = tx; v.towed.z = tz; v.towed.heading = v.heading;
        v.towed.mesh.position.set(tx, 0, tz);
        v.towed.mesh.rotation.y = v.heading;
      }
      v.mesh.position.set(v.x, 0, v.z);
      v.mesh.rotation.y = v.heading;
      v.mesh.rotation.z = -v.steer * 0.08;
      if (v.damage >= cfg.damageSmoke && v.damage < cfg.damageExplode) {
        v.smokeTimer -= dt;
        if (v.smokeTimer <= 0) { v.smokeTimer = 0.12; if (CC.fx) CC.fx.smoke(v.x, v.z); }
      }
      if (v.damage >= cfg.damageExplode) CC.driving.explode(v);
    },
    explode: function (v) {
      if (!v.engineOn) return;
      v.engineOn = false;
      if (CC.fx) CC.fx.explosion(v.x, v.z);
      if (CC.sfx) CC.sfx.explosion();
      if (CC.S) CC.S.shake = 1;
      var S = CC.S;
      if (S && S.vehicle === v) {
        CC.damage.hurt(60, 'explosion');
        S.vehicle = null;
      }
      if (S && S.police) {
        var near = S.police.some(function (u) { return Math.hypot(u.x - v.x, u.z - v.z) < 30; });
        if (near && CC.wanted) CC.wanted.addHeat(CC.config.heatFor.destroyPolice, 'Police vehicle destroyed');
      }
      v.mesh.visible = false;
    }
  };
})();
