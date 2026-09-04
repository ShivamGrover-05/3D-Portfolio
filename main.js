// Shivam Grover Portfolio - Main Orchestrator & Exhibition Engine

// 1. Reusable Haptics Feedback System with Feature Detection & Preference
const triggerHaptic = (type = 'button') => {
    try {
        const isHapticEnabled = localStorage.getItem('portfolio_haptics_enabled') !== 'false';
        if (!isHapticEnabled) return;

        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            switch (type) {
                case 'button':
                    navigator.vibrate(10);
                    break;
                case 'project':
                    navigator.vibrate(15);
                    break;
                case 'hotspot':
                    navigator.vibrate(15);
                    break;
                case 'desk':
                    navigator.vibrate(10);
                    break;
                case 'reset':
                    navigator.vibrate(20);
                    break;
                case 'action':
                    navigator.vibrate([15, 10, 15]);
                    break;
                default:
                    navigator.vibrate(10);
            }
        }
    } catch (e) {
        // Silently ignore on iOS or unsupported environments
    }
};
window.triggerHaptic = triggerHaptic;

document.addEventListener('DOMContentLoaded', () => {
    // Session progression system
    const registerSessionExplored = (sectionTitle) => {
        try {
            let explored = JSON.parse(localStorage.getItem('portfolio_visited_sections')) || [];
            if (!explored.includes(sectionTitle)) {
                explored.push(sectionTitle);
                localStorage.setItem('portfolio_visited_sections', JSON.stringify(explored));
                window.dispatchEvent(new CustomEvent('session_progress_updated', { detail: { explored } }));
            }
        } catch (e) {
            console.warn('Session progression storage failed:', e);
        }
    };
    window.registerSessionExplored = registerSessionExplored;

    // 1. Initialize Lenis Smooth Scrolling Engine (Responsive & non-delayed on mobile)
    let lenis = null;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: prefersReducedMotion ? 0 : 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.25,
            syncTouch: true,
            syncTouchLerp: 0.085,
            autoResize: true
        });

        window.lenis = lenis;

        // Synchronize with GSAP ScrollTrigger & 3D Studio Scene
        lenis.on('scroll', (e) => {
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
            if (window.studioScene && typeof window.studioScene.onScroll === 'function') {
                window.studioScene.onScroll(e);
            }
        });

        // Coordinate unified animation loop via GSAP ticker
        if (typeof gsap !== 'undefined') {
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            const rafLoop = (time) => {
                lenis.raf(time);
                requestAnimationFrame(rafLoop);
            };
            requestAnimationFrame(rafLoop);
        }
    }

    const projects = window.PROJECTS_DATA || [];
    let currentProjectIndex = 0;

    // 2. DOM Elements for Digital Exhibition
    const coverImg = document.getElementById('project-cover-img');
    const hotspotName = document.getElementById('project-hotspot-name');
    const indexCounter = document.getElementById('project-index-counter');
    const categoryTag = document.getElementById('project-category');
    const exhibitTitle = document.getElementById('project-title');
    const taglineEl = document.getElementById('project-tagline');
    const descText = document.getElementById('project-description');
    const highlightsList = document.getElementById('project-highlights-list');
    const techContainer = document.getElementById('project-tech-container');
    const liveBtn = document.getElementById('project-live-btn');
    const githubBtn = document.getElementById('project-github-btn');
    const focus3dBtn = document.getElementById('project-focus-3d-btn');
    const infoContainer = document.getElementById('project-info-container');
    const switcherButtons = document.querySelectorAll('.switcher-num-btn');

    // 3. Centralized Project Selection Engine
    const updateProjectDisplay = (index, moveCamera = false) => {
        if (!projects || projects.length === 0) return;

        currentProjectIndex = (index + projects.length) % projects.length;
        const p = projects[currentProjectIndex];

        triggerHaptic('project');

        // Track project exploration in session
        registerSessionExplored(p.title);

        // Update Counter
        if (indexCounter) {
            indexCounter.textContent = `${p.number} / 0${projects.length}`;
        }

        // Update Switcher Active State dynamically
        document.querySelectorAll('.switcher-num-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === currentProjectIndex);
        });

        if (window.gsap && !prefersReducedMotion && coverImg) {
            window.gsap.to(coverImg, {
                opacity: 0,
                scale: 0.96,
                duration: 0.18,
                ease: "power2.in",
                onComplete: () => {
                    coverImg.src = p.coverImage;
                    window.gsap.to(coverImg, { opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" });
                }
            });

            if (infoContainer) {
                window.gsap.fromTo(infoContainer, 
                    { opacity: 0.5, y: 8 }, 
                    { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
                );
            }
        } else if (coverImg) {
            coverImg.src = p.coverImage;
        }

        // Populate Metadata
        if (hotspotName) hotspotName.textContent = p.hotspotId || 'Desk Station';
        if (categoryTag) categoryTag.textContent = p.category;
        if (exhibitTitle) exhibitTitle.textContent = p.title;
        if (taglineEl) taglineEl.textContent = p.tagline;
        if (descText) descText.textContent = p.description;

        if (highlightsList && p.highlights) {
            highlightsList.innerHTML = p.highlights.map(h => `<li><span class="bullet">&bull;</span> ${h}</li>`).join('');
        }

        if (techContainer && p.technologies) {
            techContainer.innerHTML = p.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');
        }

        if (liveBtn) {
            if (p.liveUrl) {
                liveBtn.href = p.liveUrl;
                liveBtn.style.display = 'inline-flex';
            } else {
                liveBtn.style.display = 'none';
            }
        }

        if (githubBtn) {
            if (p.githubUrl) {
                githubBtn.href = p.githubUrl;
                githubBtn.style.display = 'inline-flex';
            } else {
                githubBtn.style.display = 'none';
            }
        }

        // Synchronize 3D Camera with Active Project (desktop only or intentional)
        if (moveCamera && window.innerWidth >= 768 && window.studioScene && typeof window.studioScene.focusOnProjectObject === 'function') {
            window.studioScene.focusOnProjectObject(p);
        }
    };

    window.selectProjectById = (id) => {
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            updateProjectDisplay(idx, true);
        }
    };

    // 4. Switcher Button Click Listeners & Dynamic Generation
    const numberedSwitcher = document.getElementById('project-numbered-switcher');
    if (numberedSwitcher && projects.length > 0) {
        numberedSwitcher.innerHTML = projects.map((p, idx) => 
            `<button class="switcher-num-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">${p.number}</button>`
        ).join('');
    }

    const refreshSwitcherListeners = () => {
        document.querySelectorAll('.switcher-num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                updateProjectDisplay(idx, true);
            });
        });
    };
    refreshSwitcherListeners();

    const prevBtns = document.querySelectorAll('#prev-project-btn-bottom, #project-prev-btn, .nav-arrow-btn[title="Previous Project"]');
    const nextBtns = document.querySelectorAll('#next-project-btn-bottom, #project-next-btn, .nav-arrow-btn[title="Next Project"]');

    prevBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerHaptic('button');
            updateProjectDisplay(currentProjectIndex - 1, true);
        });
    });

    nextBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerHaptic('button');
            updateProjectDisplay(currentProjectIndex + 1, true);
        });
    });

    if (focus3dBtn) {
        focus3dBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerHaptic('action');
            if (projects[currentProjectIndex] && window.studioScene) {
                window.studioScene.focusOnProjectObject(projects[currentProjectIndex]);
            }
        });
    }

    // Reset 3D View floating button
    const resetDeskBtn = document.getElementById('reset-desk-view-btn');
    if (resetDeskBtn) {
        resetDeskBtn.addEventListener('click', () => {
            if (window.studioScene && typeof window.studioScene.resetDeskView === 'function') {
                window.studioScene.resetDeskView();
            }
        });
    }

    // 5. Touch Swipe Navigation for Exhibition Stage with Strict Angle Detection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const exhibitionStage = document.querySelector('.exhibition-stage');

    if (exhibitionStage) {
        exhibitionStage.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        exhibitionStage.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length === 1) {
                touchEndX = e.changedTouches[0].clientX;
                touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
                    if (deltaX < 0) {
                        updateProjectDisplay(currentProjectIndex + 1, false);
                    } else {
                        updateProjectDisplay(currentProjectIndex - 1, false);
                    }
                }
            }
        }, { passive: true });
    }

    if (projects.length > 0) {
        updateProjectDisplay(0, false);
    }

    // 6. Section Navigation State Tracker
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    const updateActiveNav = () => {
        const scrollY = window.lenis ? window.lenis.scroll : window.scrollY;
        sections.forEach(sec => {
            const top = sec.offsetTop - 200;
            const height = sec.offsetHeight;
            const id = sec.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-section') === id);
                });

                // Track section exploration in session
                const capitalizedId = id.charAt(0).toUpperCase() + id.slice(1);
                registerSessionExplored(capitalizedId);
            }
        });
    };

    if (window.lenis) {
        window.lenis.on('scroll', updateActiveNav);
    } else {
        window.addEventListener('scroll', updateActiveNav, { passive: true });
    }

    // Smooth Anchor Navigation & Mobile Drawer Integration
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMobileNavBtn = document.getElementById('close-mobile-nav-btn');

    const openMobileNav = () => {
        triggerHaptic('button');
        if (mobileDrawer) mobileDrawer.classList.add('active');
    };

    const closeMobileNav = () => {
        triggerHaptic('button');
        if (mobileDrawer) mobileDrawer.classList.remove('active');
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
    if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', closeMobileNav);

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || href.length <= 1) return;
            const targetEl = document.querySelector(href);
            if (targetEl) {
                e.preventDefault();
                triggerHaptic('button');
                closeMobileNav();
                if (window.lenis) {
                    window.lenis.scrollTo(targetEl, { offset: 0, duration: 1.0 });
                } else {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 7. Studio Desk Lamp Toggle Trigger
    const lampBtn = document.getElementById('toggle-lamp-btn');
    if (lampBtn) {
        lampBtn.addEventListener('click', () => {
            triggerHaptic('button');
            if (window.studioScene && typeof window.studioScene.toggleDeskLamp === 'function') {
                window.studioScene.toggleDeskLamp();
            }
        });
    }

    // 8. Intentional Tap vs Scroll Gesture Discrimination Utility
    const attachTouchSafeClick = (element, callback) => {
        if (!element) return;
        let startX = 0;
        let startY = 0;
        let hasMoved = false;

        element.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                hasMoved = false;
            }
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const dx = Math.abs(e.touches[0].clientX - startX);
                const dy = Math.abs(e.touches[0].clientY - startY);
                if (dx > 8 || dy > 8) {
                    hasMoved = true;
                }
            }
        }, { passive: true });

        element.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
            callback(e);
        });
    };

    // Dedicated Interactive Studio OS Triggers (Protected with Gesture Discrimination)
    const enterStudioTriggers = document.querySelectorAll('.enter-studio-trigger');
    enterStudioTriggers.forEach(btn => {
        attachTouchSafeClick(btn, (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic('action');
            closeMobileNav();
            if (window.virtualOS && typeof window.virtualOS.enterComputer === 'function') {
                window.virtualOS.enterComputer();
            }
        });
    });

    // Interactive Holographic HUD Navigation Tags (Safe Section Smooth Scrolling)
    const holoTagMap = {
        'ideas': 'about',
        'design': 'projects',
        'develop': 'skills',
        'deploy': 'experience'
    };
    document.querySelectorAll('.holo-tag').forEach(tag => {
        const orbitKey = tag.getAttribute('data-orbit');
        const targetId = holoTagMap[orbitKey];
        if (targetId) {
            tag.style.cursor = 'pointer';
            tag.style.pointerEvents = 'auto';
            attachTouchSafeClick(tag, (e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerHaptic('button');
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    if (window.lenis) {
                        window.lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
                    } else {
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        }
    });

    // 9. Dynamic Liquid Glass Audio Capsule & True Clock Synchronization
    const audioCapsule = document.getElementById('audio-capsule');
    const capsuleTrackTitle = document.getElementById('capsule-track-title');
    const capsuleTrackGenre = document.getElementById('capsule-track-genre');
    const capsuleProgressFill = document.getElementById('capsule-progress-fill');
    const capsuleProgressTrack = document.getElementById('capsule-progress-track');
    const capsuleCurrentTime = document.getElementById('capsule-current-time');
    const capsuleTotalTime = document.getElementById('capsule-total-time');
    const capsulePlayBtn = document.getElementById('capsule-play-btn');
    const capsulePrevBtn = document.getElementById('capsule-prev-btn');
    const capsuleNextBtn = document.getElementById('capsule-next-btn');
    const capsuleVolBtn = document.getElementById('capsule-vol-btn');
    const capsuleVolIcon = document.getElementById('capsule-vol-icon');
    const capsuleVolPopover = document.getElementById('capsule-vol-slider-popover');
    const capsuleVolumeSlider = document.getElementById('capsule-volume-slider');

    let progressRafId = null;

    const formatTime = (seconds) => {
        const s = Math.max(0, Math.floor(seconds || 0));
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    };

    const updateProgressFrame = () => {
        if (!window.lofiAudio || window.lofiAudio.paused || window.lofiAudio.ended) {
            if (progressRafId) {
                cancelAnimationFrame(progressRafId);
                progressRafId = null;
            }
            return;
        }

        const curr = window.lofiAudio.currentTime;
        const dur = window.lofiAudio.duration || 32;
        const pct = Math.min(100, Math.max(0, (curr / dur) * 100));

        if (capsuleProgressFill) {
            capsuleProgressFill.style.width = `${pct}%`;
        }
        if (capsuleCurrentTime) {
            capsuleCurrentTime.textContent = formatTime(curr);
        }
        if (capsuleProgressTrack) {
            capsuleProgressTrack.setAttribute('aria-valuenow', Math.round(pct));
        }

        progressRafId = requestAnimationFrame(updateProgressFrame);
    };

    const startProgressLoop = () => {
        if (progressRafId) {
            cancelAnimationFrame(progressRafId);
            progressRafId = null;
        }
        progressRafId = requestAnimationFrame(updateProgressFrame);
    };

    const stopProgressLoop = () => {
        if (progressRafId) {
            cancelAnimationFrame(progressRafId);
            progressRafId = null;
        }
        // Sync static state exactly once upon stopping
        if (window.lofiAudio) {
            const curr = window.lofiAudio.currentTime;
            const dur = window.lofiAudio.duration || 32;
            const pct = Math.min(100, Math.max(0, (curr / dur) * 100));
            if (capsuleProgressFill) capsuleProgressFill.style.width = `${pct}%`;
            if (capsuleCurrentTime) capsuleCurrentTime.textContent = formatTime(curr);
        }
    };

    const syncCapsuleMeta = (track) => {
        if (!track && window.lofiAudio) {
            track = window.lofiAudio.getCurrentTrack();
        }
        if (!track) return;

        if (capsuleTrackTitle) capsuleTrackTitle.textContent = track.name;
        if (capsuleTrackGenre) capsuleTrackGenre.textContent = track.genre;
        if (capsuleTotalTime) capsuleTotalTime.textContent = formatTime(window.lofiAudio ? window.lofiAudio.duration : 32);
    };

    const updatePlaybackUI = (isPlaying) => {
        if (audioCapsule) {
            if (isPlaying) {
                audioCapsule.classList.remove('paused');
                audioCapsule.classList.add('playing');
            } else {
                audioCapsule.classList.remove('playing');
                audioCapsule.classList.add('paused');
            }
        }

        if (capsulePlayBtn) {
            capsulePlayBtn.innerHTML = isPlaying
                ? '<i data-lucide="pause" style="width: 15px; height: 15px;"></i>'
                : '<i data-lucide="play" style="width: 15px; height: 15px; margin-left: 1px;"></i>';
            capsulePlayBtn.setAttribute('title', isPlaying ? 'Pause Ambient Sound' : 'Play Ambient Sound');
            capsulePlayBtn.setAttribute('aria-label', isPlaying ? 'Pause Ambient Sound' : 'Play Ambient Sound');
        }

        if (isPlaying) {
            startProgressLoop();
        } else {
            stopProgressLoop();
        }

        if (window.lucide) window.lucide.createIcons();
    };

    if (window.lofiAudio) {
        window.lofiAudio.addEventListener('play', () => {
            updatePlaybackUI(true);
        });

        window.lofiAudio.addEventListener('pause', () => {
            updatePlaybackUI(false);
        });

        window.lofiAudio.addEventListener('ended', () => {
            stopProgressLoop();
            if (capsuleProgressFill) capsuleProgressFill.style.width = '100%';
            updatePlaybackUI(false);
        });

        window.lofiAudio.addEventListener('timeupdate', () => {
            if (window.lofiAudio.paused) {
                const curr = window.lofiAudio.currentTime;
                const dur = window.lofiAudio.duration || 32;
                const pct = Math.min(100, Math.max(0, (curr / dur) * 100));
                if (capsuleProgressFill) capsuleProgressFill.style.width = `${pct}%`;
                if (capsuleCurrentTime) capsuleCurrentTime.textContent = formatTime(curr);
            }
        });

        window.lofiAudio.addEventListener('loadedmetadata', () => {
            syncCapsuleMeta(window.lofiAudio.getCurrentTrack());
        });

        window.lofiAudio.addEventListener('volumechange', () => {
            const vol = window.lofiAudio.volumeLevel;
            if (capsuleVolumeSlider) capsuleVolumeSlider.value = Math.round(vol * 100);
            if (capsuleVolIcon) {
                const iconName = vol === 0 ? 'volume-x' : (vol < 0.5 ? 'volume-1' : 'volume-2');
                capsuleVolIcon.setAttribute('data-lucide', iconName);
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    window.onAmbientTrackChange = (track) => {
        syncCapsuleMeta(track);
    };

    const togglePlayback = () => {
        triggerHaptic('button');
        if (window.lofiAudio) {
            window.lofiAudio.toggle();
        }
    };

    if (capsulePlayBtn) {
        attachTouchSafeClick(capsulePlayBtn, (e) => {
            e.stopPropagation();
            togglePlayback();
        });
    }

    if (capsulePrevBtn) {
        attachTouchSafeClick(capsulePrevBtn, (e) => {
            e.stopPropagation();
            triggerHaptic('button');
            if (window.lofiAudio) {
                window.lofiAudio.prevTrack();
            }
        });
    }

    if (capsuleNextBtn) {
        attachTouchSafeClick(capsuleNextBtn, (e) => {
            e.stopPropagation();
            triggerHaptic('button');
            if (window.lofiAudio) {
                window.lofiAudio.nextTrack();
            }
        });
    }

    // Click to seek on progress line
    if (capsuleProgressTrack) {
        attachTouchSafeClick(capsuleProgressTrack, (e) => {
            e.stopPropagation();
            if (!window.lofiAudio) return;
            const rect = capsuleProgressTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            window.lofiAudio.currentTime = pct * (window.lofiAudio.duration || 32);
        });
    }

    // Volume Slider & Mute Toggle
    let volTimeout = null;
    if (capsuleVolBtn) {
        attachTouchSafeClick(capsuleVolBtn, (e) => {
            e.stopPropagation();
            if (capsuleVolPopover) {
                const isOpen = capsuleVolPopover.classList.contains('open');
                if (isOpen) {
                    capsuleVolPopover.classList.remove('open');
                } else {
                    capsuleVolPopover.classList.add('open');
                    if (volTimeout) clearTimeout(volTimeout);
                    volTimeout = setTimeout(() => {
                        if (capsuleVolPopover) capsuleVolPopover.classList.remove('open');
                    }, 4000);
                }
            }
        });
    }

    if (capsuleVolumeSlider) {
        if (window.lofiAudio) {
            capsuleVolumeSlider.value = Math.round(window.lofiAudio.volumeLevel * 100);
        }
        capsuleVolumeSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            const val = parseInt(e.target.value, 10) / 100;
            if (window.lofiAudio) {
                window.lofiAudio.setVolume(val);
            }
            if (volTimeout) clearTimeout(volTimeout);
            volTimeout = setTimeout(() => {
                if (capsuleVolPopover) capsuleVolPopover.classList.remove('open');
            }, 3000);
        });
    }

    // Initialize Audio Capsule Meta
    if (window.lofiAudio) {
        syncCapsuleMeta(window.lofiAudio.getCurrentTrack());
        updatePlaybackUI(window.lofiAudio.isPlaying);
    }

    // 10. Contact Form Submissions (Vercel Serverless Function POST /api/contact)
    const inlineContactForm = document.getElementById('inline-contact-form');
    const submitBtn = document.getElementById('inline-form-submit-btn');
    const btnText = document.getElementById('btn-text');
    const successCard = document.getElementById('inline-form-success');
    const errorCard = document.getElementById('inline-form-error');
    const errorMsgText = document.getElementById('error-msg-text');
    const sendAnotherBtn = document.getElementById('send-another-btn');

    const showFormError = (msg) => {
        if (errorCard && errorMsgText) {
            errorMsgText.textContent = msg;
            errorCard.style.display = 'block';
        }
    };

    if (inlineContactForm) {
        inlineContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Client-side field extraction
            const nameInput = document.getElementById('inline-form-name');
            const emailInput = document.getElementById('inline-form-email');
            const subjectInput = document.getElementById('inline-form-subject');
            const phoneInput = document.getElementById('inline-form-phone');
            const messageInput = document.getElementById('inline-form-message');
            const websiteHoneypot = document.getElementById('inline-form-website');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const subject = subjectInput ? subjectInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';
            const website = websiteHoneypot ? websiteHoneypot.value : '';

            // 1. Client-Side Input Validation
            if (!name || name.length < 2) {
                showFormError('Please enter your name (at least 2 characters).');
                if (nameInput) nameInput.focus();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showFormError('Please enter a valid email address.');
                if (emailInput) emailInput.focus();
                return;
            }

            if (!message || message.length < 5) {
                showFormError('Please enter your message (at least 5 characters).');
                if (messageInput) messageInput.focus();
                return;
            }

            // Hide previous errors
            if (errorCard) errorCard.style.display = 'none';

            // 2. Set Submitting Loading State
            triggerHaptic('action');
            if (submitBtn) {
                submitBtn.disabled = true;
                if (btnText) btnText.textContent = 'SENDING...';
            }

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        subject: subject || 'New Portfolio Inquiry',
                        phone,
                        message,
                        website
                    })
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok && result.success) {
                    // Success State
                    triggerHaptic('reset');
                    if (inlineContactForm) inlineContactForm.style.display = 'none';
                    if (successCard) successCard.style.display = 'block';
                    inlineContactForm.reset();
                } else {
                    // Error State
                    triggerHaptic('button');
                    const err = result.message || "Message couldn't be sent. Please try again in a moment.";
                    showFormError(err);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        if (btnText) btnText.textContent = 'TRY AGAIN →';
                    }
                }
            } catch (networkErr) {
                console.warn('Contact API dispatch error:', networkErr);
                triggerHaptic('button');
                showFormError("Message couldn't be sent. Please try again or email directly to codewithshivamdev@gmail.com.");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    if (btnText) btnText.textContent = 'TRY AGAIN →';
                }
            }
        });
    }

    if (sendAnotherBtn) {
        sendAnotherBtn.addEventListener('click', () => {
            triggerHaptic('button');
            if (successCard) successCard.style.display = 'none';
            if (errorCard) errorCard.style.display = 'none';
            if (inlineContactForm) inlineContactForm.style.display = 'block';
            if (submitBtn) {
                submitBtn.disabled = false;
                if (btnText) btnText.textContent = 'SEND MESSAGE →';
            }
        });
    }

    // 11. Keyboard Navigation Controls
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.classList.contains('os-terminal-input');

        if (e.key === 'Escape') {
            if (window.virtualOS && window.virtualOS.isActive) {
                window.virtualOS.exitComputer();
                return;
            }

            const currentScroll = window.lenis ? window.lenis.scroll : window.scrollY;
            if (currentScroll > 150) {
                triggerHaptic('button');
                const homeEl = document.getElementById('home');
                if (window.lenis) {
                    window.lenis.scrollTo(homeEl || 0, { offset: 0, duration: 1.1 });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
            return;
        }

        if (isTyping) return;

        if (e.key === 'ArrowLeft') {
            updateProjectDisplay(currentProjectIndex - 1, true);
        } else if (e.key === 'ArrowRight') {
            updateProjectDisplay(currentProjectIndex + 1, true);
        }

        if (e.key === 'm' || e.key === 'M') {
            togglePlayback();
        }

        if (e.key === 'l' || e.key === 'L') {
            if (lampBtn) lampBtn.click();
        }
    });

    // 12. Initialize Virtual Computer OS
    if (window.virtualOS) {
        window.virtualOS.init();
    }
});
