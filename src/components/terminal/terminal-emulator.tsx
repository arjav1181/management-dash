'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Send, Trash2 } from 'lucide-react';

interface TerminalEmulatorProps {
  onCommand: (command: string) => void;
  output: string[];
  connected: boolean;
  className?: string;
}

export function TerminalEmulator({ onCommand, output, connected, className }: TerminalEmulatorProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#e2e8f0',
        cursor: '#6366f1',
        selectionBackground: '#6366f122',
        black: '#000000',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#6366f1',
        magenta: '#a855f7',
        cyan: '#22d3ee',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#818cf8',
        brightMagenta: '#c084fc',
        brightCyan: '#67e8f9',
        brightWhite: '#f1f5f9',
      },
      fontSize: 13,
      fontFamily: 'var(--font-geist-mono), monospace',
      cursorBlink: true,
      allowTransparency: true,
      rows: 20,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.write(`\x1b[36mManagement Dash Terminal\x1b[0m\r\n`);
    term.write(`\x1b[2m${connected ? 'Connected' : 'Disconnected'}\x1b[0m\r\n\r\n`);
    term.write(`\x1b[32m$\x1b[0m `);

    term.onKey((e) => {
      if (e.domEvent.key === 'Enter') {
        const cmd = input;
        term.write('\r\n');
        if (cmd.trim()) {
          onCommand(cmd);
          term.write(`\x1b[32m$\x1b[0m `);
        } else {
          term.write(`\x1b[32m$\x1b[0m `);
        }
        setInput('');
      } else if (e.domEvent.key === 'Backspace') {
        if (input.length > 0) {
          setInput((prev) => prev.slice(0, -1));
          term.write('\b \b');
        }
      } else if (!e.domEvent.ctrlKey && !e.domEvent.metaKey) {
        setInput((prev) => prev + e.key);
        term.write(e.key);
      }
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;
    output.forEach((line) => {
      term.writeln(line);
    });
  }, [output]);

  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;
    term.write(`\r\n\x1b[2m${connected ? 'Connected' : 'Disconnected'}\x1b[0m\r\n`);
    term.write(`\x1b[32m$\x1b[0m `);
  }, [connected]);

  const handleSendCommand = () => {
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
      xtermRef.current?.write(`\r\n\x1b[32m$\x1b[0m `);
    }
  };

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-emerald animate-pulse-dot' : 'bg-rose')} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={handleClear}>
          <Trash2 size={14} />
        </Button>
      </div>
      <div
        ref={terminalRef}
        className="rounded-xl overflow-hidden border border-border-primary bg-black"
      />
      {!connected && (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Type a command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
          />
          <Button size="sm" onClick={handleSendCommand}>
            <Send size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
