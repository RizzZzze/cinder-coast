// Cinder Coast rng: seeded random numbers, so each seed rebuilds the same city.
(function () {
  var CC = window.CinderCoast;
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  CC.rng = {
    mulberry32: mulberry32,
    hashSeed: hashSeed,
    make: function (seed) {
      var next = mulberry32(typeof seed === 'number' ? seed : hashSeed(String(seed)));
      return {
        next: next,
        range: function (a, b) { return a + (b - a) * next(); },
        int: function (a, b) { return Math.floor(a + (b - a + 1) * next()); },
        pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
        chance: function (p) { return next() < p; }
      };
    }
  };
})();
