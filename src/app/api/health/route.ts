import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'bridge',
    version: process.env.npm_package_version || '0.1.0',
    ts: new Date().toISOString(),
  });
}
