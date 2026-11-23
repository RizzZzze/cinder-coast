// Cinder Coast activities: Tow Calls, Courier Runs, Chop Orders.
// Fresh Stage 2 write from BRIEF-04. All three pay cash and Standing.
(function () {
  var CC = window.CinderCoast;
  var CHOP_NAMES = ['Vesper Sprint', 'Mistral Spindle', 'Cutter Coupe', 'Ferro Nomad'];
  CC.activities = {
    active: null,
    start: function (id) {
      var S = CC.S;
      if (!S || CC.activities.active) return false;
      var rng = CC.rng.make(CC.config.seed + 900 + id.length * 13 + Math.floor(S.time));
      var a = { id: id, stage: 0, timer: 0, target: [0, 0], drop: [0, 0], car: null, key: null };
      if (id === 'tow') {
        var p = CC.city.roadPoint(rng, 'ew', 80, -200, 200);
        a.target = p; a.drop = [-140, 120]; a.timer = 180;
        a.car = CC.vehicles.make(S.scene, 'quill', p[0], p[1], 0, 0x8A8F98);
        a.car.broken = true;
      } else if (id === 'courier') {
        a.target = [-120, 60]; a.drop = [240, 80]; a.timer = 120;
      } else if (id === 'chop') {
        a.key = ['sprint', 'spindle', 'cutter', 'nomad'][Math.floor(S.time) % 4];
        var q = CC.city.roadPoint(rng, 'ns', 160, -100, 200);
        a.target = q; a.drop = [-140, 120]; a.timer = 240;
        a.car = CC.vehicles.make(S.scene, a.key, q[0], q[1], 0);
        a.car.chopTarget = true;
        if (CC.notify) CC.notify.push('Chop Order: steal a ' + CHOP_NAMES[['sprint', 'spindle', 'cutter', 'nomad'].indexOf(a.key)]);
      }
      CC.activities.active = a;
      S.activity = a;
      S.objective = { text: CC.activities.label(a), tx: a.target[0], tz: a.target[1], kind: 'activity' };
      if (CC.notify) CC.notify.push('Activity started: ' + CC.activities.label(a));
      return true;
    },
    label: function (a) {
      if (a.id === 'tow') return a.stage === 0 ? 'Tow the broken-down car' : 'Deliver the tow to the Mercado garage';
      if (a.id === 'courier') return a.stage === 0 ? 'Collect the package in Old Mercado' : 'Deliver the package to the Glasswing';
      return a.stage === 0 ? 'Steal the named vehicle' : 'Deliver it intact to the Mercado garage';
    }
  };
})();

// Activity update, completion and failure.
(function () {
  var CC = window.CinderCoast;
  var A = CC.activities;
  A.update = function (dt) {
    var S = CC.S, a = A.active;
    if (!S || !a) return;
    a.timer -= dt;
    if (a.timer <= 0) { A.fail('Time ran out'); return; }
    var px = S.vehicle ? S.vehicle.x : S.player.x;
    var pz = S.vehicle ? S.vehicle.z : S.player.z;
    var tgt = a.stage === 0 ? a.target : a.drop;
    var d = Math.hypot(px - tgt[0], pz - tgt[1]);
    S.objectiveDist = Math.round(d);
    S.objective = { text: A.label(a), tx: tgt[0], tz: tgt[1], kind: 'activity' };
    if (a.id === 'chop' && a.stage === 1 && S.vehicle && S.vehicle.chopTarget) {
      if (d <= 8) { A.complete(); return; }
    }
    if (d > 8) return;
    if (a.id === 'tow') {
      if (a.stage === 0) {
        a.stage = 1;
        if (S.vehicle) { S.vehicle.towed = a.car; a.car.mesh.visible = true; }
        if (CC.notify) CC.notify.push('Car hooked — deliver it to the garage');
      } else A.complete();
      return;
    }
    if (a.id === 'courier') {
      if (a.stage === 0) { a.stage = 1; if (CC.notify) CC.notify.push('Package collected — deliver it to Sunfield'); }
      else A.complete();
      return;
    }
    if (a.id === 'chop') {
      if (a.stage === 0) {
        if (S.vehicle && S.vehicle.chopTarget) {
          a.stage = 1;
          if (CC.wanted) CC.wanted.addHeat(15, 'Heat +15: vehicle reported');
          if (CC.notify) CC.notify.push('Got it — deliver it intact to the Mercado garage');
        }
      } else A.complete();
    }
  };
  A.complete = function () {
    var S = CC.S, a = A.active;
    if (!S || !a) return;
    var pay = CC.config.activityPay[a.id] || 200;
    S.cash += pay;
    if (CC.progression) CC.progression.addStanding(4);
    if (a.car && a.car.mesh) { a.car.mesh.parent.remove(a.car.mesh); }
    if (S.vehicle) S.vehicle.towed = null;
    if (CC.notify) CC.notify.push('Activity complete: +' + pay + ' crowns, +4 Standing');
    A.active = null; S.activity = null; S.objective = null;
    if (CC.save) CC.save.saveGame('activity');
  };
  A.fail = function (reason) {
    var S = CC.S, a = A.active;
    if (!S || !a) return;
    if (a.car && a.car.mesh) { a.car.mesh.parent.remove(a.car.mesh); }
    if (S.vehicle) S.vehicle.towed = null;
    if (CC.notify) CC.notify.push('Activity failed: ' + reason);
    A.active = null; S.activity = null; S.objective = null;
  };
  A.marker = function () {
    var a = A.active;
    if (!a) return null;
    var tgt = a.stage === 0 ? a.target : a.drop;
    return { x: tgt[0], z: tgt[1], kind: 'activity' };
  };
})();
