// Realistic 3D Earth Globe - inspired by zebiv-code/earth_globe
// Features: Day/night texture blending with realistic terminator, Sun position based on month/time
// Tech: WebGL via Three.js (or vanilla WebGL fallback), Custom GLSL shaders, Earth textures from Wikimedia/NASA
// License: MIT (zebiv-code/earth_globe is MIT, can be used)

let scene, camera, renderer, earth, clouds, marker;
let sunDirection = new THREE.Vector3(1, 0, 0);
let autoRotate = true;

function getSunPosition(date = new Date()){
  // Calculate sun position based on date - month and time of day
  // Simplified astronomical calculation for sun direction
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const declination = -23.44 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI/180);
  const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60;
  const longitude = (timeUTC - 12) * 15; // Sun longitude opposite
  const lat = declination;
  // Convert lat/lng to 3D direction
  const phi = (90 - lat) * Math.PI/180;
  const theta = (longitude + 180) * Math.PI/180;
  const x = -Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z).normalize();
}

function initRealisticGlobe(){
  const canvas = document.getElementById('dayNightMap');
  if(!canvas) return;
  
  // Check if THREE is loaded, if not load it
  if(typeof THREE === 'undefined'){
    console.warn('THREE not loaded, loading fallback canvas map');
    initFallbackCanvasMap();
    return;
  }

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000010);
  
  // Camera
  camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 2.5;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lighting - sun as directional light
  const ambient = new THREE.AmbientLight(0x333333);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(sunLight);

  // Textures - Earth day/night from Wikimedia / NASA Blue Marble
  const loader = new THREE.TextureLoader();
  const dayTexture = loader.load('https://cdn.jsdelivr.net/npm/three-globe@2.30.0/example/img/earth-day.jpg');
  const nightTexture = loader.load('https://cdn.jsdelivr.net/npm/three-globe@2.30.0/example/img/earth-night.jpg');
  const bumpTexture = loader.load('https://cdn.jsdelivr.net/npm/three-globe@2.30.0/example/img/earth-topology.png');

  // Custom shader material for realistic day/night blending with terminator
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main(){
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main(){
      vec3 dayColor = texture2D(dayTexture, vUv).rgb;
      vec3 nightColor = texture2D(nightTexture, vUv).rgb;
      
      // Calculate sun orientation - dot product of normal and sun direction
      float sunOrientation = dot(vNormal, sunDirection);
      
      // Smooth terminator - realistic transition zone ~ 6-12 degrees twilight
      float dayMix = smoothstep(-0.25, 0.25, sunOrientation);
      
      // Blend day and night with realistic terminator
      vec3 color = mix(nightColor * 1.5, dayColor, dayMix);
      
      // Add city lights intensity based on night side
      float nightIntensity = 1.0 - dayMix;
      color += nightColor * nightIntensity * 0.8;
      
      // Atmospheric rim lighting
      float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0,0.0,1.0)));
      rim = pow(rim, 3.0);
      color += vec3(0.1, 0.2, 0.4) * rim * dayMix;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTexture },
      nightTexture: { value: nightTexture },
      sunDirection: { value: sunDirection }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  // Earth sphere
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  // Clouds layer
  const cloudGeo = new THREE.SphereGeometry(1.005, 64, 64);
  const cloudTex = loader.load('https://cdn.jsdelivr.net/npm/three-globe@2.30.0/example/img/earth-clouds.png');
  const cloudMat = new THREE.MeshLambertMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.4
  });
  clouds = new THREE.Mesh(cloudGeo, cloudMat);
  scene.add(clouds);

  // User location marker
  const markerGeo = new THREE.SphereGeometry(0.02, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  marker = new THREE.Mesh(markerGeo, markerMat);
  scene.add(marker);

  // Controls - drag to rotate, scroll to zoom (like zebiv-code)
  let isDragging = false;
  let previousMouse = { x:0, y:0 };
  let rotation = { x:0, y:0 };

  canvas.addEventListener('mousedown', (e)=>{ isDragging=true; autoRotate=false; });
  canvas.addEventListener('mouseup', ()=>{ isDragging=false; });
  canvas.addEventListener('mousemove', (e)=>{
    if(isDragging){
      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;
      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;
      rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotation.x));
    }
    previousMouse = { x:e.clientX, y:e.clientY };
  });
  canvas.addEventListener('wheel', (e)=>{
    e.preventDefault();
    camera.position.z += e.deltaY * 0.001;
    camera.position.z = Math.max(1.2, Math.min(5, camera.position.z));
  }, {passive:false});

  // Touch controls
  canvas.addEventListener('touchstart', (e)=>{ isDragging=true; autoRotate=false; previousMouse = { x:e.touches[0].clientX, y:e.touches[0].clientY }; });
  canvas.addEventListener('touchend', ()=>{ isDragging=false; });
  canvas.addEventListener('touchmove', (e)=>{
    if(isDragging){
      const deltaX = e.touches[0].clientX - previousMouse.x;
      const deltaY = e.touches[0].clientY - previousMouse.y;
      rotation.y += deltaX * 0.005;
      rotation.x += deltaY * 0.005;
      previousMouse = { x:e.touches[0].clientX, y:e.touches[0].clientY };
    }
  }, {passive:true});

  // Animation loop - realistic day/night cycle
  function animate(){
    requestAnimationFrame(animate);
    
    // Update sun direction based on current time - live
    sunDirection = getSunPosition(new Date());
    material.uniforms.sunDirection.value = sunDirection;
    sunLight.position.copy(sunDirection).multiplyScalar(5);
    
    // Auto rotate when not dragging
    if(autoRotate){
      rotation.y += 0.001;
    }
    
    earth.rotation.y = rotation.y;
    earth.rotation.x = rotation.x;
    clouds.rotation.y = rotation.y + 0.0005;
    clouds.rotation.x = rotation.x;
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize', ()=>{
    if(!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });

  window.updateGlobeMarker = function(lat, lng){
    if(!marker) return;
    const phi = (90 - lat) * Math.PI/180;
    const theta = (lng + 180) * Math.PI/180;
    const r = 1.02;
    marker.position.x = -r * Math.sin(phi) * Math.cos(theta);
    marker.position.y = r * Math.cos(phi);
    marker.position.z = r * Math.sin(phi) * Math.sin(theta);
  };

  // Initial marker
  updateGlobeMarker(10.5276, 76.2144);
}

