// Cinder Coast main: state, boot, game loop, shot staging.
// Fresh Stage 2 write from BRIEF-04. Node hand-in program copies this game
// unchanged; the browser runs it with no network requests.
(function () {
  var CC = window.CinderCoast;
  var params = new URLSearchParams(window.location.search);
  var SEED = parseInt(params.get('seed') || '7', 10);
  var TIME_OF_DAY = parseFloat(params.get('time') || '16.5');
  var SHOT = params.get('shot') || '';
  function newState(scene, camera, renderer) {
    return {
      scene: scene, camera: camera, renderer: renderer,
      mode: 'title', time: 0, timeOfDay: TIME_OF_DAY, seed: SEED,
      player: { x: CC.config.spawn.x, z: CC.config.spawn.z, y: 0, vy: 0, heading: 0, moving: false, inVehicle: false, mesh: null },
      vehicle: null, health: 100, armour: 25, cash: 800, standing: 0, chapter: 1,
      weapons: { owned: { kestrel: { ammo: 12, reserve: 24 } }, current: 'kestrel' },
      upgrades: {}, garage: [], police: [], heat: 0,
      gunfireTimer: 0, crashTimer: 0, hijacking: false, aiming: false,
      objective: null, objectiveDist: 0, missionProgress: 0, mission: null, activity: null,
      options: { master: 0.8, music: 0.6, sfx: 0.8 },
      feedLog: [], fps: 60, shotMode: !!SHOT, shot: SHOT, shotFrozen: false,
      lastSafeX: CC.config.spawn.x, lastSafeZ: CC.config.spawn.z, dead: false, roadblock: null
    };
  }
  CC.boot = function () {
    var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game').appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1200);
    var S = newState(scene, camera, renderer);
    CC.S = S;
    CC.spatial.clear();
    CC.chunks.build(scene, SEED);
    if (CC.sky) CC.sky.setTimeOfDay(TIME_OF_DAY);
    S.player.mesh = CC.player.buildMesh(scene);
    S.player.mesh.position.set(S.player.x, 0, S.player.z);
    var rng = CC.rng.make(SEED + 600);
    CC.vehicles.spawnParked(scene, rng);
    CC.peds.spawnNear(scene, S.player.x, S.player.z, CC.rng.make(SEED + 601));
    CC.traffic.spawnNear(scene, S.player.x, S.player.z, CC.rng.make(SEED + 602));
    if (CC.fx) CC.fx.init(scene);
    if (CC.input) CC.input.init();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    if (SHOT) CC.shots.apply(SHOT);
    else if (CC.menu) CC.menu.showTitle();
    if (CC.hud) CC.hud.refresh();
    window.__cinderReady = false;
    var last = performance.now();
    var frames = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      CC.mainTick(dt);
      frames++;
      if (frames === 5) window.__cinderReady = true;
    }
    requestAnimationFrame(loop);
  };
  CC.mainTick = function (dt) {
    var S = CC.S;
    if (!S) return;
    S.time += dt;
    if (S.mode === 'play' && !S.shotFrozen) {
      var input = CC.input.state;
      S.aiming = input.aiming && !S.vehicle;
      if (input.firing && !S.vehicle && CC.weapons) CC.weapons.fire();
      if (S.vehicle) CC.driving.update(dt, input);
      else CC.player.update(dt, input, CC.camera3.getYaw());
      if (CC.ownership) CC.ownership.update(dt);
      if (CC.weapons) CC.weapons.tick(dt);
      if (CC.enemies) CC.enemies.update(dt);
      if (CC.missions) CC.missions.update(dt);
      if (CC.activities) CC.activities.update(dt);
      if (CC.wanted) CC.wanted.update(dt);
      if (CC.police) CC.police.update(dt, S.time);
      if (CC.progression && !S.shotMode) CC.progression.checkDistrictGate();
      if (S.gunfireTimer > 0) S.gunfireTimer -= dt;
      if (S.crashTimer > 0) S.crashTimer -= dt;
    }
    if (S.mode === 'play' || S.mode === 'pause' || S.mode === 'map' || S.mode === 'title') {
      CC.traffic.update(dt, S.time);
      CC.peds.update(dt, S.time);
      if (CC.peds.list.length < CC.config.caps.pedestrians) {
        CC.peds.spawnNear(S.scene, S.player.x, S.player.z, CC.rng.make(SEED + 601 + Math.floor(S.time)));
      }
      if (CC.traffic.cars.length < CC.config.caps.traffic) {
        CC.traffic.spawnNear(S.scene, S.player.x, S.player.z, CC.rng.make(SEED + 602 + Math.floor(S.time)));
      }
    }
    if (CC.fx) CC.fx.update(dt);
    if (S.shotMode && CC.fx && S.police) CC.fx.policeLights(S.police, S.time);
    if (S.shotMode && S.shot === 'police' && CC.fx) {
      S.shotFxTimer = (S.shotFxTimer || 0) + dt;
      if (S.shotFxTimer > 0.4) {
        S.shotFxTimer = 0;
        CC.fx.tracer(-196, 1.4, 236, -200, 1.2, 220);
        CC.fx.muzzle(-196, 1.4, 236);
      }
    }
    if (CC.quality) CC.quality.update(dt);
    if (CC.chunks) CC.chunks.update(dt);
    if (CC.sky) CC.sky.follow(S.player.x, S.player.z);
    if (CC.lights) CC.lights.update(S.time);
    if (CC.camera3) CC.camera3.update(dt, S.camera, !!S.aiming);
    if (S.mode !== 'title') {
      if (CC.hud) CC.hud.update(dt);
      if (CC.minimap) CC.minimap.draw();
    }
    S.renderer.render(S.scene, S.camera);
  };
})();

