import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { createWaterShaderMaterial } from './shaders/waterShader.js';

// Scene
console.log('Initializing Peaceful Valley scene...');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0xa9dbe9, 25, 180); // Fog for depth

// Camera (optimized for performance)
const camera = new THREE.PerspectiveCamera(
  60, // Reduced FOV for better performance
  window.innerWidth / window.innerHeight,
  0.1,
  500 // Reduced far plane
);
camera.position.set(0, 25, 40);

// Renderer (fallback to Canvas2D if WebGL fails)
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: 'default',
    preserveDrawingBuffer: false,
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false
  });
  console.log('WebGL renderer created successfully');
} catch (e) {
  console.warn('WebGL failed, trying Canvas renderer...', e);
  try {
    renderer = new THREE.CanvasRenderer();
    console.log('Canvas renderer created successfully');
  } catch (e2) {
    console.error('Both WebGL and Canvas renderers failed', e2);
    const msg = document.createElement('div');
    msg.innerHTML = `
      <h3>3D Graphics Not Available</h3>
      <p>Your browser doesn't support 3D graphics. Try:</p>
      <ul>
        <li>Enable hardware acceleration in your browser</li>
        <li>Update your graphics drivers</li>
        <li>Try a different browser (Chrome, Firefox, Edge)</li>
        <li>Disable browser extensions temporarily</li>
      </ul>
    `;
    msg.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:#f0f0f0;color:#333;padding:20px;font-family:sans-serif;overflow:auto;';
    document.body.appendChild(msg);
    throw e2;
  }
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Only add WebGL context listeners if using WebGL renderer
if (renderer.getContext && renderer.getContext().canvas) {
  const gl = renderer.getContext();
  if (gl && gl.canvas) {
    gl.canvas.addEventListener('webglcontextlost', (ev)=>{
      ev.preventDefault();
      console.warn('WebGL context lost');
    });
  }
}

const clock = new THREE.Clock();

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enableZoom = false; // keyboard zoom below
controls.enablePan = false;
controls.enableRotate = false;
controls.autoRotate = false;
controls.target.set(0, 12, -10);

// Materials (procedural; no external textures)
const grassColor = new THREE.Color(0x68b36b);
const rockColor = new THREE.Color(0x8c8c8c);
const snowColor = new THREE.Color(0xf2f6fa);

// Advanced Heightmap Terrain (optimized for faster loading)
const size = 120; // Reduced grid size for performance
const segments = 120;
const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
const noise = new SimplexNoise();
const noise2 = (x, y) => {
  if (noise && typeof noise.noise2D === 'function') return noise.noise2D(x, y);
  if (noise && typeof noise.noise === 'function') return noise.noise(x, y);
  return 0;
};

for (let i = 0; i < geometry.attributes.position.count; i++) {
  let x = geometry.attributes.position.getX(i) / 44;
  let y = geometry.attributes.position.getY(i) / 44;
  let h = noise2(x, y) * 12 + noise2(x * 2, y * 2) * 5;
  geometry.attributes.position.setZ(i, h);
}
geometry.computeVertexNormals();

// Vertex colors based on height and slope for grass/rock/snow
const colors = [];
const positions = geometry.attributes.position;
const normals = geometry.attributes.normal;
for (let i = 0; i < positions.count; i++) {
  const h = positions.getZ(i);
  const ny = normals.getY(i);
  let c = new THREE.Color();
  if (h > 12) {
    c.copy(snowColor);
  } else if (ny < 0.7 || h > 7) {
    c.copy(rockColor);
  } else {
    // subtle grass variation by noise
    const v = 0.9 + 0.1 * Math.sin(h * 0.5 + i * 0.001);
    c.copy(grassColor).multiplyScalar(v);
  }
  colors.push(c.r, c.g, c.b);
}
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

const groundMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.95,
  metalness: 0.0
});

const ground = new THREE.Mesh(geometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Procedural Sky
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 12;
skyUniforms['rayleigh'].value = 1.6;
skyUniforms['mieCoefficient'].value = 0.0045;
skyUniforms['mieDirectionalG'].value = 0.7;

// Lighting: Ambient + Sun + Hemisphere
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xb9eaff, 0x395379, 0.48); // sky & ground colors
scene.add(hemiLight);

