// Cinder Coast traffic: civilian car AI — lanes, spawning, despawning, reactions.
// Cars follow the road grid, stop at lights, brake for cars ahead, yield to
// police sirens by pulling to the kerb, honk when blocked by the player.
(function () {
  var CC = window.CinderCoast;
  var cars = [], spawnBudget = 0;
  function makeCar(scene, rng) {
    var keys = Object.keys(CC.config.vehicles).filter(function (k) {
      return ['sprint', 'spindle', 'cutter', 'nomad', 'courier', 'quill', 'taxi'].indexOf(k) >= 0;
    });
    var key = rng.pick(keys);
    if (rng.chance(0.12)) key = 'ardent';
    var def = CC.config.vehicles[key];
    var mesh = CC.geo.carBody(def);
    scene.add(mesh);
    if (key === 'taxi') {
      var roof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x2B2B33 }));
      roof.position.set(0, 1.45, 0);
      mesh.add(roof);
    }
    if (key === 'ardent' && CC.fx) CC.fx.headlightGlow({ mesh: mesh, def: def });
    var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
    var along = rng.range(road.from + 30, road.to - 30);
    var dir = rng.chance(0.5) ? 1 : -1;
    var lane = dir > 0 ? 3.5 : -3.5;
    var car = {
      key: key, def: def, mesh: mesh, road: road, along: along, dir: dir,
      lane: lane, speed: rng.range(6, 11), target: rng.range(8, 13),
      honkTimer: 0, stopped: false, sirenYield: false
    };
    place(car); cars.push(car); return car;
  }
  function place(car) {
    var r = car.road;
    var x, z, heading;
    if (r.axis === 'ew') { x = car.along; z = r.at + car.lane; heading = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { x = r.at + car.lane; z = car.along; heading = car.dir > 0 ? Math.PI : 0; }
    car.mesh.position.set(x, 0, z);
    car.mesh.rotation.y = heading;
    car.x = x; car.z = z; car.heading = heading;
  }
  function aheadClear(car, dt) {
    var look = 14;
    for (var i = 0; i < cars.length; i++) {
      var o = cars[i];
      if (o === car || o.road !== car.road) continue;
      var d = (o.along - car.along) * car.dir;
      if (d > 0 && d < look) return false;
    }
    var S = CC.S;
    if (S && S.vehicle) {
      var dx = S.vehicle.x - car.x, dz = S.vehicle.z - car.z;
      var dist = Math.hypot(dx, dz);
      if (dist < 12) {
        var fwdX = Math.sin(car.heading), fwdZ = Math.cos(car.heading);
        if (dx * fwdX + dz * fwdZ > 0) return false;
      }
    }
    return true;
  }
  CC.traffic = {
    cars: cars,
    spawnNear: function (scene, px, pz, rng) {
      spawnBudget = 0;
      while (cars.length < CC.config.caps.traffic && spawnBudget < 4) {
        makeCar(scene, rng); spawnBudget++;
      }
    },
    update: function (dt, t) {
      var S = CC.S;
      cars.forEach(function (car) {
        var want = car.target;
        var nextJunction = null;
        if (car.road.axis === 'ew') {
          var jx = Math.round(car.along / 80) * 80;
          if ((jx - car.along) * car.dir > 0 && Math.abs(jx - car.along) < 16) nextJunction = { x: jx, z: car.road.at };
        } else {
          var jz = Math.round(car.along / 80) * 80;
          if ((jz - car.along) * car.dir > 0 && Math.abs(jz - car.along) < 16) nextJunction = { x: car.road.at, z: jz };
        }
        if (nextJunction && !CC.lights.greenFor(nextJunction.x, nextJunction.z, car.road.axis, t)) want = 0;
        if (!aheadClear(car, dt)) want = 0;
        var sirenNear = false;
        if (S && S.police) {
          for (var i = 0; i < S.police.length; i++) {
            if (Math.hypot(S.police[i].x - car.x, S.police[i].z - car.z) < 40) { sirenNear = true; break; }
          }
        }
        if (sirenNear) { want = 0; car.sirenYield = true; }
        else car.sirenYield = false;
        if (want === 0 && S && S.vehicle) {
          var d = Math.hypot(S.vehicle.x - car.x, S.vehicle.z - car.z);
          if (d < 10) {
            car.honkTimer -= dt;
            if (car.honkTimer <= 0) { car.honkTimer = 2.5; if (CC.sfx) CC.sfx.honk(); }
          }
        }
        if (want > car.speed) car.speed = Math.min(want, car.speed + 6 * dt);
        else if (want < car.speed) car.speed = Math.max(want, car.speed - 14 * dt);
        car.along += car.dir * car.speed * dt;
        var r = car.road;
        if (car.along > r.to - 8 || car.along < r.from + 8) {
          var roads = CC.city.roads;
          car.road = roads[Math.floor(Math.random() * roads.length)];
          car.along = Math.max(car.road.from + 20, Math.min(car.along, car.road.to - 20));
          car.dir = Math.random() < 0.5 ? 1 : -1;
          car.lane = car.dir > 0 ? 3.5 : -3.5;
        }
        var laneTarget = car.sirenYield ? (car.dir > 0 ? 5.8 : -5.8) : (car.dir > 0 ? 3.5 : -3.5);
        car.lane += (laneTarget - car.lane) * Math.min(1, dt * 2);
        place(car);
      });
      for (var i = cars.length - 1; i >= 0; i--) {
        if (S && Math.hypot(cars[i].x - S.player.x, cars[i].z - S.player.z) > 180) {
          cars[i].mesh.parent.remove(cars[i].mesh);
          cars.splice(i, 1);
        }
      }
    },
    nearest: function (x, z, maxD) {
      var best = null, bd = maxD || 1e9;
      cars.forEach(function (c) {
        var d = Math.hypot(c.x - x, c.z - z);
        if (d < bd) { bd = d; best = c; }
      });
      return best;
    }
  };
})();
