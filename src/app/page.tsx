import Link from 'next/link';
import type {Metadata} from 'next';
import {ArrowDown,ArrowUpRight,ArrowRight,DoorOpen,Footprints,BookOpen,Table2,Ruler,Box,Layers} from 'lucide-react';
import {RecentDrafts} from '@/components/drafts/project-dashboard';
import {Blueprint} from '@/components/marketing/blueprint';
import {LandingMotion} from '@/components/marketing/landing-motion';

export const metadata:Metadata={title:'Furniture that fits your space',description:'Explore custom-sized cabinets, shoe racks, bookshelves and panel tables. Try the measured design studio. Ordering for Dhaka is not yet open.',openGraph:{title:'CutPlan Studio — Furniture that fits your space',description:'Measure your space. Explore your design. Review every panel.',type:'website',locale:'en_BD'}};
const families=[{type:'cabinet',name:'Cabinets',copy:'Storage made around your room.',Icon:DoorOpen},{type:'shoe_rack',name:'Shoe racks',copy:'A measured place for every pair.',Icon:Footprints},{type:'bookshelf',name:'Bookshelves',copy:'Open shelves for your collection.',Icon:BookOpen},{type:'table',name:'Tables',copy:'Room to work. Space to create.',Icon:Table2}];
const steps=[{title:'Start with your space.',copy:'Choose your furniture and enter width, height and depth. Work in millimeters or inch/suta.',Icon:Ruler,detail:'01 / MEASURE'},{title:'See it come together.',copy:'Explore every panel in 3D. Check measured 2D views and choose materials that suit your design.',Icon:Box,detail:'02 / EXPLORE'},{title:'Make every detail count.',copy:'Review the cut list, sheet layouts and part labels. Save a draft and pick up where you left off.',Icon:Layers,detail:'03 / REFINE'}];

export default function Home(){return <LandingMotion><div className="mx-auto max-w-7xl px-5 sm:px-10">
 <section className="grid items-center gap-12 py-12 lg:min-h-[720px] lg:grid-cols-[.95fr_1.05fr] lg:gap-16 lg:py-16" aria-labelledby="landing-title">
  <div className="min-w-0">
   <p data-hero-reveal className="mb-7 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[.17em] text-accent-ink"><span className="size-1.5 rounded-full bg-accent-ink"/>Less guesswork. More possibility.</p>
   <h1 id="landing-title" data-hero-reveal className="max-w-[10ch] text-[clamp(48px,5.7vw,80px)] font-medium leading-[1.02] tracking-[-.06em]">Your space. Your furniture.</h1>
   <p data-hero-reveal className="mt-7 max-w-[36ch] text-base leading-7 text-muted">That awkward corner. The wall between two doors. Design furniture around the space you actually have.</p>
   <div data-hero-reveal className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2">
    <Link href="/projects/new" className="group inline-flex min-h-12 items-center gap-5 rounded-lg bg-accent-button px-6 text-sm font-semibold text-white transition-colors hover:bg-button-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400">Try it out<ArrowUpRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"/></Link>
    <Link href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 text-sm text-muted transition-colors hover:text-ink">See how it works<ArrowDown size={14} aria-hidden="true"/></Link>
   </div>
   <p data-hero-reveal className="mt-5 text-xs text-muted">Free browser drafts. No account needed to start.</p>
   <div className="mt-10 max-w-[390px]">
    <div data-hero-rule className="h-px bg-[var(--border)]"/>
    <p data-hero-reveal className="mt-4 max-w-[43ch] text-[11px] leading-5 text-muted">Your design starts here. Designs use proposed construction rules; ordering is not yet open.</p>
   </div>
  </div>
  <div className="min-w-0"><Blueprint/></div>
 </section>
 <RecentDrafts/>
 <section className="border-t border-[var(--border)] py-12 lg:py-16" aria-labelledby="family-title">
  <div data-scroll-reveal className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-[10px] uppercase tracking-[.18em] text-accent-ink">Find your starting point</p><h2 id="family-title" className="text-2xl font-medium tracking-[-.035em] sm:text-3xl">Make room for what matters.</h2></div><p className="text-xs text-muted">Four ways to make it yours.</p></div>
  <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4 md:gap-8">{families.map(({type,name,copy,Icon},i)=><Link data-scroll-reveal key={type} href={`/projects/new?type=${type}`} className="group min-w-0 border-t border-[var(--border)] py-5 transition-colors hover:border-[var(--accent-text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400"><div className="mb-7 flex items-start justify-between"><Icon className="text-accent-ink" size={30} strokeWidth={1.2}/><span className="text-[10px] tabular-nums text-muted">0{i+1}</span></div><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium group-hover:text-accent-ink">{name}</h3><ArrowUpRight size={14} className="text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true"/></div><p className="mt-2 max-w-[23ch] text-xs leading-6 text-muted">{copy}</p></Link>)}</div>
 </section>
 <section id="how-it-works" className="scroll-mt-8 border-t border-[var(--border)] py-12 lg:py-16" aria-labelledby="how-title">
  <div data-scroll-reveal className="mb-10 grid gap-5 md:grid-cols-2 md:items-end"><div><p className="mb-3 text-[10px] uppercase tracking-[.18em] text-accent-ink">A clearer way to create</p><h2 id="how-title" className="max-w-[20ch] text-3xl font-medium leading-tight tracking-[-.035em] sm:text-4xl">From a measurement<br/>to a clearer plan.</h2></div><p className="max-w-[37ch] text-sm leading-7 text-muted md:justify-self-end">See what you are making before any board is cut. Adjust the details until it feels right.</p></div>
  <ol className="grid gap-7 md:grid-cols-3 md:gap-10">{steps.map(({title,copy,Icon,detail})=><li key={title} data-scroll-reveal className="border-t border-[var(--border)] pt-5"><div className="mb-8 flex items-center justify-between text-accent-ink"><span className="text-[10px] font-medium tracking-[.12em]">{detail}</span><Icon size={19} strokeWidth={1.3} aria-hidden="true"/></div><h3 className="text-base font-medium tracking-tight text-ink">{title}</h3><p className="mt-3 max-w-[35ch] text-sm leading-7 text-muted">{copy}</p></li>)}</ol>
 </section>
 <section className="grid gap-8 border-t border-[var(--border)] py-12 md:grid-cols-[1.1fr_.9fr] lg:py-16" aria-labelledby="availability-title">
  <div data-scroll-reveal><p className="mb-3 text-[10px] uppercase tracking-[.18em] text-accent-ink">Made around real life</p><h2 id="availability-title" className="text-2xl font-medium tracking-tight sm:text-3xl">Designed with Dhaka in mind.</h2><p className="mt-4 max-w-[49ch] text-sm leading-7 text-muted">Custom-sized panel furniture, with a planned flat-pack service for approved Dhaka areas. Delivery coverage, prices and installation terms are still being finalized.</p></div>
  <div data-scroll-reveal className="rounded-xl border border-[var(--border)] bg-surface p-6 sm:p-8"><p className="text-[10px] font-medium uppercase tracking-[.16em] text-accent-ink">The studio is yours to explore</p><h3 className="mt-4 text-xl font-medium tracking-tight">A small space. A good idea.<br/>Start there.</h3><p className="mt-4 text-xs leading-6 text-muted">Use the design studio, browser drafts and saved account projects today. No payment is collected. Quotes, live ordering and manufacturing await approval.</p><Link className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-medium text-accent-ink hover:underline hover:underline-offset-4" href="/projects/new">Start your first design<ArrowRight size={16} aria-hidden="true"/></Link></div>
 </section>
 </div></LandingMotion>;}
