// Cinder Coast HUD: stars, objective, cash, health, ammo, speed, prompts.
// Fresh Stage 2 write from BRIEF-04. Fully visible at 1280x720 and 1920x1080.
(function () {
  var CC = window.CinderCoast;
  function el(id) { return document.getElementById(id); }
  CC.hud = {
    refresh: function () {
      var S = CC.S;
      if (!S) return;
      var stars = el('stars');
      if (stars) {
        var n = CC.wanted ? CC.wanted.stars : 0;
        var html = '';
        for (var i = 0; i < 5; i++) html += '<span class="star' + (i < n ? ' lit' : '') + '">&#9733;</span>';
        stars.innerHTML = html;
      }
      var cash = el('cash');
      if (cash) cash.textContent = S.cash + ' crowns';
      var st = el('standing');
      if (st) st.textContent = 'Standing ' + S.standing + '  ·  Chapter ' + S.chapter;
      var obj = el('objective-line');
      if (obj) obj.textContent = S.objective ? S.objective.text : 'Free roam — Port Calida';
      var dist = el('objective-dist');
      if (dist) dist.textContent = (S.objective && S.objectiveDist !== undefined) ? ('  ' + S.objectiveDist + ' m') : '';
      var pw = el('progress-wrap');
      if (pw) {
        if (S.missionProgress > 0 && S.mission) { pw.style.display = 'block'; el('progress-fill').style.width = Math.round(S.missionProgress * 100) + '%'; }
        else pw.style.display = 'none';
      }
      var hf = el('health-fill');
      if (hf) hf.style.width = Math.max(0, S.health) + '%';
      var af = el('armour-fill');
      if (af) af.style.width = Math.max(0, S.armour * 2) + '%';
      var hl = el('health-label');
      if (hl) hl.textContent = 'Health ' + Math.round(S.health) + '  ·  Armour ' + Math.round(S.armour);
      var ammo = el('ammo');
      if (ammo) {
        if (S.weapons.current && CC.config.weapons[S.weapons.current]) {
          var w = S.weapons.owned[S.weapons.current];
          ammo.textContent = CC.config.weapons[S.weapons.current].name + '  ' + (w ? w.ammo + ' / ' + w.reserve : '0 / 0');
        } else ammo.textContent = 'Fists';
      }
      var ch = el('crosshair');
      if (ch) ch.style.display = (S.aiming && !S.vehicle) ? 'block' : 'none';
    },
    update: function (dt) {
      var S = CC.S;
      if (!S) return;
      var clock = el('clock');
      if (clock) {
        var h = Math.floor(S.timeOfDay || 16.5), m = Math.floor(((S.timeOfDay || 16.5) - h) * 60);
        clock.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      }
      var sp = el('speedometer');
      if (sp) {
        if (S.vehicle) {
          sp.style.display = 'block';
          sp.childNodes[0].textContent = Math.round(Math.abs(S.vehicle.speed) * 3.6) + ' km/h ';
          var db = el('damage-bar');
          if (db) db.style.width = Math.max(0, S.vehicle.health || 100) + '%';
        } else sp.style.display = 'none';
      }
      var prompt = el('prompt');
      if (prompt) {
        var txt = CC.input ? CC.input.nearestPrompt() : '';
        if (txt) { prompt.style.display = 'block'; prompt.textContent = txt; }
        else prompt.style.display = 'none';
      }
      if (S.aiming !== undefined && CC.input) S.aiming = CC.input.state.aiming;
      CC.hud.refresh();
    }
  };
})();

// HUD helpers: hitmarker flash and objective setter.
(function () {
  var CC = window.CinderCoast;
  CC.hud.hitmarker = function () {
    var h = document.getElementById('hitmarker');
    if (!h) return;
    h.style.opacity = '1';
    setTimeout(function () { h.style.opacity = '0'; }, 150);
  };
  CC.hud.setObjective = function (text, tx, tz) {
    var S = CC.S;
    if (!S) return;
    S.objective = { text: text, tx: tx, tz: tz, kind: 'hud' };
    CC.hud.refresh();
  };
})();
