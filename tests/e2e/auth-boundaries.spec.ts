import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('unauthenticated account and profile requests fail closed',async({page,request})=>{
  await page.goto('/account'); await expect(page).toHaveURL(/\/login\?returnTo=/);
  const profile=await request.get('/api/profile'); expect(profile.status()).toBe(401); expect(profile.headers()['cache-control']).toContain('no-store');
  const session=await request.get('/api/auth/session'); expect(await session.json()).toEqual({user:null,otpEnabled:false,googleEnabled:false}); expect(session.headers()['cache-control']).toContain('no-store');
});

test('cross-origin mutations and malformed bodies are rejected; deferred OTP sends nothing',async({request})=>{
  const foreign=await request.post('/api/auth/request',{headers:{Origin:'https://untrusted.example'},data:{email:'not-sent@example.test'}}); expect(foreign.status()).toBe(403);
  const absent=await request.post('/api/auth/signout'); expect(absent.status()).toBe(403);
  const invalid=await request.post('/api/auth/request',{headers:{Origin:'http://127.0.0.1:3100'},data:{email:'invalid'}}); expect(invalid.status()).toBe(400);
  const large=await request.post('/api/auth/request',{headers:{Origin:'http://127.0.0.1:3100'},data:{email:'x'.repeat(3000)}}); expect(large.status()).toBe(400);
  const deferred=await request.post('/api/auth/request',{headers:{Origin:'http://127.0.0.1:3100'},data:{email:'not-sent@example.test'}}); expect(deferred.status()).toBe(503); expect((await deferred.json()).error).toContain('not enabled');
});

test('canceled deferred sign-in preserves the current draft and keyboard focus',async({page})=>{
  await page.goto('/projects/new?type=table'); await page.getByLabel('Project name',{exact:true}).fill('Keep my local bookshelf');
  await page.getByRole('button',{name:'Create draft',exact:true}).click(); await expect(page.getByRole('heading',{name:'Keep my local bookshelf',exact:true})).toBeVisible();
  const original=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1')); const url=page.url();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();const trigger=page.getByRole('button',{name:'Sign in and continue',exact:true}); await trigger.click();
  await expect(page.getByRole('dialog',{name:'Sign in to your workspace',exact:true})).toBeVisible(); await expect(page.getByRole('button',{name:'Sign in with Google',exact:true})).toBeDisabled();
  await expect(page.getByText(/Google sign-in is being set up/)).toBeVisible();
  await expect(page.getByLabel('Email address',{exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await expect(page).toHaveURL(url);
  expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(original);
  await page.reload(); await expect(page.getByRole('heading',{name:'Keep my local bookshelf',exact:true})).toBeVisible();
});

test('account status outage offers retry without disabling guest projects',async({page})=>{
  await page.route('**/api/auth/session',route=>route.fulfill({status:503,json:{error:'Unavailable'}}));
  await page.goto('/projects'); await expect(page.getByRole('button',{name:'Retry account',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'New project',exact:true})).toBeEnabled();
  await page.unroute('**/api/auth/session'); await page.getByRole('button',{name:'Retry account',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
});

test('deferred authentication captures fit desktop mobile and paired theme',async({page})=>{
  await mkdir('.impeccable/review/phase-03-google',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,1080],['mobile',390,844]] as const) {
    await page.setViewportSize({width,height}); await page.goto('/projects');
    await page.getByRole('button',{name:'Sign in',exact:true}).click(); await expect(page.getByText(/Google sign-in is being set up/)).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`.impeccable/review/phase-03-google/${name}-setup.png`}); await page.getByRole('button',{name:'Cancel',exact:true}).click();
  }
  await page.setViewportSize({width:1440,height:1080}); await page.getByRole('button',{name:'Toggle light and dark theme'}).click();
  await page.getByRole('button',{name:'Sign in',exact:true}).click(); await expect(page.locator('html')).toHaveClass(/light/);
  await page.screenshot({path:'.impeccable/review/phase-03-google/desktop-light-setup.png'});
});
