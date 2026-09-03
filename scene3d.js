// 3D Scene Engine — Lightweight Interactive Holographic Particle Sphere
// Procedural Generation, Viewport-Aware Camera Framing, and Lenis Scroll Integration

class CameraDirector {
    constructor(sceneInstance) {
        this.studio = sceneInstance;
        this.states = {
            HOME: {
                desktop: { x: 0, y: 0.15, z: 6.2, targetX: 0, targetY: 0.15, targetZ: 0, fov: 45 },
                mobile: { x: 0, y: 0.2, z: 7.0, targetX: 0, targetY: 0.2, targetZ: 0, fov: 46 }
            },
            ABOUT: {
                desktop: { x: -2.2, y: 0.4, z: 6.0, targetX: 0.4, targetY: 0.2, targetZ: 0, fov: 45 },
                mobile: { x: -0.8, y: 0.2, z: 5.8, targetX: 0, targetY: 0.1, targetZ: 0, fov: 46 }
            },
            SKILLS: {
                desktop: { x: 2.0, y: 0.8, z: 5.6, targetX: -0.2, targetY: 0.2, targetZ: -0.2, fov: 45 },
                mobile: { x: 1.0, y: 0.5, z: 5.6, targetX: 0, targetY: 0.2, targetZ: 0, fov: 46 }
            },
            PROJECTS: {
                desktop: { x: 0, y: 0.3, z: 5.8, targetX: 0, targetY: 0.2, targetZ: 0, fov: 45 },
                mobile: { x: 0, y: 0.2, z: 5.5, targetX: 0, targetY: 0.1, targetZ: 0, fov: 46 }
            },
            EXPERIENCE: {
                desktop: { x: -1.6, y: 0.3, z: 6.0, targetX: 0.2, targetY: 0.15, targetZ: 0, fov: 45 },
                mobile: { x: -0.6, y: 0.1, z: 5.6, targetX: 0, targetY: 0.1, targetZ: 0, fov: 46 }
            },
            CONTACT: {
                desktop: { x: 0, y: 0.2, z: 5.6, targetX: 0, targetY: 0.2, targetZ: 0.2, fov: 45 },
                mobile: { x: 0, y: 0.1, z: 5.5, targetX: 0, targetY: 0.1, targetZ: 0.1, fov: 46 }
            },
            STUDIO: {
                desktop: { x: 0, y: 0.1, z: 1.5, targetX: 0, targetY: 0.1, targetZ: 0, fov: 42 },
                mobile: { x: 0, y: 0, z: 1.6, targetX: 0, targetY: 0, targetZ: 0, fov: 42 }
            },
            PROJECT_DETAIL: {
                desktop: { x: 0, y: 0.4, z: 5.2, targetX: 0, targetY: 0.2, targetZ: 0, fov: 45 },
                mobile: { x: 0, y: 0.2, z: 5.0, targetX: 0, targetY: 0.1, targetZ: 0, fov: 46 }
            }
        };
        this.currentStateName = 'HOME';
    }

    getState(stateName) {
        const isMobile = window.innerWidth < 768;
        const stateSet = this.states[stateName] || this.states.HOME;
        return isMobile ? stateSet.mobile : stateSet.desktop;
    }

    transitionTo(stateName, customPreset = null, durationOverride = null) {
        if (!this.studio.camera || !this.studio.controls) return;
        this.currentStateName = stateName;

        let target = customPreset;
        if (!target) {
            target = this.getState(stateName);
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = prefersReducedMotion ? 0.1 : (durationOverride !== null ? durationOverride : 1.4);

        if (stateName === 'STUDIO') {
            this.studio.controls.enabled = false;
        } else {
            this.studio.controls.enabled = true;
        }

        if (window.gsap) {
            window.gsap.killTweensOf(this.studio.camera.position);
            window.gsap.killTweensOf(this.studio.controls.target);
            window.gsap.killTweensOf(this.studio.camera);

            window.gsap.to(this.studio.camera.position, {
                x: target.x,
                y: target.y,
                z: target.z,
                duration: duration,
                ease: "power2.inOut"
            });
            window.gsap.to(this.studio.controls.target, {
                x: target.targetX,
                y: target.targetY,
                z: target.targetZ,
                duration: duration,
                ease: "power2.inOut"
            });
            if (target.fov) {
                window.gsap.to(this.studio.camera, {
                    fov: target.fov,
                    duration: duration,
                    ease: "power2.inOut",
                    onUpdate: () => {
                        this.studio.camera.updateProjectionMatrix();
                    }
                });
            }
        } else {
            this.studio.camera.position.set(target.x, target.y, target.z);
            this.studio.controls.target.set(target.targetX, target.targetY, target.targetZ);
            if (target.fov) {
                this.studio.camera.fov = target.fov;
                this.studio.camera.updateProjectionMatrix();
            }
        }
    }
}

class InteractionManager {
    constructor(sceneInstance) {
        this.studio = sceneInstance;
        this.cursor = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.pointer = {
            isDown: false,
            pointerId: null,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            hasMoved: false,
            pointerType: 'mouse',
            mode: 'IDLE'
        };
        this.lastRaycastTime = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();

        this.setupEvents();
    }

