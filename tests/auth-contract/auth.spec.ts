import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const draftKey='cutplan.guest-drafts.v1';
async function sendCode(page:Page,email='customer@example.test') {
  if(await page.locator('.cad-workspace').count()){await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click();}else await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByRole('button',{name:'Send code',exact:true}).click();
  await expect(page.getByLabel('Verification code',{exact:true})).toBeVisible();
}
async function signIn(page:Page,email='customer@example.test') {
  await page.goto('/projects'); await sendCode(page,email);
  await page.getByLabel('Verification code',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Verify and continue'}).click();
  await expect(page.getByRole('link',{name:'My account',exact:true})).toBeVisible();
}
test.beforeEach(async({request})=>{await request.post('http://127.0.0.1:3121/test/control',{data:{revoked:false,failProfile:false}});});

test('cookie-backed sign-in refresh profile and local sign-out preserve the draft',async({page,context,request})=>{
  await page.goto('/projects/new?type=table');
  await page.getByLabel('Project name',{exact:true}).fill('Contract test cabinet');
  await page.getByRole('button',{name:'Create draft',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Contract test cabinet',exact:true})).toBeVisible();
  const draftUrl=page.url();
  const original=await page.evaluate(key=>localStorage.getItem(key),draftKey);
  await sendCode(page,'refresh@example.test');
  await page.getByLabel('Verification code',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Verify and continue'}).click();
  await expect(page).toHaveURL(draftUrl);await page.getByRole('button',{name:'Close Project and history',exact:true}).click();await page.getByRole('link',{name:/All projects/}).click();
  await expect(page.getByRole('link',{name:'My account',exact:true})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),draftKey)).toBe(original);
  const authCookies=(await context.cookies()).filter(cookie=>cookie.name.includes('auth-token'));
  expect(authCookies.length).toBeGreaterThan(0); expect(authCookies.every(cookie=>cookie.httpOnly && cookie.sameSite==='Lax')).toBeTruthy();
  expect(await page.evaluate(()=>document.cookie)).not.toContain('auth-token');
  await page.reload(); await page.getByRole('link',{name:'My account',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Your account',exact:true})).toBeVisible();
  await expect(page.getByLabel('Display name',{exact:true})).toBeVisible();
  await page.getByLabel('Display name',{exact:true}).fill('Contract Test Customer');
  await page.getByLabel('Phone number (optional)',{exact:true}).fill('+880 1712-345678');
  await page.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect(page.getByText('Profile saved.',{exact:true})).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('Contract Test Customer');
  const counters=await request.post('http://127.0.0.1:3121/test/control',{data:{}}); expect((await counters.json()).refreshes).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Sign out of this browser'}).click();
  await expect(page).toHaveURL('/projects'); await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),draftKey)).toBe(original);
  await page.goto('/account'); await expect(page).toHaveURL(/\/login\?returnTo=/);
});

test('invalid expired code resend cooldown change email and cancel are recoverable',async({page})=>{
  await page.goto('/projects'); await sendCode(page);
  await expect(page.getByRole('button',{name:/Resend in/})).toBeDisabled();
  await page.getByLabel('Verification code',{exact:true}).fill('123');
  await page.getByRole('button',{name:'Verify and continue'}).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('six-digit');
  await page.getByLabel('Verification code',{exact:true}).fill('000000');
  await page.getByRole('button',{name:'Verify and continue'}).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('expired');
  await expect(page.getByLabel('Verification code',{exact:true})).toHaveValue('000000');
  await page.getByRole('button',{name:'Change email',exact:true}).click();
  await expect(page.getByLabel('Email address',{exact:true})).toHaveValue('customer@example.test');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeFocused();
});

test('delivery and provider quota failures retain email and hide internal details',async({page})=>{
  await page.goto('/projects');
  for(const email of ['delivery-failure@example.test','quota@example.test']) {
    if(await page.locator('.cad-workspace').count()){await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click();}else await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.getByLabel('Email address',{exact:true}).fill(email);
    await page.getByRole('button',{name:'Send code',exact:true}).click();
    await expect(page.locator('.form-error[role=alert]')).toBeVisible();
    await expect(page.locator('.form-error[role=alert]')).toContainText(email.startsWith('quota') ? 'Too many attempts' : 'could not be completed');
    await expect(page.getByLabel('Email address',{exact:true})).toHaveValue(email);
    await expect(page.locator('body')).not.toContainText('private internal');
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
  }
});

test('profile API rejects identity role extra fields and unauthenticated access',async({page})=>{
  await page.goto('/projects');
  expect(await page.evaluate(async()=> (await fetch('/api/profile')).status)).toBe(401);
  await signIn(page);
  for(const extra of [{role:'admin'},{id:'another-user'},{is_active:true}]) {
    const result=await page.evaluate(async extra=>{const response=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({display_name:'Contract',phone:'',...extra})});return response.status;},extra);
    expect(result).toBe(400);
  }
});

