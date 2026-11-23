// Cinder Coast input: keyboard, mouse aim and fire, pause and map keys.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  var keys = {};
  var state = {
    forward: false, back: false, left: false, right: false,
    sprint: false, jump: false, handbrake: false,
    aiming: false, firing: false, interact: false
  };
  function sync() {
    state.forward = !!(keys['KeyW'] || keys['ArrowUp']);
    state.back = !!(keys['KeyS'] || keys['ArrowDown']);
    state.left = !!(keys['KeyA'] || keys['ArrowLeft']);
    state.right = !!(keys['KeyD'] || keys['ArrowRight']);
    state.sprint = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
    state.jump = !!keys['Space'];
    state.handbrake = !!keys['KeyX'];
    state.firing = !!keys['Mouse0'];
    state.aiming = !!keys['Mouse2'];
  }
  CC.input = {
    state: state,
    init: function () {
      window.addEventListener('keydown', function (e) {
        keys[e.code] = true;
        sync();
        var S = CC.S;
        if (!S) return;
        if (e.code === 'KeyF') CC.input.tryHijack();
        if (e.code === 'KeyE') CC.input.tryInteract();
        if (e.code === 'KeyR' && CC.weapons) CC.weapons.startReload();
        if (e.code === 'KeyQ' && CC.weapons) CC.weapons.cycle();
        if (e.code === 'KeyV' && CC.camera3) CC.camera3.cycleMode();
        if (e.code === 'KeyM' && S.mode === 'play' && CC.menu) CC.menu.showMap();
        if ((e.code === 'Escape' || e.code === 'KeyP') && S.mode === 'play' && CC.menu) CC.menu.showPause();
        if (e.code === 'Space') e.preventDefault();
      });
      window.addEventListener('keyup', function (e) { keys[e.code] = false; sync(); });
      window.addEventListener('mousedown', function (e) {
        if (e.button === 0) keys['Mouse0'] = true;
        if (e.button === 2) keys['Mouse2'] = true;
        sync();
      });
      window.addEventListener('mouseup', function (e) {
        if (e.button === 0) keys['Mouse0'] = false;
        if (e.button === 2) keys['Mouse2'] = false;
        sync();
      });
      window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      window.addEventListener('mousemove', function (e) {
        var S = CC.S;
        if (!S || S.mode !== 'play') return;
        if (CC.camera3 && (state.aiming || e.buttons === 0)) CC.camera3.orbit(e.movementX || 0, e.movementY || 0);
      });
    },
    tryHijack: function () {
      var S = CC.S;
      if (!S || S.mode !== 'play' || S.vehicle) return;
      if (CC.ownership) CC.ownership.tryHijack();
    },
    tryInteract: function () {
      var S = CC.S;
      if (!S || S.mode !== 'play') return;
      if (S.vehicle) { if (CC.ownership) CC.ownership.exitVehicle(); return; }
      if (CC.progression) {
        var sh = CC.progression.nearestSafehouse(10);
        if (sh) { CC.progression.useSafehouse(); return; }
      }
      var S2 = S;
      var gd = Math.hypot(CC.config.gunShop.x - S2.player.x, CC.config.gunShop.z - S2.player.z);
      if (gd < 10 && CC.menu) { CC.menu.showShop('gun'); return; }
      var gr = Math.hypot(CC.config.garage.x - S2.player.x, CC.config.garage.z - S2.player.z);
      if (gr < 10 && CC.menu) { CC.menu.showShop('garage'); return; }
      if (CC.enemies) CC.enemies.melee();
    }
  };
})();

// Input helpers: prompt text for the nearest interaction.
(function () {
  var CC = window.CinderCoast;
  CC.input.nearestPrompt = function () {
    var S = CC.S;
    if (!S || S.mode !== 'play') return '';
    if (S.vehicle) return 'E: Exit vehicle';
    if (CC.vehicles && CC.vehicles.nearestParked(S.player.x, S.player.z, 4)) return 'F: Hijack';
    if (CC.progression && CC.progression.nearestSafehouse(10)) return 'E: Save at safehouse';
    if (Math.hypot(CC.config.gunShop.x - S.player.x, CC.config.gunShop.z - S.player.z) < 10) return 'E: Gun shop';
    if (Math.hypot(CC.config.garage.x - S.player.x, CC.config.garage.z - S.player.z) < 10) return 'E: Garage';
    if (CC.enemies && CC.enemies.nearest(S.player.x, S.player.z, 2.2)) return 'E: Melee';
    return '';
  };
})();
