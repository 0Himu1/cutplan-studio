'use client';

import Link from 'next/link';
import {MarketingShell} from './marketing/shell';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Box, FolderOpen, House, Package, PanelLeftClose } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { AccountControl, AccountSummary } from '@/components/auth/account-control';

const links = [
  { href: '/', label: 'Home', icon: House },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/orders', label: 'Orders', icon: Package }
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if(pathname==='/')return <MarketingShell>{children}</MarketingShell>;
  const activePath = pathname.startsWith('/projects') ? '/projects' : pathname;
  return (
    <div className="studio-shell min-h-[100dvh] grid grid-cols-[224px_minmax(0,_1fr)] [@media(width<=760px)]:block [@media(width<=1100px)]:grid-cols-[200px_minmax(0,1fr)]">
      <a className="skip-link fixed top-2 left-3 [transform:translateY(-150%)] z-100 pt-3 pr-4 pb-3 pl-4 bg-accent-button text-white rounded-[6px] [&:focus]:[transform:translateY(0)]" href="#main">Skip to content</a>
      <aside className="sidebar bg-surface [border-right:1px_solid_var(--border)] flex flex-col pt-7 pr-4 pb-0 pl-4 sticky top-0 h-[100dvh] [@media(width<=760px)]:[border-right:none] [@media(width<=760px)]:pt-5 [@media(width<=760px)]:pr-5 [@media(760px<width<=1100px)]:pr-3 [@media(width<=760px)]:pb-3 [@media(width<=760px)]:pl-5 [@media(760px<width<=1100px)]:pl-3 [@media(width<=760px)]:static [@media(width<=760px)]:h-auto [@media(width<=760px)]:[border-bottom:1px_solid_var(--border)]" aria-label="Studio navigation">
        <Link className="brand flex items-center gap-[10px] text-[length:16px] font-[650] tracking-[-.035em] pt-0 pr-2 pb-0 pl-2 whitespace-nowrap [@media(width<=1100px)]:gap-[7px] [@media(width<=760px)]:text-[length:17px] [@media(760px<width<=1100px)]:text-[length:15px] [@media(width<=760px)]:pr-1 [@media(width<=760px)]:pl-1" href="/" aria-label="CutPlan Studio home">
          <span className="brand-symbol text-accent-ink flex"><Box size={23} strokeWidth={1.6} aria-hidden="true" /></span>
          <span>CutPlan <span className="brand-secondary font-[420] text-muted">Studio</span></span>
        </Link>
        <div className="workspace-label mt-[42px] mr-3 mb-4 ml-3 flex gap-2 items-center text-[length:12px] text-muted [@media(width<=760px)]:hidden"><span className="workspace-dot w-[5px] h-[5px] rounded-full bg-muted" />Your workspace</div>
        <nav className="primary-nav grid gap-1 [@media(width<=760px)]:gap-2 [@media(width<=760px)]:mt-5 [@media(width<=760px)]:grid-cols-[repeat(3,minmax(0,1fr))]" aria-label="Main">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link flex items-center gap-3 min-h-11 pt-0 pr-3 pb-0 pl-3 rounded-[7px] text-muted font-[450] [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:gap-2 [@media(width<=760px)]:pr-2 [@media(width<=760px)]:pl-2 [@media(width<=760px)]:justify-center [@media(width<=760px)]:text-[length:13px] [&:hover]:text-ink [&:hover]:bg-elevated [&.active]:bg-accent-soft [&.active]:text-accent-ink [&.active]:font-[550] ${activePath === href ? 'active' : ''}`} aria-current={activePath === href ? 'page' : undefined}>
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom mt-auto pt-7 pr-3 pb-0 pl-3 [@media(width<=760px)]:hidden [&_>_p]:text-muted [&_>_p]:text-[length:12px] [&_>_p]:leading-[1.8]">
          <p>Made for your space.<br />Planned for Dhaka.</p>
          <Link className="subtle-link flex items-center gap-[6px] text-ink text-[length:12px] mt-3 mr-0 mb-[26px] ml-0 min-h-7 [&:hover]:underline [&:hover]:underline-offset-[4px]" href="/#how-it-works">How it works <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <AccountSummary />
        </div>
      </aside>
      <div className="workspace min-w-0 flex flex-col [@media(width<=760px)]:min-h-[calc(100dvh_-_136px)]">
        <header className="topbar h-17 [border-bottom:1px_solid_var(--border)] flex justify-between items-center pt-0 pr-9 pb-0 pl-9 gap-4 [@media(width<=760px)]:h-15 [@media(width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7">
          <div className="breadcrumb text-muted flex items-center gap-[14px] text-[length:12px] [@media(width<=760px)]:gap-[10px] [&_>_:last-child]:text-ink"><PanelLeftClose size={17} aria-hidden="true" /><span>Studio</span><span className="breadcrumb-slash text-diagram">/</span><span>{links.find(link => link.href === activePath)?.label ?? 'Workspace'}</span></div>
          <div className="topbar-actions flex items-center gap-5 [@media(width<=760px)]:gap-[10px]"><AccountControl /><ThemeToggle /></div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="workspace-footer pt-[22px] pr-12 pb-[22px] pl-12 text-muted flex justify-between gap-5 text-[length:12px] [@media(width<=760px)]:pt-4 [@media(width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pb-6 [@media(width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7 [@media(width<=420px)]:gap-[6px] [@media(width<=420px)]:flex-col"><span>Custom-sized panel furniture</span><span>Dhaka, Bangladesh</span></footer>
      </div>
    </div>
  );
}
