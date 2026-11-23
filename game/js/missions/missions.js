// Cinder Coast missions: Missions 2-8 runner, stages, fail states, retry.
// Fresh Stage 2 write from BRIEF-04. Each mission is completable from the
// start screen to its result card, with a clear fail state and a retry.
(function () {
  var CC = window.CinderCoast;
  function stage(text, x, z, kind, extra) {
    var s = { text: text, x: x, z: z, kind: kind || 'reach', radius: 6 };
    if (extra) for (var k in extra) s[k] = extra[k];
    return s;
  }
  var DEFS = {
    2: { name: 'Dead Drop', stages: [
      stage('Retrieve the parcel from the stall', -160, 96, 'pickup'),
      stage('Survive the ambush in the arcades', -120, 60, 'combat', { count: 4 }),
      stage('Reach the Mercado garage', -140, 120, 'reach') ] },
    3: { name: 'Pier Nine', stages: [
      stage('Drive through the rail crossing', -160, -160, 'reach', { radius: 10 }),
      stage('Find the locker of Tomas Varga', -280, -280, 'pickup'),
      stage('Escape the roadblock — reach the Quay', -200, 260, 'escape', { radius: 12, heat: 100 }) ] },
    4: { name: 'Glass Floor', stages: [
      stage('Infiltrate the Glasswing service lifts', 240, 80, 'reach', { radius: 10 }),
      stage('Fight through the hotel corridor', 240, 110, 'combat', { count: 5 }),
      stage('Reach the top-floor lift', 240, 60, 'pickup') ] },
    5: { name: 'Convoy', stages: [
      stage('Follow the Brasswater Haul onto the bridge', 0, -160, 'reach', { radius: 12 }),
      stage('Disable the lorry engine — do not destroy the cargo', 0, -300, 'disable', { radius: 30 }),
      stage('Escort the lorry to the north end', 0, -480, 'reach', { radius: 12 }) ] },
    6: { name: 'Funicular', stages: [
      stage('Chase Odile Sarr up the hill', 0, -160, 'reach', { radius: 10 }),
      stage('Fight the lookouts on the slope', 20, -320, 'combat', { count: 3 }),
      stage('Confront Odile on the funicular platform', 40, -480, 'confront', { count: 2 }) ] },
    7: { name: 'Lantern Light', stages: [
      stage('Reach the foot of the Halo Tower', 60, 0, 'reach', { radius: 12 }),
      stage('Confront Captain Roque', 60, 24, 'combat', { count: 4, boss: true }),
      stage('Recover the ledger', 60, 0, 'pickup') ] },
    8: { name: 'Tidewater', stages: [
      stage('Breach the freight yard', -220, -240, 'reach', { radius: 12 }),
      stage('Assault the syndicate yard', -220, -240, 'combat', { count: 6 }),
      stage('Cut the freight line at the north siding', -260, -280, 'pickup') ] }
  };
  CC.missions = {
    defs: DEFS,
    active: null,
    start: function (id) {
      var S = CC.S;
      if (!S || !DEFS[id]) return false;
      var def = null;
      CC.story.missions.forEach(function (m) { if (m.id === id) def = m; });
      var stages = DEFS[id].stages.map(function (s) {
        var c = {};
        for (var k in s) c[k] = s[k];
        c.done = false; c.progress = 0; c.spawned = false;
        return c;
      });
      CC.missions.active = {
        id: id, name: def ? def.name : DEFS[id].name, stages: stages, stage: 0,
        startedAt: S.time, timer: id === 3 ? 240 : 0, lorry: null
      };
      S.mission = CC.missions.active;
      S.mode = 'play';
      if (CC.menu) CC.menu.hideAll();
      if (CC.notify) CC.notify.push('Mission started: ' + CC.missions.active.name);
      CC.missions.applyStage();
      return true;
    },
    applyStage: function () {
      var S = CC.S, m = CC.missions.active;
      if (!S || !m) return;
      var st = m.stages[m.stage];
      if (!st) return;
      S.objective = { text: st.text, tx: st.x, tz: st.z, kind: st.kind };
      if (st.kind === 'combat' || st.kind === 'confront') {
        if (!st.spawned && CC.enemies) {
          st.spawned = true;
          CC.enemies.spawnSquad(S.scene, st.x, st.z, st.count || 3, !!st.boss);
        }
      }
      if (st.kind === 'disable' && !m.lorry && CC.vehicles) {
        m.lorry = CC.vehicles.make(S.scene, 'haul', 0, -240, Math.PI, 0x6B7A8A);
        m.lorry.mission = true;
        m.lorry.engineHealth = 100;
        m.lorry.speed = 8;
        if (CC.notify) CC.notify.push('Brasswater Haul is crossing the bridge');
      }
      if (st.kind === 'escape' && CC.wanted) CC.wanted.setHeat(st.heat || 100);
      if (CC.hud) CC.hud.refresh();
    }
  };
})();

