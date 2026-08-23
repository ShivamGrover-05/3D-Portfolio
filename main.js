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
    // 1. Initialize Lenis Smooth Scrolling Engine (Responsive & non-delayed on mobile)
    let lenis = null;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: prefersReducedMotion ? 0 : (isTouch ? 0.9 : 1.1),
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.2,
            infinite: false
        });

        window.lenis = lenis;

        // Synchronize with GSAP ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
        }

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

        // Update Counter
        if (indexCounter) {
            indexCounter.textContent = `${p.number} / 0${projects.length}`;
        }

        // Update Switcher Active State
        switcherButtons.forEach((btn, idx) => {
            btn.classList.toggle('active', idx === currentProjectIndex);
        });

        if (window.gsap && !prefersReducedMotion && coverImg) {
            window.gsap.to(coverImg, {
                opacity: 0,
                scale: 0.96,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    coverImg.src = p.coverImage;
                    window.gsap.to(coverImg, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" });
                }
            });

            if (infoContainer) {
                window.gsap.fromTo(infoContainer, 
                    { opacity: 0.4, y: 10 }, 
                    { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
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

        // Synchronize 3D Camera with Active Project
        if (moveCamera && window.studioScene && typeof window.studioScene.focusOnProjectObject === 'function') {
            window.studioScene.focusOnProjectObject(p);
        }
    };

    window.selectProjectById = (id) => {
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            updateProjectDisplay(idx, true);
        }
    };

    // 4. Switcher Button Click Listeners
    switcherButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            updateProjectDisplay(idx, true);
        });
    });

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

    // 5. Touch Swipe Navigation for Exhibition Stage
    let touchStartX = 0;
    let touchEndX = 0;
    const exhibitionStage = document.querySelector('.exhibition-stage');

    if (exhibitionStage) {
        exhibitionStage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        exhibitionStage.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 50) {
                if (diff < 0) {
                    updateProjectDisplay(currentProjectIndex + 1, true);
                } else {
                    updateProjectDisplay(currentProjectIndex - 1, true);
                }
            }
        }, { passive: true });
    }

    if (projects.length > 0) {
        updateProjectDisplay(0, false);
    }

    // 6. Section Scroll Tracking & 3D Choreography
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    let lastSection = 'home';
    let isThrottled = false;

    const updateActiveNav = () => {
        if (isThrottled) return;
        isThrottled = true;
        requestAnimationFrame(() => {
            isThrottled = false;
        });

        let current = 'home';
        const scrollPosition = (window.lenis ? window.lenis.scroll : window.scrollY) + window.innerHeight * 0.35;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
                break;
            }
        }

        if (current !== lastSection) {
            lastSection = current;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('data-section') === current);
            });

            if (window.studioScene && typeof window.studioScene.transitionToSection === 'function') {
                window.studioScene.transitionToSection(current);
            }
        }
    };

    if (lenis) {
        lenis.on('scroll', updateActiveNav);
    } else {
        window.addEventListener('scroll', updateActiveNav, { passive: true });
    }

    // Smooth Anchor Navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#' || href.length <= 1) return;
            const targetEl = document.querySelector(href);
            if (targetEl) {
                e.preventDefault();
                triggerHaptic('button');
                if (window.lenis) {
                    window.lenis.scrollTo(targetEl, { offset: 0, duration: 1.1 });
                } else {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 7. Studio Desk Lamp Toggle Control
    const lampBtn = document.getElementById('toggle-lamp-btn');
    if (lampBtn) {
        lampBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerHaptic('button');
            if (window.studioScene && typeof window.studioScene.toggleDeskLamp === 'function') {
                const isOn = window.studioScene.toggleDeskLamp();
                lampBtn.style.color = isOn ? 'var(--accent-cyan)' : 'var(--text-muted)';
                lampBtn.style.borderColor = isOn ? 'var(--accent-cyan)' : 'var(--border-color)';
            }
        });
    }

    // 8. Ambient Audio System & Compact Control Widget
    const audioWidget = document.getElementById('audio-widget');
    const volumeIcon = document.getElementById('volume-icon');
    const eqBars = [
        document.getElementById('eq1'),
        document.getElementById('eq2'),
        document.getElementById('eq3'),
        document.getElementById('eq4'),
        document.getElementById('eq5')
    ];

    let audioVisualizerLoop = null;

    const animateVisualizer = () => {
        if (window.lofiAudio && window.lofiAudio.isPlaying) {
            const freqs = window.lofiAudio.getFrequencyData();
            if (freqs && freqs.length >= 5) {
                eqBars.forEach((bar, i) => {
                    if (bar) {
                        const val = freqs[i * 2 + 1] || 0;
                        const height = Math.max(4, Math.min(22, (val / 255) * 24 + Math.random() * 4));
                        bar.style.height = `${height}px`;
                    }
                });
            }
            audioVisualizerLoop = requestAnimationFrame(animateVisualizer);
        } else {
            eqBars.forEach(bar => {
                if (bar) bar.style.height = '4px';
            });
        }
    };

    const updateAudioWidgetUI = (track) => {
        const audioLabel = document.querySelector('.audio-label');
        if (audioLabel && track) {
            audioLabel.innerHTML = `NOW PLAYING: <span class="track-name">${track.name}</span> • <span style="color: var(--text-dim);">${track.genre}</span>`;
        }
    };

    window.onAmbientTrackChange = (track) => {
        updateAudioWidgetUI(track);
    };

    const toggleAudio = () => {
        triggerHaptic('button');
        if (window.lofiAudio) {
            const isPlaying = window.lofiAudio.toggle();
            if (isPlaying) {
                if (audioWidget) audioWidget.style.borderColor = 'var(--accent-green)';
                if (volumeIcon) {
                    volumeIcon.setAttribute('data-lucide', 'volume-2');
                    volumeIcon.style.color = 'var(--accent-green)';
                }
                const track = window.lofiAudio.getCurrentTrack();
                updateAudioWidgetUI(track);
                animateVisualizer();
            } else {
                if (audioWidget) audioWidget.style.borderColor = 'var(--border-color)';
                if (volumeIcon) {
                    volumeIcon.setAttribute('data-lucide', 'volume-x');
                    volumeIcon.style.color = 'var(--text-muted)';
                }
                const audioLabel = document.querySelector('.audio-label');
                if (audioLabel) {
                    audioLabel.innerHTML = `SOUND: <span style="color: var(--text-dim);">PAUSED / OFF</span>`;
                }
                if (audioVisualizerLoop) cancelAnimationFrame(audioVisualizerLoop);
                eqBars.forEach(bar => { if (bar) bar.style.height = '4px'; });
            }
            if (window.lucide) window.lucide.createIcons();
        }
    };

    if (audioWidget) {
        audioWidget.addEventListener('click', toggleAudio);
    }

    // 9. Contact Modal
    const contactModal = document.getElementById('contact-modal');
    const openModalBtns = document.querySelectorAll('#open-contact-modal-btn, .open-contact-trigger, .nav-actions a[href="#contact"]');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const contactForm = document.getElementById('contact-form');
    const formSuccessMsg = document.getElementById('form-success-msg');

    const openModal = (e) => {
        if (e) e.preventDefault();
        triggerHaptic('button');
        if (contactModal) contactModal.classList.add('active');
    };

    const closeModal = () => {
        triggerHaptic('button');
        if (contactModal) contactModal.classList.remove('active');
    };

    openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeModal();
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            triggerHaptic('action');
            const name = document.getElementById('form-name').value;
            const email = document.getElementById('form-email').value;
            const message = document.getElementById('form-message').value;

            if (formSuccessMsg) {
                formSuccessMsg.style.display = 'block';
            }

            const subject = encodeURIComponent(`Collaboration Inquiry from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

            setTimeout(() => {
                window.location.href = `mailto:shivamgrover.dev@gmail.com?subject=${subject}&body=${body}`;
                setTimeout(() => {
                    closeModal();
                    contactForm.reset();
                    if (formSuccessMsg) formSuccessMsg.style.display = 'none';
                }, 1200);
            }, 600);
        });
    }

    // 10. Comprehensive Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.classList.contains('os-terminal-input');

        if (e.key === 'Escape') {
            if (window.virtualOS && window.virtualOS.isActive) {
                window.virtualOS.exitComputer();
                return;
            }

            if (contactModal && contactModal.classList.contains('active')) {
                closeModal();
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
                if (window.studioScene && typeof window.studioScene.transitionToSection === 'function') {
                    window.studioScene.transitionToSection('home');
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

        const sectionMap = {
            '1': '#home',
            '2': '#about',
            '3': '#projects',
            '4': '#skills',
            '5': '#experience',
            '6': '#contact'
        };

        if (sectionMap[e.key]) {
            const targetSec = document.querySelector(sectionMap[e.key]);
            if (targetSec) {
                triggerHaptic('button');
                if (window.lenis) {
                    window.lenis.scrollTo(targetSec, { offset: 0, duration: 1.1 });
                } else {
                    targetSec.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }

        if (e.key === 'm' || e.key === 'M') {
            toggleAudio();
        }

        if (e.key === 'l' || e.key === 'L') {
            if (lampBtn) lampBtn.click();
        }
    });

    // 11. Initialize Virtual Computer OS
    if (window.virtualOS) {
        window.virtualOS.init();
    }
});