// Sun / Directional light
const sun = new THREE.DirectionalLight(0xfffaa8, 1.4);
sun.position.set(56, 110, 42);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 500;
sun.shadow.camera.left = -200;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
scene.add(sun);

// Animate sun position for day-night effect
let sunAngle = 0;
function updateSun(time) {
  sunAngle = ((time * 0.00009) % (2 * Math.PI));
  sun.position.x = 110 * Math.cos(sunAngle);
  sun.position.y = 110 * Math.sin(sunAngle) + 80;
  sun.position.z = 46 * Math.sin(sunAngle);
  // Update sky sun position
  if (sky && sky.material && sky.material.uniforms && sky.material.uniforms['sunPosition']) {
    sky.material.uniforms['sunPosition'].value.copy(sun.position);
  }
}

// Animated water (shader-based, optimized)
const waterGeom = new THREE.PlaneGeometry(46, 48, 64, 64);
const waterMaterial = createWaterShaderMaterial(THREE);
const water = new THREE.Mesh(waterGeom, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.set(0, 2.1, -14);
water.receiveShadow = true;
scene.add(water);

// MOUNTAIN MODEL (GLB)
const mountainLoader = new GLTFLoader();
mountainLoader.load('assets/great_mountain.glb', (gltf) => {
  const mountain = gltf.scene;
  mountain.position.set(-28, 0, -60);
  mountain.scale.set(10, 10, 10);
  mountain.rotation.y = Math.PI * 0.15;
  mountain.traverse((obj)=>{ if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }});
  scene.add(mountain);
}, undefined, (e)=>console.warn('Mountain GLB not found or failed to load', e));

// ANIMATED BIRDS (pixel-style, highly visible) - Higher altitude for sky visibility
const birds = [];
const birdGeometry = new THREE.SphereGeometry(0.5, 8, 8); // Larger and more detailed
const birdMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x000000, // Pure black for high contrast
  transparent: true,
  opacity: 0.9
});
for (let i = 0; i < 12; i++) { // More birds for better visibility
  const bird = new THREE.Mesh(birdGeometry, birdMaterial);
  bird.position.set(
    Math.random() * 60 - 30,
    Math.random() * 20 + 15, // Higher altitude (15-35)
    Math.random() * 60 - 30
  );
  bird.userData = {
    speed: 0.02 + Math.random() * 0.03,
    direction: Math.random() * Math.PI * 2,
    altitude: bird.position.y,
    size: 0.4 + Math.random() * 0.3 // Varying sizes
  };
  bird.scale.set(bird.userData.size, bird.userData.size, bird.userData.size);
  scene.add(bird);
  birds.push(bird);
}

// PHOENIX BIRD (majestic fire bird) - Higher altitude for sky visibility
const phoenixGeometry = new THREE.ConeGeometry(0.8, 2, 8);
const phoenixMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xff4500,
  emissive: 0xff2200,
  emissiveIntensity: 0.3
});
const phoenix = new THREE.Mesh(phoenixGeometry, phoenixMaterial);
phoenix.position.set(0, 35, -20); // Higher altitude
phoenix.userData = {
  speed: 0.05,
  direction: 0,
  altitude: 35, // Higher altitude
  wingFlap: 0
};
scene.add(phoenix);

// ATMOSPHERIC PARTICLES (floating dust/magic sparkles)
const particles = [];
const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
const particleMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffffff,
  transparent: true,
  opacity: 0.6
});
for (let i = 0; i < 50; i++) {
  const particle = new THREE.Mesh(particleGeometry, particleMaterial);
  particle.position.set(
    Math.random() * 100 - 50,
    Math.random() * 30 + 5,
    Math.random() * 100 - 50
  );
  particle.userData = {
    speed: 0.01 + Math.random() * 0.02,
    direction: Math.random() * Math.PI * 2,
    altitude: particle.position.y,
    drift: Math.random() * 0.01
  };
  scene.add(particle);
  particles.push(particle);
}

