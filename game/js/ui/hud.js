// Cinder Coast hud: health, armour, stars, speed, prompts, objectives, feed.
(function () {
  var CC = window.CinderCoast;
  function el(id) { return document.getElementById(id); }
  function fmtTime(h) {
    var hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }
  CC.hud = {
    setObjective: function (text) {
      var o = el('objective');
      if (o) o.textContent = text || '';
      if (CC.S) CC.S.objectiveText = text || '';
    },
    setProgress: function (f) {
      var w = el('progress-wrap'), b = el('progress-fill');
      if (w) w.style.display = f > 0 ? 'block' : 'none';
      if (b) b.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%';
    },
    refreshStars: function () {
      var S = CC.S;
      var box = el('stars');
      if (!box || !S) return;
      var spans = box.children;
      for (var i = 0; i < spans.length; i++) {
        spans[i].className = i < S.stars ? 'star lit' : 'star';
      }
    },
    refreshWeapon: function () {
      var S = CC.S;
      if (!S) return;
      var def = CC.weapons.currentDef();
      var key = CC.weapons.currentKey();
      var w = el('weapon-name'), a = el('ammo');
      if (w) w.textContent = def.name;
      if (a) {
        var ammo = S.ammo[key];
        a.textContent = ammo && def.mag ? ammo.mag + ' / ' + ammo.reserve : '—';
      }
    },
    hitMarker: function () {
      var h = el('hitmarker');
      if (!h) return;
      h.style.opacity = '1';
      setTimeout(function () { h.style.opacity = '0'; }, 180);
    },
    flashDamage: function () {
      var f = el('damage-flash');
      if (!f) return;
      f.style.opacity = '0.45';
      setTimeout(function () { f.style.opacity = '0'; }, 220);
    },
    showPrompt: function (text) {
      var p = el('prompt');
      if (p) { p.textContent = text || ''; p.style.display = text ? 'block' : 'none'; }
    },
    update: function () {
      var S = CC.S;
      if (!S) return;
      var h = el('health-fill'), a = el('armour-fill');
      if (h) h.style.width = Math.max(0, S.health) + '%';
      if (a) a.style.width = Math.max(0, S.armour) + '%';
      var cash = el('cash'), st = el('standing'), clock = el('clock');
      if (cash) cash.textContent = S.cash + ' cr';
      if (st) st.textContent = 'Standing ' + S.standing;
      if (clock) clock.textContent = fmtTime(S.timeOfDay);
      var w = el('weapon-name');
      if (w && !S.vehicle) w.style.display = 'block';
      var sp = el('speedometer');
      if (sp) {
        if (S.vehicle) {
          sp.style.display = 'block';
          var kmh = Math.round(Math.abs(S.vehicle.speed) * 3.6);
          var val = S.speedUnit === 'mph' ? Math.round(kmh * 0.621) : kmh;
          var sv = el('speed');
          if (sv) sv.textContent = val;
          var su = el('speed-unit');
          if (su) su.textContent = S.speedUnit === 'mph' ? 'mph' : 'km/h';
          var db = el('damage-bar');
          if (db) db.style.width = Math.max(0, 100 - S.vehicle.damage) + '%';
          var gr = el('gear');
          if (gr) gr.textContent = S.vehicle.speed > 1 ? 'D' : (S.vehicle.speed < -1 ? 'R' : 'N');
        } else sp.style.display = 'none';
      }
      var obj = el('objective'), dist = el('objective-dist');
      if (obj && S.waypoint) {
        var d = Math.hypot(S.player.x - S.waypoint.x, S.player.z - S.waypoint.z);
        if (dist) dist.textContent = Math.round(d) + ' m';
      } else if (dist) dist.textContent = '';
      var ch = el('crosshair');
      if (ch) ch.style.display = (CC.input.state.aim && !S.vehicle) ? 'block' : 'none';
      CC.hud.refreshStars();
    }
  };
})();