    setupEvents() {
        const isInteractiveElement = (target) => {
            if (!target) return false;
            return target.closest('a, button, input, textarea, select, label, form, .navbar, .os-window, .os-taskbar, .os-desktop-shortcut, .btn-primary, .btn-ghost, .preview-thumb, .switcher-btn, .mini-music-pill, .expanded-music-card, .audio-player-widget, .audio-widget, .project-card, .interactive-terminal, .project-actions, .nav-btn, .filter-chip');
        };

        const onPointerDown = (e) => {
            if (isInteractiveElement(e.target)) return;
            this.pointer.isDown = true;
            this.pointer.pointerId = e.pointerId;
            this.pointer.startX = e.clientX;
            this.pointer.startY = e.clientY;
            this.pointer.lastX = e.clientX;
            this.pointer.lastY = e.clientY;
            this.pointer.hasMoved = false;
            this.pointer.pointerType = e.pointerType || (this.studio.deviceProfile.isTouch ? 'touch' : 'mouse');
            this.pointer.mode = this.pointer.pointerType === 'touch' ? 'DECIDING' : '3D_DRAG';

            if (this.pointer.pointerType !== 'touch') {
                document.body.style.cursor = 'grabbing';
            }
        };

        const onPointerMove = (e) => {
            this.cursor.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.cursor.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;

            this.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

            if (!this.studio.deviceProfile.isTouch) {
                const maxCursorRotY = 0.22;
                const maxCursorRotX = 0.14;
                this.studio.deskTransform.cursorRotation.y = this.cursor.targetX * maxCursorRotY;
                this.studio.deskTransform.cursorRotation.x = -this.cursor.targetY * maxCursorRotX;
                this.studio.deskTransform.cursorPosition.x = this.cursor.targetX * 0.08;
                this.studio.deskTransform.cursorPosition.y = this.cursor.targetY * 0.05;
            }

            // Raycast hover check on sphere collider (desktop only)
            if (!this.pointer.isDown && this.studio.hotspots.length > 0 && this.studio.camera && !this.studio.deviceProfile.isTouch) {
                const now = performance.now();
                if (now - this.lastRaycastTime >= 45) {
                    this.lastRaycastTime = now;
                    this.raycaster.setFromCamera(this.mouseVector, this.studio.camera);
                    const intersects = this.raycaster.intersectObjects(this.studio.hotspots);

                    if (intersects.length > 0) {
                        const hit = intersects[0].object;
                        if (this.studio.hoveredHotspot !== hit) {
                            this.studio.hoveredHotspot = hit;
                            document.body.style.cursor = 'pointer';
                            this.studio.setSphereHoverState(true);
                        }
                    } else if (this.studio.hoveredHotspot) {
                        this.studio.hoveredHotspot = null;
                        this.studio.setSphereHoverState(false);
                        document.body.style.cursor = 'default';
                    }
                }
            }

            if (!this.pointer.isDown) return;

            const deltaX = e.clientX - this.pointer.startX;
            const deltaY = e.clientY - this.pointer.startY;

            if (this.pointer.mode === 'DECIDING') {
                const dist = Math.hypot(deltaX, deltaY);
                if (dist > 10) {
                    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
                        this.pointer.mode = '3D_DRAG';
                        this.triggerHaptic('desk');
                        const hintPill = document.getElementById('drag-hint-pill');
                        if (hintPill) hintPill.classList.add('fade-out');
                        localStorage.setItem('portfolio_3d_hint_seen', 'true');
                    } else {
                        this.pointer.mode = 'PAGE_SCROLL';
                    }
                }
            }

            if (this.pointer.mode === '3D_DRAG') {
                const dx = e.clientX - this.pointer.lastX;
                const dy = e.clientY - this.pointer.lastY;

                if (Math.hypot(dx, dy) > 2) {
                    this.pointer.hasMoved = true;
                }

                this.studio.dragVelocity.x = dx;
                this.studio.dragVelocity.y = dy;

                const interactionScale = this.studio.tier === 'LOW' ? 0.6 : 1.0;
                const sensX = (this.pointer.pointerType === 'touch' ? 0.0075 : 0.0055) * interactionScale;
                const sensY = (this.pointer.pointerType === 'touch' ? 0.0045 : 0.0035) * interactionScale;

                this.studio.deskTransform.dragRotation.y = Math.max(
                    -1.2,
                    Math.min(1.2, this.studio.deskTransform.dragRotation.y + dx * sensX)
                );
                this.studio.deskTransform.dragRotation.x = Math.max(
                    -0.45,
                    Math.min(0.45, this.studio.deskTransform.dragRotation.x + dy * sensY)
                );

                const resetBtn = document.getElementById('reset-desk-view-btn');
                if (resetBtn && (Math.abs(this.studio.deskTransform.dragRotation.y) > 0.04 || Math.abs(this.studio.deskTransform.dragRotation.x) > 0.04)) {
                    resetBtn.classList.add('visible');
                    resetBtn.style.opacity = '1';
                }
            }

            this.pointer.lastX = e.clientX;
            this.pointer.lastY = e.clientY;
        };

        const onPointerUp = (e) => {
            if (!this.pointer.isDown) return;
            if (!this.pointer.hasMoved && !isInteractiveElement(e.target)) {
                this.handleRaycastClick(e);
            }
            this.pointer.isDown = false;
            this.pointer.mode = 'IDLE';

            if (this.pointer.pointerType !== 'touch') {
                document.body.style.cursor = 'default';
            }
        };

        const onMouseLeave = () => {
            this.cursor.targetX = 0;
            this.cursor.targetY = 0;
            this.studio.deskTransform.cursorRotation.y = 0;
            this.studio.deskTransform.cursorRotation.x = 0;
            this.studio.deskTransform.cursorPosition.x = 0;
            this.studio.deskTransform.cursorPosition.y = 0;
        };

        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerUp, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }

    handleRaycastClick(e) {
        // Raycast click deliberately does NOT trigger Studio OS
        // Studio OS is strictly launched via dedicated intentional button triggers only
    }

    triggerHaptic(type = 'button') {
        if (window.triggerHaptic) {
            window.triggerHaptic(type);
        }
    }

    update(elapsedTime) {
        if (!this.studio.deviceProfile.isTouch) {
            this.cursor.x += (this.cursor.targetX - this.cursor.x) * 0.05;
            this.cursor.y += (this.cursor.targetY - this.cursor.y) * 0.05;
        }
    }
}

class StudioScene {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null; // Points to the Holographic Sphere Group for uniform transforms
        this.sphereGroup = null;
        this.spherePoints = null;
        this.orbitalRings = [];
        this.satellites = [];
        this.particles = null; // Ambient floating dust particles
        this.ambientLight = null;
        this.keyLight = null;
        this.rimLight = null;
        this.glowTexture = null;
        this.clock = new THREE.Clock();
        this.currentSection = 'home';
        this.coreIlluminationMode = true;
        this.isContextLost = false;
        this.animFrameId = null;
        this.isInitialized = false;
        this.isVisible = true;
        this.isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;
        this.sceneObserver = null;
        this.isSphereHovered = false;