// SCATTER TWO TREE TYPES (reduced count for performance)
const treeTypes = [
  {file: 'assets/maple_tree.glb', colorHint: 'maple'},
  {file: 'assets/low_poly_tree_scene_free.glb', colorHint: 'pine'}
];
const treeLoader = new GLTFLoader();

function scatterTreesOnMountain(treeGLB, count, xBias = 1, zBias = 1, yStart = 2.1) {
  treeLoader.load(treeGLB, (gltf) => {
    const original = gltf.scene;
    for (let i = 0; i < count; i++) {
      const clone = original.clone();
      // Place more on the mountain slopes/sides
      const angle = Math.PI * (Math.random() * 0.5 + (xBias > 0 ? 0.2 : 0.8));
      const radius = 38 + Math.random() * 33;
      clone.position.x = Math.cos(angle) * radius * xBias + (Math.random()-0.5)*8;
      clone.position.z = Math.sin(angle) * radius * zBias + (Math.random()-0.5)*6;
      clone.position.y = yStart + (Math.random()-0.5)*2;
      const s = 1.3 + Math.random()*0.8;
      clone.scale.set(s, s + (Math.random()-0.5)*0.7, s);
      clone.rotation.y = Math.random() * Math.PI * 2;
      scene.add(clone);
    }
    renderer.render(scene, camera);
  }, undefined, (e)=>console.error('GLB load error', treeGLB, e));
}
// Reduced tree count for faster loading
scatterTreesOnMountain(treeTypes[0].file, 8, 1, 1);
scatterTreesOnMountain(treeTypes[1].file, 6, -1, 1);

// GLACIER + MELTWATER RIVER
const glacierGeom = new THREE.ConeGeometry(10, 18, 40);
const glacierMat = new THREE.MeshPhongMaterial({color: 0xe6f4fa, transparent:true, opacity: 0.85});
const glacier = new THREE.Mesh(glacierGeom, glacierMat);
glacier.position.set(-36, 19, -46);
glacier.rotation.x = Math.PI * 0.13; // tilt a bit
glacier.castShadow = true;
scene.add(glacier);

// Meltwater river (from glacier base, animated flow)
const riverCurvePoints = [
  new THREE.Vector3(-36, 3, -46),
  new THREE.Vector3(-28, 2, -38),
  new THREE.Vector3(-14, 2, -23),
  new THREE.Vector3(-3, 2, -17),
  new THREE.Vector3(5, 2, -8)
];
const riverCurve = new THREE.CatmullRomCurve3(riverCurvePoints);
const riverGeom = new THREE.TubeGeometry(riverCurve, 30, 2.7, 7, false);
const riverMat = new THREE.MeshPhysicalMaterial({
  color: 0x7fd8fa,
  transparent: true,
  opacity: 0.62,
  roughness: 0.25,
  metalness: 0.27,
  clearcoat: 0.2,
  reflectivity: 0.6
});
const river = new THREE.Mesh(riverGeom, riverMat);
river.castShadow = false;
river.receiveShadow = true;
scene.add(river);

