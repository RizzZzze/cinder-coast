// Cinder Coast config: palette, tuning, caps, distances, prices.
// Stage 1 covers Saltmarsh Quay and the Corvane Bridge approach only.
(function () {
  var CC = window.CinderCoast;
  CC.config = {
    palette: {
      sandstone: 0xE9C98F, stucco: 0xF4E6C8, terracotta: 0xC8643B,
      water: 0x2BB3B0, palm: 0x5E9A4A, asphalt: 0x4A4A52, kerb: 0xB9B1A3,
      skyTop: 0x7FC4E0, skyHorizon: 0xF4B67A, policeNavy: 0x1F3A5F,
      policeAmber: 0xF2A81D, hotFlash: 0xE0433A, missionGold: 0xFFD166,
      navy: 0x1F3A5F, cream: 0xF4E6C8, amber: 0xF2A81D
    },
    city: { half: 320, roadEvery: 80, roadWidth: 14, seaZ: 300, bridgeX: 180, bridgeZ0: -320, bridgeZ1: -560 },
    caps: { traffic: 48, trafficRadius: 160, pedestrians: 70, pedRadius: 120, police: 12, parked: 80 },
    tuning: {
      walkSpeed: 5.2, sprintSpeed: 8.5, jumpSpeed: 7.5, gravity: 20,
      accel: 15, brake: 26, reverseMax: 11, steerMax: 0.55, grip: 0.92,
      handbrakeGrip: 0.55, damageSmoke: 60, damageExplode: 100,
      policeShootRange: 25, policeSight: 60, heatDecayDelay: [20, 20, 30, 45, 45]
    },
    heatThresholds: [0, 20, 50, 100, 180, 260],
    heatFor: { stealCar: 15, strikeCivilian: 5, fireNearPolice: 10, destroyPolice: 30, crashInjury: 10, witnessedKill: 25 },
    vehicles: {
      tow: { name: 'Tidewell Tow', kind: 'truck', top: 34, accel: 12, handling: 0.7, colour: 0xE8A33D, len: 5.6, wid: 2.2 },
      sprint: { name: 'Vesper Sprint', kind: 'hatch', top: 38, accel: 14, handling: 1.0, colour: 0x7FA8C9, len: 4.0, wid: 1.9 },
      spindle: { name: 'Mistral Spindle', kind: 'sports', top: 52, accel: 19, handling: 1.15, colour: 0xC0392B, len: 4.4, wid: 2.0 },
      cutter: { name: 'Dorado Cutter', kind: 'suv', top: 42, accel: 14, handling: 0.85, colour: 0xD9A441, len: 4.8, wid: 2.1 },
      nomad: { name: 'Ferro Nomad', kind: 'pickup', top: 40, accel: 13, handling: 0.85, colour: 0x5E9A4A, len: 5.0, wid: 2.1 },
      courier: { name: 'Tidewell Courier', kind: 'van', top: 36, accel: 12, handling: 0.75, colour: 0xF4E6C8, len: 5.2, wid: 2.2 },
      haul: { name: 'Brasswater Haul', kind: 'lorry', top: 30, accel: 9, handling: 0.6, colour: 0x8A8F98, len: 8.0, wid: 2.5 },
      quill: { name: 'Quill', kind: 'bike', top: 46, accel: 17, handling: 1.25, colour: 0x2B2B33, len: 2.2, wid: 0.8 },
      ardent: { name: 'Calida Ardent', kind: 'police', top: 48, accel: 18, handling: 1.05, colour: 0x1F3A5F, len: 4.6, wid: 2.0 },
      swatvan: { name: 'Ardent Transport', kind: 'police', top: 38, accel: 13, handling: 0.8, colour: 0x1F3A5F, len: 5.6, wid: 2.3 }
    },
    weapons: {
      fists: { name: 'Fists', damage: 12, range: 2.2, rate: 2.5, mag: 0, reserve: 0, auto: false },
      kestrel: { name: 'Kestrel 9', damage: 22, range: 60, rate: 4.5, mag: 12, reserve: 60, auto: false },
      brisk: { name: 'Brisk SMG', damage: 14, range: 45, rate: 11, mag: 30, reserve: 120, auto: true },
      harrow: { name: 'Harrow Pump', damage: 55, range: 22, rate: 1.1, mag: 6, reserve: 24, auto: false },
      lantern: { name: 'Lantern Carbine', damage: 30, range: 90, rate: 7, mag: 24, reserve: 96, auto: true }
    },
    districts: [
      { name: 'Saltmarsh Quay', x: 0, z: 160, accent: '#2BB3B0' },
      { name: 'Old Mercado', x: -160, z: -40, accent: '#C8643B' },
      { name: 'Lantern Park', x: 0, z: -160, accent: '#FFD166' },
      { name: 'Sunfield Strip', x: 280, z: 40, accent: '#F2A81D' },
      { name: 'Brightwater Heights', x: 120, z: -480, accent: '#7FC4E0' },
      { name: 'Ironbridge Yards', x: -280, z: -40, accent: '#8A8F98' }
    ],
    landmarks: [
      { name: 'Halo Tower', x: 0, z: -200 },
      { name: 'Glasswing Hotel', x: 320, z: -160 },
      { name: 'Corvane Bridge', x: 180, z: -440 },
      { name: 'Meridian Lighthouse', x: 280, z: 300 },
      { name: 'Pier Nine', x: -200, z: 240 }
    ],
    prices: { mission1Payout: 450, towCall: 180, courier: 220, chop: 320 }
  };
})();
