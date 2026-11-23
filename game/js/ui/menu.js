// Cinder Coast menu: start screen, options, controls, pause, result cards.
(function () {
  var CC = window.CinderCoast;
  function show(id) { var e = document.getElementById(id); if (e) e.style.display = 'flex'; }
  function hide(id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; }
  CC.menu = {
    hideAll: function () {
      ['title-screen', 'pause-menu', 'options-panel', 'controls-panel', 'credits-panel', 'result-card', 'death-card', 'fullmap', 'shop-panel'].forEach(hide);
      var hud = document.getElementById('hud');
      if (hud) hud.style.display = 'block';
    },
    showTitle: function () {
      CC.menu.hideAll();
      var hud = document.getElementById('hud');
      if (hud) hud.style.display = 'none';
      show('title-screen');
      var cont = document.getElementById('btn-continue');
      if (cont) cont.disabled = !CC.save.hasSave();
      if (CC.S) CC.S.mode = 'title';
    },
    togglePause: function () {
      var S = CC.S;
      if (!S) return;
      if (S.mode === 'shop') { CC.menu.hideShop(); return; }
      if (S.mode === 'play') {
        S.mode = 'pause'; show('pause-menu');
        if (document.pointerLockElement) document.exitPointerLock();
      } else if (S.mode === 'pause') {
        S.mode = 'play'; hide('pause-menu');
      }
    },
    resume: function () {
      var S = CC.S;
      if (S) S.mode = 'play';
      hide('pause-menu');
    },
    showOptions: function () { show('options-panel'); },
    hideOptions: function () { hide('options-panel'); },
    showControls: function () { show('controls-panel'); },
    hideControls: function () { hide('controls-panel'); },
    showCredits: function () { show('credits-panel'); },
    hideCredits: function () { hide('credits-panel'); },
    showShop: function (kind) {
      var S = CC.S;
      if (!S) return;
      S.mode = 'shop';
      var title = document.getElementById('shop-title');
      var list = document.getElementById('shop-list');
      if (!title || !list) return;
      list.innerHTML = '';
      if (kind === 'gun') {
        title.textContent = 'Mercado Gun Shop — ' + S.cash + ' cr';
        CC.config.gunShop.stock.forEach(function (item) {
          var def = CC.config.weapons[item.key];
          var owned = CC.progress.ownedWeapons().indexOf(item.key) >= 0;
          var locked = S.chapter < item.chapter || S.standing < item.standing;
          var b = document.createElement('button');
          b.textContent = def.name + ' — ' + (owned ? 'OWNED' : item.price + ' cr') +
            (locked ? ' (needs Ch ' + item.chapter + ', Standing ' + item.standing + ')' : '');
          b.disabled = owned || locked;
          b.addEventListener('click', function () {
            if (CC.progress.buyWeapon(item.key)) CC.menu.showShop('gun');
          });
          list.appendChild(b);
        });
      } else {
        title.textContent = 'Mercado Garage — ' + S.cash + ' cr';
        var key = S.vehicle ? S.vehicle.key : null;
        if (key) {
          ['engine', 'grip', 'armour'].forEach(function (kind2) {
            var lvl = CC.progress.upgradeLevel(key, kind2);
            var b = document.createElement('button');
            b.textContent = CC.config.vehicles[key].name + ' ' + kind2 + ' tier ' + lvl + '/3' +
              (lvl >= 3 ? ' — MAX' : ' — next ' + CC.config.upgradeTiers[lvl].price + ' cr');
            b.disabled = lvl >= 3;
            b.addEventListener('click', function () {
              if (CC.progress.buyUpgrade(key, kind2)) CC.menu.showShop('garage');
            });
            list.appendChild(b);
          });
        } else {
          var p = document.createElement('p');
          p.textContent = 'Bring a vehicle to fit upgrades.';
          list.appendChild(p);
        }
        (S.garage || []).forEach(function (gk) {
          var b2 = document.createElement('button');
          b2.textContent = 'Recall ' + CC.config.vehicles[gk].name + ' from the garage';
          b2.addEventListener('click', function () {
            if (CC.progress.recallVehicle(gk)) CC.menu.hideShop();
          });
          list.appendChild(b2);
        });
      }
      show('shop-panel');
      if (document.pointerLockElement) document.exitPointerLock();
    },
    hideShop: function () {
      hide('shop-panel');
      var S = CC.S;
      if (S && S.mode === 'shop') S.mode = 'play';
    },
    showResult: function (ok, name, payout, standing, reason) {
      var S = CC.S;
      if (S) S.mode = 'result';
      var t = document.getElementById('result-title');
      var b = document.getElementById('result-body');
      if (t) t.textContent = ok ? 'Mission Complete — ' + name : 'Mission Failed — ' + name;
      if (b) b.textContent = ok ? ('Payout +' + payout + ' cr  ·  Standing +' + standing) : (reason || 'Try again.');
      show('result-card');
      if (document.pointerLockElement) document.exitPointerLock();
    },
    hideResult: function () { hide('result-card'); },
    showDeath: function (lost, source) {
      var b = document.getElementById('death-body');
      if (b) b.textContent = 'Taken down by ' + source + '. You wake at the Quay hospital. Lost ' + lost + ' cr. Heat reset.';
      show('death-card');
      if (document.pointerLockElement) document.exitPointerLock();
    },
    bind: function () {
      function on(id, fn) { var e = document.getElementById(id); if (e) e.addEventListener('click', fn); }
      on('btn-new', function () { CC.main.newGame(); });
      on('btn-continue', function () { CC.main.continueGame(); });
      on('btn-options', function () { CC.menu.showOptions(); });
      on('btn-controls', function () { CC.menu.showControls(); });
      on('btn-credits', function () { CC.menu.showCredits(); });
      on('btn-options-close', function () { CC.menu.hideOptions(); });
      on('btn-controls-close', function () { CC.menu.hideControls(); });
      on('btn-credits-close', function () { CC.menu.hideCredits(); });
      on('btn-resume', function () { CC.menu.resume(); });
      on('btn-pause-map', function () { hide('pause-menu'); CC.minimap.toggleFull(); });
      on('btn-pause-save', function () { if (CC.save) CC.save.saveGame(true); });
      on('btn-pause-options', function () { CC.menu.showOptions(); });
      on('btn-pause-controls', function () { CC.menu.showControls(); });
      on('btn-pause-quit', function () { CC.menu.showTitle(); });
      on('btn-result-retry', function () {
        CC.menu.hideResult();
        var S = CC.S;
        if (S) { S.mode = 'play'; CC.missions.startMission(S.lastMission || 1); }
      });
      on('btn-result-continue', function () {
        CC.menu.hideResult();
        var S = CC.S;
        if (S) S.mode = 'play';
      });
      on('btn-death-respawn', function () {
        hide('death-card');
        CC.damage.respawn();
      });
      on('btn-fullmap-close', function () { CC.minimap.closeFull(); });
      on('btn-mission1', function () {
        var S = CC.S;
        if (S) { S.lastMission = 1; CC.missions.startMission1(); }
      });
      [2, 3, 4, 5, 6, 7, 8].forEach(function (n) {
        on('btn-mission' + n, function () {
          var S = CC.S;
          if (S) {
            if (S.mode === 'title') {
              if (CC.save.hasSave()) CC.main.continueGame(); else CC.main.newGameNoMission();
              S = CC.S;
            }
            if (!CC.missions.startMission(n) && CC.notify) CC.notify.push('Mission ' + n + ' unlocks in Chapter ' + n);
          }
        });
      });
      on('btn-towcall', function () { CC.activities.startTowCall(); });
      on('btn-courier', function () { CC.activities.startCourier(); });
      on('btn-chop', function () { CC.activities.startChop(); });
      on('btn-shop-close', function () { CC.menu.hideShop(); });
      var vol = document.getElementById('opt-master');
      if (vol) vol.addEventListener('input', function () { if (CC.audio) CC.audio.setMaster(parseFloat(vol.value)); });
      var mus = document.getElementById('opt-music');
      if (mus) mus.addEventListener('input', function () { if (CC.audio) CC.audio.setMusic(parseFloat(mus.value)); });
      var sfx = document.getElementById('opt-sfx');
      if (sfx) sfx.addEventListener('input', function () { if (CC.audio) CC.audio.setSfx(parseFloat(sfx.value)); });
      var sens = document.getElementById('opt-sens');
      if (sens) sens.addEventListener('input', function () { if (CC.S) CC.S.sensitivity = parseFloat(sens.value); });
      var units = document.getElementById('opt-units');
      if (units) units.addEventListener('change', function () { if (CC.S) CC.S.speedUnit = units.value; });
      var north = document.getElementById('opt-northup');
      if (north) north.addEventListener('change', function () { if (CC.S) CC.S.northUp = north.checked; });
    }
  };
})();
