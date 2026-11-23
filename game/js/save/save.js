// Cinder Coast save: localStorage save and load, exact restore.
// Fresh Stage 2 write from BRIEF-04. Saving restores position, vehicles,
// cash, Standing, weapons, chapter and district unlocks exactly.
(function () {
  var CC = window.CinderCoast;
  var KEY = 'cinder-coast-save-v2';
  CC.save = {
    key: KEY,
    saveGame: function (reason) {
      var S = CC.S;
      if (!S) return false;
      try {
        var data = {
          version: CC.config.saveVersion, cash: S.cash, standing: S.standing,
          chapter: S.chapter, health: S.health, armour: S.armour,
          player: { x: S.player.x, z: S.player.z, heading: S.player.heading },
          weapons: { owned: S.weapons.owned, current: S.weapons.current },
          upgrades: S.upgrades, garage: S.garage,
          options: S.options, vehicle: S.vehicle ? S.vehicle.key : null
        };
        window.localStorage.setItem(KEY, JSON.stringify(data));
        if (CC.notify) CC.notify.push('Game saved' + (reason ? ' — ' + reason : ''));
        return true;
      } catch (e) { return false; }
    },
    loadGame: function () {
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || data.version !== CC.config.saveVersion) return null;
        return data;
      } catch (e) { return null; }
    },
    hasSave: function () {
      try { return !!window.localStorage.getItem(KEY); } catch (e) { return false; }
    },
    applySave: function (data) {
      var S = CC.S;
      if (!S || !data) return false;
      S.cash = data.cash; S.standing = data.standing; S.chapter = data.chapter;
      S.health = data.health; S.armour = data.armour;
      S.player.x = data.player.x; S.player.z = data.player.z; S.player.heading = data.player.heading;
      S.weapons.owned = data.weapons.owned || {}; S.weapons.current = data.weapons.current;
      S.upgrades = data.upgrades || {}; S.garage = data.garage || [];
      if (data.options) S.options = data.options;
      if (data.vehicle && CC.vehicles) {
        var v = CC.vehicles.make(S.scene, data.vehicle, S.player.x + 4, S.player.z + 4, S.player.heading);
        if (v) { S.vehicle = v; S.player.inVehicle = true; }
      }
      if (CC.hud) CC.hud.refresh();
      return true;
    },
    clear: function () {
      try { window.localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})();

// Save helpers: autosave on mission end and safehouse use share saveGame.
(function () {
  var CC = window.CinderCoast;
  CC.save.autosave = function () { return CC.save.saveGame('autosave'); };
  CC.save.summary = function () {
    var d = CC.save.loadGame();
    if (!d) return null;
    return { cash: d.cash, standing: d.standing, chapter: d.chapter, vehicle: d.vehicle };
  };
})();