test('profile storage failure preserves typed changes; session revocation denies protected routes',async({page,request})=>{
  await signIn(page,'profile-error@example.test'); await page.getByRole('link',{name:'My account',exact:true}).click();
  await page.getByLabel('Display name',{exact:true}).fill('Keep this edit');
  await request.post('http://127.0.0.1:3121/test/control',{data:{failProfile:true}});
  await page.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect(page.locator('.form-error[role=alert]')).toContainText('could not be saved');
  await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('Keep this edit');
  await request.post('http://127.0.0.1:3121/test/control',{data:{revoked:true,failProfile:false}});
  await page.reload(); await expect(page).toHaveURL(/\/login\?returnTo=/);
});

test('two identities keep separate profiles through cookie-backed API calls',async({browser})=>{
  const a=await browser.newContext({baseURL:'http://127.0.0.1:3101'}); const b=await browser.newContext({baseURL:'http://127.0.0.1:3101'});
  try {
    for(const [context,email,name] of [[a,'one@example.test','First contract user'],[b,'two@example.test','Second contract user']] as const) {
      const page=await context.newPage(); await signIn(page,email); await page.getByRole('link',{name:'My account',exact:true}).click();
      await page.getByLabel('Display name',{exact:true}).fill(name); await page.getByRole('button',{name:'Save profile',exact:true}).click(); await expect(page.getByText('Profile saved.',{exact:true})).toBeVisible();
    }
    const page= a.pages()[0]; await page.reload(); await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('First contract user');
  } finally {await a.close();await b.close();}
});

test('responsive email code error and account captures use only synthetic test identities',async({page})=>{
  await mkdir('.impeccable/review/phase-03',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,1080],['mobile',390,844]] as const) {
    await page.setViewportSize({width,height}); await page.goto('/projects');
    if(await page.locator('.cad-workspace').count()){await page.getByRole('button',{name:'Project and history',exact:true}).click();await page.getByRole('button',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign in and continue',exact:true}).click();}else await page.getByRole('button',{name:'Sign in',exact:true}).click(); await expect(page.getByLabel('Email address',{exact:true})).toBeVisible();
    await page.screenshot({path:`.impeccable/review/phase-03/${name}-email.png`});
    await page.getByLabel('Email address',{exact:true}).fill('visual-contract@example.test'); await page.getByRole('button',{name:'Send code',exact:true}).click();
    await expect(page.getByLabel('Verification code',{exact:true})).toBeVisible(); await page.screenshot({path:`.impeccable/review/phase-03/${name}-code.png`});
    await page.getByLabel('Verification code',{exact:true}).fill('000000'); await page.getByRole('button',{name:'Verify and continue'}).click();
    await expect(page.locator('.form-error[role=alert]')).toBeVisible(); await page.screenshot({path:`.impeccable/review/phase-03/${name}-error.png`});
    await page.getByLabel('Verification code',{exact:true}).fill('123456'); await page.getByRole('button',{name:'Verify and continue'}).click();
    await page.getByRole('link',{name:'My account',exact:true}).click(); await expect(page.getByLabel('Display name',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`.impeccable/review/phase-03/${name}-account.png`,fullPage:true});
    await page.getByRole('button',{name:'Sign out of this browser'}).click(); await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
  }
});
