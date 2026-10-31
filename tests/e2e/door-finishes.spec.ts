import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const board='00000000-0000-4000-8000-000000003001',blue='00000000-0000-4000-8000-000000003002',grain='00000000-0000-4000-8000-000000003003',other='00000000-0000-4000-8000-000000003004';
const catalog={items:[{id:board,kind:'board',name:'QA door board',code:'QA-18',board_skus:{thickness_mm:18,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}},{id:blue,kind:'finish',name:'Blue Formica',code:'HPL-BLUE',finish_skus:{surface:'laminate',color_code:'#3355aa'}},{id:grain,kind:'finish',name:'Oak HPL',code:'HPL-OAK',finish_skus:{surface:'laminate',color_code:'#bda382',texture_url:'https://finish.test/oak.webp'}},{id:other,kind:'finish',name:'Unpaired HPL',code:'HPL-NO',finish_skus:{surface:'laminate',color_code:'#ffffff'}}],compatibility:[{board_item_id:board,finish_item_id:blue},{board_item_id:board,finish_item_id:grain}]};
async function selectDoor(page:Page,n=1){await page.getByRole('button',{name:'Panels',exact:true}).click();await page.getByRole('dialog',{name:'Select a panel'}).getByRole('button',{name:new RegExp('^Door '+n+' ')}).click();await expect(page.getByRole('dialog')).toHaveCount(0);}
async function saved(page:Page){return page.evaluate(()=>JSON.parse(localStorage.getItem('cutplan.guest-drafts.v1')!).projects[0].cabinet);}

test('door Formica picker previews, cancels, undoes, saves and right-clicks the actual door',async({page})=>{
 await page.route('**/api/catalog',route=>route.fulfill({json:catalog}));await page.route('https://finish.test/oak.webp',route=>route.abort());
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Door Formica QA');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 await selectDoor(page);await page.getByRole('button',{name:'Select Finishings',exact:true}).click();
 const picker=page.getByRole('dialog',{name:'Select Finishings',exact:true});await expect(picker.getByText('Choose a published door board to see compatible finishes.')).toBeVisible();
 await picker.getByLabel('Board',{exact:true}).selectOption({label:'QA door board'});await expect(picker.getByRole('button',{name:'Select Unpaired HPL',exact:true})).toHaveCount(0);
 await picker.getByRole('button',{name:'Select Blue Formica',exact:true}).click();await page.getByRole('button',{name:'Apply finishing',exact:true}).click();await expect(picker).toHaveCount(0);
 await page.getByRole('button',{name:'Undo cabinet change',exact:true}).click();await page.getByRole('button',{name:'Redo cabinet change',exact:true}).click();await page.getByRole('button',{name:'Save browser design',exact:true}).click();
 await expect.poll(async()=>(await saved(page)).panelOverrides?.['cabinet/door-1']?.frontFinishId).toBe(blue);expect((await saved(page)).panelOverrides['cabinet/door-2']).toBeUndefined();
 await page.getByRole('button',{name:'Select Finishings',exact:true}).click();await picker.getByRole('button',{name:'Select Oak HPL',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(picker).toHaveCount(0);
 await page.getByRole('button',{name:'Select Finishings',exact:true}).click();await expect(picker.getByRole('button',{name:'Select Blue Formica',exact:true})).toHaveAttribute('aria-pressed','true');
 await picker.getByRole('button',{name:'Select Oak HPL',exact:true}).click();await expect(picker.getByRole('button',{name:'Select Blue Formica',exact:true}).locator('.cad-finish-swatch')).toHaveCSS('background-color','rgb(51, 85, 170)');await mkdir('artifacts/review/door-finishes',{recursive:true});if((await page.locator('html').getAttribute('class'))?.includes('dark'))await page.getByRole('button',{name:'Toggle light and dark theme',exact:true}).click();await page.screenshot({path:'artifacts/review/door-finishes/picker-light.png'});await page.getByRole('button',{name:'Toggle light and dark theme',exact:true}).click();await page.screenshot({path:'artifacts/review/door-finishes/picker-dark.png'});
 await page.getByRole('button',{name:'Apply finishing',exact:true}).click();await expect(picker).toHaveCount(0);await expect(page.getByText('Texture unavailable; named color shown.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect.poll(async()=>(await saved(page)).panelOverrides['cabinet/door-1'].frontFinishId).toBe(grain);
 await page.reload();await selectDoor(page);await page.getByRole('button',{name:'Select Finishings',exact:true}).click();await expect(picker.getByRole('button',{name:'Select Oak HPL',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(picker).toHaveCount(0);
 await page.getByRole('group',{name:'View navigator'}).getByRole('button',{name:'Front',exact:true}).click();const canvas=page.locator('.cad-webgl canvas');const box=await canvas.boundingBox();expect(box).not.toBeNull();
 await canvas.click({button:'right',position:{x:box!.width/2+35,y:box!.height/2}});
 const context=page.getByRole('dialog',{name:'Door 2',exact:true});await expect(context).toBeVisible();await context.getByRole('button',{name:'Select Finishings',exact:true}).click();await expect(picker.getByLabel('Door',{exact:true})).toHaveValue('cabinet/door-2');
 await picker.getByLabel('Board',{exact:true}).selectOption({label:'QA door board'});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/review/door-finishes/picker-mobile.png'});
 const image=await sharp(Buffer.from('<svg width="128" height="128"><rect width="128" height="128" fill="#deb887"/><path d="M0 0h16v128H0z M48 0h16v128H48z M96 0h16v128H96z" fill="#85592f"/></svg>')).webp().toBuffer();
 await page.route('https://finish.test/oak.webp',route=>route.fulfill({body:image,contentType:'image/webp',headers:{'Access-Control-Allow-Origin':'*'}}));const loaded=page.waitForResponse('https://finish.test/oak.webp');
 await picker.getByRole('button',{name:'Select Oak HPL',exact:true}).click();await loaded;await page.getByRole('button',{name:'Apply finishing',exact:true}).click();await expect(picker).toHaveCount(0);await page.setViewportSize({width:1440,height:1080});await expect(page.getByText('Texture unavailable; named color shown.',{exact:true})).toHaveCount(0);
 await expect.poll(async()=>{const {data,info}=await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});let visible=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]>90&&data[i]>data[i+1]*1.1&&data[i+2]<data[i]*.9)visible++;return visible;}).toBeGreaterThan(5000);
 await page.screenshot({path:'artifacts/review/door-finishes/image-preview.png'});
});

test('finish uploads deny anonymous and foreign-origin requests',async({request})=>{
 for(const origin of ['http://127.0.0.1:3100','https://other.invalid']){const response=await request.post('/api/admin/catalog/image',{headers:{Origin:origin,'Content-Type':'image/png'},data:Buffer.from('not an image')});expect(response.status()).toBe(403);}
});
