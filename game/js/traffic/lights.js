// Cinder Coast lights: traffic signal cycle at junctions.
(function () {
  var CC = window.CinderCoast;
  var signals = [];
  CC.lights = {
    signals: signals,
    build: function (scene) {
      signals.length = 0;
      for (var x = -240; x <= 240; x += 80) {
        for (var z = -240; z <= 240; z += 80) {
          var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 6),
            new THREE.MeshLambertMaterial({ color: 0x2B2B33 }));
          pole.position.set(x + 9, 2.5, z + 9); scene.add(pole);
          var head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7),
            new THREE.MeshLambertMaterial({ color: 0x1A1A22 }));
          head.position.set(x + 9, 5.4, z + 9); scene.add(head);
          var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x33CC44 }));
          lamp.position.set(x + 9, 5.7, z + 9.4); scene.add(lamp);
          signals.push({ x: x, z: z, lamp: lamp, phase: ((x + z) / 80) % 2 === 0 ? 0 : 12 });
        }
      }
      return signals;
    },
    // true = green for the given axis at this junction at time t
    greenFor: function (x, z, axis, t) {
      var s = null;
      for (var i = 0; i < signals.length; i++) {
        if (Math.abs(signals[i].x - x) < 1 && Math.abs(signals[i].z - z) < 1) { s = signals[i]; break; }
      }
      if (!s) return true;
      var cyc = (t + s.phase) % 24;
      var nsGreen = cyc < 12;
      return axis === 'ns' ? nsGreen : !nsGreen;
    },
    update: function (t) {
      signals.forEach(function (s) {
        var cyc = (t + s.phase) % 24;
        var green = cyc < 12;
        s.lamp.material.color.setHex(green ? 0x33CC44 : 0xE0433A);
      });
    }
  };
})();
