'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { listSpaceFiles, readSpaceFile, writeSpaceFile, deleteSpaceFile } from '@/lib/api/huggingface';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToastStore } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import { ArrowLeft, Folder, File, Save, Trash2, RefreshCw } from 'lucide-react';
import type { HFFile } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function SpaceFilesPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [files, setFiles] = useState<HFFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fetchFiles = async (path = '') => {
    if (!settings.hfToken) return;
    setLoading(true);
    try {
      const data = await listSpaceFiles(settings.hfToken, spaceId, path);
      setFiles(data);
    } catch {
      addToast('error', 'Failed to list files');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [spaceId, settings.hfToken]);

  const openFile = async (filePath: string) => {
    if (!settings.hfToken) return;
    setSelectedFile(filePath);
    try {
      const content = await readSpaceFile(settings.hfToken, spaceId, filePath);
      setFileContent(content);
    } catch {
      addToast('error', 'Failed to read file');
      setFileContent('');
    }
  };

  const saveFile = async () => {
    if (!selectedFile || !settings.hfToken) return;
    setSaving(true);
    const ok = await writeSpaceFile(settings.hfToken, spaceId, selectedFile, fileContent);
    if (ok) addToast('success', 'File saved');
    else addToast('error', 'Failed to save file');
    setSaving(false);
  };

  const deleteFile = async (filePath: string) => {
    if (!settings.hfToken) return;
    const ok = await deleteSpaceFile(settings.hfToken, spaceId, filePath);
    if (ok) {
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
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-bg-tertiary/50 rounded transition-colors"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
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
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-bg-tertiary/50 rounded transition-colors"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
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
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
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

      <div className="grid grid-cols-[300px_1fr] gap-4">
        <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-text-muted">Loading...</p>
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
                    <Button size="sm" variant="danger" onClick={() => deleteFile(selectedFile)}>
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
            {selectedFile ? (
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
