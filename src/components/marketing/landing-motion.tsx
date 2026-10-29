'use client';

import {useEffect,useRef,type ReactNode} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

/** Progressive enhancement: server-rendered content is readable before motion loads. */
export function LandingMotion({children}:{children:ReactNode}) {
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=root.current;
  if(!element)return;
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const hero=gsap.timeline({defaults:{duration:.7,ease:'power3.out'}});
   hero.fromTo(element.querySelectorAll('[data-hero-reveal]'),{y:22,autoAlpha:0},{y:0,autoAlpha:1,stagger:.09,clearProps:'transform,opacity,visibility'})
    .fromTo(element.querySelector('[data-hero-rule]'),{scaleX:0},{scaleX:1,transformOrigin:'left',duration:1},.15);
   // Native scrolling: no pinning, scroll hijacking or independent animation loop.
   element.querySelectorAll<HTMLElement>('[data-scroll-reveal]').forEach(item=>gsap.fromTo(item,{y:24,opacity:.4},{
    y:0,opacity:1,duration:.65,ease:'power3.out',clearProps:'transform,opacity',
    scrollTrigger:{trigger:item,start:'top 92%',once:true},
   }));
  },element);
  return()=>media.revert();
 },[]);
 return <div ref={root}>{children}</div>;
}
