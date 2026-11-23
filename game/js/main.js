// Cinder Coast main: boot, game states (title, play, pause, result), main loop.
// Stage 1: Saltmarsh Quay + Corvane Bridge approach, Mission 1 "Wrong Tow".
(function () {
  var CC = window.CinderCoast;
  var params = new URLSearchParams(window.location.search);
  var seed = parseInt(params.get('seed') || '7', 10) || 7;
  var shotName = params.get('shot') || '';
  var startTime = parseFloat(params.get('time') || '16.5') || 16.5;
  var renderer, camera, scene, clock, frameCount = 0, minimapTimer = 0;
  function newState() {
    return {
      mode: 'title', seed: seed, time: 0, timeOfDay: startTime,
      player: { x: -136, z: 210, y: 0, vy: 0, heading: Math.PI, moving: false, inVehicle: false, mesh: null },
      vehicle: null, health: 100, armour: 25, cash: 120, standing: 12, chapter: 1,
      heat: 0, stars: 0, mission: null, missionFlags: {}, garage: [], activity: null,
      ammo: {
        kestrel: { mag: 12, reserve: 60 },
        brisk: { mag: 30, reserve: 120 },
        harrow: { mag: 6, reserve: 24 },
        lantern: { mag: 0, reserve: 0 }
      },
      police: [], roadblock: null, waypoint: null, objectiveText: '',
      gunfireTimer: 0, crashTimer: 0, shake: 0, lastDamageAt: -99,
      outOfSightFor: 0, lastSeenAt: 0, dead: false, hijacking: false,
      northUp: false, speedUnit: 'km/h', sensitivity: 1, lastMission: 1,
      options: { master: 0.8, music: 0.6, sfx: 0.8 },
      feedLog: [], scene: null, shotMode: !!shotName
    };
  }
  function boot() {
    CC.S = newState();
    var S = CC.S;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('game').appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    scene = new THREE.Scene();
    S.scene = scene;
    CC.sky.build(scene);
    CC.sky.setTimeOfDay(startTime);
    CC.city.build(scene, seed);
    CC.props.build(scene, seed);
    CC.lights.build(scene);
    CC.chunks.register(scene);
    CC.vehicles.buildParked(scene, seed);
    CC.fx.init(scene);
    S.player.mesh = CC.player.buildMesh(scene);
    S.player.mesh.position.set(S.player.x, 0, S.player.z);
    var tow = CC.vehicles.make(scene, 'tow', -140, 210, Math.PI, 0xE8A33D);
    S.startTow = tow;
    var rng = CC.rng.make(seed);
    CC.traffic.spawnNear(scene, S.player.x, S.player.z, rng);
    CC.peds.spawnNear(scene, S.player.x, S.player.z, rng);
    CC.menu.bind();
    CC.input.bind(renderer.domElement);
    CC.hud.refreshWeapon();
    CC.hud.refreshStars();
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    clock = new THREE.Clock();
    if (shotName) {
      CC.main.applyShot(shotName);
      if (shotName !== 'police') {
        S.mode = 'play';
        CC.menu.hideAll();
      }
    } else {
      CC.menu.showTitle();
    }
    renderer.setAnimationLoop(CC.main.loop);
  }
  function applyShot(name) {
    var S = CC.S;
    S.shotMode = true;
    if (name === 'chase') {
      var car = CC.vehicles.make(S.scene, 'spindle', 180, 60, Math.PI, 0xC0392B);
      car.speed = 25;
      S.vehicle = car; S.player.inVehicle = true; S.player.x = car.x; S.player.z = car.z;
      S.heat = 100; S.stars = 3;
      S.waypoint = { x: 320, z: -160, label: 'Glasswing Hotel' };
      CC.hud.setObjective('Lose the Ardents and reach the Glasswing');
      CC.notify.push('Heat +15: vehicle reported');
      var rng = CC.rng.make(seed + 9);
      var px = [172, 188, 180];
      for (var i = 0; i < 3; i++) {
        var m = CC.geo.carBody(CC.config.vehicles.ardent);
        m.position.set(px[i], 0, 78 + i * 14);
        m.rotation.y = Math.PI;
        S.scene.add(m);
        S.police.push({ kind: 'cruiser', mesh: m, x: px[i], z: 78 + i * 14, heading: Math.PI, speed: 24, health: 100, state: 'pursuit', shootTimer: 0 });
      }
      CC.camera3.shotCam = { pos: [172, 5.5, 32], look: [181, 1.5, 62] };
      CC.camera3.setYaw(Math.PI);
    } else if (name === 'foot') {
      S.player.x = -120; S.player.z = 110; S.player.heading = Math.PI;
      S.player.inVehicle = false; S.vehicle = null;
      if (S.player.mesh) S.player.mesh.position.set(S.player.x, 0, S.player.z);
      var v = CC.vehicles.make(S.scene, 'sprint', -114, 96, Math.PI / 2, 0x7FA8C9);
      S.nearParkedPrompt = v;
      S.waypoint = { x: 0, z: -200, label: 'Halo Tower' };
      CC.hud.setObjective('Explore Saltmarsh Quay');
      CC.hud.showPrompt('F: Hijack');
      CC.camera3.setYaw(Math.PI);
      var rng2 = CC.rng.make(seed + 5);
      CC.peds.spawnNear(S.scene, S.player.x, S.player.z, rng2);
      for (var pi = 0; pi < 8; pi++) {
        var pm = CC.geo.personMesh([0xC8643B, 0x2BB3B0, 0xF2A81D, 0x5E9A4A][pi % 4], 0xE8B88A);
        var pxx = -132 + pi * 4, pzz = 96 + (pi % 3) * 5;
        pm.position.set(pxx, 0, pzz);
        S.scene.add(pm);
        CC.peds.list.push({ mesh: pm, x: pxx, z: pzz, road: CC.city.roads[4], along: pxx, dir: 1, speed: 1.1, state: 'walk', lookTimer: 0, fleeX: 0, fleeZ: 0, bob: pi, tipped: false });
      }
    } else if (name === 'mission') {
      var tow = CC.vehicles.make(S.scene, 'tow', 180, -140, Math.PI, 0xE8A33D);
      tow.speed = 14;
      var hooked = CC.vehicles.make(S.scene, 'sprint', 180, -132, Math.PI, 0x7FA8C9);
      tow.towed = hooked;
      S.vehicle = tow; S.player.inVehicle = true; S.player.x = tow.x; S.player.z = tow.z;
      var haul = CC.vehicles.make(S.scene, 'haul', 180, -168, Math.PI, 0x8A8F98);
      haul.speed = 12;
      S.missionHaul = haul;
      S.mission = { id: 1, name: 'Wrong Tow', stage: 2, timer: 0 };
      S.waypoint = { x: 180, z: -280, label: 'Mercado garage' };
      CC.hud.setObjective('Tow the Vesper to the Mercado garage');
      CC.hud.setProgress(0.55);
      CC.notify.push('Game saved');
      CC.camera3.setYaw(Math.PI);
    } else if (name === 'police') {
      var pc = CC.vehicles.make(S.scene, 'spindle', 0, 205, Math.PI, 0xC0392B);
      pc.speed = 0;
      S.vehicle = pc; S.player.inVehicle = true; S.player.x = pc.x; S.player.z = pc.z;
      S.heat = 100; S.stars = 3;
      S.waypoint = { x: 0, z: 160, label: 'Roadblock' };
      CC.hud.setObjective('Break through the roadblock');
      var rb = { x: 0, z: 160, units: [] };
      S.roadblock = rb;
      for (var i = 0; i < 3; i++) {
        var cm = CC.geo.carBody(CC.config.vehicles.ardent);
        cm.position.set(-10 + i * 10, 0, 160);
        cm.rotation.y = Math.PI / 2 + (i - 1) * 0.45;
        S.scene.add(cm);
        rb.units.push({ kind: 'cruiser', mesh: cm, x: -10 + i * 10, z: 160, heading: 0, speed: 0, health: 100, state: 'block', shootTimer: 0 });
      }
      for (var j = 0; j < 4; j++) {
        var off = CC.geo.personMesh(0x1F3A5F, 0xE8B88A);
        off.position.set(-14 + j * 9, 0, 168);
        S.scene.add(off);
        rb.units.push({ kind: 'foot', mesh: off, x: -14 + j * 9, z: 168, heading: 0, speed: 0, health: 60, state: 'block', shootTimer: j * 0.3 });
      }
      for (var k = 0; k < 3; k++) {
        var pm = CC.geo.carBody(CC.config.vehicles.ardent);
        S.scene.add(pm);
        S.police.push({ kind: 'cruiser', mesh: pm, x: -20 + k * 20, z: 190, heading: Math.PI, speed: 0, health: 100, state: 'pursuit', shootTimer: 0 });
      }
      S.mode = 'pause';
      CC.menu.hideAll();
      var pause = document.getElementById('pause-menu');
      if (pause) pause.style.display = 'flex';
      var hud = document.getElementById('hud');
      if (hud) hud.style.display = 'block';
      CC.camera3.setYaw(Math.PI);
    }
    S.timeOfDay = startTime;
    CC.sky.setTimeOfDay(startTime);
  }

  function loop() {
    var dt = Math.min(0.05, clock.getDelta());
    var S = CC.S;
    frameCount++;
    if (S.mode === 'play') {
      S.time += dt;
      S.timeOfDay = (S.timeOfDay + dt * 0.001) % 24;
      S.gunfireTimer = Math.max(0, S.gunfireTimer - dt);
      S.crashTimer = Math.max(0, S.crashTimer - dt);
      var input = CC.input.poll();
      if (S.shotMode) {
        if (shotName === 'chase' && S.vehicle) S.vehicle.speed = 25;
        if (shotName === 'mission' && S.vehicle) S.vehicle.speed = 14;
        if (shotName === 'mission' && S.missionHaul) {
          S.missionHaul.z -= 12 * dt;
          S.missionHaul.mesh.position.set(S.missionHaul.x, 0, S.missionHaul.z);
          S.missionHaul.mesh.rotation.y = Math.PI;
        }
        if (shotName === 'foot') CC.hud.showPrompt('F: Hijack');
      } else {
        if (input.enter && S.vehicle) CC.ownership.exitVehicle();
        else if (input.enter && !S.vehicle) {
          var near = CC.vehicles.nearestParked(S.player.x, S.player.z, 4);
          if (near && !near.driver) { CC.ownership.tryHijack(); }
        }
        if (input.interact) {
          if (S.mission && S.mission.id === 1 && S.mission.stage === 1) CC.missions.tryHook();
          else if (S.activity) CC.activities.tryHook();
          else if (!S.vehicle) CC.ownership.tryHijack();
        }
        CC.ownership.update(dt);
        CC.player.update(dt, input, CC.camera3.getYaw());
        if (S.vehicle) {
          CC.driving.update(S.vehicle, input, dt);
          if (CC.audio) CC.audio.setEngine(Math.min(1, Math.abs(S.vehicle.speed) / S.vehicle.def.top));
        } else if (CC.audio) CC.audio.setEngine(0);
        CC.weapons.update(dt);
        CC.missions.update(dt);
        CC.activities.update(dt);
        if (input.aim) { /* aiming handled by camera + crosshair */ }
      }
      CC.traffic.update(dt, S.time);
      CC.peds.update(dt, S.time);
      CC.lights.update(S.time);
      if (!S.shotMode) {
        CC.police.update(dt);
        CC.wanted.update(dt);
      }
      CC.fx.update(dt);
      CC.chunks.update(S.player.x, S.player.z);
      CC.sky.follow(S.player.x, S.player.z);
      if (S.stars >= 1) CC.sfx.setSiren(true); else CC.sfx.setSiren(false);
      if (!S.shotMode) {
        var nearP = CC.vehicles.nearestParked(S.player.x, S.player.z, 4);
        if (S.vehicle) CC.hud.showPrompt('E: Exit  ·  H: Horn');
        else if (nearP) CC.hud.showPrompt('F: Hijack');
        else if (S.mission && S.mission.stage === 1) CC.hud.showPrompt('F: Hook the car');
        else CC.hud.showPrompt('');
      }
      minimapTimer -= dt;
      if (minimapTimer <= 0) { minimapTimer = 0.12; CC.minimap.draw(); }
      CC.hud.update();
      if (S.vehicle && S.vehicle.speed !== undefined) CC.camera3.update(dt, camera, input.aim && !S.vehicle);
      else CC.camera3.update(dt, camera, input.aim);
    } else if (S.mode === 'title') {
      var t = S.time + dt; S.time = t;
      camera.position.set(Math.sin(t * 0.05) * 260, 90, Math.cos(t * 0.05) * 260 + 40);
      camera.lookAt(0, 10, 0);
      CC.traffic.update(dt, S.time);
      CC.peds.update(dt, S.time);
      CC.fx.update(dt);
    } else if (S.mode === 'pause' && S.shotMode) {
      CC.minimap.draw();
      CC.hud.update();
      CC.camera3.update(0.016, camera, false);
    }
    if (frameCount === 90) window.__shotReady = true;
    renderer.render(scene, camera);
    CC.input.clearTransient();
  }
  CC.main = {
    boot: boot,
    loop: loop,
    applyShot: applyShot,
    newGame: function () {
      var keepScene = CC.S.scene;
      if (CC.S.player.mesh) keepScene.remove(CC.S.player.mesh);
      if (CC.S.startTow && CC.S.startTow.mesh) keepScene.remove(CC.S.startTow.mesh);
      CC.S = newState();
      CC.S.scene = keepScene;
      CC.S.player.mesh = CC.player.buildMesh(keepScene);
      CC.S.player.mesh.position.set(CC.S.player.x, 0, CC.S.player.z);
      var tow = CC.vehicles.make(keepScene, 'tow', -140, 210, Math.PI, 0xE8A33D);
      CC.S.startTow = tow;
      CC.S.mode = 'play';
      CC.menu.hideAll();
      CC.hud.refreshWeapon();
      CC.hud.refreshStars();
      CC.missions.startMission1();
      if (CC.audio) CC.audio.unlock();
    },
    continueGame: function () {
      var ok = CC.save.loadGame();
      CC.S.mode = 'play';
      CC.menu.hideAll();
      CC.hud.refreshWeapon();
      CC.hud.refreshStars();
      if (!ok) CC.missions.startMission1();
      else if (CC.notify) CC.notify.push('Save loaded');
      if (CC.audio) CC.audio.unlock();
    }
  };
  window.addEventListener('DOMContentLoaded', function () { CC.main.boot(); });
})();