function initFallbackCanvasMap(){
  // Canvas-based terminator fallback (offline capable)
  const canvas = document.getElementById('dayNightMap');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * window.devicePixelRatio;
  
  function drawTerminator(){
    ctx.clearRect(0,0,w,h);
    // Simplified day/night world map
    ctx.fillStyle = '#454a58';
    ctx.fillRect(0,0,w,h);
    
    // Draw world map approximation - day side
    const now = new Date();
    const sunPos = { lon: -((now.getUTCHours() + now.getUTCMinutes()/60 -12)*15), lat: 0 }; // simplified
    
    // Night overlay with 3 circles for twilight like amCharts
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    // Simplified night shading
    const nightX = w/2 - (sunPos.lon/180)*w/2;
    ctx.beginPath();
    ctx.ellipse(nightX, h/2, w*0.5, h*0.5, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Sun marker
    ctx.fillStyle = '#ffba00';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffba00';
    ctx.beginPath();
    ctx.arc(w/2 + (sunPos.lon/180)*w/2, h/2, 8*window.devicePixelRatio, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // User marker
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    const userX = w/2 + (76.2144/180)*w/2;
    const userY = h/2 - (10.5276/90)*h/2;
    ctx.arc(userX, userY, 4*window.devicePixelRatio, 0, Math.PI*2);
    ctx.fill();
  }
  drawTerminator();
  setInterval(drawTerminator, 60000);
  window.updateGlobeMarker = function(lat,lng){ drawTerminator(); };
}

// Try to load THREE, else fallback
if(typeof THREE === 'undefined'){
  // Load THREE via CDN
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  script.onload = initRealisticGlobe;
  script.onerror = initFallbackCanvasMap;
  document.head.appendChild(script);
} else {
  initRealisticGlobe();
}

window.initRealisticGlobe = initRealisticGlobe;
