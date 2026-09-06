import nodemailer from 'nodemailer';

// Reusable Transporter Singleton
let transporter = null;

function getMailTransporter() {
    const user = process.env.GMAIL_USER || 'codewithshivamdev@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!pass) {
        throw new Error('GMAIL_APP_PASSWORD environment variable is not configured on server.');
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass
            }
        });
    }
    return transporter;
}

// In-memory sliding window rate limiter for contact form (max 5 transmissions / 10 minutes per IP)
const contactRateLimitMap = new Map();
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const MAX_CONTACTS_PER_WINDOW = 5;

function isContactRateLimited(ip) {
    const now = Date.now();
    const timestamps = contactRateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => now - t < CONTACT_WINDOW_MS);
    if (recent.length >= MAX_CONTACTS_PER_WINDOW) {
        return true;
    }
    recent.push(now);
    contactRateLimitMap.set(ip, recent);
    
    if (contactRateLimitMap.size > 1000) {
        for (const [k, v] of contactRateLimitMap.entries()) {
            if (v.every(t => now - t >= CONTACT_WINDOW_MS)) {
                contactRateLimitMap.delete(k);
            }
        }
    }
    return false;
}

// Helper to sanitize HTML content against script/DOM injection
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
    // 1. Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // 2. Only allow POST method
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed. Only POST requests are supported.'
        });
    }

    // 3. Contact Anti-Spam Rate Limit
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    if (isContactRateLimited(clientIp)) {
        return res.status(429).json({
            success: false,
            message: 'Too many messages sent from this connection. Please wait 10 minutes before submitting again.'
        });
    }

    try {
        const body = req.body || {};
        const { name, email, subject, message, phone, website } = body;

        // 2. Honeypot Anti-Spam Check (hidden field 'website')
        if (website && String(website).trim() !== '') {
            // Silently absorb spam submissions without alerting bots
            console.warn('Honeypot triggered, discarding spam submission.');
            return res.status(200).json({
                success: true,
                message: 'Inquiry received successfully.'
            });
        }

        // 3. Strict Input Validation & Length Bounds
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid name (2–100 characters).'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        const validatedSubject = (subject && typeof subject === 'string' && subject.trim().length > 0)
            ? subject.trim().slice(0, 150)
            : 'New Portfolio Inquiry';

        if (!message || typeof message !== 'string' || message.trim().length < 5 || message.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message between 5 and 5,000 characters.'
            });
        }

        const cleanName = escapeHtml(name.trim());
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = escapeHtml(validatedSubject);
        const cleanMessage = escapeHtml(message.trim());
        const cleanPhone = phone ? escapeHtml(String(phone).slice(0, 30)) : 'Not provided';
        const timestamp = new Date().toUTCString();

        const ownerEmail = process.env.CONTACT_EMAIL || process.env.GMAIL_USER || 'codewithshivamdev@gmail.com';
        const mailClient = getMailTransporter();

        // 4. Send Owner Notification Email
        const ownerMailOptions = {
            from: `"Shivam Portfolio Dispatch" <${ownerEmail}>`,
            to: ownerEmail,
            replyTo: cleanEmail,
            subject: `⚡ [Portfolio Inquiry] ${cleanSubject} — from ${cleanName}`,
            text: `NEW PORTFOLIO INQUIRY\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone}\nSubject: ${cleanSubject}\nDate: ${timestamp}\n\nMessage:\n${message.trim()}\n\n---\nReply directly to this email to contact ${cleanName}.`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 24px; background-color: #06070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background: #0c1020; border: 1px solid rgba(0, 243, 255, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
                        <div style="background: linear-gradient(135deg, rgba(0, 243, 255, 0.15), rgba(108, 92, 231, 0.25)); padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <div style="font-family: monospace; font-size: 11px; color: #00f3ff; letter-spacing: 2px; text-transform: uppercase;">SHIVAM.DEV // SYSTEM DISPATCH</div>
                            <h1 style="margin: 8px 0 0 0; font-size: 22px; color: #ffffff; font-weight: 700;">New Portfolio Inquiry</h1>
                        </div>
                        <div style="padding: 24px;">
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #8e95a5; width: 100px; font-size: 13px;"><strong>Sender Name</strong></td>
                                    <td style="padding: 8px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${cleanName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #8e95a5; font-size: 13px;"><strong>Email</strong></td>
                                    <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${cleanEmail}" style="color: #00f3ff; text-decoration: none; font-weight: 600;">${cleanEmail}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #8e95a5; font-size: 13px;"><strong>Phone</strong></td>
                                    <td style="padding: 8px 0; color: #cbd5e1; font-size: 14px;">${cleanPhone}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #8e95a5; font-size: 13px;"><strong>Subject</strong></td>
                                    <td style="padding: 8px 0; color: #00ff9d; font-size: 14px; font-weight: 600;">${cleanSubject}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #8e95a5; font-size: 13px;"><strong>Received At</strong></td>
                                    <td style="padding: 8px 0; color: #8e95a5; font-size: 12px; font-family: monospace;">${timestamp}</td>
                                </tr>
                            </table>
                            <div style="background: rgba(6, 8, 16, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                                <div style="font-family: monospace; font-size: 11px; color: #8e95a5; margin-bottom: 8px; letter-spacing: 1.5px; text-transform: uppercase;">Inquiry Transmission:</div>
                                <div style="color: #f0f2f5; font-size: 14px; line-height: 1.65; white-space: pre-wrap;">${cleanMessage}</div>
                            </div>
                            <div style="text-align: center;">
                                <a href="mailto:${cleanEmail}?subject=Re: ${encodeURIComponent(cleanSubject)}" style="display: inline-block; background: #00f3ff; color: #06070d; font-weight: 700; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 20px;">
                                    Reply to ${cleanName} &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const ownerResult = await mailClient.sendMail(ownerMailOptions);
        console.log('OWNER EMAIL: SUCCESS ->', ownerResult.messageId || 'sent');

        // 5. Send Visitor Confirmation Thank-You Email
        let visitorDelivered = false;
        try {
            const visitorMailOptions = {
                from: `"Shivam Grover" <${ownerEmail}>`,
                to: cleanEmail,
                replyTo: ownerEmail,
                subject: `Transmission Confirmed // Thanks for connecting, ${cleanName}!`,
                text: `Hi ${cleanName},\n\nThank you for reaching out through my portfolio (shivam.dev)!\n\nI have received your message regarding "${cleanSubject}". I usually review all inquiries and respond within 24 hours.\n\nSummary of your message:\n${message.trim()}\n\nBest regards,\nShivam Grover\nCreative Developer & Automation Specialist\ncodewithshivamdev@gmail.com\nhttps://github.com/ShivamGrover-05\nhttps://linkedin.com/in/shivamgrover-dev`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <body style="margin: 0; padding: 24px; background-color: #06070d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <div style="max-width: 580px; margin: 0 auto; background: #0c1020; border: 1px solid rgba(0, 243, 255, 0.35); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
                            <div style="background: linear-gradient(135deg, rgba(0, 243, 255, 0.18), rgba(108, 92, 231, 0.25)); padding: 28px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center;">
                                <div style="font-family: monospace; font-size: 11px; color: #00f3ff; letter-spacing: 2.5px; text-transform: uppercase;">SHIVAM GROVER // STUDIO</div>
                                <h1 style="margin: 10px 0 4px 0; font-size: 24px; color: #ffffff; font-weight: 800;">Message Received! 🚀</h1>
                                <p style="margin: 0; font-size: 13px; color: #00ff9d; font-family: monospace;">STATUS: LOGGED IN WORKSTATION CORE</p>
                            </div>
                            <div style="padding: 28px 24px;">
                                <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6; margin-top: 0;">
                                    Hi <strong style="color: #ffffff;">${cleanName}</strong>,
                                </p>
                                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.65;">
                                    Thank you for reaching out through my interactive 3D portfolio. Your inquiry regarding <strong style="color: #00f3ff;">"${cleanSubject}"</strong> has been successfully dispatched to my direct inbox.
                                </p>
                                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.65;">
                                    I review all communications promptly and will follow up with you within <strong>24 hours</strong>.
                                </p>
                                <div style="background: rgba(6, 8, 16, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; margin: 22px 0;">
                                    <div style="font-family: monospace; font-size: 11px; color: #8e95a5; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase;">Your Message Copy:</div>
                                    <div style="color: #94a3b8; font-size: 13px; font-style: italic; line-height: 1.6; white-space: pre-wrap;">"${cleanMessage.slice(0, 300)}${cleanMessage.length > 300 ? '...' : ''}"</div>
                                </div>
                                <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
                                    In the meantime, feel free to connect with me across my network coordinates:
                                </p>
                                <div style="display: flex; gap: 12px; margin: 20px 0;">
                                    <a href="https://linkedin.com/in/shivamgrover-dev" style="background: rgba(108, 92, 231, 0.2); border: 1px solid #6c5ce7; color: #a29bfe; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600;">LinkedIn Profile</a>
                                    &nbsp;
                                    <a href="https://github.com/ShivamGrover-05" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 8px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 600;">GitHub Repos</a>
                                </div>
                                <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 13px; color: #8e95a5;">
                                    <strong style="color: #ffffff;">Shivam Grover</strong><br>
                                    Creative Web Developer & RevOps Automation Specialist<br>
                                    New Delhi, India &bull; <a href="mailto:${ownerEmail}" style="color: #00f3ff; text-decoration: none;">${ownerEmail}</a>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const visitorResult = await mailClient.sendMail(visitorMailOptions);
            visitorDelivered = true;
            console.log('VISITOR EMAIL: SUCCESS ->', visitorResult.messageId || 'sent');
        } catch (confirmErr) {
            console.warn('VISITOR EMAIL: FAILED (non-fatal) ->', confirmErr.message || confirmErr);
        }

        return res.status(200).json({
            success: true,
            ownerEmailSent: true,
            visitorEmailSent: visitorDelivered,
            message: 'Your message was successfully sent! A confirmation has been emailed to you.'
        });

    } catch (error) {
        console.error('Contact API Internal Error:', error);
        return res.status(500).json({
            success: false,
            message: "Message couldn't be sent right now. Please try again or email directly to codewithshivamdev@gmail.com."
        });
    }
}
