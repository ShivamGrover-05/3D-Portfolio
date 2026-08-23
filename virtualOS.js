// SHIVAM OS - Simulated Virtual Desktop & Dedicated Mobile Workstation Engine
class VirtualComputerOS {
    constructor() {
        this.isActive = false;
        this.isBooting = false;
        this.windows = {};
        this.focusedWindow = null;
        this.nextZIndex = 100;
        this.terminalHistory = [];
        this.terminalHistoryIndex = -1;
        this.previousCameraState = null;
        this.activeMobileApp = null;

        this.apps = {
            projects: { title: "Projects Explorer", icon: "folder-git-2", width: 620, height: 420 },
            browser: { title: "ShivamBrowser — shivam.dev", icon: "globe", width: 640, height: 440 },
            terminal: { title: "Terminal — shivam@workstation", icon: "terminal", width: 560, height: 360 },
            mycomputer: { title: "My Computer — /workspace", icon: "hard-drive", width: 540, height: 360 },
            resume: { title: "Resume Viewer — Shivam_Grover_CV", icon: "file-text", width: 520, height: 440 },
            about: { title: "About Me — System Profile", icon: "user", width: 500, height: 380 },
            settings: { title: "Studio OS Settings", icon: "sliders", width: 480, height: 380 },
            contact: { title: "Direct Communicator", icon: "mail", width: 480, height: 400 }
        };
    }

    isMobileView() {
        return window.innerWidth < 768 || window.innerHeight < 550;
    }

    init() {
        this.setupEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        window.addEventListener('resize', () => {
            if (this.isActive && this.isMobileView()) {
                this.syncMobileOSState();
            }
        });
    }

