# 🌄 Peaceful Valley — A Real-Time 3D Nature Simulation

> *A serene, immersive 3D world built with Three.js — featuring real-time terrain generation, dynamic lighting, and smooth sunrise-to-sunset transitions.*

---

## 🏞️ Overview

**Peaceful Valley** is a browser-based **real-time 3D nature simulation** that brings a tranquil valley to life using modern computer graphics techniques.  
The environment evolves dynamically from **sunrise to sunset**, blending procedural terrain, animated lighting, and atmospheric realism.

---

## ✨ Highlights

### 🌍 Environment & Terrain
- **Procedural terrain generation** using Perlin/Simplex noise  
- Realistic **vertex-based coloring** for grass, rock, and snow transitions  
- **Dynamic sky dome** with natural color gradients and sunlight diffusion  
- Adjustable **fog and atmospheric scattering** for depth perception  

### 🌿 Vegetation & Natural Elements
- Forest ecosystem generated using **.glb** tree assets  
- **Procedural undergrowth** with randomized scaling and placement  
- Vegetation density based on **terrain height and slope**  

### 💧 Water & Lighting
- **Custom GLSL shader** for water surface with caustic and wave animation  
- Flowing **river system** mapped using spline geometry  
- **Physically-based lighting** with soft shadows and color adaptation through the day  

### 🌅 Daylight Cycle
- Real-time **sunrise → noon → sunset → twilight** transitions  
- Shifting **ambient color**, **shadow intensity**, and **fog hue**  
- Smooth interpolation of **sky gradients and sun direction**  

### 🧭 Camera & Interaction
- **WASD / Arrow key navigation** for free exploration  
- **Preset cinematic views (1–5)** to showcase key areas  
- Optimized camera transitions for an aesthetic presentation  

---

## ⚙️ Tech Stack

| Component | Technology Used |
|------------|-----------------|
| **Language** | JavaScript (ES6+) |
| **Graphics API** | [Three.js](https://threejs.org/) (WebGL) |
| **Build Tool** | [Vite.js](https://vitejs.dev/) |
| **Runtime** | Node.js |
| **Assets** | `.glb` models for trees, clouds, terrain elements |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Aashuti-Tech-Trek/Peaceful-Valley.git
cd Peaceful-Valley
```
2️⃣ Install Dependencies
```bash
npm install
```
3️⃣ Launch the Simulation
```bash
npm run dev
```

Then open the localhost link displayed in your terminal to explore Peaceful Valley in your browser.

## 🎓 Learning Outcomes

This project integrates a complete real-time graphics pipeline, combining both **technical depth** and **artistic design**.  
Concepts learned and applied include:

- 🌄 **Procedural terrain generation** using noise functions  
- 🌳 **Scene graph hierarchies** and object transformations  
- 🌿 **Instancing & optimization** for vegetation and environment  
- 💡 **Custom GLSL shader programming** for realistic lighting  
- 🎞️ **Real-time animation loops** with performance tuning  
- 🎮 **Interactive camera systems** and transitions  
- ☀️ **Atmospheric lighting** and composition for visual depth  

---

## 🧭 Camera & Interaction

- **WASD / Arrow key navigation** for free exploration  
- **Preset cinematic views (1–5)** to showcase key areas  
- **Optimized camera transitions** for smooth presentation  
