'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { SpaceCard } from '@/components/hf/space-card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RefreshCw, Search, Boxes } from 'lucide-react';
import type { HFSpace } from '@/types';

export default function HFSpacesPage() {
  const { hasToken } = useSettingsStore();
  const router = useRouter();
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSpaces = async () => {
    if (!hasToken('hf')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/hf/spaces');
      if (!res.ok) {
        setSpaces([]);
        return;
      }
      const data = await res.json();
      setSpaces(data);
    } catch {
      setSpaces([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpaces();
  }, [hasToken('hf')]);

  const filtered = spaces.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleTerminal = (spaceId: string) => {
    router.push(`/huggingface/${spaceId}/terminal`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Search spaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search spaces"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchSpaces} loading={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {!hasToken('hf') && (
        <div className="text-center py-12">
          <Boxes size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">HF Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your Hugging Face token in Settings</p>
          <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
        </div>
      )}

      {hasToken('hf') && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {hasToken('hf') && !loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">No spaces found for this account</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onTerminal={handleTerminal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
