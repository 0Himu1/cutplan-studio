import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('Google PKCE redirect returns to the original draft with HttpOnly session cookies',async({page,context})=>{
  await page.goto('/projects/new?type=table'); await page.getByLabel('Project name',{exact:true}).fill('Google contract cabinet');
  await page.getByRole('button',{name:'Create draft',exact:true}).click(); await expect(page.getByRole('heading',{name:'Google contract cabinet',exact:true})).toBeVisible();
  const returnUrl=page.url(); const original=await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'));
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click(); await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Isolated contract identity provider'})).toBeVisible();
  const providerUrl=new URL(page.url()); expect(providerUrl.searchParams.get('code_challenge')).toBeTruthy(); expect(providerUrl.searchParams.get('code_challenge_method')?.toLowerCase()).toBe('s256');
  expect(providerUrl.searchParams.get('redirect_to')).toBe('http://127.0.0.1:3101/auth/callback');
  expect(providerUrl.searchParams.get('scopes')).not.toMatch(/gmail|drive/);
  await page.getByRole('link',{name:'Allow contract sign-in'}).click();
  await expect(page).toHaveURL(returnUrl);await page.getByRole('link',{name:/All projects/}).click(); await expect(page.getByRole('link',{name:'My account',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(original);
  expect(await page.evaluate(()=>document.cookie)).not.toContain('auth-token');
  for(const body of [{action:'quote',operationId:'00000000-0000-4000-8000-000000000901',projectId:'0123456789abcdef01234567',revisionId:'00000000-0000-4000-8000-000000000301'},{action:'order',operationId:'00000000-0000-4000-8000-000000000902',quoteId:'00000000-0000-4000-8000-000000000701',address:{}},{action:'email',quoteId:'00000000-0000-4000-8000-000000000701'}]){const response=await page.request.post('/api/commerce',{headers:{Origin:'http://127.0.0.1:3101'},data:body});expect(response.status()).toBe(422);expect((await response.json()).code).toBe('live_commerce_disabled');}

  const inference=await page.request.post('/api/photos/analyze',{headers:{Origin:'http://127.0.0.1:3101'}});expect(inference.status()).toBe(422);expect((await inference.json()).code).toBe('inference_disabled');
  expect((await page.request.get('/api/admin/readiness')).status()).toBe(403);
  const ownAssembly=await page.request.get('/api/assembly?orderId=00000000-0000-4000-8000-000000000801');expect(ownAssembly.status()).toBe(200);expect(ownAssembly.headers()['content-type']).toBe('application/pdf');expect(ownAssembly.headers()['cache-control']).toContain('no-store');expect(ownAssembly.headers()['content-disposition']).toContain('REVIEW-ONLY');
  expect((await page.request.get('/api/assembly?orderId=00000000-0000-4000-8000-000000000802')).status()).toBe(404);
  expect((await page.request.get('/api/assembly?orderId=00000000-0000-4000-8000-000000000803')).status()).toBe(422);
  expect((await page.request.get('/api/admin/operations')).status()).toBe(403);
  expect((await page.request.get('/api/admin/production')).status()).toBe(403);
  expect((await page.request.post('/api/admin/production',{headers:{Origin:'http://127.0.0.1:3101'}})).status()).toBe(403);
  const sessionCookies=(await context.cookies()).filter(cookie=>cookie.name.includes('auth-token'));
  expect(sessionCookies.length).toBeGreaterThan(0); expect(sessionCookies.every(cookie=>cookie.httpOnly && cookie.sameSite==='Lax')).toBeTruthy();
  expect((await context.cookies()).some(cookie=>cookie.name==='cutplan.oauth.return')).toBeFalsy();
  await page.getByRole('link',{name:'My account',exact:true}).click(); await expect(page.getByRole('heading',{name:'Your account',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sign out of this browser'}).click(); await expect(page).toHaveURL('/projects');
  expect(await page.evaluate(()=>localStorage.getItem('cutplan.guest-drafts.v1'))).toBe(original);
});

test('canceling provider consent offers recovery and keeps the local draft',async({page})=>{
  await page.goto('/projects/new?type=table'); await page.getByLabel('Project name',{exact:true}).fill('Keep Google canceled draft');
  await page.getByRole('button',{name:'Create draft',exact:true}).click(); await expect(page.getByRole('heading',{name:'Keep Google canceled draft',exact:true})).toBeVisible();
  const returnUrl=page.url();
  await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click(); await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();
  await page.getByRole('link',{name:'Cancel contract sign-in'}).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('canceled');
  await page.getByRole('button',{name:'Cancel',exact:true}).click(); await expect(page).toHaveURL(returnUrl);
  await expect(page.getByRole('heading',{name:'Keep Google canceled draft',exact:true})).toBeVisible();
});

test('callback without initiation or verifier cannot authenticate; attacker return URL is ignored',async({page,request})=>{
  const unsolicited=await request.get('/auth/callback?code=attacker-code&next=https://evil.example',{maxRedirects:0});
  expect(unsolicited.status()).toBe(303); expect(unsolicited.headers().location).toContain('http://127.0.0.1:3101/login?'); expect(unsolicited.headers().location).not.toContain('evil.example');
  expect(unsolicited.headers()['cache-control']).toContain('no-store');
  await page.goto('/projects');
  const response=await page.request.post('/api/auth/google',{headers:{Origin:'http://127.0.0.1:3101'},data:{returnTo:'//evil.example'}});
  expect(response.ok()).toBeTruthy();
  const jar=await page.context().cookies();
  await page.context().clearCookies();
  // A valid-looking return cookie alone is insufficient; the PKCE verifier is independently required.
  await page.context().addCookies(jar.filter(cookie=>cookie.name==='cutplan.oauth.return'));
  await page.goto('/auth/callback?code=attacker-code'); await expect(page.locator('.form-error[role=alert]')).toContainText('could not be completed');
  const session=await page.request.get('/api/auth/session'); expect((await session.json()).user).toBeNull();
});

test('cross-origin Google start and malformed input are rejected',async({request})=>{
  const foreign=await request.post('/api/auth/google',{headers:{Origin:'https://evil.example'},data:{returnTo:'/projects'}}); expect(foreign.status()).toBe(403);
  const invalid=await request.post('/api/auth/google',{headers:{Origin:'http://127.0.0.1:3101'},data:{}}); expect(invalid.status()).toBe(400);
});

test('Google sign-in screens and error recovery fit desktop mobile and light theme',async({page})=>{
  await mkdir('.impeccable/review/phase-03-google',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,1080],['mobile',390,844]] as const) {
    await page.setViewportSize({width,height}); await page.goto('/projects'); await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await expect(page.getByRole('button',{name:'Sign in with Google',exact:true})).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`.impeccable/review/phase-03-google/${name}.png`});
    await page.keyboard.press('Escape'); await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeFocused();
    await page.goto('/login?authError=canceled&returnTo=%2Fprojects'); await expect(page.locator('.form-error[role=alert]')).toBeVisible();
    await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
    await page.screenshot({path:`.impeccable/review/phase-03-google/${name}-error.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1080}); await page.getByRole('button',{name:'Toggle light and dark theme'}).click();
  await expect(page.locator('html')).toHaveClass(/light/); await page.screenshot({path:'.impeccable/review/phase-03-google/desktop-light.png',fullPage:true});
  await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();
  await page.getByRole('link',{name:'Allow contract sign-in'}).click();
  await page.getByRole('link',{name:'My account',exact:true}).click();
  await expect(page.getByLabel('Display name',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Toggle light and dark theme'}).click(); await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({path:'.impeccable/review/phase-03-google/desktop-account.png',fullPage:true});
  await page.setViewportSize({width:390,height:844}); await page.screenshot({path:'.impeccable/review/phase-03-google/mobile-account.png',fullPage:true});
});