// Keyboard navigation (for users without mouse)
const keyState = { w:false, a:false, s:false, d:false, q:false, e:false, ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
window.addEventListener('keydown', (e)=>{ const k=e.key.toLowerCase(); if(keyState.hasOwnProperty(k)) keyState[k]=true; });
window.addEventListener('keyup', (e)=>{ const k=e.key.toLowerCase(); if(keyState.hasOwnProperty(k)) keyState[k]=false; });
function handleKeyboard(dt){
  const move = 14 * dt;
  if (keyState.w || keyState.arrowup) camera.position.z -= move;
  if (keyState.s || keyState.arrowdown) camera.position.z += move;
  if (keyState.a || keyState.arrowleft) camera.position.x -= move;
  if (keyState.d || keyState.arrowright) camera.position.x += move;
  if (keyState.q) camera.position.y += move * 0.6; // up
  if (keyState.e) camera.position.y -= move * 0.6; // down
}

// Preset views and auto-orbit toggle
window.addEventListener('keydown', (e)=>{
  if (e.key === '1') { camera.position.set(0, 30, 60); controls.target.set(0,12,-10); } // Wide valley + sky view
  if (e.key === '2') { camera.position.set(-40, 35, -30); controls.target.set(-30,15,-45); } // Glacier + mountain + sky view
  if (e.key === '3') { camera.position.set(35, 32, -12); controls.target.set(0,12,-20); } // Tree slope + sky view
  if (e.key === '4') { camera.position.set(0, 45, 0); controls.target.set(0,12,-10); } // Top-down aerial view
  if (e.key === '5') { camera.position.set(-20, 22, 20); controls.target.set(0,12,-10); } // Hut + sky view
  if (e.key.toLowerCase() === 'r') { controls.autoRotate = !controls.autoRotate; }
});

function animate(time) {
  requestAnimationFrame(animate);
  updateSun(time);
  handleKeyboard(clock.getDelta());
  
  // Animate birds with pixel-style movement
  birds.forEach((bird, i) => {
    const data = bird.userData;
    data.direction += (Math.random() - 0.5) * 0.02; // slight direction changes
    bird.position.x += Math.cos(data.direction) * data.speed;
    bird.position.z += Math.sin(data.direction) * data.speed;
    bird.position.y = data.altitude + Math.sin(time * 0.001 + i) * 0.5; // gentle bobbing
    
    // Pixel-style rotation for more dynamic movement
    bird.rotation.y += 0.02;
    bird.rotation.x = Math.sin(time * 0.002 + i) * 0.1;
    
    // Slight size pulsing for pixel effect
    const pulse = 1 + Math.sin(time * 0.003 + i) * 0.1;
    bird.scale.set(data.size * pulse, data.size * pulse, data.size * pulse);
    
    // Wrap around world bounds
    if (bird.position.x > 50) bird.position.x = -50;
    if (bird.position.x < -50) bird.position.x = 50;
    if (bird.position.z > 50) bird.position.z = -50;
    if (bird.position.z < -50) bird.position.z = 50;
  });
  
  // Animate Phoenix (majestic circular flight with wing flapping)
  const phoenixData = phoenix.userData;
  phoenixData.direction += phoenixData.speed;
  phoenixData.wingFlap += 0.1;
  
  // Circular flight pattern
  phoenix.position.x = Math.cos(phoenixData.direction) * 15;
  phoenix.position.z = Math.sin(phoenixData.direction) * 15 - 20;
  phoenix.position.y = phoenixData.altitude + Math.sin(phoenixData.wingFlap) * 2;
  
  // Wing flapping rotation
  phoenix.rotation.x = Math.sin(phoenixData.wingFlap) * 0.3;
  phoenix.rotation.z = Math.sin(phoenixData.wingFlap * 0.5) * 0.2;
  
  // Animate atmospheric particles (floating magic dust)
  particles.forEach((particle, i) => {
    const data = particle.userData;
    data.direction += data.drift;
    particle.position.x += Math.cos(data.direction) * data.speed;
    particle.position.z += Math.sin(data.direction) * data.speed;
    particle.position.y = data.altitude + Math.sin(time * 0.0005 + i) * 1;
    
    // Gentle floating motion
    particle.rotation.y += 0.01;
    particle.rotation.x += 0.005;
    
    // Wrap around world bounds
    if (particle.position.x > 60) particle.position.x = -60;
    if (particle.position.x < -60) particle.position.x = 60;
    if (particle.position.z > 60) particle.position.z = -60;
    if (particle.position.z < -60) particle.position.z = 60;
  });
  
  // Animate cloud rings
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.rotationSpeed) {
      obj.rotation.y += obj.userData.rotationSpeed;
    }
  });
  
  // Drive enhanced water shader time and wave parameters
  if (waterMaterial && waterMaterial.uniforms) {
    waterMaterial.uniforms.uTime.value = time * 0.001;
    // Animate wave parameters for more dynamic water
    waterMaterial.uniforms.uWaveHeight.value = 0.15 + Math.sin(time * 0.0008) * 0.05;
    waterMaterial.uniforms.uWaveSpeed.value = 1.2 + Math.sin(time * 0.0005) * 0.3;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ========== LOAD ALL GLB ASSETS FOUND IN assets/ ==========
const glbLoader = new GLTFLoader();

function addGLB(path, { position = new THREE.Vector3(), scale = new THREE.Vector3(1,1,1), rotationY = 0 } = {}) {
  glbLoader.load(path, (gltf) => {
    const root = gltf.scene;
    root.position.copy(position);
    root.scale.copy(scale);
    root.rotation.y = rotationY;
    root.traverse((obj)=>{ if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }});
    scene.add(root);
    console.log('Loaded', path);
  }, undefined, (e)=> console.warn('Failed to load', path, e));
}

