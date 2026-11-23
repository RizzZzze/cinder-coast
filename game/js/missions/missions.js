// Cinder Coast missions: mission runner — objectives, checkpoints, results.
// Mission 1 "Wrong Tow" (Stage 1) plus Missions 2-8 (Stage 2), all run
// through the same runner: waypoint + HUD objective + distance, a clear
// fail state with a timer or destroyed target, and a result card with retry.
(function () {
  var CC = window.CinderCoast;
  var targetCar = null;
  var LIMITS = { 2: 300, 3: 360, 4: 420, 5: 300, 6: 360, 7: 420, 8: 480 };
  function setObjective(text, x, z, label) {
    var S = CC.S;
    if (x !== undefined) S.waypoint = { x: x, z: z, label: label || '' };
    if (CC.hud) CC.hud.setObjective(text);
  }
  function distTo(x, z) {
    var S = CC.S;
    return Math.hypot(S.player.x - x, S.player.z - z);
  }
  CC.missions = {
    active: null,
    startMission1: function () { CC.missions.startMission(1); },
    startMission: function (id) {
      var S = CC.S;
      if (!S || S.mission) return false;
      if (id > 1 && id > S.chapter) return false;
      var def = CC.story.missions[id - 1];
      S.mission = { id: id, name: def.name, stage: 0, timer: LIMITS[id] || 0, elapsed: 0 };
      CC.missions.active = S.mission;
      S.lastMission = id;
      if (CC.enemies) CC.enemies.clear();
      if (id === 1) {
        var car = CC.vehicles.make(S.scene, 'sprint', -200, 228, Math.PI / 2, 0x7FA8C9);
        targetCar = car;
        setObjective('Hook the Vesper Sprint at Pier Nine', -200, 228, 'Pier Nine car');
      } else if (id === 2) {
        setObjective('Retrieve the parcel from the Mercado stall', -160, -40, 'Mercado stall');
      } else if (id === 3) {
        var nomad = CC.vehicles.make(S.scene, 'nomad', -140, 210, Math.PI, 0x5E9A4A);
        S.missionNomad = nomad;
        setObjective('Get in the Ferro Nomad pickup', -140, 210, 'Ferro Nomad');
      } else if (id === 4) {
        setObjective('Reach the Glasswing Hotel service lifts', 320, -160, 'Glasswing Hotel');
      } else if (id === 5) {
        var haul = CC.vehicles.make(S.scene, 'haul', 180, -320, Math.PI, 0x8A8F98);
        haul.speed = 12;
        S.missionHaul = haul;
        S.missionHaulEngine = 100;
        setObjective('Follow the Brasswater Haul onto Corvane Bridge', 180, -320, 'Brasswater Haul');
      } else if (id === 6) {
        setObjective('Chase Odile Sarr up the hill', 120, -400, 'Funicular climb');
      } else if (id === 7) {
        setObjective('Reach the foot of the Halo Tower', 0, -200, 'Halo Tower');
      } else if (id === 8) {
        setObjective('Reach the syndicate freight yard', -280, -40, 'Freight yard');
      }
      if (CC.notify) CC.notify.push('Mission ' + id + ' — ' + def.name + ' started');
      if (CC.save) CC.save.autosave();
      return true;
    },
    update: function (dt) {
      var S = CC.S;
      if (!S || !S.mission) return;
      var m = S.mission;
      m.elapsed += dt;
      if (m.timer > 0) {
        m.timer -= dt;
        if (m.timer <= 0) { CC.missions.fail(m.id, 'Time ran out'); return; }
      }
      if (m.id === 1) { CC.missions.updateM1(dt); return; }
      if (m.id === 2) {
        if (m.stage === 0 && distTo(-160, -40) < 8) {
          m.stage = 1;
          setObjective('Ambush! Clear the arcades', -160, -40, 'Ambush');
          if (CC.notify) CC.notify.push('Parcel grabbed — ambush in the arcades!');
          var rng = CC.rng.make(S.seed + 210);
          [[-150, -30], [-170, -50], [-148, -52], [-172, -28]].forEach(function (p) {
            CC.enemies.spawn(S.scene, p[0], p[1], { health: 60 });
          });
          if (CC.sfx) CC.sfx.gunshot('kestrel');
        } else if (m.stage === 1 && CC.enemies.count() === 0) {
          CC.missions.complete(2);
        }
        return;
      }
      if (m.id === 3) {
        if (m.stage === 0) {
          if (S.vehicle && S.vehicle.key === 'nomad') {
            m.stage = 1;
            setObjective('Drive through the rail crossing to Pier Nine', -240, 0, 'Rail crossing');
          }
        } else if (m.stage === 1) {
          if (distTo(-240, 0) < 14) {
            m.stage = 2;
            setObjective('Find the locker of Tomas Varga — press F at Pier Nine', -200, 240, 'Tomas locker');
          }
        } else if (m.stage === 2) {
          if (distTo(-200, 240) < 6) {
            m.stage = 3;
            if (CC.wanted) CC.wanted.addHeat(50, 'Police on the way — 2 stars');
            setObjective('Escape the roadblock — reach the Mercado garage', 180, -280, 'Mercado garage');
            if (CC.notify) CC.notify.push('Locker found — Tomas was here. Run!');
          }
        } else if (m.stage === 3) {
          if (distTo(180, -280) < 16) CC.missions.complete(3);
        }
        if (S.missionNomad && S.missionNomad.damage >= 100) CC.missions.fail(3, 'The Ferro Nomad was destroyed');
        return;
      }
      if (m.id === 4) {
        if (m.stage === 0 && distTo(320, -160) < 14) {
          m.stage = 1;
          setObjective('Take the service lift — reach the lift doors', 300, -160, 'Service lift');
        } else if (m.stage === 1 && distTo(300, -160) < 6) {
          m.stage = 2;
          setObjective('Fight through the hotel corridor', 305, -130, 'Hotel corridor');
          [[305, -150], [310, -140], [300, -130], [308, -118], [302, -108]].forEach(function (p) {
            CC.enemies.spawn(S.scene, p[0], p[1], { health: 60 });
          });
          if (CC.notify) CC.notify.push('Hotel security is on you — clear the corridor');
        } else if (m.stage === 2 && CC.enemies.count() === 0) {
          m.stage = 3;
          setObjective('Reach the top floor suite', 320, -180, 'Top floor');
        } else if (m.stage === 3 && distTo(320, -180) < 8) {
          CC.missions.complete(4);
        }
        return;
      }
      if (m.id === 5) {
        var haul = S.missionHaul;
        if (!haul) { CC.missions.fail(5, 'The lorry is gone'); return; }
        haul.z -= 12 * dt;
        haul.mesh.position.set(haul.x, 0, haul.z);
        haul.mesh.rotation.y = Math.PI;
        if (m.stage === 0) {
          var d = Math.hypot(S.player.x - haul.x, S.player.z - haul.z);
          if (d < 25) {
            m.stage = 1;
            setObjective('Disable the lorry engine — do not destroy the cargo', haul.x, haul.z, 'Brasswater Haul');
            if (CC.wanted) CC.wanted.addHeat(50, 'Police pursuing the convoy');
            if (CC.notify) CC.notify.push('On the lorry — shoot or ram the engine, spare the cargo');
          }
        } else if (m.stage === 1) {
          var dd = Math.hypot(S.player.x - haul.x, S.player.z - haul.z);
          S.waypoint = { x: haul.x, z: haul.z, label: 'Brasswater Haul' };
          if (S.vehicle && dd < 5) {
            S.missionHaulEngine = Math.max(0, S.missionHaulEngine - 22 * dt);
            haul.damage = Math.min(90, haul.damage + 4 * dt);
            if (CC.fx) CC.fx.sparks(haul.x, haul.z);
          }
          if (CC.hud) CC.hud.setProgress(1 - S.missionHaulEngine / 100);
          if (S.missionHaulEngine <= 0) CC.missions.complete(5);
          else if (haul.damage >= 100) CC.missions.fail(5, 'The cargo was destroyed');
        }
        if (haul.z < -540) CC.missions.fail(5, 'The lorry crossed the bridge and escaped');
        return;
      }
      if (m.id === 6) {
        if (m.stage === 0 && distTo(120, -400) < 14) {
          m.stage = 1;
          setObjective('Corner Odile Sarr on the funicular platform', 120, -520, 'Funicular platform');
          CC.enemies.spawn(S.scene, 120, -470, { health: 90, boss: true, name: 'Odile Sarr' });
          CC.enemies.spawn(S.scene, 108, -460, { health: 60 });
          CC.enemies.spawn(S.scene, 132, -460, { health: 60 });
          if (CC.notify) CC.notify.push('Odile is on the platform — take her down');
        } else if (m.stage === 1) {
          var odileAlive = CC.enemies.list.some(function (e) { return e.name === 'Odile Sarr'; });
          if (!odileAlive) CC.missions.complete(6);
        }
        return;
      }
      if (m.id === 7) {
        if (m.stage === 0 && distTo(0, -200) < 14) {
          m.stage = 1;
          setObjective('Confront Captain Roque — recover the ledger', 0, -200, 'Captain Roque');
          CC.enemies.spawn(S.scene, 0, -200, { health: 120, boss: true, rifle: true, name: 'Captain Roque' });
          [[-12, -188], [12, -188], [-12, -212], [12, -212]].forEach(function (p) {
            CC.enemies.spawn(S.scene, p[0], p[1], { health: 60, rifle: true });
          });
          if (CC.notify) CC.notify.push('Roque is here — end it and take the ledger');
        } else if (m.stage === 1) {
          var roqueAlive = CC.enemies.list.some(function (e) { return e.name === 'Captain Roque'; });
          if (!roqueAlive) CC.missions.complete(7);
        }
        return;
      }
      if (m.id === 8) {
        if (m.stage === 0 && distTo(-280, -40) < 16) {
          m.stage = 1;
          setObjective('Assault the freight yard — clear the syndicate, wreck the freight cars', -280, -40, 'Freight yard');
          [[-300, -100], [-280, -60], [-260, -90], [-290, -20], [-272, -110], [-306, -60]].forEach(function (p) {
            CC.enemies.spawn(S.scene, p[0], p[1], { health: 60, syndicate: true });
          });
          S.missionTargets = [];
          [[-300, -100], [-260, -90]].forEach(function (p) {
            var mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 10),
              new THREE.MeshLambertMaterial({ color: 0xC8643B }));
            mesh.position.set(p[0], 1.5, p[1]);
            S.scene.add(mesh);
            S.missionTargets.push({ x: p[0], z: p[1], health: 60, mesh: mesh });
          });
          if (CC.notify) CC.notify.push('Six syndicate gunmen. Wreck both freight cars.');
        } else if (m.stage === 1) {
          var carsLeft = (S.missionTargets || []).filter(function (t) { return t.health > 0; }).length;
          if (CC.enemies.count() === 0 && carsLeft === 0) CC.missions.complete(8);
        }
        return;
      }
    },
    updateM1: function (dt) {
      var S = CC.S;
      var m = S.mission;
      if (m.stage === 0) {
        var d = Math.hypot(S.player.x - (-200), S.player.z - 228);
        if (S.vehicle && S.vehicle.key === 'tow' && d < 12) {
          m.stage = 1;
          if (CC.hud) CC.hud.setObjective('Press F to hook the Vesper Sprint');
          if (CC.notify) CC.notify.push('Hook the car — press F near it');
        } else if (d < 12 && !S.vehicle) {
          if (CC.hud) CC.hud.setObjective('Get in your Tidewell Tow first (E)');
        }
      } else if (m.stage === 1) {
        if (S.vehicle && S.vehicle.towed === targetCar) {
          m.stage = 2;
          S.waypoint = { x: 180, z: -280, label: 'Mercado garage' };
          if (CC.hud) CC.hud.setObjective('Tow the Vesper to the Mercado garage');
          if (CC.wanted) CC.wanted.addHeat(20, 'Police on the way — 1 star');
          if (CC.notify) CC.notify.push('Police arriving — lose them on the way');
        }
      } else if (m.stage === 2) {
        var d2 = S.vehicle ? Math.hypot(S.vehicle.x - 180, S.vehicle.z - (-280)) : 999;
        if (CC.hud) CC.hud.setProgress(1 - Math.min(1, d2 / 520));
        if (d2 < 16 && S.vehicle && S.vehicle.towed === targetCar) {
          CC.missions.complete(1);
        }
        if (!targetCar || targetCar.damage >= 100) CC.missions.fail(1, 'The towed car was destroyed');
      }
    },
    tryHook: function () {
      var S = CC.S;
      if (!S || !S.mission || S.mission.id !== 1 || S.mission.stage !== 1) return false;
      if (!S.vehicle || S.vehicle.key !== 'tow') return false;
      var d = Math.hypot(S.vehicle.x - targetCar.x, S.vehicle.z - targetCar.z);
      if (d > 10) return false;
      S.vehicle.towed = targetCar;
      if (CC.notify) CC.notify.push('Car hooked — tow it north');
      if (CC.sfx) CC.sfx.honk();
      return true;
    },
    tryInteract: function () {
      var S = CC.S;
      if (!S || !S.mission) return false;
      var m = S.mission;
      if (m.id === 3 && m.stage === 2 && distTo(-200, 240) < 8) {
        m.stage = 3;
        if (CC.wanted) CC.wanted.addHeat(50, 'Police on the way — 2 stars');
        setObjective('Escape the roadblock — reach the Mercado garage', 180, -280, 'Mercado garage');
        if (CC.notify) CC.notify.push('Locker found — Tomas was here. Run!');
        return true;
      }
      return false;
    },
    damageTarget: function (amount, ox, oz, dirX, dirZ) {
      var S = CC.S;
      if (!S) return false;
      if (S.missionHaul && S.mission && S.mission.id === 5) {
        var h = S.missionHaul;
        var dx = h.x - ox, dz = h.z - oz, d = Math.hypot(dx, dz);
        if (d < 60 && (dx * dirX + dz * dirZ) / (d || 1) > 0.96) {
          S.missionHaulEngine = Math.max(0, S.missionHaulEngine - amount);
          if (CC.fx) CC.fx.sparks(h.x, h.z);
          return true;
        }
      }
      if (S.missionTargets) {
        for (var i = 0; i < S.missionTargets.length; i++) {
          var t = S.missionTargets[i];
          if (t.health <= 0) continue;
          var tx = t.x - ox, tz = t.z - oz, td = Math.hypot(tx, tz);
          if (td < 60 && (tx * dirX + tz * dirZ) / (td || 1) > 0.96) {
            t.health -= amount;
            if (CC.fx) CC.fx.sparks(t.x, t.z);
            if (t.health <= 0) {
              if (CC.fx) CC.fx.explosion(t.x, t.z);
              if (t.mesh.parent) t.mesh.parent.remove(t.mesh);
            }
            return true;
          }
        }
      }
      return false;
    },
    complete: function (id) {
      var S = CC.S;
      if (!S) return;
      var def = CC.story.missions[id - 1];
      S.cash += def.payout;
      S.standing = Math.min(100, S.standing + def.standing);
      S.chapter = Math.max(S.chapter, Math.min(8, id + 1));
      S.missionFlags = S.missionFlags || {};
      S.missionFlags[id] = 'complete';
      if (id === 1 && S.vehicle && S.vehicle.towed) {
        CC.ownership.storeInGarage(S.vehicle.towed);
        S.vehicle.towed = null;
      }
      if (CC.enemies) CC.enemies.clear();
      S.mission = null; CC.missions.active = null;
      S.missionHaul = null; S.missionNomad = null; S.missionTargets = null;
      S.waypoint = null;
      if (CC.hud) { CC.hud.setObjective(''); CC.hud.setProgress(0); }
      if (CC.menu) CC.menu.showResult(true, def.name, def.payout, def.standing);
      if (CC.notify) {
        var d = CC.config.districts.filter(function (x) { return x.unlockChapter === S.chapter; })[0];
        if (d) CC.notify.push('District unlocked: ' + d.name);
      }
      if (CC.save) CC.save.autosave();
    },
    fail: function (id, reason) {
      var S = CC.S;
      if (!S) return;
      var def = CC.story.missions[id - 1];
      if (CC.enemies) CC.enemies.clear();
      S.mission = null; CC.missions.active = null;
      S.missionHaul = null; S.missionNomad = null; S.missionTargets = null;
      S.waypoint = null;
      if (CC.hud) { CC.hud.setObjective(''); CC.hud.setProgress(0); }
      if (CC.menu) CC.menu.showResult(false, def.name, 0, 0, reason);
    }
  };
})();
