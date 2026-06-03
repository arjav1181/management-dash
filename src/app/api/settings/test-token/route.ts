import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { HFError, whoami } from '@/lib/api/huggingface';

export const dynamic = 'force-dynamic';

const TOKEN_PATTERNS: Record<string, RegExp> = {
  hfToken: /^hf_[A-Za-z0-9]{20,}$/,
  vercelToken: /^[A-Za-z0-9_-]{20,}$/,
  githubToken: /^(ghp_|github_pat_|gho_|ghu_|ghs_)[A-Za-z0-9]{20,}$/,
  dockerToken: /^dckr_pat_[A-Za-z0-9_-]{20,}$/,
  gitlabToken: /^glpat-[A-Za-z0-9_-]{20,}$/,
  netlifyToken: /^nfp_[A-Za-z0-9]{20,}$/,
};

const ALLOWED = Object.keys(TOKEN_PATTERNS);

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = (await req.json()) as Record<string, string>;
    const service = body.service as string;
    const token = body.token as string;
    if (!ALLOWED.includes(service)) {
      throw new HttpError(400, `Unknown service: ${service}`);
    }
    if (!token || typeof token !== 'string') {
      throw new HttpError(400, 'Token is required');
    }
    const pattern = TOKEN_PATTERNS[service];
    if (!pattern.test(token)) {
      throw new HttpError(400, `${service} format looks wrong (expected: ${pattern.toString()})`);
    }
    if (service === 'hfToken') {
      try {
        const me = await whoami(token);
        return jsonOk({ valid: true, identity: me });
      } catch (e) {
        if (e instanceof HFError) {
          throw new HttpError(e.status, e.message);
        }
        throw e;
      }
    }
    return jsonOk({ valid: true });
  } catch (e) {
    return errorResponse(e);
  }
}
