'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button grid place-items-center w-10 h-10 [border:1px_solid_var(--border)] rounded-[8px] bg-transparent text-muted [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:w-11 [@media(width<=760px)]:h-11 [&:hover]:bg-surface [&:hover]:text-ink theme-toggle [&_.sun-icon]:hidden [.dark_&_.sun-icon]:block [.dark_&_.moon-icon]:hidden"
      type="button"
      aria-label="Toggle light and dark theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="sun-icon" size={18} aria-hidden="true" />
      <Moon className="moon-icon" size={18} aria-hidden="true" />
    </button>
  );
}