    setupEventListeners() {
        // Desktop App Icons click
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const appId = icon.getAttribute('data-app');
                if (window.triggerHaptic) window.triggerHaptic('button');
                this.openApp(appId);
            });
        });

        // Mobile App Grid / Dock Items
        document.querySelectorAll('.mobile-os-app-item, .mobile-dock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = btn.getAttribute('data-app');
                if (window.triggerHaptic) window.triggerHaptic('button');
                if (appId === 'home') {
                    this.closeMobileApp();
                } else if (appId) {
                    this.openApp(appId);
                }
            });
        });

        // Exit Computer Button
        const exitBtns = document.querySelectorAll('#exit-computer-btn, #mobile-os-exit-btn');
        exitBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.exitComputer();
            });
        });

        // Mobile Back to OS home button
        const mobileBackBtn = document.getElementById('mobile-app-back-btn');
        if (mobileBackBtn) {
            mobileBackBtn.addEventListener('click', () => {
                if (window.triggerHaptic) window.triggerHaptic('button');
                this.closeMobileApp();
            });
        }

        // Global Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                if (this.isMobileView()) {
                    if (this.activeMobileApp) {
                        this.closeMobileApp();
                    } else {
                        this.exitComputer();
                    }
                    return;
                }

                const openWinKeys = Object.keys(this.windows).filter(k => this.windows[k].isOpen);
                if (openWinKeys.length > 0) {
                    this.closeWindow(this.focusedWindow || openWinKeys[openWinKeys.length - 1]);
                } else {
                    this.exitComputer();
                }
            }
        });

        // Enter Studio triggers
        const enterStudioBtns = document.querySelectorAll('.enter-studio-trigger');
        enterStudioBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.enterComputer();
            });
        });

        // Idle screen click
        const idleScreen = document.getElementById('os-idle-screen');
        if (idleScreen) {
            idleScreen.addEventListener('click', () => {
                this.enterComputer();
            });
        }
    }

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${mins}`;

        const desktopClock = document.getElementById('os-taskbar-clock');
        if (desktopClock) desktopClock.textContent = timeStr;

        const mobileClock = document.getElementById('mobile-os-clock');
        if (mobileClock) mobileClock.textContent = timeStr;
    }

    enterComputer() {
        if (this.isActive || this.isBooting) return;

        if (window.triggerHaptic) window.triggerHaptic('action');

        const computerLayer = document.getElementById('virtual-computer-layer');
        const bootScreen = document.getElementById('os-boot-screen');
        const desktopScreen = document.getElementById('os-desktop-screen');
        const mobileOsScreen = document.getElementById('os-mobile-workstation');
        const idleScreen = document.getElementById('os-idle-screen');
        const desktopGrid = document.querySelector('.os-desktop-grid');
        const taskbar = document.querySelector('.os-taskbar');
        const windowsArea = document.getElementById('os-windows-container');

        if (!computerLayer) return;

        this.isBooting = true;
        computerLayer.classList.add('active');

        // Move 3D camera to close-up monitor view & disable desk orbit
        if (window.studioScene && typeof window.studioScene.focusOnMonitor === 'function') {
            window.studioScene.focusOnMonitor();
        }

        if (idleScreen) idleScreen.style.opacity = '0';

        const isMobile = this.isMobileView();

        setTimeout(() => {
            if (idleScreen) idleScreen.style.display = 'none';

            if (bootScreen) {
                bootScreen.style.display = 'flex';
                if (desktopGrid) desktopGrid.style.opacity = '0';
                if (taskbar) taskbar.style.opacity = '0';
                if (windowsArea) windowsArea.style.opacity = '0';
            }

            setTimeout(() => {
                if (bootScreen) bootScreen.style.display = 'none';

                if (isMobile) {
                    if (desktopScreen) desktopScreen.style.display = 'none';
                    if (mobileOsScreen) {
                        mobileOsScreen.style.display = 'flex';
                        mobileOsScreen.style.opacity = '1';
                    }
                } else {
                    if (mobileOsScreen) mobileOsScreen.style.display = 'none';
                    if (desktopScreen) {
                        desktopScreen.style.display = 'flex';
                        if (window.gsap) {
                            const tl = window.gsap.timeline();
                            tl.to(desktopGrid, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0);
                            tl.to(taskbar, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.1);
                            tl.to(windowsArea, { opacity: 1, duration: 0.2 }, 0.15);
                        } else {
                            if (desktopGrid) desktopGrid.style.opacity = '1';
                            if (taskbar) taskbar.style.opacity = '1';
                            if (windowsArea) windowsArea.style.opacity = '1';
                        }
                    }
                }

                this.isBooting = false;
                this.isActive = true;
                if (window.lucide) window.lucide.createIcons();
            }, 600);
        }, 200);
    }

    exitComputer() {
        if (!this.isActive && !this.isBooting) return;

        if (window.triggerHaptic) window.triggerHaptic('button');

        const computerLayer = document.getElementById('virtual-computer-layer');
        const idleScreen = document.getElementById('os-idle-screen');
        const desktopGrid = document.querySelector('.os-desktop-grid');
        const taskbar = document.querySelector('.os-taskbar');
        const mobileOsScreen = document.getElementById('os-mobile-workstation');

        // Close all open windows and free DOM nodes
        Object.keys(this.windows).forEach(appId => {
            if (this.windows[appId] && this.windows[appId].element) {
                this.windows[appId].element.remove();
            }
        });
        this.windows = {};
        this.focusedWindow = null;
        this.closeMobileApp();

        const taskbarTasks = document.getElementById('os-taskbar-tasks');
        if (taskbarTasks) taskbarTasks.innerHTML = '';

        if (window.gsap) {
            window.gsap.to([desktopGrid, taskbar, mobileOsScreen], {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    if (idleScreen) {
                        idleScreen.style.display = 'flex';
                        idleScreen.style.opacity = '1';
                    }
                    if (mobileOsScreen) mobileOsScreen.style.display = 'none';
                    if (computerLayer) computerLayer.classList.remove('active');
                }
            });
        } else {
            if (desktopGrid) desktopGrid.style.opacity = '0';
            if (taskbar) taskbar.style.opacity = '0';
            if (idleScreen) {
                idleScreen.style.display = 'flex';
                idleScreen.style.opacity = '1';
            }
            if (mobileOsScreen) mobileOsScreen.style.display = 'none';
            if (computerLayer) computerLayer.classList.remove('active');
        }

        this.isActive = false;
        this.isBooting = false;

        // Restore normal 3D camera
        if (window.studioScene && typeof window.studioScene.exitMonitorFocus === 'function') {
            window.studioScene.exitMonitorFocus();
        }
    }

    openApp(appId) {
        if (!this.apps[appId]) return;
        const config = this.apps[appId];

        if (window.triggerHaptic) window.triggerHaptic('hotspot');

        // Mobile Mode: Render full-screen responsive app view
        if (this.isMobileView()) {
            this.openMobileApp(appId);
            return;
        }

        // Desktop Window Mode
        if (this.windows[appId]) {
            const win = this.windows[appId].element;
            win.style.display = 'flex';
            this.windows[appId].isOpen = true;
            this.focusWindow(appId);
            return;
        }

        const winEl = document.createElement('div');
        winEl.className = 'os-window';
        winEl.id = `os-window-${appId}`;
        winEl.style.width = `${Math.min(config.width, window.innerWidth * 0.9)}px`;
        winEl.style.height = `${Math.min(config.height, window.innerHeight * 0.75)}px`;
        winEl.style.zIndex = ++this.nextZIndex;

        const offset = (Object.keys(this.windows).length % 5) * 24;
        winEl.style.left = `calc(50% - ${Math.min(config.width, window.innerWidth * 0.9) / 2}px + ${offset}px)`;
        winEl.style.top = `calc(50% - ${Math.min(config.height, window.innerHeight * 0.75) / 2}px + ${offset}px)`;

        winEl.innerHTML = `
            <div class="os-window-header">
                <div class="os-window-dots">
                    <button class="win-btn close-btn" title="Close" data-action="close"></button>
                    <button class="win-btn min-btn" title="Minimize" data-action="min"></button>
                    <button class="win-btn max-btn" title="Maximize" data-action="max"></button>
                </div>
                <div class="os-window-title">
                    <i data-lucide="${config.icon}" style="width: 14px; height: 14px;"></i>
                    <span>${config.title}</span>
                </div>
                <div style="width: 48px;"></div>
            </div>
            <div class="os-window-body" id="os-body-${appId}">
                ${this.renderAppContent(appId)}
            </div>
        `;

        document.getElementById('os-windows-container').appendChild(winEl);

        this.windows[appId] = {
            element: winEl,
            isOpen: true,
            isMaximized: false,
            prevRect: null
        };

        this.setupWindowControls(appId);
        this.focusWindow(appId);
        this.postRenderApp(appId);

        if (window.lucide) window.lucide.createIcons();
    }

    openMobileApp(appId) {
        this.activeMobileApp = appId;
        const mobileContainer = document.getElementById('mobile-app-modal-view');
        const mobileTitle = document.getElementById('mobile-app-title');
        const mobileBody = document.getElementById('mobile-app-body-content');

        if (!mobileContainer || !mobileBody) return;

        const config = this.apps[appId];
        if (mobileTitle) mobileTitle.textContent = config.title;
        mobileBody.innerHTML = this.renderAppContent(appId);

        mobileContainer.classList.add('active');
        this.postRenderApp(appId);

        if (window.lucide) window.lucide.createIcons();
    }

    closeMobileApp() {
        this.activeMobileApp = null;
        const mobileContainer = document.getElementById('mobile-app-modal-view');
        const mobileBody = document.getElementById('mobile-app-body-content');
        if (mobileContainer) mobileContainer.classList.remove('active');
        if (mobileBody) mobileBody.innerHTML = '';
    }

    setupWindowControls(appId) {
        const winData = this.windows[appId];
        const winEl = winData.element;
        const header = winEl.querySelector('.os-window-header');

        winEl.addEventListener('mousedown', () => this.focusWindow(appId));

        winEl.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(appId);
        });

        winEl.querySelector('.min-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            winEl.style.display = 'none';
            winData.isOpen = false;
        });

        winEl.querySelector('.max-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize(appId);
        });

        // Desktop dragging
        let isDragging = false;
        let startX, startY, initLeft, initTop;

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('win-btn')) return;
            if (winData.isMaximized) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = winEl.getBoundingClientRect();
            initLeft = rect.left;
            initTop = rect.top;

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                winEl.style.left = `${Math.max(10, Math.min(window.innerWidth - 60, initLeft + dx))}px`;
                winEl.style.top = `${Math.max(30, Math.min(window.innerHeight - 80, initTop + dy))}px`;
                winEl.style.transform = 'none';
            };

            const onMouseUp = () => {
                isDragging = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    toggleMaximize(appId) {
        const winData = this.windows[appId];
        const winEl = winData.element;

        if (!winData.isMaximized) {
            winData.prevRect = {
                left: winEl.style.left,
                top: winEl.style.top,
                width: winEl.style.width,
                height: winEl.style.height,
                transform: winEl.style.transform
            };
            winEl.style.left = '16px';
            winEl.style.top = '38px';
            winEl.style.width = 'calc(100vw - 32px)';
            winEl.style.height = 'calc(100vh - 84px)';
            winEl.style.transform = 'none';
            winData.isMaximized = true;
        } else {
            winEl.style.left = winData.prevRect.left;
            winEl.style.top = winData.prevRect.top;
            winEl.style.width = winData.prevRect.width;
            winEl.style.height = winData.prevRect.height;
            winEl.style.transform = winData.prevRect.transform;
            winData.isMaximized = false;
        }
    }

    focusWindow(appId) {
        if (!this.windows[appId]) return;
        this.focusedWindow = appId;
        this.windows[appId].element.style.zIndex = ++this.nextZIndex;
        document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
        this.windows[appId].element.classList.add('focused');
    }

    closeWindow(appId) {
        if (!this.windows[appId]) return;
        if (window.triggerHaptic) window.triggerHaptic('button');
        const winEl = this.windows[appId].element;
        winEl.remove();
        delete this.windows[appId];
    }

    renderAppContent(appId) {
        switch (appId) {
            case 'projects':
                return this.renderProjectsApp();
            case 'browser':
                return this.renderBrowserApp();
            case 'terminal':
                return this.renderTerminalApp();
            case 'mycomputer':
                return this.renderFileExplorerApp();
            case 'resume':
                return this.renderResumeApp();
            case 'about':
                return this.renderAboutApp();
            case 'settings':
                return this.renderSettingsApp();
            case 'contact':
                return this.renderContactApp();
            default:
                return `<div style="padding: 20px; color: #fff;">Application content initialized.</div>`;
        }
    }

    postRenderApp(appId) {
        if (appId === 'terminal') {
            this.initTerminalEvents();
        } else if (appId === 'mycomputer') {
            this.initFileExplorerEvents();
        } else if (appId === 'settings') {
            this.initSettingsEvents();
        }
    }

    // App 1: Projects Explorer (Centralized Data)
    renderProjectsApp() {
        const projects = window.PROJECTS_DATA || [];
        return `
            <div class="os-projects-grid">
                ${projects.map(p => `
                    <div class="os-project-card" data-project-id="${p.id}">
                        <div class="os-proj-img" style="background-image: url('${p.coverImage}')">
                            <span class="os-proj-num">${p.number}</span>
                        </div>
                        <div class="os-proj-info">
                            <div class="os-proj-title">${p.title}</div>
                            <div class="os-proj-cat">${p.category}</div>
                            <p class="os-proj-desc">${p.tagline}</p>
                            <div class="os-proj-tech">
                                ${p.technologies.slice(0, 3).map(t => `<span>${t}</span>`).join('')}
                            </div>
                            <div class="os-proj-actions">
                                ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noopener" class="os-btn">Live ↗</a>` : ''}
                                ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" rel="noopener" class="os-btn">GitHub</a>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // App 2: Browser
    renderBrowserApp() {
        return `
            <div class="os-browser-wrap">
                <div class="os-browser-bar">
                    <span class="browser-dot" style="background: #27c93f;"></span>
                    <span class="browser-url">https://shivamgrover.dev/overview</span>
                </div>
                <div class="os-browser-body">
                    <h2 style="font-family: var(--font-heading); color: #fff; margin-bottom: 8px;">Shivam Grover</h2>
                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                        Full-Stack Developer, Creative 3D Coder, and Automation Specialist based in New Delhi, India. Delivering GPU-accelerated web experiences, scalable CRM automations, and modern web architectures.
                    </p>
                </div>
            </div>
        `;
    }

    // App 3: Terminal with Quick-Touch Command Chips
    renderTerminalApp() {
        return `
            <div class="os-terminal-wrap">
                <div class="os-terminal-chips">
                    <button class="term-chip" data-cmd="help">help</button>
                    <button class="term-chip" data-cmd="whoami">whoami</button>
                    <button class="term-chip" data-cmd="skills">skills</button>
                    <button class="term-chip" data-cmd="projects">projects</button>
                    <button class="term-chip" data-cmd="experience">experience</button>
                    <button class="term-chip" data-cmd="contact">contact</button>
                    <button class="term-chip" data-cmd="clear">clear</button>
                </div>
                <div class="os-terminal-output" id="terminal-screen-output">
                    <div>Shivam Studio OS Kernel v2.4 (arm64-darwin/webgl2)</div>
                    <div>Type <span class="term-cmd">'help'</span> or tap any button above to explore.</div>
                </div>
                <div class="os-terminal-prompt-line">
                    <span style="color: var(--accent-green); margin-right: 6px;">shivam@workstation:~$</span>
                    <input type="text" class="os-terminal-input" id="terminal-cmd-input" placeholder="Type command..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                </div>
            </div>
        `;
    }

    initTerminalEvents() {
        const input = document.getElementById('terminal-cmd-input');
        const chips = document.querySelectorAll('.term-chip');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const cmd = input.value.trim().toLowerCase();
                    input.value = '';
                    this.executeTerminalCmd(cmd);
                }
            });
        }

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const cmd = chip.getAttribute('data-cmd');
                if (window.triggerHaptic) window.triggerHaptic('button');
                this.executeTerminalCmd(cmd);
            });
        });
    }

    executeTerminalCmd(cmd) {
        const output = document.getElementById('terminal-screen-output');
        if (!output) return;

        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = `<span style="color: var(--accent-green);">shivam@workstation:~$</span> ${cmd}`;
        output.appendChild(cmdLine);

        const respLine = document.createElement('div');
        respLine.style.color = '#cbd5e1';
        respLine.style.margin = '4px 0 10px';

        switch (cmd) {
            case 'help':
                respLine.innerHTML = `Available commands: <b>whoami</b>, <b>skills</b>, <b>projects</b>, <b>experience</b>, <b>contact</b>, <b>clear</b>, <b>exit</b>`;
                break;
            case 'whoami':
                respLine.innerHTML = `Shivam Grover — Creative Web Developer & RevOps Automation Specialist based in New Delhi, India.`;
                break;
            case 'skills':
                respLine.innerHTML = `Languages: TypeScript, JavaScript, HTML5, CSS3, Python, PHP, SQL<br>3D & Frontend: Three.js, WebGL, GSAP, React, Next.js, TailwindCSS<br>Automation: n8n, HubSpot CRM, Zapier, Webhooks, REST APIs`;
                break;
            case 'projects':
                respLine.innerHTML = `1. <b>AEVONIX</b> (Interactive 3D Hardware Visualizer)<br>2. <b>CollegesPathshala</b> (Higher Ed Platform)<br>3. <b>Vacation Visits</b> (International Tourism)<br>4. <b>Saga Holidays</b> (Tour Booking Portal)<br>5. <b>AI Automation Engine</b> (n8n & HubSpot Sync)`;
                break;
            case 'experience':
                respLine.innerHTML = `• <b>Growthspree</b> — RevOps & Automation Intern (2026 - Present)<br>• <b>Freelance</b> — Web & Interactive Developer (2025 - 2026)`;
                break;
            case 'contact':
                respLine.innerHTML = `Email: shivamgrover.dev@gmail.com | LinkedIn: /in/shivamgrover-dev/ | GitHub: /ShivamGrover-05`;
                break;
            case 'clear':
                output.innerHTML = '';
                return;
            case 'exit':
                this.exitComputer();
                return;
            default:
                respLine.innerHTML = `<span style="color: #ff7b72;">Command not found: '${cmd}'. Type 'help' for options.</span>`;
        }

        output.appendChild(respLine);
        output.scrollTop = output.scrollHeight;
    }

    // App 4: File Explorer
    renderFileExplorerApp() {
        return `
            <div class="os-explorer-wrap">
                <div class="os-explorer-sidebar">
                    <div class="explorer-side-item active"><i data-lucide="hard-drive"></i> Workspace</div>
                    <div class="explorer-side-item" data-folder="projects"><i data-lucide="folder"></i> Projects</div>
                    <div class="explorer-side-item" data-folder="resume"><i data-lucide="folder"></i> Resume</div>
                    <div class="explorer-side-item" data-folder="contact"><i data-lucide="folder"></i> Contact</div>
                </div>
                <div class="os-explorer-main">
                    <div class="file-item" data-open="projects"><i data-lucide="folder" class="file-icon folder"></i><span class="file-name">PROJECTS/</span></div>
                    <div class="file-item" data-open="about"><i data-lucide="file-text" class="file-icon file"></i><span class="file-name">about.md</span></div>
                    <div class="file-item" data-open="resume"><i data-lucide="file-text" class="file-icon file"></i><span class="file-name">resume.pdf</span></div>
                    <div class="file-item" data-open="terminal"><i data-lucide="terminal" class="file-icon exec"></i><span class="file-name">terminal.sh</span></div>
                    <div class="file-item" data-open="settings"><i data-lucide="sliders" class="file-icon exec"></i><span class="file-name">settings.cfg</span></div>
                </div>
            </div>
        `;
    }

    initFileExplorerEvents() {
        document.querySelectorAll('.file-item, .explorer-side-item').forEach(el => {
            el.addEventListener('click', () => {
                const target = el.getAttribute('data-open') || el.getAttribute('data-folder');
                if (target && this.apps[target]) {
                    this.openApp(target);
                }
            });
        });
    }

    // App 5: Resume
    renderResumeApp() {
        return `
            <div class="os-resume-wrap">
                <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: #fff;">Shivam Grover</h2>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-cyan); margin-bottom: 14px;">Creative Developer & Automation Specialist</div>
                <div class="resume-sec-title">EXPERIENCE</div>
                <div class="resume-item">
                    <div class="resume-item-header"><span class="role">RevOps & Automation Intern</span><span class="dates">2026 — Present</span></div>
                    <div class="company">Growthspree</div>
                    <p class="desc">Engineered HubSpot automations, streamlined inbound lead routing, and built data sync pipelines.</p>
                </div>
                <div class="resume-item">
                    <div class="resume-item-header"><span class="role">Freelance Web Developer</span><span class="dates">2025 — 2026</span></div>
                    <div class="company">Self-Employed</div>
                    <p class="desc">Delivered custom production platforms including CollegesPathshala, Vacation Visits, and Saga Holidays.</p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 14px;">
                    <a href="https://www.linkedin.com/in/shivamgrover-dev/" target="_blank" rel="noopener" class="os-btn">LinkedIn ↗</a>
                    <a href="mailto:shivamgrover.dev@gmail.com" class="os-btn">Email ✉</a>
                </div>
            </div>
        `;
    }

    // App 6: About
    renderAboutApp() {
        return `
            <div class="os-about-wrap">
                <h3 style="font-family: var(--font-heading); font-size: 1.3rem; color: #fff; margin-bottom: 8px;">About Shivam</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                    Developer with a focus on high-impact digital experiences, 3D WebGL interactions, and enterprise workflow orchestration. Passionate about marrying aesthetic precision with engineering reliability.
                </p>
                <div class="about-stats-grid">
                    <div class="about-stat-box"><div class="stat-num">3+</div><div class="stat-lbl">Live Client Apps</div></div>
                    <div class="about-stat-box"><div class="stat-num">60fps</div><div class="stat-lbl">3D Performance</div></div>
                    <div class="about-stat-box"><div class="stat-num">100%</div><div class="stat-lbl">Reliability</div></div>
                </div>
            </div>
        `;
    }

    // App 7: Studio OS Settings (Quality Tier, Haptics, Volume)
    renderSettingsApp() {
        const currentTier = (window.studioScene ? window.studioScene.tier : 'AUTO');
        const hapticsEnabled = localStorage.getItem('portfolio_haptics_enabled') !== 'false';
        const currentVol = Math.round((window.lofiAudio ? window.lofiAudio.getVolume() : 0.3) * 100);

        return `
            <div class="os-settings-wrap" style="padding: 12px; font-family: var(--font-mono); font-size: 0.8rem; color: #cbd5e1;">
                <div style="margin-bottom: 16px;">
                    <div style="color: var(--accent-cyan); margin-bottom: 8px; font-weight: 700;">⚙ 3D RENDERING QUALITY</div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="settings-opt-btn ${currentTier === 'HIGH' ? 'active' : ''}" data-quality="HIGH">HIGH (60 FPS)</button>
                        <button class="settings-opt-btn ${currentTier === 'MEDIUM' ? 'active' : ''}" data-quality="MEDIUM">MEDIUM</button>
                        <button class="settings-opt-btn ${currentTier === 'LOW' ? 'active' : ''}" data-quality="LOW">LOW (Battery Saver)</button>
                        <button class="settings-opt-btn ${currentTier === 'FALLBACK' ? 'active' : ''}" data-quality="FALLBACK">2D FALLBACK</button>
                    </div>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="color: var(--accent-green); margin-bottom: 8px; font-weight: 700;">📳 HAPTIC FEEDBACK (MOBILE)</div>
                    <button id="toggle-haptics-btn" class="settings-opt-btn active">
                        HAPTICS: <span id="haptics-status-label">${hapticsEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    </button>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="color: var(--accent-purple); margin-bottom: 8px; font-weight: 700;">♪ AMBIENT MUSIC VOLUME</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <input type="range" id="settings-volume-slider" min="0" max="100" value="${currentVol}" style="flex-grow: 1;">
                        <span id="settings-volume-num">${currentVol}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    initSettingsEvents() {
        // Quality selector
        document.querySelectorAll('.settings-opt-btn[data-quality]').forEach(btn => {
            btn.addEventListener('click', () => {
                const q = btn.getAttribute('data-quality');
                if (window.triggerHaptic) window.triggerHaptic('button');
                if (window.studioScene && typeof window.studioScene.setQualityTier === 'function') {
                    window.studioScene.setQualityTier(q);
                }
                document.querySelectorAll('.settings-opt-btn[data-quality]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Haptics toggle
        const hapticsBtn = document.getElementById('toggle-haptics-btn');
        const hapticsLbl = document.getElementById('haptics-status-label');
        if (hapticsBtn) {
            hapticsBtn.addEventListener('click', () => {
                const current = localStorage.getItem('portfolio_haptics_enabled') !== 'false';
                const next = !current;
                localStorage.setItem('portfolio_haptics_enabled', next ? 'true' : 'false');
                if (hapticsLbl) hapticsLbl.textContent = next ? 'ENABLED' : 'DISABLED';
                if (window.triggerHaptic) window.triggerHaptic('button');
            });
        }

        // Volume slider
        const volSlider = document.getElementById('settings-volume-slider');
        const volNum = document.getElementById('settings-volume-num');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10) / 100;
                if (volNum) volNum.textContent = `${Math.round(val * 100)}%`;
                if (window.lofiAudio && typeof window.lofiAudio.setVolume === 'function') {
                    window.lofiAudio.setVolume(val);
                }
            });
        }
    }

    // App 8: Contact
    renderContactApp() {
        return `
            <div class="os-contact-wrap">
                <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: #fff; margin-bottom: 8px;">Direct Communication</h3>
                <div class="os-contact-links">
                    <a href="mailto:shivamgrover.dev@gmail.com" class="os-contact-item">
                        <i data-lucide="mail" style="color: var(--accent-cyan);"></i>
                        <div><div style="font-size: 0.7rem; color: var(--text-dim);">EMAIL</div><div style="color: #fff;">shivamgrover.dev@gmail.com</div></div>
                    </a>
                    <a href="https://www.linkedin.com/in/shivamgrover-dev/" target="_blank" rel="noopener" class="os-contact-item">
                        <i data-lucide="linkedin" style="color: #0077b5;"></i>
                        <div><div style="font-size: 0.7rem; color: var(--text-dim);">LINKEDIN</div><div style="color: #fff;">in/shivamgrover-dev</div></div>
                    </a>
                </div>
            </div>
        `;
    }
}

window.virtualOS = new VirtualComputerOS();
