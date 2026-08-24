import nodemailer from 'nodemailer';

// Reusable Transporter Singleton
let transporter = null;

function getMailTransporter() {
    if (!transporter) {
        const user = process.env.GMAIL_USER || 'codewithshivamdev@gmail.com';
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!pass) {
            console.warn('GMAIL_APP_PASSWORD is not set in environment variables.');
        }

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
    // 1. Only allow POST method
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed. Only POST requests are supported.'
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
            from: `"Shivam Portfolio" <${ownerEmail}>`,
            to: ownerEmail,
            replyTo: cleanEmail,
            subject: `[Portfolio Inquiry] ${cleanSubject} — from ${cleanName}`,
            text: `NEW PORTFOLIO INQUIRY\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone}\nSubject: ${cleanSubject}\nDate: ${timestamp}\n\nMessage:\n${message.trim()}\n\n---\nReply directly to this email to contact ${cleanName}.`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #0b0d17; color: #f0f2f5; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #232738;">
                    <h2 style="color: #00f3ff; margin-top: 0; font-size: 20px; border-bottom: 1px solid #232738; padding-bottom: 12px;">
                        ✉️ New Portfolio Inquiry
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #8e95a5; width: 90px;"><strong>Name:</strong></td>
                            <td style="padding: 6px 0; color: #ffffff;">${cleanName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #8e95a5;"><strong>Email:</strong></td>
                            <td style="padding: 6px 0; color: #00f3ff;"><a href="mailto:${cleanEmail}" style="color: #00f3ff; text-decoration: none;">${cleanEmail}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #8e95a5;"><strong>Phone:</strong></td>
                            <td style="padding: 6px 0; color: #ffffff;">${cleanPhone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #8e95a5;"><strong>Subject:</strong></td>
                            <td style="padding: 6px 0; color: #ffffff;">${cleanSubject}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #8e95a5;"><strong>Time:</strong></td>
                            <td style="padding: 6px 0; color: #8e95a5;">${timestamp}</td>
                        </tr>
                    </table>
                    <div style="background-color: #131726; padding: 16px; border-radius: 6px; border: 1px solid #232738; margin-bottom: 20px;">
                        <div style="font-size: 12px; color: #8e95a5; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Message:</div>
                        <div style="color: #ffffff; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${cleanMessage}</div>
                    </div>
                    <div style="font-size: 12px; color: #5c6273; border-top: 1px solid #232738; padding-top: 12px;">
                        Tip: Click 'Reply' to respond directly to ${cleanName} (${cleanEmail}).
                    </div>
                </div>
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
                subject: `Thanks for reaching out — Shivam Grover`,
                text: `Hi ${cleanName},\n\nThank you for reaching out through my portfolio (shivam.dev).\n\nI have received your message regarding "${cleanSubject}" and will get back to you as soon as possible.\n\nBest regards,\nShivam Grover\nCreative Developer & Automation Specialist\ncodewithshivamdev@gmail.com\nhttps://shivamgrover-05.github.io/`,
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #0b0d17; color: #f0f2f5; padding: 28px; border-radius: 8px; max-width: 560px; margin: 0 auto; border: 1px solid #232738;">
                        <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">
                            Thanks for connecting, <span style="color: #00ff9d;">${cleanName}</span>!
                        </h2>
                        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                            Thank you for reaching out through my interactive portfolio. I have received your message regarding <strong>"${cleanSubject}"</strong> and will review your inquiry shortly.
                        </p>
                        <div style="background-color: #131726; padding: 14px 18px; border-radius: 6px; border: 1px solid #232738; margin: 20px 0;">
                            <div style="font-size: 12px; color: #8e95a5; margin-bottom: 4px;">YOUR MESSAGE SUMMARY:</div>
                            <div style="color: #8e95a5; font-size: 13px; font-style: italic; white-space: pre-wrap;">${cleanMessage.slice(0, 200)}${cleanMessage.length > 200 ? '...' : ''}</div>
                        </div>
                        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                            If you have any immediate links or project scopes to share, feel free to reply directly to this email.
                        </p>
                        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #232738; font-size: 13px; color: #8e95a5;">
                            <strong>Shivam Grover</strong><br>
                            Creative Developer & Automation Specialist<br>
                            <a href="mailto:${ownerEmail}" style="color: #00f3ff; text-decoration: none;">${ownerEmail}</a>
                        </div>
                    </div>
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