// Mountain (backdrop)
addGLB('assets/great_mountain.glb', {
  position: new THREE.Vector3(-25, 0, -70),
  scale: new THREE.Vector3(10, 10, 10),
  rotationY: Math.PI * 0.12
});

// Trees (two species) clusters already scattered separately above; also drop a couple hero trees
addGLB('assets/maple_tree.glb', {
  position: new THREE.Vector3(8, 2.1, -6),
  scale: new THREE.Vector3(2.2, 2.6, 2.2),
  rotationY: Math.random()*Math.PI*2
});
addGLB('assets/low_poly_tree_scene_free.glb', {
  position: new THREE.Vector3(-12, 2.1, -4),
  scale: new THREE.Vector3(2.0, 2.4, 2.0),
  rotationY: Math.random()*Math.PI*2
});

// Lowpoly grass: if present, sprinkle fewer clumps for performance
(function sprinkleGrass(){
  const path = 'assets/lowpoly_grass.glb';
  glbLoader.load(path, (gltf)=>{
    const base = gltf.scene;
    for (let i=0;i<8;i++){ // Reduced from 14 to 8
      const g = base.clone();
      const a = Math.random()*Math.PI*2;
      const r = 10 + Math.random()*40;
      g.position.set(Math.cos(a)*r, 2.05, Math.sin(a)*r);
      const s = 0.7 + Math.random()*0.7;
      g.scale.set(s,s,s);
      g.rotation.y = Math.random()*Math.PI*2;
      g.traverse((o)=>{ if (o.isMesh){ o.castShadow=true; o.receiveShadow=true; }});
      scene.add(g);
    }
    console.log('Grass sprinkled');
  }, undefined, ()=>{/* silent if missing */});
})();

// Enhanced Cloud ring in the sky with rotation
addGLB('assets/cloud_ring.glb', (gltf) => {
  const cloudRing = gltf.scene;
  cloudRing.position.set(0, 60, -30);
  cloudRing.scale.set(8, 8, 8);
  cloudRing.userData = { rotationSpeed: 0.002 };
  scene.add(cloudRing);
  
  // Add multiple cloud layers for depth
  const cloud2 = cloudRing.clone();
  cloud2.position.set(-20, 55, -40);
  cloud2.scale.set(6, 6, 6);
  cloud2.userData = { rotationSpeed: -0.001 };
  scene.add(cloud2);
  
  const cloud3 = cloudRing.clone();
  cloud3.position.set(25, 65, -25);
  cloud3.scale.set(4, 4, 4);
  cloud3.userData = { rotationSpeed: 0.0015 };
  scene.add(cloud3);
}, undefined, (e) => console.warn('Cloud ring GLB not found', e));

// Winter hut scene somewhere cozy
addGLB('assets/winter_hut_scene.glb', {
  position: new THREE.Vector3(24, 2.2, -18),
  scale: new THREE.Vector3(2.2, 2.2, 2.2),
  rotationY: Math.PI*0.15
});

// Optional animated ocean sample: place far away so it doesn’t dominate
addGLB('assets/animated_ocean_scene_tutorial_example_1.glb', {
  position: new THREE.Vector3(80, 0, -120),
  scale: new THREE.Vector3(2,2,2),
  rotationY: 0
});
