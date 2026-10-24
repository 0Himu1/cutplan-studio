'use client';

import {UnitProvider} from '@/components/measurement/unit-provider';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth/auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange><AuthProvider><UnitProvider>{children}</UnitProvider></AuthProvider></ThemeProvider>;
}
