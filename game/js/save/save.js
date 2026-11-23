// Cinder Coast save: localStorage save, load, validation, autosave triggers.
(function () {
  var CC = window.CinderCoast;
  var KEY = 'cinder-coast-save-v1';
  function snapshot(S) {
    return {
      version: 1, x: S.player.x, z: S.player.z, y: S.player.y,
      cash: S.cash, standing: S.standing, chapter: S.chapter,
      missionFlags: S.missionFlags || {}, garage: S.garage || [],
      ammo: S.ammo, timeOfDay: S.timeOfDay, seed: S.seed,
      vehicleKey: S.vehicle ? S.vehicle.key : null,
      options: S.options || {}
    };
  }
  function valid(d) {
    if (!d || typeof d !== 'object' || d.version !== 1) return false;
    if (typeof d.x !== 'number' || typeof d.z !== 'number') return false;
    if (typeof d.cash !== 'number' || d.cash < 0) return false;
    if (typeof d.standing !== 'number' || d.standing < 0 || d.standing > 100) return false;
    if (typeof d.chapter !== 'number' || d.chapter < 1 || d.chapter > 8) return false;
    return true;
  }
  CC.save = {
    key: KEY,
    hasSave: function () {
      try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    },
    saveGame: function (manual) {
      var S = CC.S;
      if (!S) return false;
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot(S)));
        if (CC.notify) CC.notify.push(manual ? 'Game saved' : 'Game saved');
        return true;
      } catch (e) { return false; }
    },
    autosave: function () { CC.save.saveGame(false); },
    loadGame: function () {
      var S = CC.S;
      if (!S) return false;
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { return false; }
      if (!raw) return false;
      var d = null;
      try { d = JSON.parse(raw); } catch (e) { return false; }
      if (!valid(d)) {
        if (CC.notify) CC.notify.push('Save is corrupt — starting a new game');
        return false;
      }
      S.player.x = d.x; S.player.z = d.z; S.player.y = d.y || 0;
      S.cash = d.cash; S.standing = d.standing; S.chapter = d.chapter;
      S.missionFlags = d.missionFlags || {}; S.garage = d.garage || [];
      if (d.ammo) S.ammo = d.ammo;
      S.timeOfDay = d.timeOfDay || 16.5;
      if (d.options) S.options = d.options;
      if (d.vehicleKey && CC.vehicles) {
        var v = CC.vehicles.make(S.scene, d.vehicleKey, d.x + 3, d.z, 0);
        S.vehicle = v; S.player.inVehicle = true;
      }
      return true;
    }
  };
})();
