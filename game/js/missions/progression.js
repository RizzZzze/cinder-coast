// Cinder Coast progression: Standing, district unlocks, gun shop, garage
// upgrades, safehouses and owned vehicles. Standing runs 0-100 and unlocks
// districts for free roam and weapons at the Mercado gun shop.
(function () {
  var CC = window.CinderCoast;
  CC.progress = {
    districtUnlocked: function (name) {
      var S = CC.S;
      var d = null;
      CC.config.districts.forEach(function (x) { if (x.name === name) d = x; });
      if (!d) return true;
      return (S ? S.chapter : 1) >= d.unlockChapter;
    },
    districtAt: function (x, z) {
      var best = null, bd = 1e9;
      CC.config.districts.forEach(function (d) {
        var dd = Math.hypot(x - d.x, z - d.z);
        if (dd < bd) { bd = dd; best = d; }
      });
      return bd < 110 ? best : null;
    },
    checkGate: function () {
      var S = CC.S;
      if (!S || S.mode !== 'play' || S.mission || S.activity) return;
      var d = CC.progress.districtAt(S.player.x, S.player.z);
      if (d && !CC.progress.districtUnlocked(d.name)) {
        S.player.x = S.lastSafeX !== undefined ? S.lastSafeX : S.player.x;
        S.player.z = S.lastSafeZ !== undefined ? S.lastSafeZ : S.player.z;
        if (S.vehicle) { S.vehicle.x = S.player.x; S.vehicle.z = S.player.z; S.vehicle.mesh.position.set(S.player.x, 0, S.player.z); }
        if (S.player.mesh) S.player.mesh.position.set(S.player.x, 0, S.player.z);
        if (!S.gateWarnedAt || S.time - S.gateWarnedAt > 5) {
          S.gateWarnedAt = S.time;
          if (CC.notify) CC.notify.push(d.name + ' is locked — open it in Chapter ' + d.unlockChapter);
        }
      } else {
        S.lastSafeX = S.player.x; S.lastSafeZ = S.player.z;
      }
    },
    ownedWeapons: function () {
      var S = CC.S;
      return (S && S.ownedWeapons) || ['kestrel'];
    },
    buyWeapon: function (key) {
      var S = CC.S;
      if (!S) return false;
      var stock = null;
      CC.config.gunShop.stock.forEach(function (s) { if (s.key === key) stock = s; });
      if (!stock) return false;
      if (CC.progress.ownedWeapons().indexOf(key) >= 0) return false;
      if (S.chapter < stock.chapter || S.standing < stock.standing) return false;
      if (S.cash < stock.price) {
        if (CC.notify) CC.notify.push('Not enough cash for the ' + CC.config.weapons[key].name);
        return false;
      }
      S.cash -= stock.price;
      S.ownedWeapons = CC.progress.ownedWeapons().concat([key]);
      var def = CC.config.weapons[key];
      S.ammo[key] = { mag: def.mag, reserve: def.reserve };
      if (CC.weapons.order.indexOf(key) < 0) CC.weapons.order.push(key);
      if (CC.notify) CC.notify.push(CC.config.weapons[key].name + ' bought — ' + stock.price + ' cr');
      if (CC.hud) CC.hud.refreshWeapon();
      if (CC.save) CC.save.autosave();
      return true;
    },
    upgradeLevel: function (vehicleKey, kind) {
      var S = CC.S;
      if (!S || !S.upgrades || !S.upgrades[vehicleKey]) return 0;
      return S.upgrades[vehicleKey][kind] || 0;
    },
    buyUpgrade: function (vehicleKey, kind) {
      var S = CC.S;
      if (!S) return false;
      var lvl = CC.progress.upgradeLevel(vehicleKey, kind);
      if (lvl >= 3) return false;
      var tier = CC.config.upgradeTiers[lvl];
      if (S.cash < tier.price) {
        if (CC.notify) CC.notify.push('Not enough cash for the upgrade');
        return false;
      }
      S.cash -= tier.price;
      S.upgrades = S.upgrades || {};
      S.upgrades[vehicleKey] = S.upgrades[vehicleKey] || {};
      S.upgrades[vehicleKey][kind] = lvl + 1;
      if (S.vehicle && S.vehicle.key === vehicleKey) CC.progress.applyUpgrades(S.vehicle);
      if (CC.notify) CC.notify.push(vehicleKey + ' ' + kind + ' tier ' + (lvl + 1) + ' fitted — ' + tier.price + ' cr');
      if (CC.save) CC.save.autosave();
      return true;
    },
    applyUpgrades: function (v) {
      if (!v) return;
      var eng = CC.progress.upgradeLevel(v.key, 'engine');
      var grip = CC.progress.upgradeLevel(v.key, 'grip');
      var arm = CC.progress.upgradeLevel(v.key, 'armour');
      v.upgradeEngine = eng ? CC.config.upgradeTiers[eng - 1].mult : 1;
      v.upgradeGrip = grip ? CC.config.upgradeTiers[grip - 1].mult : 1;
      v.upgradeArmour = arm;
    },
    armourFactor: function (v) {
      var arm = (v && v.upgradeArmour) || 0;
      return Math.max(0.4, 1 - 0.2 * arm);
    },
    nearestSafehouse: function (x, z, maxD) {
      var best = null, bd = maxD || 1e9;
      CC.config.safehouses.forEach(function (h) {
        var d = Math.hypot(x - h.x, z - h.z);
        if (d < bd) { bd = d; best = h; }
      });
      return best;
    },
    useSafehouse: function () {
      var S = CC.S;
      if (!S) return false;
      var h = CC.progress.nearestSafehouse(S.player.x, S.player.z, 8);
      if (!h) return false;
      S.health = 100;
      if (S.vehicle) { S.vehicle.damage = 0; CC.ownership.storeInGarage(S.vehicle); }
      if (CC.save) CC.save.saveGame(true);
      if (CC.notify) CC.notify.push(h.name + ' — rested, saved, vehicle garaged');
      return true;
    },
    recallVehicle: function (key) {
      var S = CC.S;
      if (!S || !S.garage || S.garage.indexOf(key) < 0) return false;
      var i = S.garage.indexOf(key);
      S.garage.splice(i, 1);
      var v = CC.vehicles.make(S.scene, key, S.player.x + 4, S.player.z, 0);
      v.owned = true;
      CC.progress.applyUpgrades(v);
      S.vehicle = v; S.player.inVehicle = true;
      S.player.x = v.x; S.player.z = v.z;
      if (CC.notify) CC.notify.push(CC.config.vehicles[key].name + ' recalled from the garage');
      return true;
    },
    update: function () {
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      S.nearShop = null;
      var g = CC.config.gunShop.at;
      if (Math.hypot(S.player.x - g.x, S.player.z - g.z) < 8) S.nearShop = 'gun';
      var ga = CC.config.garageAt;
      if (Math.hypot(S.player.x - ga.x, S.player.z - ga.z) < 10) S.nearShop = 'garage';
      if (CC.progress.nearestSafehouse(S.player.x, S.player.z, 8)) S.nearShop = 'safehouse';
    }
  };
})();
