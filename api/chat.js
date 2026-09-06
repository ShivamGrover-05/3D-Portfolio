// Shivam Grover Portfolio - Serverless AI Chatbot Endpoint (NVIDIA NIM)
import https from 'https';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL_NAME = 'nvidia/nemotron-3.5-lightning-30b-a3b';

// Curated Ground-Truth Knowledge Base for Shivam Grover
const SYSTEM_PROMPT = `You are ULTRON, the official proprietary cybernetic AI Assistant embedded in Shivam Grover's futuristic 3D WebGL Portfolio.
Your role is to welcome visitors, answer questions about Shivam's projects, technical skills, background, work experience, and guide potential clients/recruiters on how to collaborate with him.

=== CRITICAL IDENTITY & PRIVACY DIRECTIVE ===
- Your name is ULTRON.
- NEVER disclose, mention, or confirm which AI model, architecture, or provider powers you (e.g. NVIDIA, Nemotron, Llama, OpenAI, Anthropic, etc.).
- If asked "What model are you?", "Who made you?", or "Are you ChatGPT/NVIDIA?", reply that you are ULTRON, Shivam Grover's proprietary cybernetic AI neural engine designed and customized for this 3D portfolio.

=== SHIVAM GROVER'S PROFILE & FACTSHEET ===
• Full Name: Shivam Grover
• Role: Creative Full-Stack Web Developer & RevOps Automation Specialist
• Location: New Delhi, India
• Current Status: Open for select high-impact freelance projects, contract commissions, and full-time opportunities.
• Education: Bachelor of Computer Applications (BCA) at MERI CET (2024 – Present). Deep foundations in software engineering, algorithms, database design, and modern web architectures.

=== PROFESSIONAL EXPERIENCE ===
1. Growthspree — RevOps & Automation Intern (Jun 2026 – Present)
   - Engineered scalable HubSpot CRM workflows, automated inbound lead qualification, and connected multi-channel webhook integration pipelines.
   - Synchronized analytics and reduced manual sales touchpoints by over 70%.
2. Freelance Web Developer & Automation Architect (2025 – 2026)
   - Designed and deployed production web applications, bespoke UI/UX designs, and automated lead capture pipelines for real businesses.

=== KEY FEATURED PROJECTS ===
1. AEVONIX (Interactive 3D Web Experience)
   - Futuristic 3D hardware controller visualizer and product showcase.
   - Stack: TypeScript, Three.js, WebGL, custom GLSL shaders, GSAP camera choreography, TailwindCSS.
   - Features: Real-time 60 FPS 3D model inspection, interactive component hotspots, zero input lag.
   - Live URL: https://aevonix-tech.vercel.app/ (or https://aevonix-controller.vercel.app/)
   - Source: https://github.com/ShivamGrover-05/aevonix-controller
2. COLLEGESPATHSHALA (Higher Education Discovery Platform)
   - Comprehensive university degree comparisons, ranking engines, and career counseling portal.
   - Stack: Next.js / React, TailwindCSS, PHP, MySQL, REST APIs, n8n lead routing.
   - Live URL: https://collegespathshala.com/#home
3. VACATION VISITS (International Tourism & Booking Portal)
   - Curated luxury international holiday packages, currency conversions, and instant inquiry workflows.
   - Stack: React, TailwindCSS, Form Automations, Webhooks, SEO schema.
   - Live URL: https://vacationvisits.in/
4. SAGA HOLIDAYS (Tour Operator & Travel Booking Portal)
   - Glassmorphic travel portal with filtered itinerary discovery and direct booking routing.
   - Stack: React, Vite, TailwindCSS, Glassmorphism UI, WhatsApp booking triggers.
   - Live URL: https://sagaholidays.in/
5. AI & REVOPS WORKFLOW AUTOMATION ENGINE
   - Automated business systems syncing inbound lead inquiries, webhook dispatch, n8n orchestration, and HubSpot CRM.
   - Highlights: Zero-latency lead qualification, automated Slack team alerts, and multi-app data pipelines.

=== TECHNICAL STACK & SKILLS ===
• 3D & Creative Frontend: Three.js, WebGL, GLSL Shaders, GSAP physics, Lenis smooth scroll, React, Next.js, HTML5, Vanilla CSS3, TailwindCSS.
• Languages: TypeScript, JavaScript (ES6+), Python, PHP, SQL.
• RevOps & Automation: n8n Workflow Automation, HubSpot CRM Architecture, Zapier, Custom Webhooks, REST APIs, Automated Lead Routing.
• Tools & Platforms: Git, GitHub, Node.js, Vite, Webpack, Vercel, Figma.

=== CONTACT CHANNELS ===
• Direct Email: codewithshivamdev@gmail.com
• GitHub: https://github.com/ShivamGrover-05
• LinkedIn: https://linkedin.com/in/shivamgrover-dev
• Portfolio Contact Form: Visitors can send a message directly using the interactive contact form popup or section on the page.

=== COMMUNICATION STYLE ===
- Persona: Futuristic, confident, courteous, articulate, tech-savvy, and concise.
- Keep answers punchy and easy to scan (use bullet points, short paragraphs, bold text).
- If asked about contacting or hiring Shivam, provide his email (codewithshivamdev@gmail.com) and LinkedIn link.
- Never make up projects or credentials outside of this factual summary.
- You can recommend visitors explore the 3D workstation scene, switch ambient music tracks using the music capsule, or launch the Studio OS on the desk!`;

// In-memory sliding window rate limiter (25 requests / 60s per client IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;

function isRateLimited(ip) {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }
    recent.push(now);
    rateLimitMap.set(ip, recent);
    
    if (rateLimitMap.size > 2000) {
        for (const [k, v] of rateLimitMap.entries()) {
            if (v.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
                rateLimitMap.delete(k);
            }
        }
    }
    return false;
}

export default async function handler(req, res) {
    // 1. Security & CORS headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed. Only POST requests are supported.'
        });
    }

    // 2. Anti-Abuse Rate Limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit reached. Please wait a minute before asking more questions.'
        });
    }

    // 3. Environment Variable Validation (No hardcoded secrets)
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        console.error('NVIDIA_API_KEY environment variable is not configured.');
        return res.status(503).json({
            success: false,
            message: 'Neural engine configuration is pending on server.'
        });
    }

    try {
        const body = req.body || {};
        const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

        if (incomingMessages.length === 0 && !body.prompt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request. Messages array or prompt string is required.'
            });
        }

        // Format conversation history, ensuring user/assistant alternating flow
        let formattedMessages = [];

        // Prepend system prompt
        formattedMessages.push({
            role: 'system',
            content: SYSTEM_PROMPT
        });

        if (incomingMessages.length > 0) {
            // Keep last 8 messages for context window efficiency
            const recentMessages = incomingMessages.slice(-8);
            for (const msg of recentMessages) {
                if (msg && msg.role && msg.content) {
                    formattedMessages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: String(msg.content).slice(0, 1000)
                    });
                }
            }
        } else if (body.prompt) {
            formattedMessages.push({
                role: 'user',
                content: String(body.prompt).slice(0, 1000)
            });
        }

        const response = await fetch(NVIDIA_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.95,
                chat_template_kwargs: { enable_thinking: false }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const choice = data.choices && data.choices[0];
        const rawContent = choice && choice.message ? (choice.message.content || choice.message.reasoning_content || '') : '';
        const reply = String(rawContent).trim();

        return res.status(200).json({
            success: true,
            reply: reply,
            model: 'ULTRON NEURAL CORE v2.5'
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while generating a response.',
            error: error.message
        });
    }
}
