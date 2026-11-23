// Cinder Coast geometry: procedural geometry helpers (box, prism, palm, car body).
// Parts are merged into one BufferGeometry with vertex colours, so a car,
// a pedestrian or a palm is a single draw call.
(function () {
  var CC = window.CinderCoast;
  function colourAttr(count, hex) {
    var c = new THREE.Color(hex);
    var arr = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    return arr;
  }
  function mergeParts(parts) {
    var positions = [], normals = [], colours = [], indices = [];
    var base = 0;
    parts.forEach(function (p) {
      var geo;
      if (p.shape === 'box') geo = new THREE.BoxGeometry(p.w, p.h, p.d);
      else if (p.shape === 'cyl') geo = new THREE.CylinderGeometry(p.rTop, p.rBot, p.h, p.seg || 8);
      else if (p.shape === 'cone') geo = new THREE.ConeGeometry(p.r, p.h, p.seg || 8);
      else if (p.shape === 'sphere') geo = new THREE.SphereGeometry(p.r, 8, 6);
      else geo = new THREE.BoxGeometry(p.w || 1, p.h || 1, p.d || 1);
      var m = new THREE.Matrix4();
      var e = new THREE.Euler(p.rx || 0, p.ry || 0, p.rz || 0);
      m.makeRotationFromEuler(e);
      m.setPosition(p.x || 0, p.y || 0, p.z || 0);
      geo.applyMatrix4(m);
      var pos = geo.attributes.position, nor = geo.attributes.normal, idx = geo.index;
      for (var i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      }
      var col = colourAttr(pos.count, p.color);
      for (var j = 0; j < col.length; j++) colours.push(col[j]);
      for (var k = 0; k < idx.count; k++) indices.push(idx.getX(k) + base);
      base += pos.count;
      geo.dispose();
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    out.setIndex(indices);
    return out;
  }
  function meshFromParts(parts) {
    var mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    var mesh = new THREE.Mesh(mergeParts(parts), mat);
    mesh.castShadow = true;
    return mesh;
  }
  // Unit rectangular pyramid: base corners (+-0.5, 0, +-0.5), apex (0, 1, 0).
  // Scaled by (w, h, d) its base lands exactly on the corners of a w x d
  // building top, so a roof can never hover or float above its walls.
  function pyramidGeometry() {
    var c = [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5]];
    var apex = [0, 1, 0];
    var tris = [];
    for (var i = 0; i < 4; i++) {
      var a = c[i], b = c[(i + 1) % 4];
      tris.push(a, b, apex);
    }
    tris.push(c[0], apex, c[2]); tris.push(c[2], apex, c[0]);
    var pos = [];
    tris.forEach(function (v) { pos.push(v[0], v[1], v[2]); });
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return geo;
  }
  CC.geo = {
    mergeParts: mergeParts,
    meshFromParts: meshFromParts,
    pyramidGeometry: pyramidGeometry,
    // Instanced meshes in this build share one mesh at the world origin,
    // and the vendored three.js (r149) culls an InstancedMesh as a whole
    // from its geometry's bounding sphere at that origin. So every
    // instanced mesh must opt out of frustum culling, or whole sets of
    // buildings, roofs and props vanish whenever the origin leaves frame.
    instanced: function (geo, mat, count) {
      var m = new THREE.InstancedMesh(geo, mat, count);
      m.frustumCulled = false;
      return m;
    },
    carBody: function (def, colour) {
      var c = colour === undefined ? def.colour : colour;
      var dark = 0x1A1A22, glass = 0x9FC4D8, steel = 0x8A8F98;
      var wid = def.wid, len = def.len;
      var parts = [];
      if (def.kind === 'truck' || def.kind === 'lorry') {
        // Cargo box with side ribs at the rear, cab with windshield and a
        // short hood at the front (+z is forward), exhaust stack.
        parts = [
          { shape: 'box', w: wid, h: 1.5, d: len * 0.6, x: 0, y: 1.05, z: -len * 0.2, color: 0xD8D2C4 },
          { shape: 'box', w: wid + 0.06, h: 0.14, d: len * 0.6, x: 0, y: 1.86, z: -len * 0.2, color: c },
          { shape: 'box', w: wid * 0.12, h: 1.5, d: len * 0.6, x: -wid / 2, y: 1.05, z: -len * 0.2, color: steel },
          { shape: 'box', w: wid * 0.12, h: 1.5, d: len * 0.6, x: wid / 2, y: 1.05, z: -len * 0.2, color: steel },
          { shape: 'box', w: wid * 0.9, h: 1.3, d: len * 0.3, x: 0, y: 1.05, z: len * 0.2, color: c },
          { shape: 'box', w: wid * 0.82, h: 0.55, d: 0.1, x: 0, y: 1.35, z: len * 0.34, color: glass },
          { shape: 'box', w: wid * 0.9, h: 0.4, d: len * 0.15, x: 0, y: 0.55, z: len * 0.42, color: c },
          { shape: 'cyl', rTop: 0.09, rBot: 0.09, h: 1.6, x: wid / 2 - 0.15, y: 1.6, z: len * 0.08, color: dark },
          { shape: 'box', w: wid, h: 0.2, d: 0.16, x: 0, y: 0.4, z: len / 2, color: dark },
          { shape: 'box', w: 0.4, h: 0.16, d: 0.06, x: -wid * 0.3, y: 0.72, z: len / 2 + 0.01, color: 0xFFF2B0 },
          { shape: 'box', w: 0.4, h: 0.16, d: 0.06, x: wid * 0.3, y: 0.72, z: len / 2 + 0.01, color: 0xFFF2B0 },
          { shape: 'box', w: 0.34, h: 0.14, d: 0.06, x: -wid * 0.3, y: 0.8, z: -len / 2 - 0.01, color: 0xE0433A },
          { shape: 'box', w: 0.34, h: 0.14, d: 0.06, x: wid * 0.3, y: 0.8, z: -len / 2 - 0.01, color: 0xE0433A }
        ];
        var wR = 0.46;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
          parts.push(
            { shape: 'cyl', rTop: wR, rBot: wR, h: 0.3, x: s[0] * (wid / 2 - 0.05), y: wR, z: s[1] * len * 0.34, rz: Math.PI / 2, color: dark },
            { shape: 'cyl', rTop: 0.22, rBot: 0.22, h: 0.32, x: s[0] * (wid / 2 - 0.05), y: wR, z: s[1] * len * 0.34, rz: Math.PI / 2, color: steel }
          );
        });
        return meshFromParts(parts);
      }
      if (def.kind === 'bike') {
        parts = [
          { shape: 'box', w: 0.5, h: 0.5, d: len, x: 0, y: 0.6, z: 0, color: c },
          { shape: 'box', w: 0.3, h: 0.4, d: 0.7, x: 0, y: 1.0, z: -0.3, color: dark },
          { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.16, x: 0, y: 0.34, z: len * 0.4, rz: Math.PI / 2, color: dark },
          { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.16, x: 0, y: 0.34, z: -len * 0.4, rz: Math.PI / 2, color: dark }
        ];
        return meshFromParts(parts);
      }
      // Standard car: low body, sloped wedge hood, glass cabin with roof
      // panel, trunk, bumpers, grille, headlights and taillights.
      parts = [
        { shape: 'box', w: wid, h: 0.55, d: len, x: 0, y: 0.55, z: 0, color: c },
        { shape: 'box', w: wid * 0.92, h: 0.34, d: len * 0.3, x: 0, y: 0.88, z: len * 0.31, rx: 0.14, color: c },
        { shape: 'box', w: wid * 0.8, h: 0.5, d: len * 0.44, x: 0, y: 1.05, z: -len * 0.05, color: glass },
        { shape: 'box', w: wid * 0.78, h: 0.08, d: len * 0.4, x: 0, y: 1.33, z: -len * 0.05, color: c },
        { shape: 'box', w: wid * 0.94, h: 0.3, d: len * 0.18, x: 0, y: 0.9, z: -len * 0.38, color: c },
        { shape: 'box', w: wid, h: 0.16, d: 0.12, x: 0, y: 0.42, z: len / 2, color: dark },
        { shape: 'box', w: wid, h: 0.16, d: 0.12, x: 0, y: 0.42, z: -len / 2, color: dark },
        { shape: 'box', w: wid * 0.5, h: 0.18, d: 0.06, x: 0, y: 0.55, z: len / 2 + 0.01, color: dark },
        { shape: 'box', w: 0.34, h: 0.14, d: 0.08, x: -wid * 0.3, y: 0.72, z: len / 2 + 0.01, color: 0xFFF2B0 },
        { shape: 'box', w: 0.34, h: 0.14, d: 0.08, x: wid * 0.3, y: 0.72, z: len / 2 + 0.01, color: 0xFFF2B0 },
        { shape: 'box', w: 0.3, h: 0.12, d: 0.08, x: -wid * 0.3, y: 0.75, z: -len / 2 - 0.01, color: 0xE0433A },
        { shape: 'box', w: 0.3, h: 0.12, d: 0.08, x: wid * 0.3, y: 0.75, z: -len / 2 - 0.01, color: 0xE0433A }
      ];
      if (def.kind === 'police') {
        parts.push(
          { shape: 'box', w: wid * 1.01, h: 0.34, d: len * 0.4, x: 0, y: 0.62, z: -len * 0.02, color: 0xF4F2E8 },
          { shape: 'box', w: wid * 0.78, h: 0.08, d: len * 0.4, x: 0, y: 1.33, z: -len * 0.05, color: 0xF4F2E8 },
          { shape: 'box', w: wid * 0.6, h: 0.1, d: 0.5, x: 0, y: 1.4, z: -len * 0.05, color: dark },
          { shape: 'box', w: 0.28, h: 0.14, d: 0.4, x: -wid * 0.16, y: 1.5, z: -len * 0.05, color: 0xE0433A },
          { shape: 'box', w: 0.28, h: 0.14, d: 0.4, x: wid * 0.16, y: 1.5, z: -len * 0.05, color: 0x2B5F9E }
        );
      }
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (s) {
        parts.push(
          { shape: 'cyl', rTop: 0.38, rBot: 0.38, h: 0.3, x: s[0] * (wid / 2 - 0.05), y: 0.38, z: s[1] * len * 0.32, rz: Math.PI / 2, color: dark },
          { shape: 'cyl', rTop: 0.2, rBot: 0.2, h: 0.32, x: s[0] * (wid / 2 - 0.05), y: 0.38, z: s[1] * len * 0.32, rz: Math.PI / 2, color: steel }
        );
      });
      return meshFromParts(parts);
    },
    personMesh: function (shirt, skin) {
      return meshFromParts([
        { shape: 'cyl', rTop: 0.22, rBot: 0.26, h: 0.85, x: 0, y: 0.95, z: 0, color: shirt },
        { shape: 'sphere', r: 0.22, x: 0, y: 1.62, z: 0, color: skin },
        { shape: 'box', w: 0.34, h: 0.75, d: 0.3, x: 0, y: 0.38, z: 0, color: 0x2B2B33 }
      ]);
    },
    palm: function () {
      return meshFromParts([
        { shape: 'cyl', rTop: 0.12, rBot: 0.2, h: 5.5, x: 0, y: 2.75, z: 0, color: 0x8A6B4A },
        { shape: 'cone', r: 1.6, h: 1.6, x: 0, y: 5.9, z: 0, color: 0x5E9A4A },
        { shape: 'cone', r: 1.2, h: 1.2, x: 0, y: 6.6, z: 0, color: 0x6FAE56 }
      ]);
    },
    // Canvas-text shop sign: a plane with a readable name, gold border on
    // dark navy by default. Text is drawn once per sign; keep names short.
    textSign: function (text, w, h, bg, fg) {
      var cv = document.createElement('canvas');
      cv.width = 512; cv.height = 96;
      var cx = cv.getContext('2d');
      cx.fillStyle = bg || '#1F3A5F';
      cx.fillRect(0, 0, 512, 96);
      cx.strokeStyle = '#FFD166'; cx.lineWidth = 6;
      cx.strokeRect(4, 4, 504, 88);
      cx.fillStyle = fg || '#FFD166';
      cx.font = 'bold 52px system-ui, sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      var label = String(text).toUpperCase();
      var tw = cx.measureText(label).width;
      if (tw > 470) cx.font = 'bold ' + Math.floor(52 * 470 / tw) + 'px system-ui, sans-serif';
      cx.fillText(label, 256, 52);
      var tex = new THREE.CanvasTexture(cv);
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
      mesh.userData.isSign = true;
      return mesh;
    }
  };
})();