        this.interactionManager = null;
        this.cameraDirector = null;
        this.dragVelocity = { x: 0, y: 0 };

        // Capability-Based Device Profiling
        this.deviceProfile = this.detectDeviceProfile();
        this.tier = this.determinePerformanceTier(this.deviceProfile);

        // Runtime FPS & Frame Time Watcher
        this.fpsTracker = {
            frames: 0,
            lastSampleTime: performance.now(),
            currentFps: 60,
            frameTimes: [],
            poorPerformanceCounter: 0,
            downgradeCooldown: 0
        };

        // Unified Multi-Input Transform Architecture
        // Target: base + scroll + cursor + drag
        const isMobile = this.deviceProfile.isMobile;
        this.deskTransform = {
            baseRotation: { x: 0.15, y: 0, z: 0 },
            basePosition: { x: isMobile ? 0 : 1.15, y: isMobile ? -0.2 : 0.05, z: 0 },

            scrollRotation: { x: 0, y: 0, z: 0 },
            scrollPosition: { x: 0, y: 0, z: 0 },

            cursorRotation: { x: 0, y: 0 },
            cursorPosition: { x: 0, y: 0 },

            dragRotation: { x: 0, y: 0 },

            currentRotation: { x: 0.15, y: 0, z: 0 },
            currentPosition: { x: isMobile ? 0 : 1.15, y: isMobile ? -0.2 : 0.05, z: 0 },

            limits: {
                minRotY: -1.4,
                maxRotY: 1.4,
                minRotX: -0.5,
                maxRotX: 0.5,
                minPosY: -0.6,
                maxPosY: 0.6,
                minPosX: -0.5,
                maxPosX: 2.2
            }
        };

        this.scrollState = {
            progress: 0,
            scrollY: 0,
            velocity: 0
        };

        // Raycasting & Hotspot Targets
        this.hotspots = [];
        this.hoveredHotspot = null;

