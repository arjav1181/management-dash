'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Boxes, Triangle, GitBranch, Container, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  platform: 'huggingface' | 'vercel' | 'github' | 'docker' | 'gitlab' | 'netlify';
  type: 'space' | 'project' | 'repo' | 'image' | 'site';
  url: string;
}

const platformIcons: Record<SearchResult['platform'], React.ReactNode> = {
  huggingface: <Boxes size={14} />,
  vercel: <Triangle size={14} />,
  github: <GitBranch size={14} />,
  docker: <Container size={14} />,
  gitlab: <GitBranch size={14} />,
  netlify: <Triangle size={14} />,
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal });
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim().length >= 2) void performSearch(query);
      else if (query.trim().length === 0) { setResults([]); setSearched(false); }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, performSearch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Search</h2>
        <p className="text-sm text-text-muted">Search across all your connected platforms</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spaces, projects, repos, images, sites..."
            aria-label="Search query"
            className="w-full rounded-xl border border-border-primary bg-bg-tertiary pl-12 pr-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
          />
        </div>
        <Button onClick={() => performSearch(query)} loading={searching} disabled={query.trim().length < 2}>
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">{results.length} results</p>
          {results.map((r) => (
            <Link key={r.id} href={r.url}>
              <Card hover className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  {platformIcons[r.platform]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{r.title}</p>
                  <p className="text-xs text-text-muted truncate">{r.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{r.platform}</Badge>
                  <ExternalLink size={14} className="text-text-muted" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {searched && !searching && results.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16">
          <Search size={48} className="text-text-muted mx-auto mb-4 opacity-20" />
          <p className="text-text-muted">Type to search across your infrastructure</p>
        </div>
      )}
    </div>
  );
}
