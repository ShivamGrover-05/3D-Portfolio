// 3D Scene Engine with Interactive Hotspots & Adaptive Device-Tiering Choreography

class StudioScene {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.particles = null;
        this.lampLight = null;
        this.neonLight = null;
        this.screenCanvas = null;
        this.screenContext = null;
        this.screenTexture = null;
        this.screenMesh = null;
        this.clock = new THREE.Clock();
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.currentSection = 'home';
        this.deskLampOn = true;
        this.isContextLost = false;
        this.animFrameId = null;

        // Performance Tier System: HIGH | MEDIUM | LOW | FALLBACK
        this.tier = 'HIGH';
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

        // Raycasting & Hotspots
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.hotspots = [];
        this.hoveredHotspot = null;

        // Section viewpoint presets
        this.cameraPositions = {
            home: { x: 0, y: 3.2, z: 7.2, targetX: 0, targetY: 1.2, targetZ: 0 },
            about: { x: -3.5, y: 2.8, z: 5.5, targetX: -0.5, targetY: 1.4, targetZ: 0 },
            projects: { x: 0, y: 2.8, z: 5.2, targetX: 0, targetY: 1.4, targetZ: 0 },
            skills: { x: 2.5, y: 4.2, z: 4.8, targetX: 0, targetY: 1.6, targetZ: -0.5 },
            experience: { x: -2.8, y: 2.2, z: 6.0, targetX: -0.2, targetY: 1.1, targetZ: 0 },
            contact: { x: 0, y: 2.6, z: 5.2, targetX: 0, targetY: 1.2, targetZ: 0.5 }
        };

