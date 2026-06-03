import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSpaces } from '@/lib/api/huggingface';
import { listProjects } from '@/lib/api/vercel';
import { listRepos } from '@/lib/api/github';
import { listProjects as listGitLabProjects } from '@/lib/api/gitlab';
import { listRepos as listDockerRepos } from '@/lib/api/docker';
import { listSites } from '@/lib/api/netlify';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  platform: 'huggingface' | 'vercel' | 'github' | 'docker' | 'gitlab' | 'netlify';
  type: 'space' | 'project' | 'repo' | 'image' | 'site';
  url: string;
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
    if (q.length < 2) return jsonOk<{ results: SearchResult[] }>({ results: [] });

    const { settings } = await loadSettings(ctx.supabase, ctx.userId);

    const tasks: Promise<SearchResult[]>[] = [];

    if (settings.hfToken) {
      tasks.push(
        listSpaces(settings.hfToken)
          .then((spaces) => spaces
            .filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
            .map<SearchResult>((s) => ({ id: `hf-${s.id}`, title: s.name, subtitle: s.id, platform: 'huggingface', type: 'space', url: `/huggingface/${encodeURIComponent(s.id)}` })))
          .catch(() => [] as SearchResult[])
      );
    }
    if (settings.vercelToken) {
      tasks.push(
        listProjects(settings.vercelToken)
          .then((projects) => projects
            .filter((p) => p.name.toLowerCase().includes(q))
            .map<SearchResult>((p) => ({ id: `v-${p.id}`, title: p.name, subtitle: 'Vercel project', platform: 'vercel', type: 'project', url: `/vercel/${p.id}` })))
          .catch(() => [] as SearchResult[])
      );
    }
    if (settings.githubToken) {
      tasks.push(
        listRepos(settings.githubToken, settings.githubScope)
          .then((repos) => repos
            .filter((r) => r.fullName.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
            .map<SearchResult>((r) => ({ id: `gh-${r.id}`, title: r.name, subtitle: r.fullName, platform: 'github', type: 'repo', url: `/github/${encodeURIComponent(r.fullName)}` })))
          .catch(() => [] as SearchResult[])
      );
    }
    if (settings.gitlabToken) {
      tasks.push(
        listGitLabProjects(settings.gitlabToken, settings.gitlabUrl)
          .then((projects) => projects
            .filter((p) => p.nameWithNamespace.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
            .map<SearchResult>((p) => ({ id: `gl-${p.id}`, title: p.name, subtitle: p.nameWithNamespace, platform: 'gitlab', type: 'project', url: '/gitlab' })))
          .catch(() => [] as SearchResult[])
      );
    }
    if (settings.dockerToken) {
      tasks.push(
        listDockerRepos(settings.dockerToken)
          .then((repos) => repos
            .filter((r) => r.name.toLowerCase().includes(q))
            .map<SearchResult>((r) => ({ id: `d-${r.name}`, title: r.name, subtitle: r.description || 'Docker image', platform: 'docker', type: 'image', url: '/docker' })))
          .catch(() => [] as SearchResult[])
      );
    }
    if (settings.netlifyToken) {
      tasks.push(
        listSites(settings.netlifyToken)
          .then((sites) => sites
            .filter((s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
            .map<SearchResult>((s) => ({ id: `n-${s.id}`, title: s.name, subtitle: s.url, platform: 'netlify', type: 'site', url: '/netlify' })))
          .catch(() => [] as SearchResult[])
      );
    }

    const settled = await Promise.allSettled(tasks);
    const results = settled
      .filter((s): s is PromiseFulfilledResult<SearchResult[]> => s.status === 'fulfilled')
      .flatMap((s) => s.value)
      .slice(0, 30);

    return jsonOk({ results });
  } catch (e) {
    return errorResponse(e);
  }
}
