'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { AgentAction } from '@/types';

interface ActionConfirmationProps {
  action: AgentAction | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ActionConfirmation({ action, onApprove, onReject }: ActionConfirmationProps) {
  if (!action) return null;

  return (
    <Modal
      open={!!action}
      onClose={() => onReject(action.id)}
      title="Confirm Action"
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber/5 border border-amber/20">
          <AlertTriangle size={20} className="text-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-text-primary font-medium">{action.description}</p>
            {action.args && Object.keys(action.args).length > 0 && (
              <pre className="text-xs text-text-muted bg-bg-elevated/40 rounded p-2 overflow-x-auto">
                {Object.entries(action.args).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n')}
              </pre>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => onReject(action.id)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onApprove(action.id)}>
            <CheckCircle size={14} />
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
