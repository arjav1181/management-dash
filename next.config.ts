import type { NextConfig } from 'next';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${allowedOrigins.map((o) => `"${o}"`).join(' ')} https://*.supabase.co wss://*.supabase.co https://*.huggingface.co https://huggingface.co wss://*.hf.space https://*.hf.space https://api.groq.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com https://openrouter.ai https://api.cerebras.ai https://api.vercel.com https://api.github.com https://hub.docker.com https://gitlab.com https://api.netlify.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const devOrigins = ['2e749a99-3351-427e-a35c-cda034db4ef3-00-tjpcufa55p9i.sisko.replit.dev'];

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  allowedDevOrigins: devOrigins,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          ...(allowedOrigins.length > 0
            ? [
                { key: 'Access-Control-Allow-Origin', value: allowedOrigins[0] },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept' },
                { key: 'Access-Control-Allow-Credentials', value: 'true' },
                { key: 'Vary', value: 'Origin' },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