// Mission update, completion, failure and retry.
(function () {
  var CC = window.CinderCoast;
  var M = CC.missions;
  M.update = function (dt) {
    var S = CC.S, m = M.active;
    if (!S || !m) return;
    var st = m.stages[m.stage];
    if (!st) return;
    var px = S.vehicle ? S.vehicle.x : S.player.x;
    var pz = S.vehicle ? S.vehicle.z : S.player.z;
    var d = Math.hypot(px - st.x, pz - st.z);
    S.objectiveDist = Math.round(d);
    if (m.timer > 0) {
      m.timer -= dt;
      if (m.timer <= 0) { M.fail('Time ran out'); return; }
    }
    if (st.kind === 'disable' && m.lorry) {
      var L = m.lorry;
      L.z -= L.speed * dt;
      if (L.z < -480) L.z = -480;
      L.mesh.position.set(L.x, 0, L.z);
      st.x = L.x; st.z = L.z;
      var behind = Math.hypot(px - L.x, pz - L.z);
      if (behind < 30 && (!S.vehicle || Math.abs(S.vehicle.speed) > 6)) st.progress += dt / 24;
      if (L.engineHealth <= 0) { M.fail('The cargo was destroyed'); return; }
      S.missionProgress = Math.min(1, st.progress);
      if (st.progress >= 1) { M.nextStage(); return; }
      return;
    }
    if (st.kind === 'combat' || st.kind === 'confront') {
      var alive = CC.enemies ? CC.enemies.aliveCount() : 0;
      S.missionProgress = st.count ? Math.min(1, 1 - alive / st.count) : 1;
      if (st.spawned && alive <= 0) { M.nextStage(); return; }
      return;
    }
    if (d <= st.radius) {
      if (st.kind === 'escape' && CC.wanted) CC.wanted.setHeat(0);
      M.nextStage();
    }
  };
  M.nextStage = function () {
    var S = CC.S, m = M.active;
    if (!m) return;
    m.stage++;
    S.missionProgress = 0;
    if (CC.enemies) CC.enemies.clear();
    if (m.stage >= m.stages.length) { M.complete(); return; }
    if (CC.sfx) CC.sfx.click();
    M.applyStage();
  };
  M.complete = function () {
    var S = CC.S, m = M.active;
    if (!S || !m) return;
    var def = null;
    CC.story.missions.forEach(function (mm) { if (mm.id === m.id) def = mm; });
    var payout = def ? def.payout : 500, standing = def ? def.standing : 10;
    S.cash += payout;
    if (CC.progression) CC.progression.addStanding(standing);
    S.chapter = Math.max(S.chapter, Math.min(8, m.id + 1));
    if (CC.wanted) CC.wanted.setHeat(0);
    if (CC.notify) CC.notify.push('Mission complete: +' + payout + ' crowns, +' + standing + ' Standing');
    var done = { id: m.id, name: m.name, payout: payout, standing: standing, win: true };
    M.active = null; S.mission = null; S.objective = null; S.missionProgress = 0;
    if (CC.save) CC.save.saveGame('mission');
    if (CC.menu) CC.menu.showResult(done);
    else S.mode = 'result';
  };
  M.fail = function (reason) {
    var S = CC.S, m = M.active;
    if (!S || !m) return;
    if (CC.enemies) CC.enemies.clear();
    if (m.lorry && m.lorry.mesh) { m.lorry.mesh.parent.remove(m.lorry.mesh); m.lorry = null; }
    var done = { id: m.id, name: m.name, payout: 0, standing: 0, win: false, reason: reason };
    M.active = null; S.mission = null; S.objective = null; S.missionProgress = 0;
    if (CC.notify) CC.notify.push('Mission failed: ' + reason);
    if (CC.menu) CC.menu.showResult(done);
    else S.mode = 'result';
  };
  M.retry = function (id) {
    var S = CC.S;
    if (S) { S.health = 100; S.armour = S.armour || 0; }
    if (CC.wanted) CC.wanted.setHeat(0);
    M.start(id);
  };
  M.abandon = function () {
    var S = CC.S;
    if (CC.enemies) CC.enemies.clear();
    M.active = null;
    if (S) { S.mission = null; S.objective = null; S.missionProgress = 0; }
  };
})();
