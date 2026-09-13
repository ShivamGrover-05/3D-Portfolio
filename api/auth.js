// Shivam Grover Portfolio - Serverless Authentication & Profile Synchronization API
import { createClient } from '@supabase/supabase-js';

// Allowed origins for CORS (Defense-in-depth: No wildcard '*')
const ALLOWED_ORIGINS = new Set([
    'https://3-d-portfolio-mu-seven.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]);

function setCorsAndSecurityHeaders(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const origin = req.headers['origin'];
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
}

// In-memory sliding window rate limiter (30 requests / 60s per IP)
const authRateLimitMap = new Map();
const AUTH_WINDOW_MS = 60 * 1000;
const MAX_AUTH_REQUESTS = 30;

function isAuthRateLimited(ip) {
    const now = Date.now();
    const timestamps = authRateLimitMap.get(ip) || [];
    const recent = timestamps.filter(t => now - t < AUTH_WINDOW_MS);
    if (recent.length >= MAX_AUTH_REQUESTS) {
        return true;
    }
    recent.push(now);
    authRateLimitMap.set(ip, recent);

    if (authRateLimitMap.size > 1000) {
        for (const [k, v] of authRateLimitMap.entries()) {
            if (v.every(t => now - t >= AUTH_WINDOW_MS)) {
                authRateLimitMap.delete(k);
            }
        }
    }
    return false;
}

// Public fallback Supabase configuration for zero-failure authentication initialization
const DEFAULT_SUPABASE_URL = 'https://yajpqgcddzxizarpugyw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhanBxZ2NkZHp4aXphcnB1Z3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjIwMDksImV4cCI6MjEwNDc5ODAwOX0.nHAC-KweBkZzPDnNGrSjCWzVxvfJ0kYLGBca0fZxsXs';

// Cached Supabase admin client for server-side profile operations
let supabaseAdmin = null;

function getSupabaseAdmin() {
    const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    if (!url || !serviceRoleKey) {
        return null;
    }

    if (!supabaseAdmin) {
        supabaseAdmin = createClient(url, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
    }
    return supabaseAdmin;
}

export default async function handler(req, res) {
    setCorsAndSecurityHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    if (isAuthRateLimited(clientIp)) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again in a moment.'
        });
    }

    // Determine requested action from query string or URL
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = parsedUrl.searchParams.get('action');

    // -------------------------------------------------------------------------
    // ACTION: config (GET) -> Returns public Supabase URL & Anon Key to browser
    // -------------------------------------------------------------------------
    if (req.method === 'GET' && action === 'config') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

        return res.status(200).json({
            success: true,
            configured: Boolean(supabaseUrl && supabaseAnonKey),
            supabaseUrl,
            supabaseAnonKey
        });
    }

    // -------------------------------------------------------------------------
    // ACTION: sync (POST) -> Validates user token & upserts PostgreSQL profile
    // -------------------------------------------------------------------------
    if (req.method === 'POST' && action === 'sync') {
        // Enforce Content-Type
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('application/json')) {
            return res.status(415).json({
                success: false,
                message: 'Unsupported Media Type. Expected application/json.'
            });
        }

        // Extract JWT access token from Authorization header or body
        const authHeader = req.headers['authorization'] || '';
        let token = '';
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        } else if (req.body && req.body.access_token) {
            token = String(req.body.access_token).trim();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token required.'
            });
        }

        const admin = getSupabaseAdmin();
        if (!admin) {
            return res.status(503).json({
                success: false,
                message: 'Database service configuration is pending on server.'
            });
        }

        try {
            // Verify JWT token with Supabase Auth server-side
            const { data: authData, error: authError } = await admin.auth.getUser(token);
            if (authError || !authData?.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session token.'
                });
            }

            const authUser = authData.user;
            const metadata = authUser.user_metadata || {};
            const email = authUser.email || '';
            const name = metadata.full_name || metadata.name || (email.split('@')[0]) || 'User';
            const avatarUrl = metadata.avatar_url || metadata.picture || null;
            const provider = authUser.app_metadata?.provider || 'google';

            // Upsert profile into public.profiles with parameterized query
            const now = new Date().toISOString();
            const { data: profile, error: dbError } = await admin
                .from('profiles')
                .upsert(
                    {
                        auth_user_id: authUser.id,
                        name: name.slice(0, 100),
                        email: email.toLowerCase().slice(0, 120),
                        avatar_url: avatarUrl ? String(avatarUrl).slice(0, 500) : null,
                        provider: provider.slice(0, 50),
                        updated_at: now,
                        last_login_at: now
                    },
                    { onConflict: 'auth_user_id' }
                )
                .select('id, auth_user_id, name, email, avatar_url, provider, last_login_at')
                .single();

            if (dbError) {
                console.error('Database profile upsert error:', dbError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to synchronize profile record.'
                });
            }

            return res.status(200).json({
                success: true,
                profile
            });
        } catch (err) {
            console.error('Auth sync internal error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Authentication synchronization encountered an error.'
            });
        }
    }

    return res.status(400).json({
        success: false,
        message: 'Invalid authentication action or method.'
    });
}
