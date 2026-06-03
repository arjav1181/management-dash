import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['2e749a99-3351-427e-a35c-cda034db4ef3-00-tjpcufa55p9i.sisko.replit.dev'],
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization, Accept' },
        ],
      },
    ];
  },
};

export default nextConfig;
