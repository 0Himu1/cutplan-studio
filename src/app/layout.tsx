import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import { StudioShell } from '@/components/studio-shell';
import './globals.css';

const inter = localFont({ src: '../../public/fonts/InterVariable.woff2', variable: '--font-inter', display: 'swap', weight: '100 900' });

export const metadata: Metadata = {
  title: { default: 'CutPlan Studio', template: '%s | CutPlan Studio' },
  description: 'A measured panel-furniture design workspace. Explore your design; ordering and manufacturing await approval.',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions such as Grammarly add body attributes before hydration.
  // Suppression applies only to this element, leaving component mismatches visible.
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body className={inter.variable} suppressHydrationWarning><Providers><StudioShell>{children}</StudioShell></Providers></body></html>;
}
