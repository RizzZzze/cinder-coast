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
      ownedWeapons: ['kestrel'], upgrades: {}, lastSafeX: -136, lastSafeZ: 210,
      gateWarnedAt: -99, nearShop: null, missionHaul: null, missionHaulEngine: 100,
      missionNomad: null, missionTargets: null,
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
    if (CC.quality) CC.quality.init(renderer);
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
    if (CC.damage) CC.damage.buildPickups(scene);
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
    var testMission = parseInt(params.get('test') || '0', 10) || 0;
    if (testMission) {
      S.mode = 'play';
      CC.menu.hideAll();
      S.chapter = Math.max(S.chapter, testMission);
      var tp = { 2: [-150, -30], 3: [-136, 210], 4: [300, -150], 5: [180, -300], 6: [120, -390], 7: [0, -188], 8: [-270, -30] }[testMission];
      if (tp) {
        S.player.x = tp[0]; S.player.z = tp[1];
        if (S.player.mesh) S.player.mesh.position.set(tp[0], 0, tp[1]);
      }
      if (testMission === 5) {
        var tt = CC.vehicles.make(scene, 'tow', 180, -300, Math.PI, 0xE8A33D);
        S.vehicle = tt; S.player.inVehicle = true;
      }
      CC.missions.startMission(testMission);
      window.__testMission = testMission;
    }
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
      // Shot 1, the cover: a chase down the Sunfield boulevard. Ines in a
      // Mistral Spindle, three Calida Ardent cruisers behind, lights on.
      // The boulevard road runs at x 320, clear of the hotel row.
      var car = CC.vehicles.make(S.scene, 'spindle', 320, 60, Math.PI, 0xC0392B);
      car.speed = 25;
      S.vehicle = car; S.player.inVehicle = true; S.player.x = car.x; S.player.z = car.z;
      S.heat = 100; S.stars = 3;
      S.waypoint = { x: 320, z: -160, label: 'Glasswing Hotel' };
      CC.hud.setObjective('Lose the Ardents and reach the Glasswing');
      CC.notify.push('Heat +15: vehicle reported');
      var rng = CC.rng.make(seed + 9);
      var px = [308, 320, 330];
      for (var i = 0; i < 3; i++) {
        var m = CC.geo.carBody(CC.config.vehicles.ardent);
        m.position.set(px[i], 0, 74 + i * 13);
        m.rotation.y = Math.PI;
        S.scene.add(m);
        S.police.push({ kind: 'cruiser', mesh: m, x: px[i], z: 74 + i * 13, heading: Math.PI, speed: 24, health: 100, state: 'pursuit', shootTimer: 0 });
      }
      CC.camera3.shotCam = { pos: [312, 5.5, 30], look: [321, 1.5, 62] };
      CC.camera3.setYaw(Math.PI);
    } else if (name === 'foot') {
      // Shot 2, the city on foot: Ines walks through Old Mercado past the
      // awning stalls and a crowd, traffic on the cross street, Halo Tower
      // rising above the rooftops in the distance.
      S.player.x = -150; S.player.z = 6; S.player.heading = 2.45;
      S.player.inVehicle = false; S.vehicle = null;
      if (S.player.mesh) S.player.mesh.position.set(S.player.x, 0, S.player.z);
      var v = CC.vehicles.make(S.scene, 'sprint', -144, -2, Math.PI / 2, 0x7FA8C9);
      S.nearParkedPrompt = v;
      S.waypoint = { x: 0, z: -200, label: 'Halo Tower' };
      CC.hud.setObjective('Explore Old Mercado');
      CC.hud.showPrompt('F: Hijack');
      // Staged traffic on the cross street (z 0 road).
      [[-120, 2, 'sprint'], [-100, -2, 'cutter']].forEach(function (tc) {
        var tm = CC.geo.carBody(CC.config.vehicles[tc[2]]);
        tm.position.set(tc[0], 0, tc[1]);
        tm.rotation.y = tc[0] < -150 ? -Math.PI / 2 : Math.PI / 2;
        S.scene.add(tm);
      });
      // Fixed camera: Ines crossing the street in the foreground, stalls,
      // the Sprint and the Halo Tower behind her.
      CC.camera3.shotCam = { pos: [-186, 6, 20], look: [-130, 6, -30] };
      CC.camera3.setYaw(2.45);
      var rng2 = CC.rng.make(seed + 5);
      CC.peds.spawnNear(S.scene, S.player.x, S.player.z, rng2);
      for (var pi = 0; pi < 8; pi++) {
        var pm = CC.geo.personMesh([0xC8643B, 0x2BB3B0, 0xF2A81D, 0x5E9A4A][pi % 4], 0xE8B88A);
        var pxx = -170 + pi * 4, pzz = 0 + (pi % 3) * 3;
        pm.position.set(pxx, 0, pzz);
        S.scene.add(pm);
        CC.peds.list.push({ mesh: pm, x: pxx, z: pzz, road: CC.city.roads[4], along: pxx, dir: 1, speed: 1.1, state: 'walk', lookTimer: 0, fleeX: 0, fleeZ: 0, bob: pi, tipped: false });
      }
    } else if (name === 'mission') {
      // Shot 3, the mission set piece: Mission 5 Convoy on the Corvane
      // Bridge approach. Ines in the Tidewell Tow close behind a Brasswater
      // Haul lorry. Staged on flat ground south of the bridge ramp, with
      // the ramp and deck rising behind the lorry.
      var tow = CC.vehicles.make(S.scene, 'tow', 180, -230, Math.PI, 0xE8A33D);
      tow.speed = 14;
      S.vehicle = tow; S.player.inVehicle = true; S.player.x = tow.x; S.player.z = tow.z;
      var haul = CC.vehicles.make(S.scene, 'haul', 180, -255, Math.PI, 0x8A8F98);
      haul.speed = 12;
      S.missionHaul = haul;
      S.missionHaulEngine = 55;
      S.mission = { id: 5, name: 'Convoy', stage: 1, timer: 300 };
      S.waypoint = { x: 180, z: -255, label: 'Brasswater Haul' };
      CC.hud.setObjective('Disable the lorry engine');
      CC.hud.setProgress(0.45);
      CC.notify.push('Game saved');
      // Bridge traffic moving on the bridge lanes.
      [[172, -235, 'sprint'], [188, -250, 'cutter']].forEach(function (tc) {
        var tm = CC.geo.carBody(CC.config.vehicles[tc[2]]);
        tm.position.set(tc[0], 0, tc[1]);
        tm.rotation.y = Math.PI;
        S.scene.add(tm);
      });
      CC.camera3.shotCam = { pos: [196, 9, -215], look: [180, 1.5, -245] };
      CC.camera3.setYaw(Math.PI);
    } else if (name === 'police') {
      // Shot 4, police responding: a 4-star roadblock at a Quay junction,
      // cruisers angled across the road, foot officers firing from behind
      // barriers, a SWAT van arriving with its lights on. Pause menu open.
      var pc = CC.vehicles.make(S.scene, 'spindle', 0, 205, Math.PI, 0xC0392B);
      pc.speed = 0;
      S.vehicle = pc; S.player.inVehicle = true; S.player.x = pc.x; S.player.z = pc.z;
      S.heat = 180; S.stars = 4;
      S.waypoint = { x: 0, z: 160, label: 'Roadblock' };
      CC.hud.setObjective('Break through the roadblock');
      var rb = { x: 0, z: 160, units: [] };
      S.roadblock = rb;
      for (var i = 0; i < 3; i++) {
        var cm = CC.geo.carBody(CC.config.vehicles.ardent);
        cm.position.set(-24 + i * 24, 0, 160);
        cm.rotation.y = Math.PI / 2 + (i - 1) * 0.45;
        S.scene.add(cm);
        rb.units.push({ kind: 'cruiser', mesh: cm, x: -24 + i * 24, z: 160, heading: 0, speed: 0, health: 100, state: 'block', shootTimer: 0 });
      }
      for (var j = 0; j < 4; j++) {
        var off = CC.geo.personMesh(0x1F3A5F, 0xE8B88A);
        off.position.set(-30 + j * 20, 0, 168);
        S.scene.add(off);
        rb.units.push({ kind: 'foot', mesh: off, x: -30 + j * 20, z: 168, heading: 0, speed: 0, health: 60, state: 'block', shootTimer: j * 0.3 });
      }
      for (var k = 0; k < 3; k++) {
        var pm = CC.geo.carBody(CC.config.vehicles.ardent);
        pm.position.set(-20 + k * 20, 0, 190);
        pm.rotation.y = Math.PI;
        S.scene.add(pm);
        S.police.push({ kind: 'cruiser', mesh: pm, x: -20 + k * 20, z: 190, heading: Math.PI, speed: 0, health: 100, state: 'pursuit', shootTimer: 0 });
      }
      // SWAT van arriving from the east with its lights on, staged clear
      // of the pause panel so it reads at a glance.
      var swat = CC.vehicles.make(S.scene, 'swatvan', 18, 182, Math.PI / 2, 0x1F3A5F);
      S.police.push({ kind: 'swat', mesh: swat.mesh, x: 18, z: 182, heading: Math.PI / 2, speed: 0, health: 160, state: 'pursuit', shootTimer: 0 });
      // Muzzle flashes and tracers from the roadblock officers.
      for (var f = 0; f < 4; f++) {
        CC.fx.muzzle(-30 + f * 20, 168, 0);
        CC.fx.tracer(-30 + f * 20, 168, 0, 200);
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
        // The mission-shot haul stays staged: in real play
        // CC.missions.update drives it across the bridge.
        if (shotName === 'foot') CC.hud.showPrompt('F: Hijack');
      } else {
        if (input.enter && S.vehicle) CC.ownership.exitVehicle();
        else if (input.enter && !S.vehicle) {
          var near = CC.vehicles.nearestParked(S.player.x, S.player.z, 4);
          if (near && !near.driver) { CC.ownership.tryHijack(); }
        }
        if (input.interact) {
          if (S.nearShop === 'gun') CC.menu.showShop('gun');
          else if (S.nearShop === 'garage') CC.menu.showShop('garage');
          else if (S.nearShop === 'safehouse') CC.progress.useSafehouse();
          else if (S.mission && CC.missions.tryInteract()) { /* mission interact */ }
          else if (S.mission && S.mission.id === 1 && S.mission.stage === 1) CC.missions.tryHook();
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
        CC.enemies.update(dt);
        CC.districts.update(dt);
        CC.damage.update(dt);
        if (CC.quality) CC.quality.update(dt);
        CC.progress.checkGate();
        CC.progress.update();
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
        if (S.nearShop === 'gun') CC.hud.showPrompt('F: Gun Shop');
        else if (S.nearShop === 'garage') CC.hud.showPrompt('F: Garage');
        else if (S.nearShop === 'safehouse') CC.hud.showPrompt('F: Rest & Save');
        else if (S.vehicle) CC.hud.showPrompt('E: Exit  ·  H: Horn');
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
      // Keep a muzzle flash and tracer live at the screenshot instant:
      // the one-off flashes from staging have faded by then.
      var fxOx = [-30, -10, 10, 30][frameCount % 4];
      CC.fx.muzzle(fxOx, 168, 0);
      CC.fx.tracer(fxOx, 168, 0, 200);
      CC.fx.update(0.016);
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
    newGameNoMission: function () {
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