        this.init();
    }

    detectDeviceProfile() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const userAgent = navigator.userAgent || '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const concurrency = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4; // GB (Chrome/Edge API)
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmallScreen = width < 768 || height < 500;

        // WebGL Capability Probe
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
        // User manual override from settings
        const userOverride = localStorage.getItem('portfolio_quality');
        if (userOverride && ['HIGH', 'MEDIUM', 'LOW', 'FALLBACK'].includes(userOverride)) {
            return userOverride;
        }

        // WebGL Unsupported -> FALLBACK 2D
        if (!p.hasWebGL) {
            return 'FALLBACK';
        }

        // Low-End Mobile (Snapdragon 680, low memory, budget mobile GPUs like Adreno 610/Mali-G52, <=4 cores or <=4GB RAM)
        const isLowGPU = /Adreno\s*(5|610|612|616)|Mali-G(51|52|57|71)|PowerVR/i.test(p.rendererString);
        if (p.isMobile && (p.memory <= 4 || p.concurrency <= 4 || isLowGPU || p.maxTextureSize <= 4096)) {
            return 'LOW';
        }

        // Mid-Range Mobile / Tablets
        if (p.isMobile) {
            return 'MEDIUM';
        }

        // Desktop with moderate specs
        if (p.concurrency <= 4 || p.memory <= 4) {
            return 'MEDIUM';
        }

        // Capable Desktop / High-End
        return 'HIGH';
    }

    init() {
        if (!this.container) return;

        if (this.tier === 'FALLBACK') {
            this.activate2DFallback();
            return;
        }

        try {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

            // DPR Capping per Tier:
            // HIGH: 1.0 - 1.5 | MEDIUM: 1.0 | LOW: 0.75 - 1.0
            let targetDPR = 1.0;
            if (this.tier === 'HIGH') {
                targetDPR = Math.min(window.devicePixelRatio, 1.5);
            } else if (this.tier === 'MEDIUM') {
                targetDPR = 1.0;
            } else {
                targetDPR = Math.min(window.devicePixelRatio, 0.9);
            }

            this.renderer = new THREE.WebGLRenderer({
                antialias: this.tier !== 'LOW',
                alpha: true,
                powerPreference: this.tier === 'LOW' ? "default" : "high-performance",
                precision: this.tier === 'LOW' ? "mediump" : "highp",
                depth: true,
                stencil: false
            });

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(targetDPR);
            
            // Shadows per tier
            if (this.tier === 'HIGH') {
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            } else if (this.tier === 'MEDIUM') {
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFShadowMap;
            } else {
                this.renderer.shadowMap.enabled = false;
            }

            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.1;
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            // Setup WebGL Context Loss Listeners
            this.setupContextLossHandling();

            // Initial camera & aspect adaptation
            this.updateCameraForViewport();

            // OrbitControls setup with mobile-friendly gestures
            this.setupControls();

            // Scene setup
            this.setupLighting();
            this.setupRoomEnvironment();
            this.setupNeonSign();
            this.setupScreenCanvas();
            
            if (this.tier !== 'LOW') {
                this.setupDustParticles();
            }
            
            this.setupInteractiveHotspots();
            this.loadModel();

            // Event listeners
            window.addEventListener('resize', this.onWindowResize.bind(this), { passive: true });
            
            if (!this.deviceProfile.isTouch) {
                window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
            }
            
            this.renderer.domElement.addEventListener('click', this.onCanvasClick.bind(this));

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
            console.log('WebGL context restored! Rebuilding 3D workspace...');
            this.isContextLost = false;
            this.init();
        }, false);
    }

    setupControls() {
        if (THREE.OrbitControls && this.renderer) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.06;
            this.controls.enableZoom = this.deviceProfile.isMobile ? true : false;
            this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
            this.controls.minPolarAngle = Math.PI / 6;
            this.controls.minAzimuthAngle = -Math.PI / 3;
            this.controls.maxAzimuthAngle = Math.PI / 3;
            
            // Allow natural touch scroll to pass through unless user explicitly touches canvas
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };

            const p = this.cameraPositions.home;
            this.controls.target.set(p.targetX, p.targetY, p.targetZ);

            // Trigger subtle desk interaction haptic
            this.controls.addEventListener('start', () => {
                if (window.triggerHaptic) window.triggerHaptic('desk');
                const resetBtn = document.getElementById('reset-desk-view-btn');
                if (resetBtn) resetBtn.style.opacity = '1';
            });
        }
    }

    updateCameraForViewport() {
        const aspect = window.innerWidth / window.innerHeight;
        const p = this.cameraPositions.home;
        
        // Mobile tall screens (e.g. 19.5:9, 20:9, 21:9) need slightly more z-depth to center desk beautifully
        if (aspect < 0.6) {
            this.camera.position.set(p.x, p.y + 0.3, p.z + 1.8);
            this.camera.fov = 52;
        } else if (aspect < 1.0) {
            this.camera.position.set(p.x, p.y + 0.2, p.z + 0.8);
            this.camera.fov = 48;
        } else {
            this.camera.position.set(p.x, p.y, p.z);
            this.camera.fov = 45;
        }
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x1a1a2e, this.tier === 'LOW' ? 1.6 : 1.2);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0x7082a4, this.tier === 'LOW' ? 1.4 : 1.8);
        keyLight.position.set(-6, 10, 8);
        
        if (this.tier !== 'LOW') {
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.width = this.tier === 'HIGH' ? 1024 : 512;
            keyLight.shadow.mapSize.height = this.tier === 'HIGH' ? 1024 : 512;
            keyLight.shadow.bias = -0.0001;
        }
        this.scene.add(keyLight);

        this.lampLight = new THREE.SpotLight(0xffecd2, 4.5, 9, Math.PI / 3.5, 0.45, 1.2);
        this.lampLight.position.set(-1.1, 3.1, 0.2);
        this.lampLight.target.position.set(-0.2, 1.2, 0.4);
        if (this.tier === 'HIGH') {
            this.lampLight.castShadow = true;
        }
        this.scene.add(this.lampLight);
        this.scene.add(this.lampLight.target);

        this.neonLight = new THREE.PointLight(0x00f3ff, 3.2, 10, 1.4);
        this.neonLight.position.set(0.2, 4.2, -1.2);
        this.scene.add(this.neonLight);

        const rimLight = new THREE.PointLight(0x8a2be2, 3.2, 12, 1.5);
        rimLight.position.set(4, 2.5, 2);
        this.scene.add(rimLight);

        if (this.tier !== 'LOW') {
            const groundLight = new THREE.PointLight(0x1e153b, 1.5, 6);
            groundLight.position.set(0, 0.2, 2);
            this.scene.add(groundLight);
        }
    }

    setupRoomEnvironment() {
        const floorGeo = new THREE.PlaneGeometry(24, 24);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x0c0d16,
            roughness: 0.75,
            metalness: 0.15,
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        if (this.tier !== 'LOW') floor.receiveShadow = true;
        this.scene.add(floor);

        const wallGeo = new THREE.PlaneGeometry(24, 14);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x121422,
            roughness: 0.9,
            metalness: 0.05
        });
        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, 7, -2.8);
        if (this.tier !== 'LOW') backWall.receiveShadow = true;
        this.scene.add(backWall);

        const rugGeo = new THREE.CircleGeometry(2.6, 24);
        const rugMat = new THREE.MeshStandardMaterial({
            color: 0x191a2d,
            roughness: 0.98,
            metalness: 0.02
        });
        const rug = new THREE.Mesh(rugGeo, rugMat);
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.01, 0.8);
        if (this.tier !== 'LOW') rug.receiveShadow = true;
        this.scene.add(rug);
    }

    setupNeonSign() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 52px "Outfit", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = this.tier === 'LOW' ? 10 : 30;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('KEEP', canvas.width / 2, 60);
        ctx.fillText('BUILDING', canvas.width / 2, 130);

        const neonTexture = new THREE.CanvasTexture(canvas);
        const signGeo = new THREE.PlaneGeometry(3.2, 1.2);
        const signMat = new THREE.MeshBasicMaterial({
            map: neonTexture,
            transparent: true,
            opacity: 0.95
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(0.1, 4.4, -2.75);
        this.scene.add(signMesh);
    }

    setupScreenCanvas() {
        this.screenCanvas = document.createElement('canvas');
        this.screenCanvas.width = 384;
        this.screenCanvas.height = 240;
        this.screenContext = this.screenCanvas.getContext('2d');

        this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
        this.screenTexture.minFilter = THREE.LinearFilter;

        this.renderScreenContent(0);
    }

    renderScreenContent(time) {
        if (!this.screenContext) return;
        
        // Throttled IDE screen redraw (12fps on High, 6fps on Low)
        const throttleInterval = this.tier === 'LOW' ? 0.20 : 0.08;
        if (this.lastScreenUpdate && (time - this.lastScreenUpdate < throttleInterval)) return;
        this.lastScreenUpdate = time;

        const ctx = this.screenContext;
        const w = this.screenCanvas.width;
        const h = this.screenCanvas.height;

        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#161b22';
        ctx.fillRect(0, 0, w, 22);

        ctx.fillStyle = '#ff5f56';
        ctx.beginPath(); ctx.arc(12, 11, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffbd2e';
        ctx.beginPath(); ctx.arc(24, 11, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#27c93f';
        ctx.beginPath(); ctx.arc(36, 11, 4, 0, Math.PI * 2); ctx.fill();

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8b949e';
        ctx.fillText('ProjectShowcase.tsx — ShivamGrover.dev', 54, 15);

        const lines = [
            { text: 'import { SelectedWork, StudioOS } from "@shivam/core";', color: '#ff7b72' },
            { text: 'export const ActiveProject = () => {', color: '#d2a8ff' },
            { text: '  const builds = [ "Aevonix", "CollegesPathshala", "VacationVisits" ];', color: '#7ee787' },
            { text: '  return <Exhibition projects={builds} status="live" />;', color: '#79c0ff' },
            { text: '};', color: '#d2a8ff' }
        ];

        const lineCount = Math.floor((time * 1.5) % (lines.length + 3));

        lines.forEach((line, i) => {
            if (i <= lineCount) {
                ctx.fillStyle = '#484f58';
                ctx.fillText(`${i + 1}`, 12, 44 + i * 18);
                ctx.fillStyle = line.color;
                ctx.fillText(line.text, 32, 44 + i * 18);
            }
        });

        if (Math.sin(time * 5) > 0) {
            ctx.fillStyle = '#00f3ff';
            const cursorY = 44 + Math.min(lineCount, lines.length - 1) * 18;
            ctx.fillRect(32 + lines[Math.min(lineCount, lines.length - 1)].text.length * 6.2, cursorY - 9, 6, 11);
        }

        if (this.screenTexture) {
            this.screenTexture.needsUpdate = true;
        }
    }

    setupDustParticles() {
        const particleCount = this.tier === 'MEDIUM' ? 50 : 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
            scales[i] = Math.random() * 0.05 + 0.02;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const material = new THREE.PointsMaterial({
            color: 0x00f3ff,
            size: 0.05,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupInteractiveHotspots() {
        const hotspotConfigs = [
            { id: 'monitor', projectId: 'aevonix', pos: [0.12, 1.95, 0.05], label: 'AEVONIX (3D Controller)' },
            { id: 'laptop', projectId: 'collegespathshala', pos: [-0.9, 1.45, 0.35], label: 'CollegesPathshala' },
            { id: 'desk_display', projectId: 'vacationvisits', pos: [0.65, 1.38, 0.45], label: 'Vacation Visits' },
            { id: 'second_display', projectId: 'sagaholidays', pos: [1.15, 1.42, 0.38], label: 'Saga Holidays' },
            { id: 'terminal', projectId: 'aiautomation', pos: [-0.45, 0.95, 0.2], label: 'AI Automation Hub' },
            { id: 'geo_station', projectId: 'gisremotesensing', pos: [0.0, 1.45, -0.3], label: 'GIS Remote Sensing' }
        ];

        hotspotConfigs.forEach(cfg => {
            const group = new THREE.Group();
            group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

            // Subtle glowing ring marker
            const ringGeo = new THREE.RingGeometry(0.08, 0.12, 24);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00f3ff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.75
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            // Bounding sphere for reliable raycast click
            const sphereGeo = new THREE.SphereGeometry(0.25, 12, 12);
            const sphereMat = new THREE.MeshBasicMaterial({
                visible: false
            });
            const hitSphere = new THREE.Mesh(sphereGeo, sphereMat);
            hitSphere.userData = { projectId: cfg.projectId, hotspotId: cfg.id, label: cfg.label, group: group, ring: ring };
            group.add(hitSphere);

            this.scene.add(group);
            this.hotspots.push(hitSphere);
        });
    }

    loadModel() {
        if (!THREE.GLTFLoader) {
            console.warn('THREE.GLTFLoader unavailable, using procedural studio scene.');
            this.dismissLoadingScreen();
            return;
        }

        const loader = new THREE.GLTFLoader();
        const loadingIndicator = document.getElementById('loading-indicator');

        // Safe loader with error recovery
        loader.load(
            'Desk by dook - EtJlOllzbf.glb',
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(0, 0, 0);
                this.model.scale.set(1.4, 1.4, 1.4);

                this.model.traverse((child) => {
                    if (child.isMesh) {
                        if (this.tier !== 'LOW') {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }

                        if (child.material) {
                            child.material.roughness = Math.max(child.material.roughness || 0.4, 0.35);
                            child.material.metalness = Math.min(child.material.metalness || 0.2, 0.85);

                            const name = (child.name || '').toLowerCase();
                            if (name.includes('screen') || name.includes('monitor') || name.includes('display')) {
                                child.material = new THREE.MeshBasicMaterial({
                                    map: this.screenTexture
                                });
                                this.screenMesh = child;
                            }
                        }
                    }
                });

                this.scene.add(this.model);

                if (!this.screenMesh) {
                    const planeGeo = new THREE.PlaneGeometry(1.45, 0.9);
                    const planeMat = new THREE.MeshBasicMaterial({
                        map: this.screenTexture,
                        side: THREE.DoubleSide
                    });
                    const screenPlane = new THREE.Mesh(planeGeo, planeMat);
                    screenPlane.position.set(0.12, 1.95, 0.02);
                    this.scene.add(screenPlane);
                    this.screenMesh = screenPlane;
                }

                this.dismissLoadingScreen();
            },
            (xhr) => {
                const percent = Math.round((xhr.loaded / (xhr.total || 2080000)) * 100);
                const progressBar = document.getElementById('loading-bar-fill');
                if (progressBar) {
                    progressBar.style.width = `${Math.min(100, percent)}%`;
                }
            },
            (error) => {
                console.warn('GLB asset loading notice:', error);
                this.dismissLoadingScreen();
            }
        );

        // Fallback safety timer in case network stalls
        setTimeout(() => {
            this.dismissLoadingScreen();
        }, 2400);
    }

    dismissLoadingScreen() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator && loadingIndicator.style.display !== 'none') {
            loadingIndicator.classList.add('fade-out');
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 500);
        }
    }

    activate2DFallback() {
        console.log('Activating Premium 2D Fallback Mode');
        document.body.classList.add('fallback-2d-mode');
        const webglCont = document.getElementById('webgl-container');
        if (webglCont) webglCont.style.display = 'none';
        
        const fallbackBanner = document.getElementById('fallback-2d-banner');
        if (fallbackBanner) fallbackBanner.style.display = 'flex';

        this.dismissLoadingScreen();
    }

    onMouseMove(e) {
        this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;

        this.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Throttled raycasting for hover markers
        const now = performance.now();
        if (this.lastRaycast && (now - this.lastRaycast < 40)) return;
        this.lastRaycast = now;

        if (this.hotspots.length > 0 && this.camera) {
            this.raycaster.setFromCamera(this.mouseVector, this.camera);
            const intersects = this.raycaster.intersectObjects(this.hotspots);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                if (this.hoveredHotspot !== hit) {
                    this.hoveredHotspot = hit;
                    document.body.style.cursor = 'pointer';
                    if (hit.userData.ring) {
                        hit.userData.ring.material.color.setHex(0x00ff9d);
                        hit.userData.ring.scale.set(1.3, 1.3, 1.3);
                    }
                    if (window.triggerHaptic) window.triggerHaptic('hotspot');
                }
            } else {
                if (this.hoveredHotspot) {
                    if (this.hoveredHotspot.userData.ring) {
                        this.hoveredHotspot.userData.ring.material.color.setHex(0x00f3ff);
                        this.hoveredHotspot.userData.ring.scale.set(1, 1, 1);
                    }
                    this.hoveredHotspot = null;
                    document.body.style.cursor = 'default';
                }
            }
        }
    }

    onCanvasClick(e) {
        if (!this.camera) return;

        // On mobile tap, perform immediate raycast at tap coordinate
        if (this.deviceProfile.isTouch) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.mouseVector, this.camera);
            const intersects = this.raycaster.intersectObjects(this.hotspots);
            if (intersects.length > 0) {
                this.hoveredHotspot = intersects[0].object;
            }
        }

        if (this.hoveredHotspot) {
            const hotspotId = this.hoveredHotspot.userData.hotspotId;
            const pId = this.hoveredHotspot.userData.projectId;

            if (hotspotId === 'monitor') {
                if (window.virtualOS) {
                    window.virtualOS.enterComputer();
                    return;
                }
            }

            if (pId && window.selectProjectById) {
                window.selectProjectById(pId);
                const projSec = document.getElementById('projects');
                if (projSec && window.scrollY < projSec.offsetTop - 200) {
                    projSec.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }

    focusOnMonitor() {
        if (!this.camera || !this.controls) return;

        if (!this.previousCameraState) {
            this.previousCameraState = {
                pos: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
                target: { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z }
            };
        }

        this.controls.enabled = false;

        const monitorPos = { x: 0.12, y: 1.95, z: 1.55 };
        const monitorTarget = { x: 0.12, y: 1.95, z: 0.02 };

        if (window.gsap) {
            window.gsap.to(this.camera.position, {
                x: monitorPos.x,
                y: monitorPos.y,
                z: monitorPos.z,
                duration: 1.0,
                ease: "power2.inOut"
            });
            window.gsap.to(this.controls.target, {
                x: monitorTarget.x,
                y: monitorTarget.y,
                z: monitorTarget.z,
                duration: 1.0,
                ease: "power2.inOut"
            });
        } else {
            this.camera.position.set(monitorPos.x, monitorPos.y, monitorPos.z);
            this.controls.target.set(monitorTarget.x, monitorTarget.y, monitorTarget.z);
        }
    }

    exitMonitorFocus() {
        if (!this.camera || !this.controls) return;

        this.controls.enabled = true;

        const restorePos = this.previousCameraState ? this.previousCameraState.pos : this.cameraPositions.home;
        const restoreTarget = this.previousCameraState ? this.previousCameraState.target : { x: 0, y: 1.2, z: 0 };
        this.previousCameraState = null;

        if (window.gsap) {
            window.gsap.to(this.camera.position, {
                x: restorePos.x,
                y: restorePos.y,
                z: restorePos.z,
                duration: 1.0,
                ease: "power2.inOut"
            });
            window.gsap.to(this.controls.target, {
                x: restoreTarget.x,
                y: restoreTarget.y,
                z: restoreTarget.z,
                duration: 1.0,
                ease: "power2.inOut"
            });
        } else {
            this.camera.position.set(restorePos.x, restorePos.y, restorePos.z);
            this.controls.target.set(restoreTarget.x, restoreTarget.y, restoreTarget.z);
        }
    }

    resetDeskView() {
        if (window.triggerHaptic) window.triggerHaptic('reset');
        const p = this.cameraPositions[this.currentSection] || this.cameraPositions.home;
        
        if (window.gsap && this.camera && this.controls) {
            window.gsap.to(this.camera.position, { x: p.x, y: p.y, z: p.z, duration: 0.9, ease: "power2.out" });
            window.gsap.to(this.controls.target, { x: p.targetX, y: p.targetY, z: p.targetZ, duration: 0.9, ease: "power2.out" });
        }

        const resetBtn = document.getElementById('reset-desk-view-btn');
        if (resetBtn) resetBtn.style.opacity = '0';
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.updateCameraForViewport();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    transitionToSection(sectionKey) {
        if (!this.cameraPositions[sectionKey] || this.currentSection === sectionKey) return;
        this.currentSection = sectionKey;
        const target = this.cameraPositions[sectionKey];

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = prefersReducedMotion ? 0.1 : 1.4;

        if (window.gsap && this.camera && this.controls) {
            window.gsap.to(this.camera.position, {
                x: target.x,
                y: target.y,
                z: target.z,
                duration: duration,
                ease: "power2.inOut"
            });
            window.gsap.to(this.controls.target, {
                x: target.targetX,
                y: target.targetY,
                z: target.targetZ,
                duration: duration,
                ease: "power2.inOut"
            });
        }
    }

    focusOnProjectObject(project) {
        if (!project || !project.cameraPosition || !this.camera || !this.controls) return;
        const pos = project.cameraPosition;
        const target = project.cameraTarget;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = prefersReducedMotion ? 0.1 : 1.0;

        if (window.gsap) {
            window.gsap.to(this.camera.position, {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                duration: duration,
                ease: "power2.out"
            });
            window.gsap.to(this.controls.target, {
                x: target.x,
                y: target.y,
                z: target.z,
                duration: duration,
                ease: "power2.out"
            });
        }
    }

    toggleDeskLamp() {
        this.deskLampOn = !this.deskLampOn;
        if (this.lampLight) {
            this.lampLight.intensity = this.deskLampOn ? 4.5 : 0.2;
        }
        return this.deskLampOn;
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
            this.init();
        }
    }

    monitorRuntimePerformance(frameTime) {
        const now = performance.now();
        this.fpsTracker.frames++;
        this.fpsTracker.frameTimes.push(frameTime);

        // Sample every 2 seconds
        if (now - this.fpsTracker.lastSampleTime >= 2000) {
            const avgFrameTime = this.fpsTracker.frameTimes.reduce((a, b) => a + b, 0) / this.fpsTracker.frameTimes.length;
            const approxFps = Math.round(1000 / avgFrameTime);
            this.fpsTracker.currentFps = approxFps;

            // Downgrade hysteresis (if FPS < 25 consistently on Mobile/Mid tier)
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
                    this.fpsTracker.downgradeCooldown = 10; // Wait 20 seconds before assessing next downgrade
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

        this.animFrameId = requestAnimationFrame(this.animate.bind(this));

        const startFrame = performance.now();
        const delta = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        if (!this.deviceProfile.isTouch) {
            this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;
        }

        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }

        // Rotate particle container
        if (this.particles) {
            this.particles.rotation.y = elapsedTime * 0.015;
            this.particles.position.y = Math.sin(elapsedTime * 0.5) * 0.04;
        }

        // Animate 3D Hotspots pulsing rings
        this.hotspots.forEach((hit, idx) => {
            if (hit.userData.ring) {
                const pulse = 1 + Math.sin(elapsedTime * 3 + idx * 1.2) * 0.15;
                hit.userData.ring.scale.set(pulse, pulse, pulse);
            }
        });

        // Neon sign subtle flicker
        if (this.neonLight && this.tier !== 'LOW') {
            const flicker = Math.sin(elapsedTime * 12) * 0.08 + Math.sin(elapsedTime * 2.3) * 0.15;
            this.neonLight.intensity = 3.2 + (Math.random() < 0.008 ? -1.2 : flicker);
        }

        // Update animated IDE screen (throttled)
        this.renderScreenContent(elapsedTime);

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        const endFrame = performance.now();
        this.monitorRuntimePerformance(endFrame - startFrame);
    }
}

window.studioScene = new StudioScene();
