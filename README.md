# Shivam Grover — Interactive 3D Developer Portfolio & Studio OS

![Shivam Grover 3D Portfolio](assets/covers/aevonix.jpg)

An interactive, high-performance 3D web experience, virtual developer workstation, and full-stack contact system built with **Three.js**, **WebGL**, **GSAP**, **Lenis Smooth Scroll**, **Web Audio API**, and **Node.js / Nodemailer Serverless Backend**.

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
  - Procedural Lo-Fi chord progressions built with the Web Audio API across 8 distinct soundscapes.
  - Fisher-Yates track shuffling, smooth crossfading, auto-minimizing floating player widget, calibrated volume (~30%), and zero performance impact on 3D rendering.
- ✉️ **Production Serverless Contact Backend (`/api/contact`):**
  - Vercel Node.js function with **Nodemailer** and Gmail SMTP integration.
  - Dual email routing: sends full inquiry notifications to `codewithshivamdev@gmail.com` with `Reply-To: visitor`, plus an automated branded confirmation email back to the visitor.
  - Lightweight anti-spam honeypot, payload length constraints, and client + server validation.
- 📳 **Cross-Platform Mobile Haptics:**
  - Subtle physical feedback for app launches, project exploration, 3D hotspots, and form submissions on supported devices with safe fallbacks.
- 📱 **Mobile-First Responsive Design:**
  - Non-blocking touch scrolling synchronized with Lenis and GSAP.
  - Safe-area inset support (`env(safe-area-inset-*)`) across all mobile aspect ratios.

---

## 🛠️ Technology Stack

- **3D & Graphics:** [Three.js](https://threejs.org/) (r128), WebGL 2.0 / 1.0, GLTFLoader, OrbitControls
- **Animation & Choreography:** [GSAP 3](https://greensock.com/gsap/) (ScrollTrigger, Ticker)
- **Smooth Scrolling:** [Lenis](https://github.com/darkroomengineering/lenis)
- **Audio Synthesis:** Web Audio API (AnalyserNode, OscillatorNode, BiquadFilterNode)
- **Backend & Email:** Node.js Serverless Function, Nodemailer, Gmail SMTP
- **Icons & Typography:** [Lucide Icons](https://lucide.dev/), Google Fonts (Outfit, Inter, JetBrains Mono)
- **Deployment & Edge Routing:** [Vercel](https://vercel.com/)

---

## 🚀 Local Development & Environment Configuration

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Update your Gmail credentials:
```env
GMAIL_USER=codewithshivamdev@gmail.com
GMAIL_APP_PASSWORD=your_16_digit_app_password
CONTACT_EMAIL=codewithshivamdev@gmail.com
```

### 3. Run Locally with Vercel CLI
```bash
npx vercel dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

- **No hardcoded credentials:** Gmail App Passwords and credentials are kept strictly in server-side environment variables (`.env.local` / Vercel Environment Settings) and excluded via `.gitignore`.
- **Anti-Spam & Validation:** Invisible honeypot field, length bounding, input sanitization, and POST-only endpoint security.
- **Header Security:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referrer policies configured in `vercel.json`.

---

## ⚖️ Copyright & License

**Copyright © 2026 Shivam Grover. All Rights Reserved.**

This repository, including its 3D models, graphics, styling, code architecture, and interactive systems, is the proprietary work of **Shivam Grover**.

### Permissions:
No part of this project may be copied, reproduced, modified, republished, distributed, or used in commercial/non-commercial projects without explicit prior written consent from Shivam Grover.

To request permission or discuss collaboration:
- **Email:** [codewithshivamdev@gmail.com](mailto:codewithshivamdev@gmail.com)
- **LinkedIn:** [linkedin.com/in/shivamgrover-dev/](https://www.linkedin.com/in/shivamgrover-dev/)
- **GitHub:** [github.com/ShivamGrover-05](https://github.com/ShivamGrover-05)
