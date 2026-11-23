// Cinder Coast main: state, boot, game loop, shot staging.
// Fresh Stage 2 write from BRIEF-04. Node hand-in program copies this game
// unchanged; the browser runs it with no network requests.
(function () {
  var CC = window.CinderCoast;
  var params = new URLSearchParams(window.location.search);
  var SEED = parseInt(params.get('seed') || '7', 10);
  var TIME_OF_DAY = parseFloat(params.get('time') || '17.5');
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
        CC.fx.tracer(-196, 1.4, 236, -196, 1.2, 228);
        CC.fx.muzzle(-196, 1.4, 236);
      }
    }
    if (S.shotMode && S.shot === 'chase' && CC.fx && S.police && S.police.length) {
      S.shotFxTimer = (S.shotFxTimer || 0) + dt;
      if (S.shotFxTimer > 0.5) {
        S.shotFxTimer = 0;
        var lead = S.police[0];
        CC.fx.tracer(lead.x, 1.4, lead.z, S.player.x, 1.2, S.player.z);
        CC.fx.muzzle(lead.x, 1.4, lead.z);
        CC.fx.sparks(S.player.x + 4, 0.5, S.player.z - 6);
      }
    }
    if (S.shotMode && S.shot === 'mission' && CC.fx) {
      S.shotFxTimer = (S.shotFxTimer || 0) + dt;
      if (S.shotFxTimer > 0.6) {
        S.shotFxTimer = 0;
        CC.fx.sparks(0, 1.2, -398);
        CC.fx.muzzle(0, 1.4, -398);
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
      var back = 9 + i * 7, side = (i - 1) * 7;
      u.x = x - Math.sin(heading) * back + Math.cos(heading) * side;
      u.z = z - Math.cos(heading) * back - Math.sin(heading) * side;
      u.heading = heading;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = heading;
      u.speed = 18;
    }
  }
  function heliOver(S, x, z, y) {
    var h = CC.police.spawnUnit('heli');
    if (!h) return null;
    h.x = x; h.z = z; h.y = y || 55;
    h.mesh.position.set(x, h.y, z);
    if (h.cone) { h.cone.position.set(S.player.x, h.y / 2, S.player.z); h.cone.scale.y = h.y / 55; }
    return h;
  }
  function staticCar(S, key, x, z, heading, colour) {
    var v = CC.vehicles.make(S.scene, key, x, z, heading, colour);
    if (v && CC.fx) CC.fx.headlightGlow(v);
    return v;
  }
  // A standing crowd: pedestrians placed tight around a point, held still
  // by a long look timer so they read as a crowd in the still.
  function crowd(S, cx, cz, n, rng) {
    var shirts = [0xC8643B, 0x2BB3B0, 0xF2A81D, 0x5E9A4A, 0xE0433A, 0x7FA8C9, 0xF4E6C8];
    var skins = [0xE8B88A, 0xC98A5A, 0x8A5A3A, 0xF0C8A0];
    var road = { axis: 'ew', at: 80, from: -320, to: 320 };
    for (var i = 0; i < n; i++) {
      var x = cx + rng.range(-14, 14), z = cz + rng.range(-8, 10);
      var mesh = CC.geo.personMesh(rng.pick(shirts), rng.pick(skins));
      mesh.position.set(x, 0, z);
      mesh.rotation.y = rng.range(0, Math.PI * 2);
      S.scene.add(mesh);
      CC.peds.list.push({ mesh: mesh, x: x, z: z, road: road, along: x, dir: 1, speed: 0, state: 'look', lookTimer: 8, fleeX: 0, fleeZ: 0, bob: rng.range(0, 6), tipped: false });
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
        var car = placePlayerCar(S, 'spindle', 246, -20, Math.PI, 0x2BB3B0);
        car.speed = 24;
        CC.wanted.setHeat(100);
        // Three cruisers in an echelon flanking the hero car, none hidden
        // directly behind it from the chase camera.
        [[258, -18], [252, -12], [234, -18]].forEach(function (cp) {
          var u = CC.police.spawnUnit('cruiser');
          if (!u) return;
          u.x = cp[0]; u.z = cp[1]; u.heading = Math.PI;
          u.mesh.position.set(cp[0], 0, cp[1]);
          u.mesh.rotation.y = Math.PI;
          u.speed = 18;
        });
        heliOver(S, 252, 18, 55);
        staticCar(S, 'taxi', 236.5, -58, Math.PI, 0xF2A81D);
        staticCar(S, 'taxi', 236, 20, 0, 0xF2A81D);
        staticCar(S, 'courier', 236.5, -8, Math.PI, 0xF4E6C8);
        staticCar(S, 'cutter', 238, -38, 0, 0xF2A81D);
        staticCar(S, 'quill', 232, -30, 0, 0x7FA8C9);
        CC.peds.spawnNear(S.scene, 246, -20, CC.rng.make(S.seed + 603));
        CC.traffic.spawnNear(S.scene, 246, -20, CC.rng.make(S.seed + 604));
        CC.traffic.spawnNear(S.scene, 246, -20, CC.rng.make(S.seed + 607));
        S.objective = { text: 'Lose the Ardents and reach the Glasswing', tx: 240, tz: 80, kind: 'mission' };
        S.objectiveDist = 62;
        if (CC.notify) { CC.notify.push('Heat +15: vehicle reported'); }
        CC.camera3.shotCam = { pos: [252, 7, -50], look: [243, 2, 2] };
      } else if (name === 'foot') {
        S.player.x = -150; S.player.z = 92; S.player.heading = 0.6;
        S.player.inVehicle = false;
        S.vehicle = null;
        if (S.player.mesh) { S.player.mesh.visible = true; S.player.mesh.position.set(-150, 0, 92); }
        var parkedCar = CC.vehicles.make(S.scene, 'sprint', -148, 96, Math.PI / 2, 0xE0433A);
        CC.vehicles.parked.push({ key: 'sprint', def: CC.config.vehicles.sprint, mesh: parkedCar.mesh, x: -148, z: 96, heading: Math.PI / 2, driver: false, colour: 0xE0433A });
        staticCar(S, 'taxi', -140, 84, Math.PI / 2, 0xF2A81D);
        staticCar(S, 'courier', -172, 84, -Math.PI / 2, 0xF4E6C8);
        staticCar(S, 'quill', -130, 84, Math.PI / 2, 0x7FA8C9);
        staticCar(S, 'nomad', -168, 84, -Math.PI / 2, 0x8A6B4A);
        crowd(S, -150, 98, 12, CC.rng.make(S.seed + 608));
        CC.peds.spawnNear(S.scene, -150, 92, CC.rng.make(S.seed + 605));
        CC.traffic.spawnNear(S.scene, -150, 92, CC.rng.make(S.seed + 606));
        S.health = 100; S.armour = 25;
        S.objective = null;
        CC.camera3.shotCam = { pos: [-152, 6, 118], look: [-128, 2, 80] };
      } else if (name === 'mission') {
        var tow = placePlayerCar(S, 'tow', 0, -380, Math.PI, 0xE8A33D);
        tow.speed = 10;
        var lorry = CC.vehicles.make(S.scene, 'haul', 0, -400, Math.PI, 0x6B7A8A);
        lorry.mission = true; lorry.engineHealth = 100; lorry.speed = 8;
        staticCar(S, 'cutter', -5, -396, Math.PI, 0xF2A81D);
        staticCar(S, 'nomad', 5, -402, Math.PI, 0x8A6B4A);
        staticCar(S, 'taxi', 6, -412, Math.PI, 0xF2A81D);
        staticCar(S, 'quill', -6, -418, Math.PI, 0x7FA8C9);
        var escort = CC.police.spawnUnit('cruiser');
        if (escort) { escort.x = -8; escort.z = -392; escort.heading = Math.PI; escort.mesh.position.set(-8, 0, -392); escort.mesh.rotation.y = Math.PI; }
        S.mission = { id: 5, name: 'Convoy', lorry: lorry, stages: [], stage: 1 };
        S.objective = { text: "Disable the lorry's engine", tx: 0, tz: -400, kind: 'mission' };
        S.objectiveDist = 20;
        S.missionProgress = 0.45;
        if (CC.notify) CC.notify.push('Game saved');
        CC.camera3.shotCam = { pos: [-8, 9, -360], look: [0, 2, -400] };
      } else if (name === 'police') {
        document.body.classList.add('shot-police');
        S.player.x = -196; S.player.z = 228; S.player.heading = 0;
        S.player.inVehicle = false;
        if (S.player.mesh) { S.player.mesh.visible = true; S.player.mesh.position.set(-196, 0, 228); }
        CC.wanted.setHeat(180);
        CC.wanted.lastKnown = { x: -200, z: 220 };
        CC.police.makeRoadblock();
        var swat = CC.police.spawnUnit('swat');
        if (swat) { swat.x = -170; swat.z = 240; swat.mesh.position.set(-170, 0, 240); swat.mesh.rotation.y = Math.PI / 2; }
        staticCar(S, 'swat', -178, 226, Math.PI / 2);
        // A SWAT sign on the van's camera-facing side, so the van reads
        // unmistakably and is never mistaken for a civilian truck.
        var swatSign = CC.geo.textSign('SWAT', 4, 0.8);
        swatSign.position.set(-178, 1.5, 224.7);
        swatSign.rotation.y = Math.PI;
        S.scene.add(swatSign);
        staticCar(S, 'quill', -168, 231.5, Math.PI / 2, 0x7FA8C9);
        var flank = CC.police.spawnUnit('cruiser');
        if (flank) { flank.x = -196; flank.z = 246; flank.heading = Math.PI / 2; flank.mesh.position.set(-196, 0, 246); flank.mesh.rotation.y = Math.PI / 2; }
        heliOver(S, -210, 245, 55);
        if (CC.fx) { CC.fx.tracer(-196, 1.4, 236, -196, 1.2, 228); CC.fx.muzzle(-196, 1.4, 236); }
        S.objective = { text: 'Escape the roadblock', tx: -200, tz: 280, kind: 'mission' };
        S.objectiveDist = 58;
        CC.camera3.shotCam = { pos: [-232, 8, 196], look: [-186, 1, 240] };
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
