// Cinder Coast minimap: circular radar, full-screen map.
(function () {
  var CC = window.CinderCoast;
  var fullOpen = false;
  function drawRadar(ctx, size) {
    var S = CC.S;
    if (!S) return;
    var range = 220;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0E2A3A'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#2BB3B0'; ctx.fillRect(0, size * 0.82, size, size * 0.18);
    var scale = size / (range * 2);
    var cx = size / 2, cy = size / 2;
    var rot = S.northUp ? 0 : -CC.camera3.getYaw();
    function toMap(x, z) {
      var dx = (x - S.player.x) * scale, dz = (z - S.player.z) * scale;
      var rx = dx * Math.cos(rot) - dz * Math.sin(rot);
      var rz = dx * Math.sin(rot) + dz * Math.cos(rot);
      return { x: cx + rx, y: cy + rz };
    }
    ctx.strokeStyle = '#8A8F98'; ctx.lineWidth = 3;
    CC.city.roads.forEach(function (r) {
      var a = toMap(r.axis === 'ew' ? r.from : r.at, r.axis === 'ew' ? r.at : r.from);
      var b = toMap(r.axis === 'ew' ? r.to : r.at, r.axis === 'ew' ? r.at : r.to);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    if (S.waypoint) {
      var w = toMap(S.waypoint.x, S.waypoint.z);
      ctx.fillStyle = '#FFD166';
      ctx.beginPath(); ctx.arc(w.x, w.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1F3A5F'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (S.police) {
      S.police.forEach(function (u) {
        var p = toMap(u.x, u.z);
        ctx.fillStyle = (Math.floor(S.time * 3) % 2 === 0) ? '#E0433A' : '#FF6B5E';
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (S.vehicle && S.vehicle.hot) {
      ctx.fillStyle = '#E0433A';
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#F4E6C8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 6, cy + 6); ctx.lineTo(cx - 6, cy + 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#F4E6C8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2); ctx.stroke();
  }
  CC.minimap = {
    draw: function () {
      var cv = document.getElementById('minimap');
      if (!cv) return;
      var ctx = cv.getContext('2d');
      drawRadar(ctx, cv.width);
      if (fullOpen) CC.minimap.drawFull();
    },
    drawFull: function () {
      var cv = document.getElementById('fullmap-canvas');
      if (!cv) return;
      var ctx = cv.getContext('2d');
      var S = CC.S;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#12303F'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#2BB3B0'; ctx.fillRect(0, cv.height * 0.72, cv.width, cv.height * 0.28);
      function toMap(x, z) {
        return { x: (x + 360) / 720 * cv.width, y: (z + 600) / 1160 * cv.height };
      }
      ctx.strokeStyle = '#8A8F98'; ctx.lineWidth = 4;
      CC.city.roads.forEach(function (r) {
        var a = toMap(r.axis === 'ew' ? r.from : r.at, r.axis === 'ew' ? r.at : r.from);
        var b = toMap(r.axis === 'ew' ? r.to : r.at, r.axis === 'ew' ? r.at : r.to);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      ctx.font = 'bold 15px system-ui, sans-serif'; ctx.fillStyle = '#F4E6C8';
      CC.config.districts.forEach(function (d) {
        var p = toMap(d.x, d.z);
        ctx.fillText(d.name, p.x - 40, p.y);
      });
      ctx.fillStyle = '#FFD166';
      CC.config.landmarks.forEach(function (l) {
        var p = toMap(l.x, l.z);
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F4E6C8'; ctx.fillText(l.name, p.x + 8, p.y + 4); ctx.fillStyle = '#FFD166';
      });
      if (S && S.waypoint) {
        var w = toMap(S.waypoint.x, S.waypoint.z);
        ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, 10, 0, Math.PI * 2); ctx.stroke();
        var pp = toMap(S.player.x, S.player.z);
        ctx.beginPath(); ctx.moveTo(pp.x, pp.y); ctx.lineTo(w.x, w.y); ctx.stroke();
      }
      if (S) {
        var pp2 = toMap(S.player.x, S.player.z);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(pp2.x, pp2.y, 6, 0, Math.PI * 2); ctx.fill();
      }
    },
    toggleFull: function () {
      fullOpen = !fullOpen;
      var f = document.getElementById('fullmap');
      if (f) f.style.display = fullOpen ? 'flex' : 'none';
      if (fullOpen) CC.minimap.drawFull();
    },
    closeFull: function () {
      fullOpen = false;
      var f = document.getElementById('fullmap');
      if (f) f.style.display = 'none';
    },
    isFullOpen: function () { return fullOpen; }
  };
})();
