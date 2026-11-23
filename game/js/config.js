// Cinder Coast config: palette, tuning, vehicles, weapons, heat, prices.
// Fresh Stage 2 write from BRIEF-04. No network, no timestamps, fixed seed.
(function () {
  var CC = window.CinderCoast;
  CC.config = {
    seed: 7,
    timeOfDay: 17.5,
    saveVersion: 2,
    palette: {
      sandstone: 0xD8B98A, stucco: 0xF4E6C8, terracotta: 0xC8643B,
      water: 0x2BB3B0, palm: 0x5E9A4A, asphalt: 0x3A3A44, policeNavy: 0x1F3A5F,
      amber: 0xF2A81D, gold: 0xFFD166, skyTop: 0x5A3A7A, skyHorizon: 0xFF7A4A,
      wall: 0xD8B98A, roof: 0xC8643B, glass: 0x9FC4D8
    },
    tuning: { walkSpeed: 5.2, sprintSpeed: 8.5, jumpSpeed: 7.5, gravity: 20, aimZoom: 0.6 },
    caps: { traffic: 26, pedestrians: 48, police: 12, enemies: 10 },
    heatFor: { stealCar: 15, strikeCivilian: 5, fireInView: 10, destroyPolice: 30, crashInjury: 10, killWitnessed: 25 },
    heatStars: [0, 20, 50, 100, 180, 260],
    heatDecay: { after: [20, 20, 30, 30, 45, 45], stepSeconds: 12 },
    vehicles: {
      sprint:   { name: 'Vesper Sprint', kind: 'car', colour: 0xE0433A, wid: 1.9, len: 4.2, top: 34, accel: 16, grip: 1.0 },
      spindle:  { name: 'Mistral Spindle', kind: 'car', colour: 0x2BB3B0, wid: 1.9, len: 4.4, top: 38, accel: 18, grip: 1.05 },
      cutter:   { name: 'Cutter Coupe', kind: 'car', colour: 0xF2A81D, wid: 1.8, len: 4.0, top: 36, accel: 17, grip: 1.1 },
      nomad:    { name: 'Ferro Nomad', kind: 'car', colour: 0x8A6B4A, wid: 2.0, len: 4.6, top: 30, accel: 13, grip: 0.95 },
      courier:  { name: 'Courier Van', kind: 'truck', colour: 0xF4E6C8, wid: 2.1, len: 5.0, top: 28, accel: 12, grip: 0.9 },
      quill:    { name: 'Quill Hatch', kind: 'car', colour: 0x7FA8C9, wid: 1.8, len: 3.8, top: 32, accel: 15, grip: 1.0 },
      taxi:     { name: 'Sunfield Taxi', kind: 'car', colour: 0xF2A81D, wid: 1.9, len: 4.2, top: 32, accel: 15, grip: 1.0 },
      tow:      { name: 'Tidewell Tow', kind: 'truck', colour: 0xE8A33D, wid: 2.1, len: 5.2, top: 29, accel: 12, grip: 0.9 },
      ardent:   { name: 'Calida Ardent', kind: 'police', colour: 0x1F3A5F, wid: 1.9, len: 4.4, top: 40, accel: 20, grip: 1.15 },
      haul:     { name: 'Brasswater Haul', kind: 'lorry', colour: 0x6B7A8A, wid: 2.4, len: 7.0, top: 24, accel: 9, grip: 0.85 },
      swat:     { name: 'SWAT Van', kind: 'truck', colour: 0x1F3A5F, wid: 2.2, len: 5.4, top: 32, accel: 14, grip: 0.95 },
      heli:     { name: 'Police Helicopter', kind: 'heli', colour: 0x1F3A5F, wid: 2.0, len: 5.0, top: 30, accel: 10, grip: 1.0 }
    },
    weapons: {
      kestrel: { name: 'Kestrel 9', price: 400, damage: 34, rate: 0.22, range: 60, mag: 12, spread: 0.02, chapter: 1, auto: false },
      brisk:   { name: 'Brisk SMG', price: 1200, damage: 18, rate: 0.09, range: 45, mag: 30, spread: 0.045, chapter: 3, auto: true },
      harrow:  { name: 'Harrow Pump', price: 1800, damage: 22, rate: 0.85, range: 28, mag: 6, spread: 0.09, chapter: 4, auto: false, pellets: 6 },
      lantern: { name: 'Lantern Carbine', price: 3200, damage: 46, rate: 0.16, range: 90, mag: 24, spread: 0.012, chapter: 6, auto: true }
    },
    gunShop: { name: 'Mercado Gun Shop', x: -96, z: 60 },
    garage: { name: 'Mercado Garage', x: -140, z: 120 },
    safehouses: [
      { name: 'Quay Safehouse', x: -240, z: 260 },
      { name: 'Heights Safehouse', x: 80, z: -420 }
    ],
    upgrades: {
      engine: [0, 600, 1400, 2600],
      grip: [0, 500, 1100, 2000],
      armour: [0, 700, 1500, 2800]
    },
    districts: [
      { id: 'quay', name: 'Saltmarsh Quay', chapter: 1, accent: 0x2BB3B0, cx: -200, cz: 240, hw: 130, hd: 90 },
      { id: 'mercado', name: 'Old Mercado', chapter: 2, accent: 0xF2A81D, cx: -120, cz: 60, hw: 120, hd: 100 },
      { id: 'ironbridge', name: 'Ironbridge Yards', chapter: 3, accent: 0x8A8F98, cx: -200, cz: -220, hw: 130, hd: 140 },
      { id: 'sunfield', name: 'Sunfield Strip', chapter: 4, accent: 0xE0433A, cx: 240, cz: 80, hw: 90, hd: 160 },
      { id: 'heights', name: 'Brightwater Heights', chapter: 6, accent: 0x7FC4E0, cx: 60, cz: -360, hw: 140, hd: 200 },
      { id: 'lantern', name: 'Lantern Park', chapter: 7, accent: 0xFFD166, cx: 60, cz: 0, hw: 100, hd: 80 }
    ],
    landmarks: {
      haloTower: [60, 0], glasswing: [240, 80], funicularBottom: [0, -160],
      funicularTop: [40, -480], pierNine: [-280, -280], railCrossing: [-160, -160],
      foodHall: [-120, 60], freightYard: [-220, -240], bridge: [0, -240],
      bridgeNorth: [0, -480], bridgeSouth: [0, -160]
    },
    spawn: { x: -200, z: 260, heading: 0 },
    activityPay: { tow: 180, courier: 220, chop: 320 }
  };
})();

// Helpers on the config: heat to stars, district unlock checks, prices.
(function () {
  var CC = window.CinderCoast;
  var cfg = CC.config;
  cfg.starsForHeat = function (heat) {
    var s = 0;
    for (var i = 0; i < cfg.heatStars.length; i++) if (heat >= cfg.heatStars[i]) s = i;
    return s;
  };
  cfg.districtUnlocked = function (id, chapter) {
    for (var i = 0; i < cfg.districts.length; i++) {
      if (cfg.districts[i].id === id) return chapter >= cfg.districts[i].chapter;
    }
    return true;
  };
  cfg.districtAt = function (x, z) {
    for (var i = 0; i < cfg.districts.length; i++) {
      var d = cfg.districts[i];
      if (Math.abs(x - d.cx) <= d.hw && Math.abs(z - d.cz) <= d.hd) return d;
    }
    return null;
  };
  cfg.upgradeCost = function (kind, tier) {
    var t = cfg.upgrades[kind];
    if (!t || tier < 0 || tier >= t.length) return 0;
    return t[tier];
  };
})();
