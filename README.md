# Shivam Grover — Interactive 3D Developer Portfolio & Studio OS

![Shivam Grover 3D Portfolio](assets/covers/aevonix.jpg)

An interactive, high-performance 3D web experience and virtual developer workstation built with **Three.js**, **WebGL**, **GSAP**, **Lenis Smooth Scroll**, and **Web Audio API**.

---

## 🌟 Key Features

- 🎮 **Adaptive 3D Rendering Architecture:**
  - Dynamic device capability profiling across **HIGH**, **MEDIUM**, **LOW**, and **FALLBACK** tiers.
  - Automatic frame-time monitoring, DPR capping, and WebGL context loss recovery.
  - Smooth 60 FPS on high-end systems and battery-optimized performance on mid/low-tier mobile devices (e.g., Snapdragon 680).
- 🖥️ **Shivam Studio OS (Virtual Workstation):**
  - Monitor-integrated virtual desktop experience on desktop displays.
  - Dedicated full-screen **Mobile Studio OS** with a live system status bar, dock, touch command chips in the terminal, and settings panel.
- 🎵 **Multi-Track Ambient Audio Engine:**
  - Procedural Lo-Fi chord progressions built with the Web Audio API.
  - Fisher-Yates track shuffling, smooth crossfading, volume control (~30% calibrated default), and responsive visualizer bars.
- 📳 **Cross-Platform Mobile Haptics:**
  - Subtle physical feedback for app launches, project exploration, 3D hotspots, and desk interaction on supported devices with safe fallbacks.
- 📱 **Mobile-First Responsive Design:**
  - Non-blocking touch scrolling synchronized with Lenis and GSAP.
  - Safe-area inset support (`env(safe-area-inset-*)`) across all mobile aspect ratios (16:9, 19.5:9, 20:9, 21:9).

---

## 🛠️ Technology Stack

- **3D & Graphics:** [Three.js](https://threejs.org/) (r128), WebGL 2.0 / 1.0, GLTFLoader, OrbitControls
- **Animation & Choreography:** [GSAP 3](https://greensock.com/gsap/) (ScrollTrigger, Ticker)
- **Smooth Scrolling:** [Lenis](https://github.com/darkroomengineering/lenis)
- **Audio Synthesis:** Web Audio API (AnalyserNode, OscillatorNode, BiquadFilterNode)
- **Icons & Typography:** [Lucide Icons](https://lucide.dev/), Google Fonts (Outfit, Inter, JetBrains Mono)
- **Deployment & Edge Routing:** [Vercel](https://vercel.com/)

---

## 🚀 Local Development

To run the project locally without any build step needed:

```bash
# Using Python built-in HTTP server
python -m http.server 3000

# Or using Node.js npx serve
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

This repository contains **NO sensitive credentials, API keys, or private tokens**. All interactive features (email routing, project links, audio generation) run purely client-side without exposing private environment variables.

---

## ⚖️ Copyright & License

**Copyright © 2026 Shivam Grover. All Rights Reserved.**

This repository, including its 3D models, graphics, styling, code architecture, and interactive systems, is the proprietary work of **Shivam Grover**.

### Permissions:
No part of this project may be copied, reproduced, modified, republished, distributed, or used in commercial/non-commercial projects without explicit prior written consent from Shivam Grover.

To request permission or discuss collaboration:
- **Email:** [shivamgrover195@gmail.com](mailto:shivamgrover195@gmail.com) / [shivamgrover.dev@gmail.com](mailto:shivamgrover.dev@gmail.com)
- **LinkedIn:** [linkedin.com/in/shivamgrover-dev/](https://www.linkedin.com/in/shivamgrover-dev/)
- **GitHub:** [github.com/ShivamGrover-05](https://github.com/ShivamGrover-05)
