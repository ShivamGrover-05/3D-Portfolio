// ==========================================================================
// NOVA // AI ASSISTANT - Next-Level Autonomous Portfolio Conversational Engine
// Features: NVIDIA NIM Integration, Glassmorphic Cyberpunk HUD, Procedural Web Audio,
// Web Speech Recognition & Synthesis, Interactive Action Routing & 3D Integration.
// ==========================================================================

(() => {
    'use strict';



    // 1. Procedural Web Audio Synthesizer
    class CyberAudioSynth {
        constructor() {
            this.ctx = null;
            this.isMuted = localStorage.getItem('nova_ai_muted') === 'true';
        }

        initContext() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playSend() {
            if (this.isMuted) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = this.ctx.currentTime;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(480, t);
                osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.08);
            } catch (e) {}
        }

        playReceive() {
            if (this.isMuted) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                const notes = [587.33, 880, 1174.66]; // D5, A5, D6
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = this.ctx.currentTime + (idx * 0.04);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t);

                    gain.gain.setValueAtTime(0.05, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(t);
                    osc.stop(t + 0.16);
                });
            } catch (e) {}
        }

        playPop() {
            if (this.isMuted) return;
            try {
                this.initContext();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = this.ctx.currentTime;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, t);
                osc.frequency.exponentialRampToValueAtTime(640, t + 0.05);

                gain.gain.setValueAtTime(0.06, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.06);
            } catch (e) {}
        }

        toggleMute() {
            this.isMuted = !this.isMuted;
            localStorage.setItem('nova_ai_muted', this.isMuted);
            return this.isMuted;
        }
    }

    // 2. Chatbot State & Controller
    class NovaChatbot {
        constructor() {
            this.isOpen = false;
            this.isGenerating = false;
            this.synth = new CyberAudioSynth();
            this.messages = [];
            this.speechUtterance = null;
            this.isSpeaking = false;
            this.recognition = null;
            this.isListening = false;

            this.dom = {};
            this.initDOM();
            this.initSpeechRecognition();
            this.loadHistory();
            this.bindEvents();
        }

        initDOM() {
            this.dom.launcher = document.getElementById('chatbot-launcher');
            this.dom.invitePill = document.getElementById('chatbot-invite-pill');
            this.dom.window = document.getElementById('chatbot-window');
            this.dom.closeBtn = document.getElementById('chatbot-close-btn');
            this.dom.muteBtn = document.getElementById('chatbot-mute-btn');
            this.dom.clearBtn = document.getElementById('chatbot-clear-btn');
            this.dom.messagesList = document.getElementById('chatbot-messages');
            this.dom.input = document.getElementById('chatbot-input');
            this.dom.sendBtn = document.getElementById('chatbot-send-btn');
            this.dom.micBtn = document.getElementById('chatbot-mic-btn');
            this.dom.typingIndicator = document.getElementById('chatbot-typing-indicator');
            this.dom.suggestionsContainer = document.getElementById('chatbot-suggestions');

            // Sync mute icon initial state
            this.updateMuteIcon();
        }

        initSpeechRecognition() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                this.recognition = new SpeechRec();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';

                this.recognition.onstart = () => {
                    this.isListening = true;
                    if (this.dom.micBtn) {
                        this.dom.micBtn.classList.add('recording');
                        this.dom.micBtn.setAttribute('title', 'Listening... click to stop');
                    }
                    if (this.dom.input) {
                        this.dom.input.placeholder = 'Listening to your voice...';
                    }
                };

                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    if (this.dom.input && transcript) {
                        this.dom.input.value = transcript;
                        this.autoResizeInput();
                    }
                };

                this.recognition.onerror = (e) => {
                    console.warn('Speech recognition error:', e);
                    this.stopListening();
                };

                this.recognition.onend = () => {
                    this.stopListening();
                };
            } else if (this.dom.micBtn) {
                this.dom.micBtn.style.display = 'none';
            }
        }

        toggleSpeechRecognition() {
            if (!this.recognition) return;
            if (this.isListening) {
                this.recognition.stop();
            } else {
                try {
                    this.recognition.start();
                } catch (e) {
                    this.recognition.stop();
                }
            }
        }

        stopListening() {
            this.isListening = false;
            if (this.dom.micBtn) {
                this.dom.micBtn.classList.remove('recording');
                this.dom.micBtn.setAttribute('title', 'Voice Dictation');
            }
            if (this.dom.input) {
                this.dom.input.placeholder = 'Ask ULTRON anything about Shivam...';
            }
        }

        bindEvents() {
            // Launcher button
            if (this.dom.launcher) {
                this.dom.launcher.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleWindow();
                });
            }

            // Invite pill
            if (this.dom.invitePill) {
                this.dom.invitePill.addEventListener('click', (e) => {
                    if (e.target.closest('#chatbot-invite-close')) {
                        e.stopPropagation();
                        this.dom.invitePill.style.display = 'none';
                        return;
                    }
                    this.openWindow();
                });
            }

            // Close button
            if (this.dom.closeBtn) {
                this.dom.closeBtn.addEventListener('click', () => {
                    this.closeWindow();
                });
            }

            // Mute button
            if (this.dom.muteBtn) {
                this.dom.muteBtn.addEventListener('click', () => {
                    const isMuted = this.synth.toggleMute();
                    this.updateMuteIcon();
                    if (!isMuted) this.synth.playPop();
                });
            }

            // Clear history button
            if (this.dom.clearBtn) {
                this.dom.clearBtn.addEventListener('click', () => {
                    this.clearHistory();
                });
            }

            // Mic button
            if (this.dom.micBtn) {
                this.dom.micBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleSpeechRecognition();
                });
            }

            // Send button
            if (this.dom.sendBtn) {
                this.dom.sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSendMessage();
                });
            }

            // Text input keyboard handler
            if (this.dom.input) {
                this.dom.input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.handleSendMessage();
                    }
                });

                this.dom.input.addEventListener('input', () => {
                    this.autoResizeInput();
                });
            }

            // Suggestion chips delegation
            if (this.dom.suggestionsContainer) {
                this.dom.suggestionsContainer.addEventListener('click', (e) => {
                    const chip = e.target.closest('.chat-suggestion-chip');
                    if (chip) {
                        const query = chip.getAttribute('data-query');
                        if (query) {
                            this.sendUserMessage(query);
                        }
                    }
                });
            }

            // Action links delegation (markdown action links)
            if (this.dom.messagesList) {
                this.dom.messagesList.addEventListener('click', (e) => {
                    const actionBtn = e.target.closest('[data-chat-action]');
                    if (actionBtn) {
                        e.preventDefault();
                        const action = actionBtn.getAttribute('data-chat-action');
                        this.handleActionClick(action);
                    }

                    // Copy code block button
                    const copyCodeBtn = e.target.closest('.chat-copy-code-btn');
                    if (copyCodeBtn) {
                        e.preventDefault();
                        const codeElem = copyCodeBtn.closest('.chat-code-block').querySelector('code');
                        if (codeElem) {
                            navigator.clipboard.writeText(codeElem.innerText).then(() => {
                                copyCodeBtn.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> Copied!';
                                if (window.lucide) lucide.createIcons();
                                setTimeout(() => {
                                    copyCodeBtn.innerHTML = '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copy';
                                    if (window.lucide) lucide.createIcons();
                                }, 2000);
                            });
                        }
                    }

                    // Read aloud button
                    const speakBtn = e.target.closest('.chat-msg-speak-btn');
                    if (speakBtn) {
                        e.preventDefault();
                        const bubble = speakBtn.closest('.chat-bubble-bot');
                        const text = bubble ? bubble.getAttribute('data-raw-text') : '';
                        this.toggleTextToSpeech(text, speakBtn);
                    }
                });
            }

            // Prevent scroll locking / leakage into Lenis smooth scroll
            const preventScrollHijack = (e) => {
                e.stopPropagation();
            };

            if (this.dom.window) {
                this.dom.window.addEventListener('wheel', preventScrollHijack, { passive: true });
                this.dom.window.addEventListener('touchmove', preventScrollHijack, { passive: true });
            }

            const chatBody = document.querySelector('.chatbot-body');
            if (chatBody) {
                chatBody.addEventListener('wheel', preventScrollHijack, { passive: true });
                chatBody.addEventListener('touchmove', preventScrollHijack, { passive: true });
            }

            // Escape key closes window
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeWindow();
                }
            });
        }

        autoResizeInput() {
            if (!this.dom.input) return;
            this.dom.input.style.height = 'auto';
            const newHeight = Math.min(this.dom.input.scrollHeight, 100);
            this.dom.input.style.height = newHeight + 'px';
        }

        updateMuteIcon() {
            if (!this.dom.muteBtn) return;
            const isMuted = this.synth.isMuted;
            this.dom.muteBtn.innerHTML = isMuted 
                ? '<i data-lucide="volume-x" style="width:15px;height:15px;"></i>' 
                : '<i data-lucide="volume-2" style="width:15px;height:15px;"></i>';
            this.dom.muteBtn.setAttribute('title', isMuted ? 'Unmute ULTRON Audio' : 'Mute ULTRON Audio');
            if (window.lucide) lucide.createIcons();
        }

        toggleWindow() {
            if (this.isOpen) {
                this.closeWindow();
            } else {
                this.openWindow();
            }
        }

        openWindow() {
            if (this.isOpen) return;
            this.isOpen = true;
            this.synth.playPop();

            if (this.dom.window) {
                this.dom.window.classList.add('open');
                this.dom.window.setAttribute('aria-hidden', 'false');
            }
            if (this.dom.launcher) {
                this.dom.launcher.classList.add('active');
            }
            if (this.dom.invitePill) {
                this.dom.invitePill.style.display = 'none';
            }

            // Focus input
            setTimeout(() => {
                if (this.dom.input) this.dom.input.focus();
                this.scrollToBottom();
            }, 250);
        }

        closeWindow() {
            if (!this.isOpen) return;
            this.isOpen = false;
            this.synth.playPop();

            if (this.dom.window) {
                this.dom.window.classList.remove('open');
                this.dom.window.setAttribute('aria-hidden', 'true');
            }
            if (this.dom.launcher) {
                this.dom.launcher.classList.remove('active');
            }

            // Stop speech synthesis if speaking
            if (this.isSpeaking && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                this.isSpeaking = false;
            }
        }

        handleSendMessage() {
            if (this.isGenerating || !this.dom.input) return;
            const text = this.dom.input.value.trim();
            if (!text) return;

            this.dom.input.value = '';
            this.autoResizeInput();
            this.sendUserMessage(text);
        }

        sendUserMessage(text) {
            if (this.isGenerating) return;

            // Render User Message
            this.appendMessage('user', text);
            this.synth.playSend();
            if (window.triggerHaptic) window.triggerHaptic('button');

            // Hide suggestions once user engages
            if (this.dom.suggestionsContainer) {
                this.dom.suggestionsContainer.style.display = 'none';
            }

            this.isGenerating = true;
            this.showTypingIndicator(true);

            // Call API
            this.fetchAIResponse(text);
        }

        async fetchAIResponse(userQuery) {
            const conversationPayload = this.messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            let botReply = '';

            try {
                // 1. Try internal serverless API route
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversationPayload })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.reply) {
                        botReply = data.reply;
                    } else {
                        throw new Error(data.message || 'Empty response from chat API');
                    }
                } else {
                    throw new Error(`Server returned HTTP ${response.status}`);
                }
            } catch (serverErr) {
                console.error('Chat API dispatch error:', serverErr);
                botReply = `⚠️ **Neural Core Offline**: Unable to connect to the neural core right now. Please try again shortly or reach out to Shivam directly at **[codewithshivamdev@gmail.com](mailto:codewithshivamdev@gmail.com)**!`;
            }

            this.showTypingIndicator(false);
            this.isGenerating = false;

            // Render Bot Message
            this.appendMessage('assistant', botReply);
            this.synth.playReceive();
            if (window.triggerHaptic) window.triggerHaptic('action');
        }

        appendMessage(role, content) {
            this.messages.push({ role, content, timestamp: Date.now() });
            this.saveHistory();

            const msgElem = document.createElement('div');
            msgElem.className = `chat-msg-row ${role}`;

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (role === 'user') {
                msgElem.innerHTML = `
                    <div class="chat-bubble chat-bubble-user">
                        <div class="chat-msg-content">${this.escapeHTML(content)}</div>
                        <div class="chat-msg-meta">${timeStr}</div>
                    </div>
                `;
            } else {
                const formattedContent = this.renderMarkdown(content);
                msgElem.innerHTML = `
                    <div class="chat-avatar-wrap">
                        <div class="chat-avatar-bot">
                            <img src="assets/ultron-avatar.jpg" alt="ULTRON" class="chat-avatar-mini-img">
                        </div>
                    </div>
                    <div class="chat-bubble chat-bubble-bot" data-raw-text="${this.escapeHTML(content)}">
                        <div class="chat-bubble-header">
                            <span class="chat-bot-label">ULTRON // CORE</span>
                            <div class="chat-msg-tools">
                                <button class="chat-msg-speak-btn" title="Read Aloud" aria-label="Read message aloud">
                                    <i data-lucide="volume-2" style="width: 12px; height: 12px;"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chat-msg-content">${formattedContent}</div>
                        <div class="chat-msg-meta">${timeStr}</div>
                    </div>
                `;
            }

            if (this.dom.messagesList) {
                this.dom.messagesList.appendChild(msgElem);
                if (window.lucide) lucide.createIcons();
                this.scrollToBottom();
            }
        }

        renderMarkdown(text) {
            if (!text) return '';

            // 1. Code blocks ```lang ... ```
            let html = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
                const safeCode = this.escapeHTML(code.trim());
                const langLabel = lang ? lang.toUpperCase() : 'CODE';
                return `
                    <div class="chat-code-block">
                        <div class="chat-code-header">
                            <span>${langLabel}</span>
                            <button class="chat-copy-code-btn"><i data-lucide="copy" style="width:12px;height:12px;"></i> Copy</button>
                        </div>
                        <pre><code>${safeCode}</code></pre>
                    </div>
                `;
            });

            // 2. Inline code `code`
            html = html.replace(/`([^`]+)`/g, (match, code) => {
                return `<code class="chat-inline-code">${this.escapeHTML(code)}</code>`;
            });

            // 3. Headings ###
            html = html.replace(/^### (.*$)/gim, '<h4 class="chat-h4">$1</h4>');
            html = html.replace(/^## (.*$)/gim, '<h3 class="chat-h3">$1</h3>');

            // 4. Bold **text**
            html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // 5. Italic *text*
            html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

            // 6. Action Links: [label](action:category:target)
            html = html.replace(/\[([^\]]+)\]\(action:([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\)/g, (match, label, type, target) => {
                return `<button class="chat-action-btn" data-chat-action="${type}:${target}"><i data-lucide="sparkles" style="width:12px;height:12px;"></i> ${label}</button>`;
            });

            // 7. Regular Markdown Links: [label](url) - strictly enforce https:// or http:// or mailto:
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-ext-link">$1 <i data-lucide="external-link" style="width:10px;height:10px;"></i></a>');
            html = html.replace(/\[([^\]]+)\]\(mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/g, '<a href="mailto:$2" class="chat-ext-link">$1 <i data-lucide="mail" style="width:10px;height:10px;"></i></a>');

            // 8. Bullet points
            html = html.replace(/^\s*[\-\*]\s+(.*)$/gim, '<li class="chat-bullet-li"><span class="chat-bullet-dot"></span><span>$1</span></li>');

            // Wrap bullet items in ul
            html = html.replace(/((?:<li class="chat-bullet-li">.*?<\/li>\s*)+)/gis, '<ul class="chat-bullet-list">$1</ul>');

            // 9. Paragraph breaks
            html = html.replace(/\n{2,}/g, '<br><br>');

            // 10. Strict Defense-in-Depth XSS Sanitization
            if (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
                html = window.DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'h3', 'h4', 'span', 'button', 'div', 'img'],
                    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'title', 'aria-label', 'data-chat-action', 'data-raw-text', 'src', 'alt', 'width', 'height', 'data-lucide'],
                    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
                });
            } else {
                // Fallback Sanitizer: strip dangerous tags and event handlers
                html = html
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
                    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
                    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
                    .replace(/href\s*=\s*["']\s*(?:javascript|data|vbscript):[^"']*["']/gi, 'href="#"');
            }

            return html;
        }

        handleActionClick(actionStr) {
            if (!actionStr) return;
            const [type, target] = actionStr.split(':');

            if (type === 'scroll') {
                const section = document.getElementById(target);
                if (section) {
                    if (window.lenis) {
                        window.lenis.scrollTo(section, { offset: -60, duration: 1.2 });
                    } else {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                    if (window.innerWidth < 768) this.closeWindow();
                }
            } else if (type === 'project') {
                if (window.selectProjectById) {
                    window.selectProjectById(target);
                }
                const projSec = document.getElementById('projects');
                if (projSec) {
                    if (window.lenis) {
                        window.lenis.scrollTo(projSec, { offset: -60, duration: 1.2 });
                    } else {
                        projSec.scrollIntoView({ behavior: 'smooth' });
                    }
                }
                if (window.innerWidth < 768) this.closeWindow();
            } else if (type === 'studio') {
                const studioBtn = document.querySelector('.enter-studio-trigger');
                if (studioBtn) studioBtn.click();
                this.closeWindow();
            }
        }

        toggleTextToSpeech(text, btnElem) {
            if (!window.speechSynthesis) return;

            if (this.isSpeaking) {
                window.speechSynthesis.cancel();
                this.isSpeaking = false;
                if (btnElem) btnElem.classList.remove('speaking');
                return;
            }

            // Strip markdown formatting for cleaner speech
            const cleanText = text
                .replace(/[*#`_\[\]]/g, '')
                .replace(/https?:\/\/[^\s]+/g, 'link')
                .replace(/\(.*?\)/g, '');

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;

            utterance.onstart = () => {
                this.isSpeaking = true;
                if (btnElem) btnElem.classList.add('speaking');
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                if (btnElem) btnElem.classList.remove('speaking');
            };

            utterance.onerror = () => {
                this.isSpeaking = false;
                if (btnElem) btnElem.classList.remove('speaking');
            };

            window.speechSynthesis.speak(utterance);
        }

        showTypingIndicator(show) {
            if (!this.dom.typingIndicator) return;
            this.dom.typingIndicator.style.display = show ? 'flex' : 'none';
            if (show) this.scrollToBottom();
        }

        scrollToBottom() {
            if (!this.dom.messagesList) return;
            requestAnimationFrame(() => {
                this.dom.messagesList.scrollTop = this.dom.messagesList.scrollHeight;
            });
        }

        saveHistory() {
            try {
                sessionStorage.setItem('nova_chat_history', JSON.stringify(this.messages));
            } catch (e) {}
        }

        loadHistory() {
            try {
                const saved = sessionStorage.getItem('nova_chat_history');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.messages = parsed;
                        // Hide initial suggestions since history exists
                        if (this.dom.suggestionsContainer) {
                            this.dom.suggestionsContainer.style.display = 'none';
                        }
                        this.messages.forEach(m => {
                            const msgElem = document.createElement('div');
                            msgElem.className = `chat-msg-row ${m.role}`;
                            const timeStr = m.timestamp 
                                ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '';

                            if (m.role === 'user') {
                                msgElem.innerHTML = `
                                    <div class="chat-bubble chat-bubble-user">
                                        <div class="chat-msg-content">${this.escapeHTML(m.content)}</div>
                                        <div class="chat-msg-meta">${timeStr}</div>
                                    </div>
                                `;
                            } else {
                                const formatted = this.renderMarkdown(m.content);
                                msgElem.innerHTML = `
                                    <div class="chat-avatar-wrap">
                                        <div class="chat-avatar-bot">
                                            <img src="assets/ultron-avatar.jpg" alt="ULTRON" class="chat-avatar-mini-img">
                                        </div>
                                    </div>
                                    <div class="chat-bubble chat-bubble-bot" data-raw-text="${this.escapeHTML(m.content)}">
                                        <div class="chat-bubble-header">
                                            <span class="chat-bot-label">ULTRON // CORE</span>
                                            <div class="chat-msg-tools">
                                                <button class="chat-msg-speak-btn" title="Read Aloud" aria-label="Read message aloud">
                                                    <i data-lucide="volume-2" style="width: 12px; height: 12px;"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="chat-msg-content">${formatted}</div>
                                        <div class="chat-msg-meta">${timeStr}</div>
                                    </div>
                                `;
                            }
                            if (this.dom.messagesList) this.dom.messagesList.appendChild(msgElem);
                        });
                        if (window.lucide) lucide.createIcons();
                    }
                }
            } catch (e) {}
        }

        clearHistory() {
            sessionStorage.removeItem('nova_chat_history');
            this.messages = [];
            if (this.dom.messagesList) {
                this.dom.messagesList.innerHTML = '';
            }
            if (this.dom.suggestionsContainer) {
                this.dom.suggestionsContainer.style.display = 'flex';
            }
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            this.synth.playPop();

            // Re-render initial welcome
            this.appendMessage('assistant', `Greetings! I am **ULTRON**, Shivam Grover's cybernetic AI assistant.

I can answer any queries about:
• **Featured Projects** (Aevonix 3D, CollegesPathshala, Vacation Visits, Saga Holidays)
• **Technical Expertise** (Three.js, WebGL, GSAP, React, Next.js, TypeScript)
• **RevOps & Automation** (n8n, HubSpot CRM, Zapier, Webhooks)
• **Direct Collaboration** & Hiring Availability

Feel free to pick one of the quick suggestions below or type your question!`);
        }

        escapeHTML(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    // Initialize once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.novaChatbot = new NovaChatbot();
        });
    } else {
        window.novaChatbot = new NovaChatbot();
    }
})();
