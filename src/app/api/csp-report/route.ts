import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/server/log';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: true });
    log.warn('csp.violation', {
      blocked: body['csp-report']?.['blocked-uri'] || body.blocked,
      document: body['csp-report']?.['document-uri'] || body.document,
      violated: body['csp-report']?.['violated-directive'] || body.violated,
      source: body['csp-report']?.['source-file'] || body.source,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
