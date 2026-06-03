'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertTriangle, ArrowRight, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WSSPatchWizardProps {
  spaceName: string;
  onPatch: () => Promise<boolean>;
}

type Step = 'intro' | 'patching' | 'done' | 'error';

export function WSSPatchWizard({ spaceName, onPatch }: WSSPatchWizardProps) {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState('');

  const steps = [
    { label: 'Read space files', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
    { label: 'Generate JWT secret', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
    { label: 'Inject wss_agent.py', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
    { label: 'Patch Dockerfile/start.sh', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
    { label: 'Add dependencies', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
    { label: 'Commit & rebuild', status: step === 'patching' ? 'doing' : step === 'done' ? 'done' : 'pending' },
  ];

  const handlePatch = async () => {
    setStep('patching');
    try {
      const result = await onPatch();
      setStep(result ? 'done' : 'error');
      if (!result) setError('Patching failed');
    } catch (e) {
      setStep('error');
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal size={18} className="text-accent" />
          WSS Agent Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              This will inject a WebSocket terminal agent into <strong className="text-text-primary">{spaceName}</strong>,
              giving you remote command execution via the dashboard.
            </p>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Generates a unique JWT secret for auth</li>
              <li>Injects wss_agent.py into the space</li>
              <li>Patches Dockerfile / start.sh to run the agent</li>
              <li>Adds websockets + pyjwt to requirements</li>
              <li>Space will rebuild automatically</li>
            </ul>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber/5 border border-amber/20 text-xs text-amber">
              <AlertTriangle size={14} />
              The space will restart during rebuild
            </div>
            <Button onClick={handlePatch}>
              Start Patching
              <ArrowRight size={14} />
            </Button>
          </div>
        )}

        {step === 'patching' && (
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {s.status === 'done' ? (
                  <CheckCircle size={16} className="text-emerald" />
                ) : s.status === 'doing' ? (
                  <Loader2 size={16} className="text-amber animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border-primary" />
                )}
                <span className={cn(
                  s.status === 'done' ? 'text-text-primary' :
                  s.status === 'doing' ? 'text-amber' : 'text-text-muted'
                )}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-3">
            <CheckCircle size={40} className="text-emerald mx-auto" />
            <p className="text-text-primary font-medium">WSS Agent Patched!</p>
            <p className="text-xs text-text-muted">Wait for the space to rebuild, then connect via WSS</p>
            <Badge variant="success">Agent injected</Badge>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-3">
            <AlertTriangle size={40} className="text-rose mx-auto" />
            <p className="text-text-primary font-medium">Patch Failed</p>
            <p className="text-xs text-rose">{error}</p>
            <Button variant="secondary" onClick={() => setStep('intro')}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
