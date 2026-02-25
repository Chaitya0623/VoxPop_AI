'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Brain, Upload, Layers, ClipboardList, BarChart3, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Brain },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/scenarios', label: 'Scenarios', icon: Layers },
  { href: '/survey', label: 'Survey', icon: ClipboardList },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const reset = useAppStore((s) => s.reset);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              VoxPop<span className="text-primary"> AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                if (confirm('Reset all data? This cannot be undone.')) reset();
              }}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all"
              title="Reset all data"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
