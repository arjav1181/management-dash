'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SkeletonFileTree, Skeleton } from '@/components/ui/skeleton';
import { useToastStore } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import { ArrowLeft, Folder, File, Save, Trash2, RefreshCw } from 'lucide-react';
import type { HFFile } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function SpaceFilesPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { hasToken } = useSettingsStore();
  const { addToast } = useToastStore();
  const [files, setFiles] = useState<HFFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFiles = async (path = '') => {
    if (!hasToken('hf')) return;
    setLoading(true);
    try {
      const url = `/api/hf/spaces/${encodeURIComponent(spaceId)}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        addToast('error', 'Failed to list files');
        setFiles([]);
        return;
      }
      const data = await res.json();
      setFiles(data);
    } catch {
      addToast('error', 'Failed to list files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [spaceId, hasToken('hf')]);

  const openFile = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/file/${filePath.split('/').map(encodeURIComponent).join('/')}`);
      if (!res.ok) {
        addToast('error', 'Failed to read file');
        setFileContent('');
        return;
      }
      const content = await res.text();
      setFileContent(content);
    } catch {
      addToast('error', 'Failed to read file');
      setFileContent('');
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/file/${selectedFile.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: fileContent,
    });
    const data = await res.json();
    if (data.success) addToast('success', 'File saved');
    else addToast('error', 'Failed to save file');
    setSaving(false);
  };

  const deleteFile = async (filePath: string) => {
    const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/file/${filePath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      addToast('success', 'File deleted');
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setFileContent('');
      }
      fetchFiles();
    } else addToast('error', 'Failed to delete file');
  };

  const getLanguage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
      jsx: 'javascript', json: 'json', yml: 'yaml', yaml: 'yaml',
      md: 'markdown', sh: 'shell', html: 'html', css: 'css',
      dockerfile: 'dockerfile', txt: 'text', toml: 'toml',
    };
    return map[ext || ''] || 'plaintext';
  };

  const renderFileTree = (items: HFFile[], depth = 0) => (
    <div>
      {items.map((item) => (
        <div key={item.path}>
          <button
            onClick={() => {
              if (item.type === 'dir') fetchFiles(item.path);
              else openFile(item.path);
            }}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-bg-tertiary/50 rounded transition-colors text-left"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            aria-label={item.type === 'dir' ? `Open folder ${item.name}` : `Open file ${item.name}`}
          >
            {item.type === 'dir' ? (
              <Folder size={14} className="text-amber" />
            ) : (
              <File size={14} className="text-text-muted" />
            )}
            <span className={`truncate ${selectedFile === item.path ? 'text-accent' : 'text-text-secondary'}`}>
              {item.name}
            </span>
          </button>
          {item.children?.map((child) => (
            <button
              key={child.path}
              onClick={() => openFile(child.path)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-bg-tertiary/50 rounded transition-colors text-left"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              aria-label={`Open file ${child.name}`}
            >
              <File size={14} className="text-text-muted" />
              <span className={`truncate ${selectedFile === child.path ? 'text-accent' : 'text-text-secondary'}`}>
                {child.name}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">File Editor</h2>
          <p className="text-xs text-text-muted">{spaceId}</p>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={() => fetchFiles()} loading={loading}>
          <RefreshCw size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonFileTree />
            ) : files.length === 0 ? (
              <p className="text-sm text-text-muted">No files</p>
            ) : (
              renderFileTree(files)
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm truncate">{selectedFile || 'Select a file'}</CardTitle>
              <div className="flex items-center gap-2">
                {selectedFile && (
                  <>
                    <Button size="sm" variant="danger" onClick={() => deleteFile(selectedFile)} aria-label="Delete file">
                      <Trash2 size={14} />
                    </Button>
                    <Button size="sm" onClick={saveFile} loading={saving}>
                      <Save size={14} />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {loading ? (
              <div className="h-[calc(100vh-20rem)] rounded-lg border border-border-primary p-4 space-y-3">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
                ))}
              </div>
            ) : selectedFile ? (
              <div className="h-[calc(100vh-20rem)] rounded-lg overflow-hidden border border-border-primary">
                <MonacoEditor
                  value={fileContent}
                  onChange={(val) => setFileContent(val || '')}
                  language={getLanguage(selectedFile)}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'var(--font-geist-mono)',
                    scrollBeyondLastLine: false,
                    padding: { top: 8 },
                  }}
                />
              </div>
            ) : (
              <div className="h-[calc(100vh-20rem)] flex items-center justify-center text-text-muted text-sm">
                Select a file from the tree to edit
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
