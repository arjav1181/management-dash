export const APP_NAME = 'Bridge';
export const APP_TAGLINE = 'Unified infrastructure control center';

export const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: 'LayoutDashboard' },
  { label: 'HF Spaces', href: '/huggingface', icon: 'Boxes' },
  { label: 'Vercel', href: '/vercel', icon: 'Triangle' },
  { label: 'GitHub', href: '/github', icon: 'GitBranch' },
  { label: 'Terminal', href: '/huggingface', icon: 'Terminal' },
  { label: 'AI Agent', href: '/agent', icon: 'Bot' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

export const HF_API_BASE = 'https://huggingface.co/api';
export const HF_SPACE_BASE = 'https://huggingface.co/spaces';
export const VERCEL_API_BASE = 'https://api.vercel.com';
export const GITHUB_API_BASE = 'https://api.github.com';
