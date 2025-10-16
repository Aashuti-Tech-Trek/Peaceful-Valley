// Enhanced flowing water shader with realistic waves and caustics
export function createWaterShaderMaterial(THREE) {
  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x4a9eff) },
    uColorB: { value: new THREE.Color(0x1e88e5) },
    uColorC: { value: new THREE.Color(0x0d47a1) },
    uOpacity: { value: 0.75 },
    uWaveHeight: { value: 0.15 },
    uWaveSpeed: { value: 1.2 }
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveSpeed;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWave;
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Multiple wave layers for realistic water movement
      float wave1 = sin(position.x * 0.8 + uTime * uWaveSpeed) * 0.1;
      float wave2 = cos(position.y * 0.6 + uTime * uWaveSpeed * 0.7) * 0.08;
      float wave3 = sin((position.x + position.y) * 0.4 + uTime * uWaveSpeed * 1.3) * 0.06;
      
      vWave = wave1 + wave2 + wave3;
      vec3 p = position;
      p.z += vWave * uWaveHeight;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vWave;
    
    void main() {
      // Caustic-like patterns
      float caustic1 = sin(vUv.x * 25.0 + uTime * 2.0) * 0.5 + 0.5;
      float caustic2 = cos(vUv.y * 18.0 - uTime * 1.5) * 0.5 + 0.5;
      float caustic3 = sin((vUv.x + vUv.y) * 12.0 + uTime * 1.8) * 0.5 + 0.5;
      
      // Combine caustics
      float caustic = (caustic1 * 0.4 + caustic2 * 0.3 + caustic3 * 0.3);
      
      // Depth-based color mixing
      float depth = vWave * 0.5 + 0.5;
      vec3 color = mix(uColorA, uColorB, depth);
      color = mix(color, uColorC, caustic * 0.3);
      
      // Add sparkle effect
      float sparkle = sin(vUv.x * 50.0 + uTime * 3.0) * sin(vUv.y * 50.0 + uTime * 2.5);
      sparkle = smoothstep(0.8, 1.0, sparkle);
      color += sparkle * 0.2;
      
      gl_FragColor = vec4(color, uOpacity + caustic * 0.1);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  });
  return mat;
}

