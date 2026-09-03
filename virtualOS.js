// =========================================================================
// STUDIO OS — Redesigned Futuristic Creative Operating System v2.5
// Clean, Editorial, High-Performance Interactive Workstation Layer
// =========================================================================

class VirtualComputerOS {
    constructor() {
        this.isActive = false;
        this.activeTab = 'profile';
        this.terminalHistory = [];
        this.historyIndex = -1;
        this.fpsWatcherInterval = null;
    }

    init() {
        this.setupTabNavigation();
        this.setupCloseTriggers();
        this.setupTerminal();
        this.setupTierControls();
        this.setupEmailCopy();
        this.setupKeyboardShortcuts();
    }

    setupTabNavigation() {
        // Desktop / Tablet Nav Tabs
        const navTabs = document.querySelectorAll('.os-nav-tab');
        navTabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = btn.getAttribute('data-tab');
                if (tab) this.switchTab(tab);
            });
        });

        // Mobile Bottom Dock Tabs
        const mobileTabs = document.querySelectorAll('.mobile-dock-tab');
        mobileTabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = btn.getAttribute('data-tab');
                if (tab) this.switchTab(tab);
            });
        });
    }

    setupCloseTriggers() {
        const exitBtn = document.getElementById('exit-computer-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exitComputer();
            });
        }
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            // Escape key closes Studio OS immediately
            if (e.key === 'Escape') {
                e.preventDefault();
                this.exitComputer();
                return;
            }

            // Numeric keys 1-5 switch tabs when not typing in the terminal input
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (activeTag !== 'input' && activeTag !== 'textarea') {
                const numKey = parseInt(e.key, 10);
                const tabKeys = ['profile', 'projects', 'experiments', 'stack', 'contact'];
                if (numKey >= 1 && numKey <= 5) {
                    e.preventDefault();
                    this.switchTab(tabKeys[numKey - 1]);
                }
            }
        });
    }

    switchTab(tabKey) {
        if (!tabKey) return;
        this.activeTab = tabKey;
        this.triggerHaptic('button');

        // Update Desktop Tabs
        document.querySelectorAll('.os-nav-tab').forEach(t => {
            if (t.getAttribute('data-tab') === tabKey) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        // Update Mobile Dock Tabs
        document.querySelectorAll('.mobile-dock-tab').forEach(t => {
            if (t.getAttribute('data-tab') === tabKey) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        // Switch Panels with Smooth Transition
        document.querySelectorAll('.studio-os-panel').forEach(p => {
            if (p.getAttribute('data-panel') === tabKey) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        // Focus terminal input if switched to experiments
        if (tabKey === 'experiments') {
            const input = document.getElementById('os-term-input');
            if (input) setTimeout(() => input.focus(), 100);
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    enterComputer() {
        if (this.isActive) return;
        this.isActive = true;
        this.triggerHaptic('action');

        const overlay = document.getElementById('virtual-computer-layer');
        if (overlay) {
            overlay.classList.add('active');
        }

        // Lock background scroll to prevent jitter
        document.body.classList.add('studio-os-open');
        document.body.style.overflow = 'hidden';
        if (window.lenis && typeof window.lenis.stop === 'function') {
            window.lenis.stop();
        }

        // Camera director transition to Studio preset
        if (window.studioScene && window.studioScene.cameraDirector) {
            window.studioScene.cameraDirector.transitionTo('STUDIO', null, 0.85);
        }

        // Start telemetry watcher
        this.startTelemetry();

        // Refresh icons
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    exitComputer() {
        if (!this.isActive) return;
        this.isActive = false;
        this.triggerHaptic('button');

        const overlay = document.getElementById('virtual-computer-layer');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // Restore page scrolling cleanly
        document.body.classList.remove('studio-os-open');
        document.body.style.overflow = '';
        if (window.lenis && typeof window.lenis.start === 'function') {
            window.lenis.start();
        }

        // Camera director returns to current section view
        if (window.studioScene && typeof window.studioScene.resetDeskView === 'function') {
            window.studioScene.resetDeskView();
        }

        if (this.fpsWatcherInterval) {
            clearInterval(this.fpsWatcherInterval);
            this.fpsWatcherInterval = null;
        }
    }

    startTelemetry() {
        const gpuStatus = document.getElementById('os-gpu-status');
        if (gpuStatus && window.studioScene) {
            const tier = window.studioScene.tier || 'HIGH';
            const fps = window.studioScene.fpsTracker ? window.studioScene.fpsTracker.currentFps : 60;
            gpuStatus.innerHTML = `<i data-lucide="cpu"></i> <span>${tier} • ${fps} FPS</span>`;
            if (window.lucide) window.lucide.createIcons();
        }

        if (!this.fpsWatcherInterval) {
            this.fpsWatcherInterval = setInterval(() => {
                if (!this.isActive) return;
                const statusEl = document.getElementById('os-gpu-status');
                if (statusEl && window.studioScene) {
                    const tier = window.studioScene.tier || 'HIGH';
                    const fps = window.studioScene.fpsTracker ? window.studioScene.fpsTracker.currentFps : 60;
                    statusEl.querySelector('span').textContent = `${tier} • ${fps} FPS`;
                }
            }, 1000);
        }
    }

    setupTerminal() {
        const form = document.getElementById('os-term-form');
        const input = document.getElementById('os-term-input');
        const output = document.getElementById('os-term-output');

        if (!form || !input || !output) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const cmd = input.value.trim();
            if (!cmd) return;

            this.terminalHistory.push(cmd);
            this.historyIndex = this.terminalHistory.length;
            input.value = '';

            // Render command echo
            const echoLine = document.createElement('div');
            echoLine.className = 'term-line';
            echoLine.innerHTML = `<span class="term-prompt">shivam@os:~$</span> <span class="term-echo-cmd">${this.escapeHtml(cmd)}</span>`;
            output.appendChild(echoLine);

            this.handleTerminalCommand(cmd.toLowerCase(), output);
            output.scrollTop = output.scrollHeight;
        });

        // Arrow Key command history
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.terminalHistory[this.historyIndex] || '';
                }
            } else if (e.key === 'ArrowDown') {
                if (this.historyIndex < this.terminalHistory.length - 1) {
                    this.historyIndex++;
                    input.value = this.terminalHistory[this.historyIndex] || '';
                } else {
                    this.historyIndex = this.terminalHistory.length;
                    input.value = '';
                }
            }
        });
    }

    handleTerminalCommand(cmd, output) {
        const respLine = document.createElement('div');
        respLine.className = 'term-line resp';

        switch (cmd) {
            case 'help':
                respLine.innerHTML = `Available commands:<br>
• <strong>whoami</strong> / <strong>about</strong> — Developer executive overview<br>
• <strong>projects</strong> — Showcase of featured builds<br>
• <strong>skills</strong> / <strong>stack</strong> — Technical languages, 3D & RevOps toolset<br>
• <strong>neofetch</strong> — Real-time WebGL workstation telemetry<br>
• <strong>contact</strong> — Transmission coordinates and email<br>
• <strong>clear</strong> — Clear terminal screen<br>
• <strong>exit</strong> — Close Studio OS`;
                break;

            case 'whoami':
            case 'about':
                respLine.innerHTML = `Shivam Grover — Creative Web Developer & RevOps Automation Specialist based in New Delhi, India. Expert in Three.js, WebGL architectures, and enterprise n8n / HubSpot integrations.`;
                break;

            case 'projects':
                respLine.innerHTML = `Flagship Production Artifacts:<br>
1. <strong>AEVONIX</strong> — Real-time 3D Hardware Visualizer (Three.js/WebGL)<br>
2. <strong>CollegesPathshala</strong> — Higher Ed Discovery Portal (Next.js/n8n)<br>
3. <strong>Vacation Visits</strong> — Experiential Travel Platform (REST/Webhooks)<br>
4. <strong>Saga Holidays</strong> — Luxury Tour Portal (React/Vite)`;
                break;

            case 'skills':
            case 'stack':
                respLine.innerHTML = `Core Stack:<br>
• Languages: TypeScript, JavaScript (ESNext), Python, HTML5, CSS3, SQL<br>
• 3D & Frontend: Three.js, WebGL, GSAP, Lenis, React, Next.js, Tailwind<br>
• Automation & RevOps: n8n, HubSpot CRM, Zapier, Webhooks, REST APIs`;
                break;

            case 'neofetch':
                const tier = window.studioScene ? window.studioScene.tier : 'HIGH';
                const fps = window.studioScene && window.studioScene.fpsTracker ? window.studioScene.fpsTracker.currentFps : 60;
                const width = window.innerWidth;
                const height = window.innerHeight;
                const dpr = (window.devicePixelRatio || 1).toFixed(2);
                respLine.innerHTML = `
<pre style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); line-height: 1.35; margin: 0;">
  /\\_/\\       shivam@workstation
 ( o.o )      ------------------
  &gt; ^ &lt;       OS: Studio OS v2.5 (x86_64-webgl)
              Display: ${width}x${height} @ DPR ${dpr}
              GPU Status: ACTIVE [Three.js r128]
              Quality Tier: ${tier}
              Render Target: ~${fps} FPS
              Engine: Generative Audio & Holographic Core
</pre>`;
                break;

            case 'contact':
                respLine.innerHTML = `Email: <a href="mailto:codewithshivamdev@gmail.com" style="color: var(--accent-cyan);">codewithshivamdev@gmail.com</a><br>LinkedIn: <a href="https://linkedin.com/in/shivamgrover-dev" target="_blank" rel="noopener" style="color: var(--accent-cyan);">/in/shivamgrover-dev</a><br>GitHub: <a href="https://github.com/ShivamGrover-05" target="_blank" rel="noopener" style="color: var(--accent-cyan);">/ShivamGrover-05</a>`;
                break;

            case 'clear':
                output.innerHTML = '';
                return;

            case 'exit':
                this.exitComputer();
                return;

            default:
                respLine.innerHTML = `<span style="color: #ff7b72;">Command not found: '${this.escapeHtml(cmd)}'. Type 'help' for options.</span>`;
        }

        output.appendChild(respLine);
    }

    setupTierControls() {
        document.querySelectorAll('.tier-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tier = btn.getAttribute('data-tier');
                if (tier && window.studioScene && typeof window.studioScene.setQualityTier === 'function') {
                    window.studioScene.setQualityTier(tier);
                    this.triggerHaptic('button');
                    document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.startTelemetry();
                }
            });
        });
    }

    setupEmailCopy() {
        const copyBtn = document.getElementById('os-copy-email-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const email = 'codewithshivamdev@gmail.com';
                navigator.clipboard.writeText(email).then(() => {
                    this.triggerHaptic('success');
                    const span = copyBtn.querySelector('span');
                    if (span) {
                        const original = span.textContent;
                        span.textContent = 'COPIED!';
                        copyBtn.style.borderColor = 'var(--accent-green)';
                        setTimeout(() => {
                            span.textContent = original;
                            copyBtn.style.borderColor = '';
                        }, 2000);
                    }
                }).catch(() => {
                    // Fallback
                    window.location.href = `mailto:${email}`;
                });
            });
        }
    }

    triggerHaptic(type = 'button') {
        if (window.triggerHaptic) window.triggerHaptic(type);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Global instantiation
window.virtualOS = new VirtualComputerOS();
document.addEventListener('DOMContentLoaded', () => {
    window.virtualOS.init();
});
