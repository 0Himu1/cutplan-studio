import {test,expect} from '@playwright/test';
for(const order of [['Width','Height'],['Height','Width']])test(`oversized cabinet applies, saves and reopens after ${order.join(' then ')}`,async({page})=>{
 await page.goto('/projects/new?type=cabinet');await page.getByLabel('Project name',{exact:true}).fill('Large design');await page.getByRole('button',{name:'Create draft',exact:true}).click();
 await page.getByRole('button',{name:'Dimensions',exact:true}).click();
 for(const label of order)await page.getByLabel(label+' (mm)',{exact:true}).fill(label==='Width'?'1800':'2600');
 await page.getByLabel('Depth (mm)',{exact:true}).fill('600');
 await expect(page.getByRole('complementary',{name:'Stock fit warnings',exact:true})).toContainText('Back: 1764 × 2564 mm');
 await expect(page.getByRole('button',{name:'Apply measurements',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Apply measurements',exact:true}).click();
 await page.getByRole('button',{name:'Save browser design',exact:true}).click();await expect(page.getByText('Design saved.',{exact:true})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Dimensions',exact:true}).click();
 await expect(page.getByLabel('Width (mm)',{exact:true})).toHaveValue('1800');await expect(page.getByLabel('Height (mm)',{exact:true})).toHaveValue('2600');await expect(page.getByLabel('Depth (mm)',{exact:true})).toHaveValue('600');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'SHEETS',exact:true}).click();await expect(page.getByRole('button',{name:/Unplaced/})).toContainText(/[1-9]/);
});
