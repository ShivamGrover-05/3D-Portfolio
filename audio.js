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
        this.volumeLevel = 0.30; // Target 30% default volume (audible on mobile & desktop)
        
        // Restore volume preference if present
        const savedVol = localStorage.getItem('portfolio_audio_volume');
        if (savedVol !== null) {
            const parsed = parseFloat(savedVol);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                this.volumeLevel = parsed;
            }
        }

        // 5 Calm studio ambient tracks with distinct musical moods
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
                tempoSec: 3.6
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
                tempoSec: 4.2
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
                tempoSec: 3.8
            },
            {
                id: "ambient-04",
                name: "Ethereal Waves",
                genre: "Cinematic Ambient Horizon",
                bpm: 54,
                chords: [
                    [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
                    [196.00, 246.94, 293.66, 370.00, 440.00], // Gmaj9
                    [146.83, 220.00, 261.63, 329.63, 440.00], // Dm9
                    [110.00, 164.81, 220.00, 246.94, 329.63]  // Asus4(9)
                ],
                timbre: "shimmer_reverb",
                tempoSec: 4.5
            },
            {
                id: "ambient-05",
                name: "Calm Reverie",
                genre: "Warm Acoustic Resonance",
                bpm: 58,
                chords: [
                    [130.81, 164.81, 196.00, 246.94, 329.63], // Cmaj9
                    [110.00, 146.83, 174.61, 220.00, 261.63], // Dm7/A
                    [123.47, 164.81, 196.00, 246.94, 293.66], // Em7/B
                    [87.31, 130.81, 174.61, 220.00, 329.63]   // Fmaj9
                ],
                timbre: "acoustic_mellow",
                tempoSec: 4.0
            }
        ];

        this.playlist = [];
        this.playlistIndex = 0;
        this.chordStep = 0;
        this.shufflePlaylist();

        // Restore sound preference if available
        const savedPref = localStorage.getItem('portfolio_sound_enabled');
        this.soundPreference = savedPref === 'true';
    }

    shufflePlaylist() {
        const indices = [0, 1, 2, 3, 4];
        // Fisher-Yates Shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Avoid repeating the previous track on reshuffle
        if (this.playlist.length > 0 && indices[0] === this.playlist[this.playlist.length - 1]) {
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
            // Clear, calibrated 30% master volume
            this.masterGain.gain.setValueAtTime(this.volumeLevel, this.ctx.currentTime);
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);

            this.createSubtleVinylNoise();
        } catch (e) {
            console.warn('AudioContext initialization failed or blocked by policy:', e);
        }
    }

    setVolume(val) {
        this.volumeLevel = Math.max(0, Math.min(1, val));
        localStorage.setItem('portfolio_audio_volume', this.volumeLevel.toFixed(2));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.volumeLevel, this.ctx.currentTime, 0.05);
        }
    }

    getVolume() {
        return this.volumeLevel;
    }

    createSubtleVinylNoise() {
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
        } catch (e) {
            // Audio policy ignore
        }
    }

    playProgression() {
        if (!this.isPlaying || !this.ctx) return;

        const currentTrack = this.getCurrentTrack();
        const chords = currentTrack.chords;
        const chord = chords[this.chordStep % chords.length];
        const now = this.ctx.currentTime;
        const duration = currentTrack.tempoSec;

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
                // Clear, rich acoustic chord envelope
                gain.gain.linearRampToValueAtTime(0.09 / (i * 0.4 + 1), now + 0.6 + i * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

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
            bassOsc.start(now);
            bassOsc.stop(now + duration);
        } catch (e) {}

        this.chordStep++;

        // Every 8 chords (approx 30 seconds), crossfade to next shuffled track
        if (this.chordStep % 8 === 0) {
            this.crossfadeToNextTrack();
        }

        // Schedule next chord
        this.trackTimer = setTimeout(() => {
            this.playProgression();
        }, duration * 1000 * 0.95);
    }

    crossfadeToNextTrack() {
        this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
        if (this.playlistIndex === 0) {
            this.shufflePlaylist();
        }
        
        // Notify UI of track change
        const track = this.getCurrentTrack();
        if (window.onAmbientTrackChange) {
            window.onAmbientTrackChange(track);
        }
    }

    toggle() {
        if (!this.ctx) {
            this.init();
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isPlaying = !this.isPlaying;
        localStorage.setItem('portfolio_sound_enabled', this.isPlaying ? 'true' : 'false');

        if (this.isPlaying) {
            this.playProgression();
            const track = this.getCurrentTrack();
            if (window.onAmbientTrackChange) {
                window.onAmbientTrackChange(track);
            }
        } else {
            if (this.trackTimer) clearTimeout(this.trackTimer);
        }

        return this.isPlaying;
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(16);
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
}

window.lofiAudio = new AmbientMusicSystem();
