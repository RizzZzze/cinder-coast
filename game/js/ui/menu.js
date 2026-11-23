// Cinder Coast menu: title, pause, result card, full map, options, shops.
// Fresh Stage 2 write from BRIEF-04. Same panel style as the pause panel.
(function () {
  var CC = window.CinderCoast;
  function screensEl() { return document.getElementById('screens'); }
  function makeScreen(id, inner, wide) {
    CC.menu.hideAll();
    var host = screensEl();
    if (!host) return null;
    var wrap = document.createElement('div');
    wrap.className = 'panel-screen';
    wrap.id = 'screen-' + id;
    var panel = document.createElement('div');
    panel.className = 'panel' + (wide ? ' wide' : '');
    panel.innerHTML = inner;
    wrap.appendChild(panel);
    host.appendChild(wrap);
    return panel;
  }
  function btn(panel, id, fn) {
    var b = panel.querySelector('#' + id);
    if (b) b.addEventListener('click', fn);
    return b;
  }
  CC.menu = {
    hideAll: function () {
      var host = screensEl();
      if (host) host.innerHTML = '';
      var S = CC.S;
      if (S && S.mode === 'pause') S.mode = 'play';
    },
    resume: function () {
      var S = CC.S;
      CC.menu.hideAll();
      if (S) S.mode = 'play';
    },
    showTitle: function () {
      var S = CC.S;
      if (!S) return;
      S.mode = 'title';
      var hasSave = CC.save ? CC.save.hasSave() : false;
      var list = CC.story.missions.map(function (m) {
        var locked = m.id > S.chapter;
        return '<button data-mission="' + m.id + '"' + (locked ? ' disabled' : '') + '>' +
          'Chapter ' + m.id + ' — ' + m.name + ' (' + m.district + ')' + (locked ? ' — locked' : '') + '</button>';
      }).join('');
      var panel = makeScreen('title',
        '<h1>CINDER COAST</h1><p class="subtitle">Port Calida — an open world crime game</p>' +
        '<p class="story">Ines Vela came home to Port Calida to settle a debt. Eight chapters, ' +
        'six districts, one freight line to break.</p>' +
        (hasSave ? '<button id="btn-continue">Continue</button>' : '') +
        '<button id="btn-freeroam">Free Roam</button>' +
        '<div class="mission-list">' + list + '</div>' +
        '<button id="btn-activities">Activities</button>' +
        '<button id="btn-options">Options</button>' +
        '<button id="btn-controls">Controls</button>');
      if (!panel) return;
      btn(panel, 'btn-continue', function () {
        var d = CC.save.loadGame();
        if (d) CC.save.applySave(d);
        CC.menu.resume();
      });
      btn(panel, 'btn-freeroam', function () { CC.menu.resume(); });
      btn(panel, 'btn-activities', function () { CC.menu.showActivities(); });
      btn(panel, 'btn-options', function () { CC.menu.showOptions(); });
      btn(panel, 'btn-controls', function () { CC.menu.showControls(); });
      panel.querySelectorAll('[data-mission]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = parseInt(b.getAttribute('data-mission'), 10);
          if (CC.missions) CC.missions.start(id);
        });
      });
    },
    showPause: function () {
      var S = CC.S;
      if (!S) return;
      S.mode = 'pause';
      var panel = makeScreen('pause',
        '<h2>Paused</h2>' +
        '<button id="btn-resume">Resume</button>' +
        '<button id="btn-map">Full Map</button>' +
        '<button id="btn-save">Save Game</button>' +
        '<button id="btn-options">Options</button>' +
        '<button id="btn-controls">Controls</button>' +
        '<button id="btn-quit">Quit to Title</button>');
      if (!panel) return;
      btn(panel, 'btn-resume', function () { CC.menu.resume(); });
      btn(panel, 'btn-map', function () { CC.menu.showMap(); });
      btn(panel, 'btn-save', function () { if (CC.save) CC.save.saveGame('manual'); CC.menu.resume(); });
      btn(panel, 'btn-options', function () { CC.menu.showOptions(); });
      btn(panel, 'btn-controls', function () { CC.menu.showControls(); });
      btn(panel, 'btn-quit', function () { CC.menu.showTitle(); });
    }
  };
})();

