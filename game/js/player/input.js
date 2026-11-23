// Cinder Coast input: keyboard and mouse, pointer lock, key bindings.
(function () {
  var CC = window.CinderCoast;
  var keys = {};
  var input = {
    forward: false, back: false, left: false, right: false,
    sprint: false, jump: false, handbrake: false, aim: false,
    horn: false, interact: false, enter: false
  };
  var pressed = {};
  CC.input = {
    keys: keys, state: input, pressed: pressed,
    bind: function (canvas) {
      window.addEventListener('keydown', function (e) {
        if (e.repeat) return;
        keys[e.code] = true; pressed[e.code] = true;
        if (['Space', 'ArrowUp', 'ArrowDown'].indexOf(e.code) >= 0) e.preventDefault();
        if (e.code === 'Escape') CC.menu.togglePause();
        if (e.code === 'KeyM') CC.minimap.toggleFull();
        if (e.code === 'KeyC') CC.camera3.cycleMode();
        if (e.code === 'KeyR') CC.weapons.reload();
        if (e.code === 'KeyE') input.enter = true;
        if (e.code === 'KeyF') input.interact = true;
        if (e.code === 'KeyH') { input.horn = true; if (CC.sfx) CC.sfx.honk(); }
        if (e.code === 'Digit1') CC.weapons.select(0);
        if (e.code === 'Digit2') CC.weapons.select(1);
        if (e.code === 'Digit3') CC.weapons.select(2);
        if (e.code === 'Digit4') CC.weapons.select(3);
        if (CC.audio) CC.audio.unlock();
      });
      window.addEventListener('keyup', function (e) { keys[e.code] = false; });
      canvas.addEventListener('click', function () {
        if (CC.S && CC.S.mode === 'play' && !CC.S.shotMode) canvas.requestPointerLock();
        if (CC.audio) CC.audio.unlock();
      });
      document.addEventListener('mousemove', function (e) {
        if (document.pointerLockElement === canvas) {
          CC.camera3.orbit(e.movementX, e.movementY);
        }
      });
      canvas.addEventListener('mousedown', function (e) {
        if (e.button === 0) pressed.Mouse0 = true;
        if (e.button === 2) input.aim = true;
      });
      window.addEventListener('mouseup', function (e) {
        if (e.button === 2) input.aim = false;
      });
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      window.addEventListener('wheel', function (e) {
        if (e.deltaY > 0) CC.weapons.cycle(1); else CC.weapons.cycle(-1);
      }, { passive: true });
    },
    poll: function () {
      input.forward = !!(keys.KeyW || keys.ArrowUp);
      input.back = !!(keys.KeyS || keys.ArrowDown);
      input.left = !!(keys.KeyA || keys.ArrowLeft);
      input.right = !!(keys.KeyD || keys.ArrowRight);
      input.sprint = !!keys.ShiftLeft || !!keys.ShiftRight;
      input.jump = !!keys.Space;
      input.handbrake = !!keys.Space;
      return input;
    },
    consume: function (code) {
      var v = !!pressed[code];
      pressed[code] = false;
      return v;
    },
    clearTransient: function () {
      input.enter = false; input.interact = false; input.horn = false;
      pressed.Mouse0 = false;
    }
  };
})();
