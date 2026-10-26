'use client';
import type {InputHTMLAttributes,ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import {ConfigHint} from '@/components/ui/config-hint';
export const catalogButton='inline-flex min-h-8 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-base px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 max-[600px]:min-h-11';
export const catalogPrimary=catalogButton+' border-transparent! bg-[var(--accent-button)]! text-white! hover:bg-[var(--accent-button-hover)]!';
export function CatalogField({label,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string}){return <label className="config-field"><span className="config-field-label">{label}</span><input aria-label={label} {...props}/></label>;}
export function CatalogHeading({icon:Icon,title,hint}:{icon:LucideIcon;title:string;hint?:string}){return <div className="mb-3 flex items-center gap-2"><Icon size={15} strokeWidth={1.5} className="shrink-0 text-accent-ink" aria-hidden="true"/><h3 className="text-xs font-semibold">{title}</h3>{hint&&<ConfigHint label={`${title} help`}>{hint}</ConfigHint>}</div>;}
export function CatalogFooter({children}:{children:ReactNode}){return <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] bg-base px-4 py-3">{children}</footer>;}
export function MaterialStatus({item}:{item:{retired_at:string|null;is_sellable:boolean}}){return <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${item.retired_at?'text-muted':item.is_sellable?'text-[var(--config-available)]':'text-[var(--config-warning)]'}`}><span className="size-1.5 rounded-full bg-current" aria-hidden="true"/>{item.retired_at?'Retired':item.is_sellable?'Published':'Unpublished'}</span>;}