        // Dedicated Viewport-Aware Camera Configurations
        this.cameraPositions = {
            desktop: {
                home: { x: 0, y: 0.15, z: 6.2, targetX: 0, targetY: 0.15, targetZ: 0 },
                about: { x: -2.2, y: 0.4, z: 6.0, targetX: 0.4, targetY: 0.2, targetZ: 0 },
                projects: { x: 0, y: 0.3, z: 5.8, targetX: 0, targetY: 0.2, targetZ: 0 },
                skills: { x: 2.0, y: 0.8, z: 5.6, targetX: -0.2, targetY: 0.2, targetZ: -0.2 },
                experience: { x: -1.6, y: 0.3, z: 6.0, targetX: 0.2, targetY: 0.15, targetZ: 0 },
                contact: { x: 0, y: 0.2, z: 5.6, targetX: 0, targetY: 0.2, targetZ: 0.2 }
            },
            mobile: {
                home: { x: 0, y: 0.2, z: 7.0, targetX: 0, targetY: 0.2, targetZ: 0 },
                about: { x: -0.8, y: 0.2, z: 5.8, targetX: 0, targetY: 0.1, targetZ: 0 },
                projects: { x: 0, y: 0.2, z: 5.5, targetX: 0, targetY: 0.1, targetZ: 0 },
                skills: { x: 1.0, y: 0.5, z: 5.6, targetX: 0, targetY: 0.2, targetZ: 0 },
                experience: { x: -0.6, y: 0.1, z: 5.6, targetX: 0, targetY: 0.1, targetZ: 0 },
                contact: { x: 0, y: 0.1, z: 5.5, targetX: 0, targetY: 0.1, targetZ: 0.1 }
            }
        };

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => this.startProgressiveInit(), { timeout: 250 });
            } else {
                setTimeout(() => this.startProgressiveInit(), 40);
            }
        }
    }

    detectDeviceProfile() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const userAgent = navigator.userAgent || '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const concurrency = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmallScreen = width < 768 || height < 500;

        let hasWebGL = false;
        let hasWebGL2 = false;
        let rendererString = '';
        let maxTextureSize = 2048;

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                hasWebGL = true;
                hasWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);
                maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
                const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (dbgRenderInfo) {
                    rendererString = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || '';
                }
            }
        } catch (e) {
            hasWebGL = false;
        }

        return {
            isTouch,
            isMobile: isMobileUA || isSmallScreen,
            concurrency,
            memory,
            dpr,
            width,
            height,
            hasWebGL,
            hasWebGL2,
            rendererString,
            maxTextureSize
        };
    }

    determinePerformanceTier(p) {
        const userOverride = localStorage.getItem('portfolio_quality');
        if (userOverride && ['HIGH', 'MEDIUM', 'LOW', 'FALLBACK'].includes(userOverride)) {
            return userOverride;
        }

        if (!p.hasWebGL) return 'FALLBACK';

        // Low-End Mobile (Snapdragon 680, low memory, budget mobile GPUs)
        const isLowGPU = /Adreno\s*(5|610|612|616)|Mali-G(51|52|57|71)|PowerVR/i.test(p.rendererString);
        if (p.isMobile && (p.memory <= 4 || p.concurrency <= 4 || isLowGPU || p.maxTextureSize <= 4096)) {
            return 'LOW';
        }

        if (p.isMobile) return 'MEDIUM';
        if (p.concurrency <= 4 || p.memory <= 4) return 'MEDIUM';
        return 'HIGH';
    }

    // Procedural Glowing Circular Particle Sprite (Zero External Assets)
    createGlowPointTexture() {
        if (this.glowTexture) return this.glowTexture;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.18, 'rgba(0, 243, 255, 0.95)');
        gradient.addColorStop(0.45, 'rgba(0, 180, 255, 0.45)');
        gradient.addColorStop(0.75, 'rgba(138, 43, 226, 0.18)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        this.glowTexture = new THREE.CanvasTexture(canvas);
        return this.glowTexture;
    }

    startProgressiveInit() {
        if (this.isInitialized || !this.container) return;
        this.isInitialized = true;

        if (this.tier === 'FALLBACK') {
            this.activate2DFallback();
            return;
        }

        try {
            // Stage 1: Renderer & Camera Initialization
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 60);

            let targetDPR = 1.0;
            if (this.tier === 'HIGH') {
                targetDPR = Math.min(window.devicePixelRatio, 1.5);
            } else if (this.tier === 'MEDIUM') {
                targetDPR = 1.0;
            } else {
                targetDPR = Math.min(window.devicePixelRatio, 0.85); // Optimized for Snapdragon 680
            }

            this.renderer = new THREE.WebGLRenderer({
                antialias: this.tier !== 'LOW',
                alpha: true,
                powerPreference: this.tier === 'LOW' ? "default" : "high-performance",
                precision: this.tier === 'LOW' ? "mediump" : "highp",
                depth: true,
                stencil: false,
                preserveDrawingBuffer: false
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(targetDPR);
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.15;
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            this.setupContextLossHandling();
            this.updateCameraForViewport();
            this.setupControls();

            // Instantiate Centralized Systems
            this.cameraDirector = new CameraDirector(this);
            this.interactionManager = new InteractionManager(this);

            // Stage 2: Lighting & Environment
            this.setupLighting();

            // Stage 3: Lightweight Procedural Holographic Particle Sphere (NO GLB)
            this.setupHolographicSphere();

            // Stage 4: Ambient Floating Dust Particles
            if (this.tier !== 'LOW') {
                this.setupDustParticles();
            }

            // Stage 5: Pointer & Visibility Observers
            this.setupPointerInteractions();
            this.setupVisibilityObserver();

            // Update progress bar & dismiss loading screen quickly
            const progressBar = document.getElementById('loading-bar-fill');
            if (progressBar) progressBar.style.width = '100%';
            this.dismissLoadingScreen();

            // Event Listeners
            window.addEventListener('resize', this.onWindowResize.bind(this), { passive: true });

            this.animate();
        } catch (err) {
            console.error('WebGL Studio Scene Init Exception:', err);
            this.activate2DFallback();
        }
    }

    setupContextLossHandling() {
        if (!this.renderer || !this.renderer.domElement) return;
        const canvas = this.renderer.domElement;

        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost! Halting render pipeline.');
            this.isContextLost = true;
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }
        }, false);

        canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored! Rebuilding 3D core...');
            this.isContextLost = false;
            this.startProgressiveInit();
        }, false);
    }

    setupControls() {
        if (THREE.OrbitControls && this.renderer && this.camera) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.06;
            this.controls.enableZoom = !this.deviceProfile.isMobile;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.15;
            this.controls.minPolarAngle = Math.PI / 5;
            this.controls.minAzimuthAngle = -Math.PI / 2.5;
            this.controls.maxAzimuthAngle = Math.PI / 2.5;

            if (this.deviceProfile.isMobile) {
                this.controls.enableRotate = false; // Never hijack vertical page scroll on mobile
            }

            const preset = this.getCameraPreset(this.currentSection);
            this.controls.target.set(preset.targetX, preset.targetY, preset.targetZ);

            this.controls.addEventListener('start', () => {
                if (window.triggerHaptic) window.triggerHaptic('desk');
                const resetBtn = document.getElementById('reset-desk-view-btn');
                if (resetBtn) resetBtn.style.opacity = '1';
            });
        }
    }

    getCameraPreset(sectionKey) {
        const isMobile = window.innerWidth < 768;
        const dict = isMobile ? this.cameraPositions.mobile : this.cameraPositions.desktop;
        return dict[sectionKey] || dict.home;
    }

    updateCameraForViewport() {
        if (!this.camera) return;
        const aspect = window.innerWidth / window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const p = this.getCameraPreset(this.currentSection);

        // Update responsive base position of sphere
        this.deskTransform.basePosition.x = isMobile ? 0 : 1.15;
        this.deskTransform.basePosition.y = isMobile ? -0.2 : 0.05;

        if (isMobile) {
            if (aspect < 0.52) {
                this.camera.position.set(p.x, p.y + 0.15, p.z + 0.5);
                this.camera.fov = 48;
            } else if (aspect < 0.65) {
                this.camera.position.set(p.x, p.y, p.z);
                this.camera.fov = 46;
            } else {
                this.camera.position.set(p.x, p.y - 0.1, p.z - 0.3);
                this.camera.fov = 44;
            }
        } else {
            this.camera.position.set(p.x, p.y, p.z);
            this.camera.fov = 45;
        }

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        if (this.controls) {
            this.controls.target.set(p.targetX, p.targetY, p.targetZ);
        }
    }

    setupLighting() {
        // Deep futuristic illumination
        this.ambientLight = new THREE.AmbientLight(0x060c1d, 1.8);
        this.scene.add(this.ambientLight);

        // Electric cyan key directional light
        this.keyLight = new THREE.DirectionalLight(0x00f3ff, 1.4);
        this.keyLight.position.set(-4, 6, 6);
        this.scene.add(this.keyLight);

        // Violet / Purple accent rim light
        this.rimLight = new THREE.PointLight(0x8a2be2, 3.5, 12, 1.2);
        this.rimLight.position.set(4, 3, 3);
        this.scene.add(this.rimLight);
    }

    // =========================================================================
    // Procedural Holographic Particle Sphere & Orbital Rings Subsystem
    // =========================================================================
    setupHolographicSphere() {
        this.sphereGroup = new THREE.Group();
        this.model = this.sphereGroup; // Retain uniform transform mapping

        // Initial responsive position
        const isMobile = this.deviceProfile.isMobile;
        this.sphereGroup.position.set(
            this.deskTransform.basePosition.x,
            this.deskTransform.basePosition.y,
            this.deskTransform.basePosition.z
        );

        const pointTexture = this.createGlowPointTexture();

        // 1. Determine particle count based on performance tier
        let totalCount = 11000;
        if (this.tier === 'MEDIUM') totalCount = 5500;
        if (this.tier === 'LOW') totalCount = 2200;

        const sphereRadius = 2.0;

        // Reserve portion of particles for coordinate lines (parallels & meridians), rest for surface/network clusters
        const gridCount = Math.floor(totalCount * 0.35);
        const surfaceCount = totalCount - gridCount;

        const positions = new Float32Array(totalCount * 3);
        const colors = new Float32Array(totalCount * 3);
        const sizes = new Float32Array(totalCount);

        let ptr = 0;

        // A. Latitude Parallels & Longitude Meridians (Digital Globe Coordinate Matrix)
        const latitudes = [-70, -55, -40, -25, -10, 0, 10, 25, 40, 55, 70];
        const pointsPerLat = Math.floor((gridCount * 0.55) / latitudes.length);

        latitudes.forEach(latDeg => {
            const phi = (90 - latDeg) * (Math.PI / 180);
            const rSinPhi = sphereRadius * Math.sin(phi);
            const rCosPhi = sphereRadius * Math.cos(phi);

            for (let i = 0; i < pointsPerLat && ptr < totalCount; i++) {
                const theta = (i / pointsPerLat) * Math.PI * 2;
                const idx = ptr * 3;

                positions[idx] = rSinPhi * Math.cos(theta);
                positions[idx + 1] = rCosPhi;
                positions[idx + 2] = rSinPhi * Math.sin(theta);

                // Coordinate lines: subtle cyan / bright blue
                colors[idx] = 0.0;
                colors[idx + 1] = 0.85;
                colors[idx + 2] = 1.0;

                sizes[ptr] = 0.045;
                ptr++;
            }
        });

        // Longitude Meridians
        const longitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
        const pointsPerLong = Math.floor((gridCount * 0.45) / longitudes.length);

        longitudes.forEach(lonDeg => {
            const theta = lonDeg * (Math.PI / 180);
            for (let i = 0; i < pointsPerLong && ptr < totalCount; i++) {
                const phi = (i / pointsPerLong) * Math.PI;
                const idx = ptr * 3;

                positions[idx] = sphereRadius * Math.sin(phi) * Math.cos(theta);
                positions[idx + 1] = sphereRadius * Math.cos(phi);
                positions[idx + 2] = sphereRadius * Math.sin(phi) * Math.sin(theta);

                colors[idx] = 0.15;
                colors[idx + 1] = 0.75;
                colors[idx + 2] = 1.0;

                sizes[ptr] = 0.042;
                ptr++;
            }
        });

        // B. Surface & Continental / Network Density Fibonacci Distribution
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const remaining = totalCount - ptr;

        for (let i = 0; i < remaining && ptr < totalCount; i++) {
            const idx = ptr * 3;
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / remaining);

            // Procedural network clustering function
            const nx = Math.sin(phi) * Math.cos(theta);
            const ny = Math.cos(phi);
            const nz = Math.sin(phi) * Math.sin(theta);

            // Perlin-like pseudo frequency to simulate data continents & network clusters
            const cluster = Math.sin(nx * 3.5 + ny * 2.0) * Math.cos(nz * 3.0 + nx * 1.5);
            const isClusterNode = cluster > 0.2;
            const isHotspot = cluster > 0.55;

            // Slight radius variation for depth & holographic shimmer
            const rOffset = (Math.random() - 0.5) * 0.06 + (isHotspot ? 0.03 : 0);
            const r = sphereRadius + rOffset;

            positions[idx] = r * nx;
            positions[idx + 1] = r * ny;
            positions[idx + 2] = r * nz;

            if (isHotspot) {
                // Bright electric cyan / white nodes
                colors[idx] = 0.85;
                colors[idx + 1] = 1.0;
                colors[idx + 2] = 1.0;
                sizes[ptr] = 0.075;
            } else if (isClusterNode) {
                // Vibrant electric cyan
                colors[idx] = 0.0;
                colors[idx + 1] = 0.95;
                colors[idx + 2] = 1.0;
                sizes[ptr] = 0.06;
            } else if (Math.random() < 0.28) {
                // Violet / purple accents matching portfolio identity
                colors[idx] = 0.65;
                colors[idx + 1] = 0.35;
                colors[idx + 2] = 1.0;
                sizes[ptr] = 0.052;
            } else {
                // Deep cyan background ocean points
                colors[idx] = 0.05;
                colors[idx + 1] = 0.55;
                colors[idx + 2] = 0.95;
                sizes[ptr] = 0.045;
            }

            ptr++;
        }

        const sphereGeometry = new THREE.BufferGeometry();
        sphereGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sphereGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        sphereGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const sphereMaterial = new THREE.PointsMaterial({
            size: this.tier === 'LOW' ? 0.065 : 0.08,
            map: pointTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.spherePoints = new THREE.Points(sphereGeometry, sphereMaterial);
        this.sphereGroup.add(this.spherePoints);

        // 2. Atmosphere Outer Shimmer Aura Points
        if (this.tier !== 'LOW') {
            const auraCount = this.tier === 'HIGH' ? 850 : 400;
            const auraGeo = new THREE.BufferGeometry();
            const auraPos = new Float32Array(auraCount * 3);
            const auraCol = new Float32Array(auraCount * 3);

            for (let i = 0; i < auraCount; i++) {
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = sphereRadius + 0.12 + Math.random() * 0.18;

                const i3 = i * 3;
                auraPos[i3] = r * Math.sin(phi) * Math.cos(theta);
                auraPos[i3 + 1] = r * Math.cos(phi);
                auraPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

                // Violet / cyan soft atmosphere
                if (Math.random() < 0.6) {
                    auraCol[i3] = 0.0; auraCol[i3 + 1] = 0.7; auraCol[i3 + 2] = 1.0;
                } else {
                    auraCol[i3] = 0.55; auraCol[i3 + 1] = 0.25; auraCol[i3 + 2] = 0.95;
                }
            }

            auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
            auraGeo.setAttribute('color', new THREE.BufferAttribute(auraCol, 3));

            const auraMat = new THREE.PointsMaterial({
                size: 0.05,
                map: pointTexture,
                vertexColors: true,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const auraPoints = new THREE.Points(auraGeo, auraMat);
            this.sphereGroup.add(auraPoints);
        }

        // Inner Glowing Volume Points for Spherical Depth & Luminescence
        const innerCount = this.tier === 'LOW' ? 250 : 650;
        const innerGeo = new THREE.BufferGeometry();
        const innerPos = new Float32Array(innerCount * 3);
        const innerCol = new Float32Array(innerCount * 3);
        for (let i = 0; i < innerCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = 1.35 + Math.random() * 0.45;

            const i3 = i * 3;
            innerPos[i3] = r * Math.sin(phi) * Math.cos(theta);
            innerPos[i3 + 1] = r * Math.cos(phi);
            innerPos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            // Deep luminous violet / cobalt blue
            innerCol[i3] = 0.28; innerCol[i3 + 1] = 0.18; innerCol[i3 + 2] = 0.95;
        }
        innerGeo.setAttribute('position', new THREE.BufferAttribute(innerPos, 3));
        innerGeo.setAttribute('color', new THREE.BufferAttribute(innerCol, 3));
        const innerMat = new THREE.PointsMaterial({
            size: 0.065,
            map: pointTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const innerPoints = new THREE.Points(innerGeo, innerMat);
        this.sphereGroup.add(innerPoints);

        // 3. Thin Orbital Rings & Orbiting Satellite Nodes
        const ringConfigs = [
            { radius: 2.55, rot: [0.45, 0.65, 0.0], speed: 0.14, color: 0x00f3ff, opacity: 0.65, satCount: 3, satSpeed: 0.8 },
            { radius: 2.80, rot: [-0.60, 0.35, 0.4], speed: -0.11, color: 0x9d4edd, opacity: 0.55, satCount: 2, satSpeed: 0.65 },
            { radius: 3.05, rot: [0.85, -0.45, 0.8], speed: 0.09, color: 0x00d2ff, opacity: 0.58, satCount: 3, satSpeed: 0.75 },
            { radius: 3.30, rot: [-0.35, 1.15, -0.5], speed: -0.13, color: 0x8a2be2, opacity: 0.45, satCount: 2, satSpeed: 0.55 }
        ];

        // On LOW tier, use only 2 rings for optimal GPU performance
        const activeConfigs = this.tier === 'LOW' ? ringConfigs.slice(0, 2) : ringConfigs;

        this.orbitalRings = [];
        this.satellites = [];

        activeConfigs.forEach((cfg, ringIdx) => {
            const ringGroup = new THREE.Group();
            ringGroup.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

            // Create thin smooth circular path
            const segments = this.tier === 'LOW' ? 48 : 80;
            const ringGeo = new THREE.BufferGeometry();
            const ringPoints = new Float32Array((segments + 1) * 3);

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                ringPoints[i * 3] = cfg.radius * Math.cos(angle);
                ringPoints[i * 3 + 1] = cfg.radius * Math.sin(angle);
                ringPoints[i * 3 + 2] = 0;
            }

            ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPoints, 3));

            const ringMat = new THREE.LineBasicMaterial({
                color: cfg.color,
                transparent: true,
                opacity: cfg.opacity,
                blending: THREE.AdditiveBlending,
                linewidth: 1
            });

            const ringLine = new THREE.Line(ringGeo, ringMat);
            ringGroup.add(ringLine);

            // Orbiting Satellite Nodes along the ring
            const satCount = cfg.satCount;
            const satGeo = new THREE.BufferGeometry();
            const satPos = new Float32Array(satCount * 3);
            const satCol = new Float32Array(satCount * 3);

            for (let s = 0; s < satCount; s++) {
                // Brighter white-cyan core for satellites
                satCol[s * 3] = 0.85;
                satCol[s * 3 + 1] = 1.0;
                satCol[s * 3 + 2] = 1.0;
            }

            satGeo.setAttribute('position', new THREE.BufferAttribute(satPos, 3));
            satGeo.setAttribute('color', new THREE.BufferAttribute(satCol, 3));

            const satMat = new THREE.PointsMaterial({
                size: 0.18,
                map: pointTexture,
                vertexColors: true,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const satPoints = new THREE.Points(satGeo, satMat);
            ringGroup.add(satPoints);

            this.satellites.push({
                points: satPoints,
                radius: cfg.radius,
                count: satCount,
                speed: cfg.satSpeed,
                phaseOffset: ringIdx * 1.5
            });

            this.orbitalRings.push({
                group: ringGroup,
                speed: cfg.speed
            });

            this.sphereGroup.add(ringGroup);
        });

        // 4. Interactive Collider (Only for subtle hover, never triggers Studio OS)
        const colliderGeo = new THREE.SphereGeometry(2.15, 12, 12);
        const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
        const collider = new THREE.Mesh(colliderGeo, colliderMat);
        collider.userData = { id: 'holographic-core', label: 'Holographic Core' };
        this.sphereGroup.add(collider);
        this.hotspots = []; // Hotspot array cleared: modal cannot be triggered by canvas clicks

        this.scene.add(this.sphereGroup);
    }

    setupDustParticles() {
        const particleCount = this.tier === 'MEDIUM' ? 35 : 60;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 14;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00f3ff,
            size: 0.045,
            map: this.createGlowPointTexture(),
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setSphereHoverState(isHovered) {
        this.isSphereHovered = isHovered;
        if (this.spherePoints && this.spherePoints.material) {
            this.spherePoints.material.size = isHovered ? (this.tier === 'LOW' ? 0.08 : 0.095) : (this.tier === 'LOW' ? 0.065 : 0.08);
            this.spherePoints.material.opacity = isHovered ? 1.0 : 0.92;
        }
    }

    setupPointerInteractions() {
        const resetBtn = document.getElementById('reset-desk-view-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resetDeskView();
            });
        }
    }

    setupVisibilityObserver() {
        if (this.sceneObserver) {
            this.sceneObserver.disconnect();
            this.sceneObserver = null;
        }

        const targetElement = this.container || document.body;
        if ('IntersectionObserver' in window && targetElement) {
            this.sceneObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const wasVisible = this.isVisible;
                    this.isVisible = entry.isIntersecting;

                    if (this.isVisible && !wasVisible && this.isTabVisible) {
                        if (!this.animFrameId && !this.isContextLost) {
                            this.clock.start();
                            this.animate();
                        }
                    }
                });
            }, {
                root: null,
                threshold: [0, 0.01]
            });
            this.sceneObserver.observe(targetElement);
        }

        document.addEventListener('visibilitychange', () => {
            const wasTabVisible = this.isTabVisible;
            this.isTabVisible = !document.hidden;

            if (this.isTabVisible && !wasTabVisible && this.isVisible) {
                if (!this.animFrameId && !this.isContextLost) {
                    this.clock.start();
                    this.animate();
                }
            }
        }, { passive: true });
    }

    handleRaycastClick(e) {
        if (this.interactionManager) {
            this.interactionManager.handleRaycastClick(e);
        }
    }

    // Public API preserved for VirtualOS.js and Main.js
    focusOnMonitor() {
        if (!this.previousCameraState && this.camera && this.controls) {
            this.previousCameraState = {
                pos: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
                target: { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z }
            };
        }
        if (this.cameraDirector) {
            this.cameraDirector.transitionTo('STUDIO', null, 1.0);
        }
    }

    exitMonitorFocus() {
        if (this.cameraDirector) {
            const stateName = this.currentSection.toUpperCase();
            const target = this.previousCameraState ? {
                x: this.previousCameraState.pos.x,
                y: this.previousCameraState.pos.y,
                z: this.previousCameraState.pos.z,
                targetX: this.previousCameraState.target.x,
                targetY: this.previousCameraState.target.y,
                targetZ: this.previousCameraState.target.z
            } : null;
            this.previousCameraState = null;
            this.cameraDirector.transitionTo(stateName, target, 1.0);
        }
    }

    resetDeskView() {
        if (window.triggerHaptic) window.triggerHaptic('reset');

        this.deskTransform.dragRotation.x = 0;
        this.deskTransform.dragRotation.y = 0;
        this.dragVelocity.x = 0;
        this.dragVelocity.y = 0;

        if (this.cameraDirector) {
            this.cameraDirector.transitionTo(this.currentSection.toUpperCase(), null, 0.85);
        }

        const resetBtn = document.getElementById('reset-desk-view-btn');
        if (resetBtn) {
            resetBtn.classList.remove('visible');
            resetBtn.style.opacity = '0';
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.updateCameraForViewport();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    transitionToSection(sectionKey) {
        this.currentSection = sectionKey;
        const stateName = sectionKey.toUpperCase();
        if (this.cameraDirector) {
            this.cameraDirector.transitionTo(stateName);
        }
    }

    focusOnProjectObject(project) {
        if (!project || !this.cameraDirector) return;
        this.cameraDirector.transitionTo('PROJECT_DETAIL', null, 1.0);
    }

    toggleDeskLamp() {
        this.coreIlluminationMode = !this.coreIlluminationMode;
        if (this.keyLight) {
            this.keyLight.intensity = this.coreIlluminationMode ? 1.4 : 0.4;
        }
        if (this.rimLight) {
            this.rimLight.intensity = this.coreIlluminationMode ? 3.5 : 1.2;
        }
        if (this.spherePoints && this.spherePoints.material) {
            this.spherePoints.material.opacity = this.coreIlluminationMode ? 0.92 : 0.65;
        }
        return this.coreIlluminationMode;
    }

    setQualityTier(newTier) {
        if (!['HIGH', 'MEDIUM', 'LOW', 'FALLBACK'].includes(newTier)) return;
        this.tier = newTier;
        localStorage.setItem('portfolio_quality', newTier);

        if (newTier === 'FALLBACK') {
            this.activate2DFallback();
        } else {
            document.body.classList.remove('fallback-2d-mode');
            const fallbackBanner = document.getElementById('fallback-2d-banner');
            if (fallbackBanner) fallbackBanner.style.display = 'none';
            if (this.container) this.container.style.display = 'block';

            // Rebuild holographic sphere with new tier particle counts
            if (this.sphereGroup && this.scene) {
                this.scene.remove(this.sphereGroup);
            }
            this.setupHolographicSphere();
        }
    }

    dismissLoadingScreen() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator && loadingIndicator.style.display !== 'none') {
            loadingIndicator.classList.add('fade-out');
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);
        }
    }

    activate2DFallback() {
        document.body.classList.add('fallback-2d-mode');
        const webglCont = document.getElementById('webgl-container');
        if (webglCont) webglCont.style.display = 'none';

        const fallbackBanner = document.getElementById('fallback-2d-banner');
        if (fallbackBanner) fallbackBanner.style.display = 'flex';

        this.dismissLoadingScreen();
    }

    onScroll(e) {
        let scrollY = 0;
        let totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) totalHeight = 1;

        if (typeof e === 'object' && e !== null && 'scroll' in e) {
            scrollY = e.scroll;
            this.scrollState.velocity = e.velocity || 0;
        } else {
            scrollY = window.scrollY || window.pageYOffset || 0;
        }

        this.scrollState.scrollY = scrollY;
        const globalProgress = Math.min(1, Math.max(0, scrollY / totalHeight));
        this.scrollState.progress = globalProgress;

        // Continuous cinematic scroll sequence across entire portfolio (0% to 100%)
        const isMobile = this.deviceProfile.isMobile;
        const maxScrollRotY = isMobile ? Math.PI * 1.5 : Math.PI * 2.0;
        const maxScrollRotX = isMobile ? 0.22 : 0.32;

        // Smooth continuous progressive rotation that scrubs with page scroll
        this.deskTransform.scrollRotation.y = globalProgress * maxScrollRotY;
        this.deskTransform.scrollRotation.x = Math.sin(globalProgress * Math.PI * 2.0) * maxScrollRotX;

        // Subtle undulating spatial depth & height across sections
        this.deskTransform.scrollPosition.y = Math.sin(globalProgress * Math.PI) * -0.3;
        this.deskTransform.scrollPosition.z = Math.sin(globalProgress * Math.PI * 2.0) * 0.2;
    }

    monitorRuntimePerformance(frameTime) {
        const now = performance.now();
        this.fpsTracker.frames++;
        this.fpsTracker.frameTimes.push(frameTime);

        if (now - this.fpsTracker.lastSampleTime >= 2000) {
            const avgFrameTime = this.fpsTracker.frameTimes.reduce((a, b) => a + b, 0) / this.fpsTracker.frameTimes.length;
            const approxFps = Math.round(1000 / avgFrameTime);
            this.fpsTracker.currentFps = approxFps;

            if (approxFps < 25 && this.fpsTracker.downgradeCooldown <= 0) {
                this.fpsTracker.poorPerformanceCounter++;
                if (this.fpsTracker.poorPerformanceCounter >= 2) {
                    if (this.tier === 'HIGH') {
                        console.warn(`Adaptive downgrade triggered: HIGH -> MEDIUM (${approxFps} FPS)`);
                        this.setQualityTier('MEDIUM');
                    } else if (this.tier === 'MEDIUM') {
                        console.warn(`Adaptive downgrade triggered: MEDIUM -> LOW (${approxFps} FPS)`);
                        this.setQualityTier('LOW');
                    }
                    this.fpsTracker.downgradeCooldown = 10;
                    this.fpsTracker.poorPerformanceCounter = 0;
                }
            } else {
                this.fpsTracker.poorPerformanceCounter = 0;
                if (this.fpsTracker.downgradeCooldown > 0) this.fpsTracker.downgradeCooldown--;
            }

            this.fpsTracker.frameTimes = [];
            this.fpsTracker.frames = 0;
            this.fpsTracker.lastSampleTime = now;
        }
    }

    animate() {
        if (this.isContextLost) return;

        if (!this.isVisible || !this.isTabVisible) {
            if (this.animFrameId) {
                cancelAnimationFrame(this.animFrameId);
                this.animFrameId = null;
            }
            return;
        }

        this.animFrameId = requestAnimationFrame(this.animate.bind(this));

        const startFrame = performance.now();
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const motionScale = prefersReducedMotion ? 0.15 : 1.0;

        if (this.interactionManager) {
            this.interactionManager.update(elapsedTime);
        }

        // Swipe drag inertia settle
        if (this.interactionManager && !this.interactionManager.pointer.isDown) {
            this.dragVelocity.x *= 0.92;
            this.dragVelocity.y *= 0.92;
            this.deskTransform.dragRotation.y += this.dragVelocity.x * 0.005;
            this.deskTransform.dragRotation.x += this.dragVelocity.y * 0.005;
        }

        // 1. Slow, majestic continuous planetary core spin
        this.deskTransform.baseRotation.y += delta * 0.08 * motionScale;

        // 2. Orbital Rings & Satellites Animation
        this.orbitalRings.forEach(r => {
            r.group.rotation.z += delta * r.speed * motionScale;
        });

        this.satellites.forEach(sat => {
            const posAttr = sat.points.geometry.attributes.position;
            const positions = posAttr.array;
            for (let i = 0; i < sat.count; i++) {
                const angle = (elapsedTime * sat.speed * motionScale) + sat.phaseOffset + (i / sat.count) * Math.PI * 2;
                positions[i * 3] = sat.radius * Math.cos(angle);
                positions[i * 3 + 1] = sat.radius * Math.sin(angle);
                positions[i * 3 + 2] = 0;
            }
            posAttr.needsUpdate = true;
        });

        // 3. Multi-Input Physical LERP (Smooth Inertia Damping)
        if (this.model) {
            const t = this.deskTransform;

            let targetRotX = t.baseRotation.x + t.scrollRotation.x + (this.deviceProfile.isTouch ? 0 : t.cursorRotation.x) + t.dragRotation.x;
            let targetRotY = t.baseRotation.y + t.scrollRotation.y + (this.deviceProfile.isTouch ? 0 : t.cursorRotation.y) + t.dragRotation.y;
            let targetRotZ = t.baseRotation.z + t.scrollRotation.z;

            let targetPosX = t.basePosition.x + (this.deviceProfile.isTouch ? 0 : t.cursorPosition.x);
            let targetPosY = t.basePosition.y + t.scrollPosition.y + (this.deviceProfile.isTouch ? 0 : t.cursorPosition.y);
            let targetPosZ = t.basePosition.z + t.scrollPosition.z;

            // Hover subtle elevation
            if (this.isSphereHovered) {
                targetPosZ += 0.15;
            }

            // Smooth physical LERP (0.075 easing for weighted natural inertia)
            t.currentRotation.x += (targetRotX - t.currentRotation.x) * 0.075;
            t.currentRotation.y += (targetRotY - t.currentRotation.y) * 0.075;
            t.currentRotation.z += (targetRotZ - t.currentRotation.z) * 0.075;

            t.currentPosition.x += (targetPosX - t.currentPosition.x) * 0.075;
            t.currentPosition.y += (targetPosY - t.currentPosition.y) * 0.075;
            t.currentPosition.z += (targetPosZ - t.currentPosition.z) * 0.075;

            this.model.rotation.x = t.currentRotation.x;
            this.model.rotation.y = t.currentRotation.y;
            this.model.rotation.z = t.currentRotation.z;

            this.model.position.x = t.currentPosition.x;
            this.model.position.y = t.currentPosition.y;
            this.model.position.z = t.currentPosition.z;
        }

        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }

        if (this.particles) {
            this.particles.rotation.y = elapsedTime * 0.012 * motionScale;
            this.particles.position.y = Math.sin(elapsedTime * 0.4) * 0.05;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        const endFrame = performance.now();
        this.monitorRuntimePerformance(endFrame - startFrame);
    }
}

window.studioScene = new StudioScene();
