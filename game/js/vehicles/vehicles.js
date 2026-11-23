// Cinder Coast vehicles: definitions, parked cars, spawning, ownership hooks.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  var parked = [];
  CC.vehicles = {
    parked: parked,
    make: function (scene, key, x, z, heading, colour) {
      var def = CC.config.vehicles[key];
      if (!def) return null;
      var mesh = CC.geo.carBody(def, colour);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = heading || 0;
      mesh.castShadow = true;
      scene.add(mesh);
      var v = {
        key: key, def: def, mesh: mesh, x: x, z: z, heading: heading || 0,
        speed: 0, health: 100, hot: false, towed: null, driver: false,
        top: def.top, grip: def.grip, engineHealth: 100
      };
      if (CC.progression) CC.progression.applyUpgrades(v);
      return v;
    },
    spawnParked: function (scene, rng) {
      while (parked.length < 18) {
        var road = CC.city.roads[rng.int(0, CC.city.roads.length - 1)];
        var along = rng.range(road.from + 20, road.to - 20);
        var side = rng.chance(0.5) ? 8.5 : -8.5;
        var x, z, heading;
        if (road.axis === 'ew') { x = along; z = road.at + side; heading = rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2; }
        else { x = road.at + side; z = along; heading = rng.chance(0.5) ? Math.PI : 0; }
        var keys = ['sprint', 'spindle', 'cutter', 'nomad', 'quill'];
        var key = rng.pick(keys);
        var mesh = CC.geo.carBody(CC.config.vehicles[key]);
        mesh.position.set(x, 0, z);
        mesh.rotation.y = heading;
        scene.add(mesh);
        parked.push({ key: key, def: CC.config.vehicles[key], mesh: mesh, x: x, z: z, heading: heading, driver: false, colour: null });
      }
    },
    nearestParked: function (x, z, maxD) {
      var best = null, bd = maxD || 1e9;
      parked.forEach(function (p) {
        var d = Math.hypot(p.x - x, p.z - z);
        if (d < bd) { bd = d; best = p; }
      });
      return best;
    },
    takeParked: function (p) {
      var idx = parked.indexOf(p);
      if (idx >= 0) parked.splice(idx, 1);
      if (p.mesh) p.mesh.parent.remove(p.mesh);
    }
  };
})();

// Vehicle helpers: nearest vehicle and parked-car respawn.
(function () {
  var CC = window.CinderCoast;
  var V = CC.vehicles;
  V.nearest = function (x, z, maxD) {
    var S = CC.S;
    var best = V.nearestParked(x, z, maxD);
    var bd = best ? Math.hypot(best.x - x, best.z - z) : (maxD || 1e9);
    if (S && S.vehicle) {
      var d = Math.hypot(S.vehicle.x - x, S.vehicle.z - z);
      if (d < bd) return S.vehicle;
    }
    return best;
  };
  V.respawnParked = function (scene) {
    var S = CC.S;
    if (!S) return;
    var rng = CC.rng.make(CC.config.seed + 600 + Math.floor(S.time));
    V.spawnParked(scene, rng);
  };
  V.remove = function (v) {
    if (!v || !v.mesh) return;
    v.mesh.parent.remove(v.mesh);
  };
})();
