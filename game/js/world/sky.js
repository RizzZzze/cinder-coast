// Cinder Coast sky: sky dome, sun, fog, time of day.
(function () {
  var CC = window.CinderCoast;
  var sunLight, hemi, dome, sunSprite;
  CC.sky = {
    build: function (scene) {
      var cfg = CC.config;
      scene.fog = new THREE.Fog(0xF4B67A, 200, 900);
      var geo = new THREE.SphereGeometry(900, 16, 12);
      var mat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color(cfg.palette.skyTop) }, bottom: { value: new THREE.Color(cfg.palette.skyHorizon) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0); }'
      });
      dome = new THREE.Mesh(geo, mat); scene.add(dome);
      sunLight = new THREE.DirectionalLight(0xFFE0B0, 2.2);
      sunLight.position.set(-120, 180, 140);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.camera.left = -60; sunLight.shadow.camera.right = 60;
      sunLight.shadow.camera.top = 60; sunLight.shadow.camera.bottom = -60;
      sunLight.shadow.camera.far = 500;
      scene.add(sunLight); scene.add(sunLight.target);
      hemi = new THREE.HemisphereLight(0xBFD9E8, 0xC9A37A, 0.9);
      scene.add(hemi);
      var cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      var cx = cv.getContext('2d');
      var g = cx.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
      sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
      sunSprite.scale.set(90, 90, 1); sunSprite.position.set(-420, 320, 420);
      scene.add(sunSprite);
      return true;
    },
    setTimeOfDay: function (h) {
      var t = (h - 6) / 12;
      var ang = Math.PI * Math.max(0.05, Math.min(0.95, t));
      if (sunLight) {
        sunLight.position.set(-Math.cos(ang) * 200, Math.sin(ang) * 180 + 20, 140);
        sunLight.intensity = h >= 17.5 ? 1.5 : 2.2;
      }
      if (sunSprite) sunSprite.position.set(-Math.cos(ang) * 700, Math.sin(ang) * 500 + 40, 420);
    },
    follow: function (x, z) {
      if (!sunLight) return;
      sunLight.target.position.set(x, 0, z);
      sunLight.position.set(x - 120, 180, z + 140);
    }
  };
})();
