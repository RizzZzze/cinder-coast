// Cinder Coast sky: sky dome, sun, fog, time of day.
(function () {
  var CC = window.CinderCoast;
  var sunLight, hemi, dome, sunSprite;
  CC.sky = {
    build: function (scene) {
      var cfg = CC.config;
      scene.fog = new THREE.Fog(0xE88A6A, 180, 850);
      var geo = new THREE.SphereGeometry(900, 16, 12);
      var mat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color(cfg.palette.skyTop) }, bottom: { value: new THREE.Color(cfg.palette.skyHorizon) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y * 0.5 + 0.5; vec3 warm = mix(bottom, vec3(1.0, 0.55, 0.75), smoothstep(0.35, 0.75, h) * 0.7); gl_FragColor = vec4(mix(warm, top, pow(h, 1.1)), 1.0); }'
      });
      dome = new THREE.Mesh(geo, mat); scene.add(dome);
      sunLight = new THREE.DirectionalLight(0xFFB060, 1.9);
      sunLight.position.set(-220, 55, 120);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(2048, 2048);
      sunLight.shadow.bias = -0.0002;
      sunLight.shadow.normalBias = 0.06;
      sunLight.shadow.camera.left = -70; sunLight.shadow.camera.right = 70;
      sunLight.shadow.camera.top = 70; sunLight.shadow.camera.bottom = -70;
      sunLight.shadow.camera.far = 600;
      scene.add(sunLight); scene.add(sunLight.target);
      hemi = new THREE.HemisphereLight(0xE8A0C8, 0xB0703A, 0.75);
      scene.add(hemi);
      var cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      var cx = cv.getContext('2d');
      var g = cx.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,230,170,1)'); g.addColorStop(0.35, 'rgba(255,170,80,0.85)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
      sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
      sunSprite.scale.set(150, 150, 1); sunSprite.position.set(-560, 130, 420);
      scene.add(sunSprite);
      return true;
    },
    setTimeOfDay: function (h) {
      var t = (h - 6) / 12;
      var ang = Math.PI * Math.max(0.05, Math.min(0.95, t));
      if (sunLight) {
        sunLight.position.set(-Math.cos(ang) * 260, Math.max(45, Math.sin(ang) * 180 + 20), 140);
        sunLight.intensity = h >= 17 ? 1.7 : 2.2;
        sunLight.color.setHex(0xFFB060);
      }
      if (sunSprite) sunSprite.position.set(-Math.cos(ang) * 700, Math.max(90, Math.sin(ang) * 500 + 40), 420);
    },
    follow: function (x, z) {
      if (!sunLight) return;
      sunLight.target.position.set(x, 0, z);
      sunLight.position.set(x - 220, 55, z + 120);
    }
  };
})();
