// Advanced Multi-Track Ambient Music System & Audio Engine - Web Audio API
class AmbientMusicSystem {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.analyser = null;
        this.dataArray = null;
        this.masterGain = null;
        this.currentTrackGain = null;
        this.trackTimer = null;
        this.activeNodes = [];
        this.volumeLevel = 0.30; // Target 30% default master volume (calibrated for mobile & desktop)
        this.autoMinimizeTimer = null;
        this.isExpanded = false;
        
        // Exact Audio Clock Synchronization Properties
        this.trackElapsed = 0.0;
        this.trackDuration = 32.0;
        this.lastTickTime = null;
        this.chordStep = 0;
        this.playlist = [];
        this.playlistIndex = 0;
        this.isEnded = false;
        this.eventListeners = {};
        
        // Restore volume preference if present
        const savedVol = localStorage.getItem('portfolio_audio_volume');
        if (savedVol !== null) {
            const parsed = parseFloat(savedVol);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                this.volumeLevel = parsed;
            }
        }

        // 8 Royalty-Free Calm studio ambient tracks with distinct musical moods
        this.trackCatalog = [
            {
                id: "ambient-01",
                name: "Deep Focus",
                genre: "Vintage Lo-Fi Rhodes",
                bpm: 68,
                chords: [
                    [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
                    [98.00, 146.83, 196.00, 246.94, 329.63],  // G13
                    [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
                    [110.00, 130.81, 164.81, 196.00, 246.94]  // Am9
                ],
                timbre: "warm_rhodes",
                tempoSec: 4.0
            },
            {
                id: "ambient-02",
                name: "Cyber Lounge",
                genre: "Ethereal Pad & 9th Intervals",
                bpm: 60,
                chords: [
                    [130.81, 196.00, 246.94, 293.66, 392.00], // Cmaj9
                    [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
                    [164.81, 246.94, 293.66, 392.00, 493.88], // Em9
                    [123.47, 185.00, 220.00, 293.66, 370.00]  // Bm7(b13)
                ],
                timbre: "ambient_pad",
                tempoSec: 4.0
            },
            {
                id: "ambient-03",
                name: "Midnight Code",
                genre: "Calm Minimalist Synth",
                bpm: 64,
                chords: [
                    [110.00, 164.81, 220.00, 261.63, 329.63], // Am9
                    [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7
                    [98.00, 146.83, 196.00, 246.94, 293.66],  // G6
                    [130.81, 196.00, 261.63, 329.63, 392.00]  // Cmaj7
                ],
                timbre: "analog_soft",
                tempoSec: 4.0
            },
            {
                id: "ambient-04",
                name: "Ethereal Horizon",
                genre: "Cinematic Ambient Atmosphere",
                bpm: 54,
                chords: [
                    [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
                    [196.00, 246.94, 293.66, 370.00, 440.00], // Gmaj9
                    [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
                    [110.00, 164.81, 220.00, 246.94, 329.63]  // Asus4(9)
                ],
                timbre: "shimmer_reverb",
                tempoSec: 4.0
            },
            {
                id: "ambient-05",
                name: "Warm Resonance",
                genre: "Acoustic Mellow Harmonics",
                bpm: 58,
                chords: [
                    [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj9
                    [110.00, 146.83, 174.61, 220.00, 261.63], // Dm7/A
                    [123.47, 164.81, 196.00, 246.94, 293.66], // Em7/B
                    [87.31, 130.81, 174.61, 220.00, 329.63]   // Fmaj9
                ],
                timbre: "acoustic_mellow",
                tempoSec: 4.0
            },
            {
                id: "ambient-06",
                name: "Solitude & Sunsets",
                genre: "Warm Tape Saturation",
                bpm: 62,
                chords: [
                    [98.00, 146.83, 196.00, 246.94, 293.66],  // Gmaj7
                    [110.00, 164.81, 220.00, 261.63, 329.63], // Am7
                    [123.47, 185.00, 220.00, 293.66, 370.00], // Bm7
                    [130.81, 196.00, 246.94, 293.66, 392.00]  // Cmaj7
                ],
                timbre: "analog_soft",
                tempoSec: 4.0
            },
            {
                id: "ambient-07",
                name: "Night Owl Code",
                genre: "Minimalist Soft Synth",
                bpm: 66,
                chords: [
                    [110.00, 146.83, 174.61, 220.00, 261.63], // Dm7/A
                    [123.47, 164.81, 196.00, 246.94, 293.66], // Em7/B
                    [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj9
                    [146.83, 220.00, 261.63, 329.63, 392.00]  // Dsus4(9)
                ],
                timbre: "ambient_pad",
                tempoSec: 3.7
            },
            {
                id: "ambient-08",
                name: "Velvet Breeze",
                genre: "Gentle Electric Piano",
                bpm: 56,
                chords: [
                    [130.81, 164.81, 196.00, 261.63, 329.63], // Cmaj7
                    [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
                    [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7
                    [98.00, 146.83, 196.00, 246.94, 329.63]   // G13
                ],
                timbre: "warm_rhodes",
                tempoSec: 4.1
            }
        ];

        this.shufflePlaylist();
        this.updateCurrentTrackDuration();

        // Check if sound was previously enabled or blocked
        const savedPref = localStorage.getItem('portfolio_sound_enabled');
        this.soundPreference = savedPref !== 'false';
    }

    // Standard HTMLAudioElement properties
    get currentTime() {
        if (this.isPlaying && this.lastTickTime !== null) {
            const now = performance.now();
            const delta = (now - this.lastTickTime) / 1000;
            return Math.min(this.trackDuration, this.trackElapsed + delta);
        }
        return this.trackElapsed;
    }

    set currentTime(val) {
        this.trackElapsed = Math.max(0, Math.min(this.trackDuration, val));
        this.lastTickTime = performance.now();
        this.dispatchEvent('timeupdate');
    }

    get duration() {
        return this.trackDuration;
    }

    get paused() {
        return !this.isPlaying;
    }

    get ended() {
        return this.isEnded;
    }

    // Standard Event Handling
    addEventListener(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (!this.eventListeners[event]) return;
        this.eventListeners[event] = this.eventListeners[event].filter(fn => fn !== callback);
    }

    dispatchEvent(eventName, detail = {}) {
        const listeners = this.eventListeners[eventName];
        if (listeners) {
            listeners.forEach(fn => {
                try { fn({ type: eventName, target: this, ...detail }); } catch (e) { console.error(e); }
            });
        }
    }

    updateCurrentTrackDuration() {
        const track = this.getCurrentTrack();
        // 8 chord steps per full track progression
        this.trackDuration = (track ? track.tempoSec : 4.0) * 8;
        this.dispatchEvent('durationchange');
        this.dispatchEvent('loadedmetadata');
    }

    shufflePlaylist() {
        const count = this.trackCatalog.length;
        const indices = Array.from({ length: count }, (_, i) => i);
        // Fisher-Yates Shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        if (this.playlist && this.playlist.length > 0 && indices[0] === this.playlist[this.playlist.length - 1]) {
            [indices[0], indices[1]] = [indices[1], indices[0]];
        }

        this.playlist = indices;
        this.playlistIndex = 0;
    }

    getCurrentTrack() {
        const trackIdx = this.playlist[this.playlistIndex] || 0;
        return this.trackCatalog[trackIdx];
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();

            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 64;
            this.analyser.smoothingTimeConstant = 0.85;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);

            this.startSubtleNoiseBed();

            // Monitor browser tab visibility changes for Audio Context suspension
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.suspendAudio();
                } else {
                    this.resumeAudio();
                }
            }, { passive: true });
        } catch (e) {
            console.warn('AudioContext initialization failed or blocked by policy:', e);
        }
    }

    suspendAudio() {
        if (this.trackTimer) {
            clearTimeout(this.trackTimer);
            this.trackTimer = null;
        }
        this.stopAllActiveNodes();
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
    }

    resumeAudio() {
        if (!this.isPlaying) return;
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch((err) => {
                console.warn('AudioContext resume notice:', err);
            });
        }
        if (!this.trackTimer) {
            this.playProgression();
        }
    }

    stopAllActiveNodes() {
        this.activeNodes.forEach(nodes => {
            try {
                if (nodes.osc) {
                    nodes.osc.stop();
                    nodes.osc.disconnect();
                }
                if (nodes.filter) nodes.filter.disconnect();
                if (nodes.gain) nodes.gain.disconnect();
            } catch (e) {}
        });
        this.activeNodes = [];
    }

    setVolume(val) {
        this.volumeLevel = Math.max(0, Math.min(1, val));
        localStorage.setItem('portfolio_audio_volume', this.volumeLevel.toFixed(2));
        if (this.masterGain && this.ctx) {
            try {
                this.masterGain.gain.setTargetAtTime(this.volumeLevel, this.ctx.currentTime, 0.05);
            } catch (e) {
                this.masterGain.gain.value = this.volumeLevel;
            }
        }
        this.dispatchEvent('volumechange');
    }

    getVolume() {
        return this.volumeLevel;
    }

    startSubtleNoiseBed() {
        if (!this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.008;
                if (Math.random() < 0.0004) {
                    output[i] += (Math.random() * 2 - 1) * 0.08;
                }
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            whiteNoise.start();

            // Track background noise source node
            this.activeNodes.push({ osc: whiteNoise, gain: noiseGain, filter: filter });
        } catch (e) {}
    }

    playProgression() {
        if (!this.isPlaying) return;

        const currentTrack = this.getCurrentTrack();
        const duration = currentTrack.tempoSec;

        if (this.ctx && this.ctx.state !== 'closed') {
            const chords = currentTrack.chords;
            const chord = chords[this.chordStep % chords.length];
            const now = this.ctx.currentTime;

            chord.forEach((freq, i) => {
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const filter = this.ctx.createBiquadFilter();

                    osc.type = i === 0 ? 'sine' : (currentTrack.timbre === 'shimmer_reverb' ? 'sawtooth' : 'triangle');
                    osc.frequency.setValueAtTime(freq, now);
                    osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

                    filter.type = 'lowpass';
                    const cutoff = currentTrack.timbre === 'shimmer_reverb' ? 1000 : 650;
                    filter.frequency.setValueAtTime(cutoff, now);
                    filter.frequency.exponentialRampToValueAtTime(360, now + duration * 0.85);

                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.09 / (i * 0.4 + 1), now + 0.6 + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);

                    const nodeRef = { osc, gain, filter };
                    this.activeNodes.push(nodeRef);

                    osc.onended = () => {
                        try {
                            osc.disconnect();
                            filter.disconnect();
                            gain.disconnect();
                        } catch (err) {}
                        this.activeNodes = this.activeNodes.filter(n => n !== nodeRef);
                    };

                    osc.start(now + i * 0.04);
                    osc.stop(now + duration + 0.1);
                } catch (e) {}
            });

            // Warm Bass Pulse
            try {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(chord[0] / 2, now);
                bassGain.gain.setValueAtTime(0.001, now);
                bassGain.gain.linearRampToValueAtTime(0.12, now + 0.25);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);
                bassOsc.connect(bassGain);
                bassGain.connect(this.masterGain);

                const bassNodeRef = { osc: bassOsc, gain: bassGain };
                this.activeNodes.push(bassNodeRef);

                bassOsc.onended = () => {
                    try {
                        bassOsc.disconnect();
                        bassGain.disconnect();
                    } catch (err) {}
                    this.activeNodes = this.activeNodes.filter(n => n !== bassNodeRef);
                };

                bassOsc.start(now);
                bassOsc.stop(now + duration);
            } catch (e) {}
        }

        this.chordStep++;
        this.lastTickTime = performance.now();

        // Advance track when 8 chords have completed
        if (this.chordStep >= 8) {
            this.dispatchEvent('ended');
            this.crossfadeToNextTrack();
            return;
        }

        this.trackTimer = setTimeout(() => {
            this.trackElapsed += duration;
            this.playProgression();
        }, duration * 1000 * 0.96);
    }

    nextTrack() {
        this.crossfadeToNextTrack();
    }

    prevTrack() {
        this.playlistIndex = (this.playlistIndex - 1 + this.playlist.length) % this.playlist.length;
        this.resetTrackState();
        const track = this.getCurrentTrack();
        this.updateCurrentTrackDuration();
        if (window.onAmbientTrackChange) {
            window.onAmbientTrackChange(track);
        }
        if (this.isPlaying) {
            if (this.trackTimer) clearTimeout(this.trackTimer);
            this.lastTickTime = performance.now();
            this.playProgression();
        }
        this.dispatchEvent('timeupdate');
    }

    resetTrackState() {
        this.chordStep = 0;
        this.trackElapsed = 0.0;
        this.lastTickTime = this.isPlaying ? performance.now() : null;
        this.isEnded = false;
    }

    crossfadeToNextTrack() {
        this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
        if (this.playlistIndex === 0) {
            this.shufflePlaylist();
        }
        this.resetTrackState();
        this.updateCurrentTrackDuration();
        
        const track = this.getCurrentTrack();
        if (window.onAmbientTrackChange) {
            window.onAmbientTrackChange(track);
        }
        if (this.isPlaying) {
            if (this.trackTimer) clearTimeout(this.trackTimer);
            this.lastTickTime = performance.now();
            this.playProgression();
        }
        this.dispatchEvent('timeupdate');
    }

    play() {
        try {
            if (!this.ctx) this.init();
            this.isPlaying = true;
            this.isEnded = false;
            this.lastTickTime = performance.now();
            localStorage.setItem('portfolio_sound_enabled', 'true');
            this.resumeAudio();
            const track = this.getCurrentTrack();
            if (window.onAmbientTrackChange) {
                window.onAmbientTrackChange(track);
            }
            this.dispatchEvent('play');
            return true;
        } catch (err) {
            console.warn('Audio playback error:', err);
            this.isPlaying = false;
            return false;
        }
    }

    pause() {
        if (this.isPlaying && this.lastTickTime !== null) {
            const now = performance.now();
            this.trackElapsed = Math.min(this.trackDuration, this.trackElapsed + (now - this.lastTickTime) / 1000);
        }
        this.lastTickTime = null;
        this.isPlaying = false;
        if (this.trackTimer) {
            clearTimeout(this.trackTimer);
            this.trackTimer = null;
        }
        localStorage.setItem('portfolio_sound_enabled', 'false');
        this.suspendAudio();
        this.dispatchEvent('pause');
        this.dispatchEvent('timeupdate');
        return false;
    }

    toggle() {
        if (this.isPlaying) {
            return this.pause();
        } else {
            return this.play();
        }
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(16);
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}

window.lofiAudio = new AmbientMusicSystem();
