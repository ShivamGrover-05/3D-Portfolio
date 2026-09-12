// Shivam Grover Portfolio - Unified Local Development Server
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-load .env.local for local development simulation
try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.slice(0, eqIdx).trim();
                let val = trimmed.slice(eqIdx + 1).trim();
                val = val.replace(/^["']|["']$/g, '');
                process.env[key] = val;
            }
        }
    }
} catch (e) {
    console.warn('Could not read .env.local:', e.message);
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // API Routes Handler
    if (pathname.startsWith('/api/')) {
        const apiName = pathname.replace('/api/', '').split('/')[0];
        const apiPath = path.join(__dirname, 'api', `${apiName}.js`);

        if (fs.existsSync(apiPath)) {
            try {
                // Read request body safely
                const body = await new Promise((resolve, reject) => {
                    let chunks = '';
                    req.on('data', chunk => chunks += chunk);
                    req.on('end', () => resolve(chunks));
                    req.on('error', reject);
                });

                let parsedBody = {};
                try {
                    if (body) parsedBody = JSON.parse(body);
                } catch (e) {
                    parsedBody = body;
                }

                req.body = parsedBody;
                req.query = Object.fromEntries(parsedUrl.searchParams.entries());

                // Mock Vercel response helper
                const mockRes = {
                    setHeader: (k, v) => res.setHeader(k, v),
                    status: (code) => {
                        res.statusCode = code;
                        return mockRes;
                    },
                    json: (data) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    },
                    end: (data) => res.end(data)
                };

                const fileUrl = pathToFileURL(apiPath).href;
                const module = await import(`${fileUrl}?t=${Date.now()}`);
                const handler = module.default;
                return await handler(req, mockRes);
            } catch (err) {
                console.error(`API Error on ${pathname}:`, err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: err.message }));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'API route not found' }));
        }
    }

    // Static Files Handler
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);

    // Security check: ensure filePath is within __dirname
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('File Not Found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Shivam Grover 3D Portfolio Local Server Running:`);
    console.log(`👉 http://localhost:${PORT}\n`);
});
