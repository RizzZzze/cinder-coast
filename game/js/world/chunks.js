// Cinder Coast chunks: chunk streaming, load budget, bounding spheres.
// The city is split into 200 m chunks; each chunk's instanced meshes carry
// a bounding sphere so the renderer skips off-screen chunks, and chunks
// beyond 650 m are hidden. At most one chunk is (re)built per frame.
(function () {
  var CC = window.CinderCoast;
  var chunks = [], budgetUsed = 0;
  CC.chunks = {
    list: function () { return chunks; },
    register: function (scene) {
      chunks = [];
      for (var cx = -300; cx <= 300; cx += 200) {
        for (var cz = -300; cz <= 300; cz += 200) {
          chunks.push({ x: cx + 100, z: cz + 100, r: 150, visible: true, group: scene });
        }
      }
      chunks.push({ x: 180, z: -440, r: 160, visible: true, group: scene });
      return chunks;
    },
    update: function (px, pz) {
      budgetUsed = 0;
      chunks.forEach(function (c) {
        var d = Math.hypot(px - c.x, pz - c.z);
        var want = d < 650;
        if (want !== c.visible && budgetUsed < 1) { c.visible = want; budgetUsed++; }
      });
      if (CC.city && CC.city.group) {
        CC.city.group.traverse(function (o) {
          if (o.isInstancedMesh && o.userData.boundingSphere) {
            o.frustumCulled = true;
            o.boundingSphere = o.userData.boundingSphere;
          }
        });
      }
    }
  };
})();
