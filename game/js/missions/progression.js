// Cinder Coast progression: Standing, gun shop, garage upgrades, safehouses.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  CC.progression = {
    addStanding: function (n) {
      var S = CC.S;
      if (!S) return;
      S.standing = Math.max(0, Math.min(100, (S.standing || 0) + n));
      if (CC.hud) CC.hud.refresh();
    },
    canBuyWeapon: function (key) {
      var S = CC.S;
      var w = CC.config.weapons[key];
      if (!w || !S) return false;
      if (S.chapter < w.chapter) return false;
      if ((S.weapons.owned || {})[key]) return false;
      return S.cash >= w.price;
    },
    buyWeapon: function (key) {
      var S = CC.S;
      if (!CC.progression.canBuyWeapon(key)) return false;
      var w = CC.config.weapons[key];
      S.cash -= w.price;
      S.weapons.owned[key] = { ammo: w.mag * 3, reserve: w.mag * 3 };
      S.weapons.current = key;
      if (CC.notify) CC.notify.push('Bought the ' + w.name);
      if (CC.hud) CC.hud.refresh();
      return true;
    },
    upgradeCost: function (vehicleKey, kind) {
      var S = CC.S;
      if (!S) return 0;
      var tier = ((S.upgrades[vehicleKey] || {}).engine !== undefined) ? S.upgrades[vehicleKey] : null;
      var cur = tier ? (tier[kind] || 0) : 0;
      return CC.config.upgradeCost(kind, cur + 1);
    },
    buyUpgrade: function (vehicleKey, kind) {
      var S = CC.S;
      if (!S) return false;
      var cost = CC.progression.upgradeCost(vehicleKey, kind);
      if (!cost || S.cash < cost) return false;
      S.upgrades[vehicleKey] = S.upgrades[vehicleKey] || { engine: 0, grip: 0, armour: 0 };
      if (S.upgrades[vehicleKey][kind] >= 3) return false;
      S.cash -= cost;
      S.upgrades[vehicleKey][kind]++;
      if (CC.notify) CC.notify.push(kind + ' upgraded to tier ' + S.upgrades[vehicleKey][kind]);
      return true;
    },
    applyUpgrades: function (v) {
      var S = CC.S;
      if (!S || !v) return v;
      var u = S.upgrades[v.key] || { engine: 0, grip: 0, armour: 0 };
      v.top = v.def.top * (1 + 0.12 * u.engine);
      v.grip = v.def.grip * (1 + 0.1 * u.grip);
      v.maxArmour = 50 + 50 * u.armour;
      return v;
    }
  };
})();

// District gating, safehouses and owned-vehicle recall.
(function () {
  var CC = window.CinderCoast;
  var P = CC.progression;
  P.districtUnlocked = function (id) {
    var S = CC.S;
    return CC.config.districtUnlocked(id, S ? S.chapter : 1);
  };
  P.checkDistrictGate = function () {
    var S = CC.S;
    if (!S) return;
    var d = CC.city.districtAt(S.player.x, S.player.z);
    if (d && !P.districtUnlocked(d.id) && !S.mission) {
      if (CC.notify) CC.notify.push(d.name + ' is locked — finish chapter ' + d.chapter + ' first');
      S.player.x = S.lastSafeX || CC.config.spawn.x;
      S.player.z = S.lastSafeZ || CC.config.spawn.z;
      if (S.vehicle) { S.vehicle.x = S.player.x; S.vehicle.z = S.player.z; }
    } else if (d && P.districtUnlocked(d.id)) {
      S.lastSafeX = S.player.x; S.lastSafeZ = S.player.z;
    }
  };
  P.nearestSafehouse = function (maxD) {
    var S = CC.S;
    if (!S) return null;
    var best = null, bd = maxD || 1e9;
    CC.config.safehouses.forEach(function (sh) {
      var d = Math.hypot(sh.x - S.player.x, sh.z - S.player.z);
      if (d < bd) { bd = d; best = sh; }
    });
    return best;
  };
  P.useSafehouse = function () {
    var S = CC.S;
    var sh = P.nearestSafehouse(10);
    if (!sh || !S) return false;
    if (S.vehicle) CC.ownership.storeInGarage(S.vehicle);
    if (CC.save) CC.save.saveGame('safehouse');
    if (CC.notify) CC.notify.push('Saved at ' + sh.name + ' — garage stop free');
    return true;
  };
  P.recallVehicle = function (key) {
    var S = CC.S;
    if (!S || !S.garage || S.garage.indexOf(key) < 0) return null;
    var v = CC.vehicles.make(S.scene, key, S.player.x + 4, S.player.z + 4, S.player.heading);
    P.applyUpgrades(v);
    return v;
  };
  P.ownedWeaponList = function () {
    var S = CC.S;
    if (!S) return [];
    return Object.keys(S.weapons.owned || {});
  };
})();
