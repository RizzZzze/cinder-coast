// Cinder Coast notify: notification feed entries and timers.
(function () {
  var CC = window.CinderCoast;
  CC.notify = {
    push: function (text) {
      var feed = document.getElementById('feed');
      if (!feed) return;
      var el = document.createElement('div');
      el.className = 'feed-item';
      el.textContent = text;
      feed.appendChild(el);
      while (feed.children.length > 5) feed.removeChild(feed.firstChild);
      var S0 = CC.S;
      if (!S0 || !S0.shotMode) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
      }
      var S = CC.S;
      if (S) S.feedLog = (S.feedLog || []).concat([text]).slice(-5);
    }
  };
})();