// Menu screens: result card, full map, options, controls, activities, shops.
(function () {
  var CC = window.CinderCoast;
  var M = CC.menu;
  function panelFor(id, inner, wide) {
    var host = document.getElementById('screens');
    M.hideAll();
    if (!host) return null;
    var wrap = document.createElement('div');
    wrap.className = 'panel-screen';
    wrap.id = 'screen-' + id;
    var panel = document.createElement('div');
    panel.className = 'panel' + (wide ? ' wide' : '');
    panel.innerHTML = inner;
    wrap.appendChild(panel);
    host.appendChild(wrap);
    return panel;
  }
  function wire(panel, id, fn) {
    var b = panel.querySelector('#' + id);
    if (b) b.addEventListener('click', fn);
  }
  M.showResult = function (r) {
    var S = CC.S;
    if (S) S.mode = 'result';
    var panel = panelFor('result',
      '<h2>' + (r.win ? 'Mission Complete' : 'Mission Failed') + '</h2>' +
      '<p class="subtitle">' + r.name + '</p>' +
      (r.win ? '<p class="story">Payout +' + r.payout + ' crowns, Standing +' + r.standing + '</p>'
        : '<p class="story">' + (r.reason || 'Try again.') + '</p>') +
      '<button id="btn-retry">Retry</button>' +
      '<button id="btn-freeroam">Free Roam</button>' +
      '<button id="btn-title">Quit to Title</button>');
    if (!panel) return;
    wire(panel, 'btn-retry', function () { if (CC.missions) CC.missions.retry(r.id); });
    wire(panel, 'btn-freeroam', function () { M.resume(); });
    wire(panel, 'btn-title', function () { M.showTitle(); });
  };
  M.showMap = function () {
    var S = CC.S;
    if (S) S.mode = 'map';
    var panel = panelFor('map',
      '<h2>Port Calida — Full Map</h2><canvas id="fullmap-canvas" width="860" height="520"></canvas>' +
      '<p class="hint">Gold: mission objective. Red: police. Locked districts cannot be entered in free roam.</p>' +
      '<button id="btn-close">Close Map</button>', true);
    if (!panel) return;
    var cv = panel.querySelector('#fullmap-canvas');
    if (cv && CC.minimap) CC.minimap.drawFull(cv);
    wire(panel, 'btn-close', function () { M.resume(); });
  };
  M.showOptions = function () {
    var S = CC.S;
    var o = S ? S.options : { master: 0.8, music: 0.6, sfx: 0.8 };
    var panel = panelFor('options',
      '<h2>Options</h2>' +
      '<label>Master volume <input id="opt-master" type="range" min="0" max="1" step="0.05" value="' + o.master + '"></label>' +
      '<label>Music volume <input id="opt-music" type="range" min="0" max="1" step="0.05" value="' + o.music + '"></label>' +
      '<label>Effects volume <input id="opt-sfx" type="range" min="0" max="1" step="0.05" value="' + o.sfx + '"></label>' +
      '<button id="btn-back">Back</button>');
    if (!panel) return;
    function bind(id, fn) {
      var inp = panel.querySelector('#' + id);
      if (inp) inp.addEventListener('input', function () { fn(parseFloat(inp.value)); });
    }
    bind('opt-master', function (v) { if (CC.audio) CC.audio.setMaster(v); });
    bind('opt-music', function (v) { if (CC.audio) CC.audio.setMusic(v); });
    bind('opt-sfx', function (v) { if (CC.audio) CC.audio.setSfx(v); });
    wire(panel, 'btn-back', function () { if (S && S.mode === 'pause') M.showPause(); else M.showTitle(); });
  };
  M.showControls = function () {
    var panel = panelFor('controls',
      '<h2>Controls</h2><p class="story">WASD / arrows — move and drive<br>Shift — sprint · Space — jump<br>' +
      'F — hijack · E — enter, exit, interact, melee<br>Right mouse — aim · Left mouse — fire<br>' +
      'R — reload · Q — switch weapon · V — camera<br>M — full map · Esc / P — pause</p>' +
      '<button id="btn-back">Back</button>');
    if (!panel) return;
    wire(panel, 'btn-back', function () { var S = CC.S; if (S && S.mode === 'pause') M.showPause(); else M.showTitle(); });
  };
  M.showActivities = function () {
    var panel = panelFor('activities',
      '<h2>Activities</h2><p class="story">Tow Calls, Courier Runs and Chop Orders pay cash and Standing.</p>' +
      '<button id="act-tow">Tow Calls — 180 crowns</button>' +
      '<button id="act-courier">Courier Runs — 220 crowns</button>' +
      '<button id="act-chop">Chop Orders — 320 crowns</button>' +
      '<button id="btn-back">Back</button>');
    if (!panel) return;
    function start(id) { if (CC.activities && CC.activities.start(id)) M.resume(); }
    wire(panel, 'act-tow', function () { start('tow'); });
    wire(panel, 'act-courier', function () { start('courier'); });
    wire(panel, 'act-chop', function () { start('chop'); });
    wire(panel, 'btn-back', function () { M.showTitle(); });
  };
  M.showShop = function (kind) {
    var S = CC.S;
    if (!S) return;
    S.mode = 'pause';
    var inner = '<h2>' + (kind === 'gun' ? 'Mercado Gun Shop' : 'Mercado Garage') + '</h2>';
    if (kind === 'gun') {
      Object.keys(CC.config.weapons).forEach(function (k) {
        var w = CC.config.weapons[k];
        var owned = (S.weapons.owned || {})[k];
        var locked = S.chapter < w.chapter;
        inner += '<button data-weapon="' + k + '"' + ((owned || locked || S.cash < w.price) ? ' disabled' : '') + '>' +
          w.name + ' — ' + w.price + ' crowns' + (owned ? ' — owned' : locked ? ' — chapter ' + w.chapter : '') + '</button>';
      });
    } else {
      var vkey = S.vehicle ? S.vehicle.key : 'sprint';
      ['engine', 'grip', 'armour'].forEach(function (up) {
        var cost = CC.progression.upgradeCost(vkey, up);
        var tier = ((S.upgrades[vkey] || {}))[up] || 0;
        inner += '<button data-upgrade="' + up + '"' + ((!cost || S.cash < cost) ? ' disabled' : '') + '>' +
          up + ' tier ' + tier + ' → ' + (tier + 1) + ' — ' + cost + ' crowns</button>';
      });
      inner += '<p class="hint">Upgrades apply to the ' + (CC.config.vehicles[vkey] ? CC.config.vehicles[vkey].name : vkey) + '.</p>';
    }
    inner += '<button id="btn-close">Close</button>';
    var panel = panelFor('shop', inner);
    if (!panel) return;
    panel.querySelectorAll('[data-weapon]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (CC.progression.buyWeapon(b.getAttribute('data-weapon'))) M.showShop('gun');
      });
    });
    panel.querySelectorAll('[data-upgrade]').forEach(function (b) {
      b.addEventListener('click', function () {
        var vkey = S.vehicle ? S.vehicle.key : 'sprint';
        if (CC.progression.buyUpgrade(vkey, b.getAttribute('data-upgrade'))) M.showShop('garage');
      });
    });
    wire(panel, 'btn-close', function () { M.resume(); });
  };
})();
