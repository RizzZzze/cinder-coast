// Cinder Coast minimap: circular map, roads, water, markers, police blips.
// Fresh Stage 2 write from BRIEF-04.
(function () {
  var CC = window.CinderCoast;
  function worldToMap(x, z, size, range) {
    var S = CC.S;
    var cx = S ? S.player.x : 0, cz = S ? S.player.z : 0;
    var px = size / 2 + (x - cx) / range * (size / 2);
    var py = size / 2 + (z - cz) / range * (size / 2);
    return [px, py];
  }
  CC.minimap = {
    draw: function () {
      var S = CC.S;
      var cv = document.getElementById('minimap');
      if (!cv || !S) return;
      var ctx = cv.getContext('2d');
      var size = cv.width, range = 220;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#0E2A3A';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#2BB3B0';
      ctx.fillRect(0, 0, size, size * 0.08);
      ctx.strokeStyle = '#5A5A66';
      ctx.lineWidth = 3;
      CC.city.roads.forEach(function (r) {
        ctx.beginPath();
        var a = worldToMap(r.axis === 'ew' ? r.from : r.at, r.axis === 'ew' ? r.at : r.from, size, range);
        var b = worldToMap(r.axis === 'ew' ? r.to : r.at, r.axis === 'ew' ? r.at : r.to, size, range);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      });
      function blip(x, z, colour, r, pulse) {
        var p = worldToMap(x, z, size, range);
        if (p[0] < -10 || p[0] > size + 10 || p[1] < -10 || p[1] > size + 10) return;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(p[0], p[1], pulse ? r + Math.sin(S.time * 6) * 1.5 : r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (S.objective) blip(S.objective.tx, S.objective.tz, '#FFD166', 6, false);
      var act = CC.activities ? CC.activities.marker() : null;
      if (act) blip(act.x, act.z, '#2B5F9E', 5, false);
      if (S.police) S.police.forEach(function (u) {
        blip(u.x, u.z, '#E0433A', 4, true);
      });
      if (S.vehicle && S.vehicle.hot) blip(S.vehicle.x, S.vehicle.z, '#F2A81D', 4, true);
      var pp = worldToMap(S.player.x, S.player.z, size, range);
      ctx.fillStyle = '#F4E6C8';
      ctx.beginPath();
      ctx.moveTo(pp[0], pp[1] - 7);
      ctx.lineTo(pp[0] - 5, pp[1] + 5);
      ctx.lineTo(pp[0] + 5, pp[1] + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
})();

// Minimap helpers: full-map canvas drawing shared with the menu map.
(function () {
  var CC = window.CinderCoast;
  CC.minimap.drawFull = function (canvas) {
    var S = CC.S;
    if (!canvas || !S) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#12303F';
    ctx.fillRect(0, 0, W, H);
    function mx(x) { return (x + 340) / 680 * W; }
    function mz(z) { return (z + 570) / 900 * H; }
    ctx.fillStyle = '#2BB3B0';
    ctx.fillRect(mx(330), 0, W - mx(330), H);
    ctx.fillRect(0, H - mz(340), W, H);
    ctx.strokeStyle = '#5A5A66';
    ctx.lineWidth = 2;
    CC.city.roads.forEach(function (r) {
      ctx.beginPath();
      if (r.axis === 'ew') { ctx.moveTo(mx(r.from), mz(r.at)); ctx.lineTo(mx(r.to), mz(r.at)); }
      else { ctx.moveTo(mx(r.at), mz(r.from)); ctx.lineTo(mx(r.at), mz(r.to)); }
      ctx.stroke();
    });
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 4;
    ctx.strokeRect(mx(-13), mz(-480), mx(13) - mx(-13), mz(-160) - mz(-480));
    ctx.font = 'bold 15px system-ui, sans-serif';
    CC.config.districts.forEach(function (d) {
      var locked = CC.progression && !CC.progression.districtUnlocked(d.id);
      ctx.fillStyle = locked ? '#8A8F98' : '#F4E6C8';
      ctx.fillText(d.name + (locked ? ' (locked)' : ''), mx(d.cx) - 40, mz(d.cz));
    });
    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('Halo Tower', mx(60) - 30, mz(0) - 8);
    ctx.fillText('Glasswing Hotel', mx(240) - 40, mz(80) - 8);
    ctx.fillText('Pier Nine', mx(-280) - 25, mz(-280) - 8);
    ctx.fillText('Funicular', mx(40) - 25, mz(-480) - 8);
    if (S.objective) {
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(mx(S.objective.tx), mz(S.objective.tz), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFD166';
      ctx.beginPath();
      ctx.moveTo(mx(S.player.x), mz(S.player.z));
      ctx.lineTo(mx(S.objective.tx), mz(S.objective.tz));
      ctx.stroke();
    }
    if (S.police) S.police.forEach(function (u) {
      ctx.fillStyle = '#E0433A';
      ctx.beginPath();
      ctx.arc(mx(u.x), mz(u.z), 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#F4E6C8';
    ctx.beginPath();
    ctx.arc(mx(S.player.x), mz(S.player.z), 6, 0, Math.PI * 2);
    ctx.fill();
  };
})();