// Shot staging: four fixed 1280x720 renders from the same seed and time.
(function () {
  var CC = window.CinderCoast;
  function placePlayerCar(S, key, x, z, heading, colour) {
    var v = CC.vehicles.make(S.scene, key, x, z, heading, colour);
    S.vehicle = v;
    S.player.inVehicle = true;
    S.player.x = x; S.player.z = z; S.player.heading = heading;
    if (S.player.mesh) S.player.mesh.visible = false;
    return v;
  }
  function policeBehind(S, n, x, z, heading) {
    for (var i = 0; i < n; i++) {
      var u = CC.police.spawnUnit('cruiser');
      if (!u) break;
      u.x = x - Math.sin(heading) * (10 + i * 9);
      u.z = z - Math.cos(heading) * (10 + i * 9);
      u.heading = heading;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = heading;
      u.speed = 18;
    }
  }
  CC.shots = {
    apply: function (name) {
      var S = CC.S;
      if (!S) return;
      S.mode = 'play';
      S.chapter = 8;
      S.cash = 2450;
      S.standing = 42;
      if (name === 'chase') {
        var car = placePlayerCar(S, 'spindle', 240, 40, Math.PI, 0x2BB3B0);
        car.speed = 24;
        CC.wanted.setHeat(100);
        policeBehind(S, 3, 240, 40, Math.PI);
        S.objective = { text: 'Lose the Ardents and reach the Glasswing', tx: 240, tz: 80, kind: 'mission' };
        S.objectiveDist = 62;
        if (CC.notify) { CC.notify.push('Heat +15: vehicle reported'); }
        CC.camera3.shotCam = { pos: [212, 7, 82], look: [242, 2, 12] };
      } else if (name === 'foot') {
        S.player.x = -158; S.player.z = 98; S.player.heading = 0.6;
        S.player.inVehicle = false;
        S.vehicle = null;
        if (S.player.mesh) { S.player.mesh.visible = true; S.player.mesh.position.set(-158, 0, 98); }
        var parkedCar = CC.vehicles.make(S.scene, 'sprint', -156, 102, Math.PI / 2, 0xE0433A);
        CC.vehicles.parked.push({ key: 'sprint', def: CC.config.vehicles.sprint, mesh: parkedCar.mesh, x: -156, z: 102, heading: Math.PI / 2, driver: false, colour: 0xE0433A });
        S.health = 100; S.armour = 25;
        S.objective = null;
        CC.camera3.shotCam = { pos: [-162, 6, 128], look: [-118, 3, 45] };
      } else if (name === 'mission') {
        var tow = placePlayerCar(S, 'tow', 0, -268, Math.PI, 0xE8A33D);
        tow.speed = 10;
        var lorry = CC.vehicles.make(S.scene, 'haul', 0, -300, Math.PI, 0x6B7A8A);
        lorry.mission = true; lorry.engineHealth = 100; lorry.speed = 8;
        S.mission = { id: 5, name: 'Convoy', lorry: lorry, stages: [], stage: 1 };
        S.objective = { text: "Disable the lorry's engine", tx: 0, tz: -300, kind: 'mission' };
        S.objectiveDist = 32;
        S.missionProgress = 0.45;
        if (CC.notify) CC.notify.push('Game saved');
        CC.camera3.shotCam = { pos: [-10, 7, -246], look: [0, 2, -300] };
      } else if (name === 'police') {
        S.player.x = -200; S.player.z = 220; S.player.heading = 0;
        S.player.inVehicle = false;
        if (S.player.mesh) { S.player.mesh.visible = true; S.player.mesh.position.set(-200, 0, 220); }
        CC.wanted.setHeat(180);
        CC.police.makeRoadblock();
        var swat = CC.police.spawnUnit('swat');
        if (swat) { swat.x = -170; swat.z = 240; swat.mesh.position.set(-170, 0, 240); swat.mesh.rotation.y = Math.PI / 2; }
        if (CC.fx) { CC.fx.tracer(-196, 1.4, 236, -200, 1.2, 220); CC.fx.muzzle(-196, 1.4, 236); }
        S.objective = { text: 'Escape the roadblock', tx: -200, tz: 280, kind: 'mission' };
        S.objectiveDist = 58;
        CC.camera3.shotCam = { pos: [-222, 6, 206], look: [-188, 1, 238] };
        if (CC.menu) CC.menu.showPause();
        S.mode = 'pause';
      }
      S.shotFrozen = true;
      if (CC.hud) CC.hud.refresh();
      if (CC.minimap) CC.minimap.draw();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { CC.boot(); });
  } else {
    CC.boot();
  }
})();
