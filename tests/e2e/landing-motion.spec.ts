import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const figure=(page:import('@playwright/test').Page)=>page.getByRole('figure',{name:'Interactive cabinet study'});
const firstPiece=(page:import('@playwright/test').Page)=>figure(page).locator('[data-cabinet-piece]').first();

test('cabinet motion reverses cleanly and survives route and motion-preference changes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');
 await expect(figure(page)).toHaveAttribute('data-motion-ready','true');
 const origin=await firstPiece(page).locator('polygon').first().getAttribute('points');
 await expect.poll(()=>firstPiece(page).evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41))).toBeLessThan(.01);
 await page.getByRole('button',{name:'Explode cabinet',exact:true}).click();
 await expect(page.getByRole('img',{name:'Exploded cabinet panel schematic',exact:true})).toBeVisible();
 await expect.poll(()=>firstPiece(page).evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41))).toBeGreaterThan(1);
 // Reversal while moving must settle at the authored assembled coordinates.
 await page.getByRole('button',{name:'Assemble cabinet',exact:true}).click();
 await expect.poll(()=>firstPiece(page).evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41))).toBeLessThan(.01);
 await expect(firstPiece(page).locator('polygon').first()).toHaveAttribute('points',origin!);
 await page.getByRole('heading',{name:'Designed with Dhaka in mind.',exact:true}).scrollIntoViewIfNeeded();
 await expect(page.getByRole('link',{name:'Start your first design'})).toBeVisible();
 await page.getByRole('link',{name:'CutPlan Studio home'}).click();
 await page.getByRole('link',{name:'Try it out',exact:true}).click();
 await expect(page).toHaveURL('/projects/new');
 await page.getByRole('link',{name:'CutPlan Studio home'}).click();
 await expect(figure(page)).toHaveCount(1);
 await expect(figure(page)).toHaveAttribute('data-motion-ready','true');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Explode cabinet',exact:true}).click();
 const reducedTransform=await firstPiece(page).getAttribute('transform');
 await page.waitForTimeout(120); // Verify that reduced mode has no continuing panel movement.
 await expect(firstPiece(page)).toHaveAttribute('transform',reducedTransform??'');
 await page.getByRole('button',{name:'Assemble cabinet',exact:true}).click();
 await expect.poll(()=>firstPiece(page).evaluate(el=>Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41))).toBeLessThan(.01);
 expect(errors).toEqual([]);
});

test('landing remains complete on mobile, in both themes and without JavaScript',async({page,browser})=>{
 await mkdir('artifacts/review/landing-motion',{recursive:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});await page.goto('/');
  await expect(page.getByRole('heading',{name:'Your space. Your furniture.',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/review/landing-motion/landing-${width}-dark.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Toggle light and dark theme',exact:true}).click();
 await page.screenshot({path:'artifacts/review/landing-motion/landing-390-light.png',fullPage:true});
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
 const staticPage=await context.newPage();await staticPage.goto('/');
 await expect(staticPage.getByRole('heading',{name:'Your space. Your furniture.',exact:true})).toBeVisible();
 await expect(staticPage.getByRole('link',{name:'Try it out',exact:true})).toBeVisible();
 await expect(staticPage.getByRole('img',{name:'Assembled cabinet panel schematic',exact:true})).toBeVisible();
 await context.close();
});

test('assembly entrance has distinct start, middle and settled frames',async({page})=>{
 await mkdir('artifacts/review/landing-motion',{recursive:true});
 const now=new Date('2026-10-26T10:00:00Z');
 await page.clock.install({time:now});
 await page.clock.pauseAt(new Date(now.getTime()+1000));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');
 await expect(figure(page)).toHaveAttribute('data-motion-ready','true');
 await page.clock.runFor(32);
 const start=await firstPiece(page).evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
 const piecesFit=await figure(page).getByRole('img').evaluate(svg=>{
  const bounds=svg.getBoundingClientRect();
  return [...svg.querySelectorAll('[data-cabinet-piece]')].every(piece=>{
   const rect=piece.getBoundingClientRect();
   return rect.left>=bounds.left-1&&rect.right<=bounds.right+1&&rect.top>=bounds.top-1&&rect.bottom<=bounds.bottom+1;
  });
 });
 expect(piecesFit).toBe(true);
 await page.screenshot({path:'artifacts/review/landing-motion/motion-start.png'});
 await page.clock.runFor(350);
 await page.screenshot({path:'artifacts/review/landing-motion/motion-middle.png'});
 await page.clock.runFor(1200);
 await page.screenshot({path:'artifacts/review/landing-motion/motion-settled.png'});
 const end=await firstPiece(page).evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
 expect(Math.abs(start)).toBeGreaterThan(1);
 expect(Math.abs(end)).toBeLessThan(.01);
});
