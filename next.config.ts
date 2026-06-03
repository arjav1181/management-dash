import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", 'https://*.supabase.co', 'https://js.sentry-cdn.com'],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", 'data:', 'blob:', 'https:', 'http:'],
  "font-src": ["'self'", 'data:'],
  "connect-src": [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.groq.com',
    'https://generativelanguage.googleapis.com',
    'https://api.anthropic.com',
    'https://api.openai.com',
    'https://openrouter.ai',
    'https://api.cerebras.ai',
    'https://huggingface.co',
    'https://*.hf.space',
    'wss://*.hf.space',
    'https://api.vercel.com',
    'https://api.github.com',
    'https://*.docker.io',
    'https://hub.docker.com',
    'https://gitlab.com',
    'https://*.gitlab.com',
    'https://api.netlify.com',
  ],
  "frame-src": ["'self'", 'https://*.hf.space', 'https://*.vercel.app'],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
  "report-uri": ['/api/csp-report'],
};

function buildCsp(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const FIRST_ORIGIN = ALLOWED_ORIGINS[0] || '';
const DEV_ORIGINS = FIRST_ORIGIN ? [FIRST_ORIGIN] : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', '@monaco-editor/react'],
  },
  serverExternalPackages: ['ws'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: buildCsp() },
          ...SECURITY_HEADERS,
          ...(ALLOWED_ORIGINS.length
            ? [{
                key: 'Access-Control-Allow-Origin',
                value: ALLOWED_ORIGINS[0],
              }]
            : []),
          ...(ALLOWED_ORIGINS.length
            ? [{
                key: 'Vary',
                value: 'Origin',
              }]
            : []),
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/docs', destination: '/api/docs' },
    ];
  },
  allowedDevOrigins: DEV_ORIGINS,
  ...(FIRST_ORIGIN ? {} : {}),
};

export default nextConfig;
