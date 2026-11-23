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
  CC.geo = {
    mergeParts: mergeParts,
    meshFromParts: meshFromParts,
    carBody: function (def, colour) {
      var c = colour === undefined ? def.colour : colour;
      var dark = 0x1A1A22, glass = 0x9FC4D8;
      var parts = [
        { shape: 'box', w: def.wid, h: 0.62, d: def.len, x: 0, y: 0.55, z: 0, color: c },
        { shape: 'box', w: def.wid * 0.82, h: 0.55, d: def.len * 0.48, x: 0, y: 1.08, z: -def.len * 0.06, color: glass }
      ];
      if (def.kind === 'truck' || def.kind === 'lorry') {
        parts = [
          { shape: 'box', w: def.wid, h: 1.1, d: def.len * 0.62, x: 0, y: 0.85, z: def.len * 0.16, color: 0xD8D2C4 },
          { shape: 'box', w: def.wid, h: 1.5, d: def.len * 0.3, x: 0, y: 1.05, z: -def.len * 0.32, color: c },
          { shape: 'box', w: def.wid * 0.8, h: 0.5, d: 0.3, x: 0, y: 1.55, z: -def.len * 0.32, color: glass }
        ];
      }
      if (def.kind === 'bike') {
        parts = [
          { shape: 'box', w: 0.5, h: 0.5, d: def.len, x: 0, y: 0.6, z: 0, color: c },
          { shape: 'box', w: 0.3, h: 0.4, d: 0.7, x: 0, y: 1.0, z: -0.3, color: dark }
        ];
      }
      if (def.kind === 'police') {
        parts.push({ shape: 'box', w: def.wid * 0.5, h: 0.14, d: 0.5, x: 0, y: 1.42, z: -def.len * 0.06, color: 0xF2A81D });
      }
      parts.push(
        { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.24, x: -def.wid / 2 + 0.12, y: 0.34, z: def.len * 0.32, rz: Math.PI / 2, color: dark },
        { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.24, x: def.wid / 2 - 0.12, y: 0.34, z: def.len * 0.32, rz: Math.PI / 2, color: dark },
        { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.24, x: -def.wid / 2 + 0.12, y: 0.34, z: -def.len * 0.32, rz: Math.PI / 2, color: dark },
        { shape: 'cyl', rTop: 0.34, rBot: 0.34, h: 0.24, x: def.wid / 2 - 0.12, y: 0.34, z: -def.len * 0.32, rz: Math.PI / 2, color: dark }
      );
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
    }
  };
})();
