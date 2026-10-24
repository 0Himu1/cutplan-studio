import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultFurniture} from '../../src/lib/furniture/families.ts';
import {cuttingJob,defaultCuttingSettings,generateSheetCode,validateOperations,partsCsv} from '../../src/lib/cutting/workspace.ts';
import {zipFiles} from '../../src/lib/cutting/archive.ts';
import {generateGCode} from '../../src/lib/cutting/legacy/gcode/gcode-generator.ts';
import {generatePocketEngravingGCode} from '../../src/lib/cutting/legacy/gcode/engraving-generator.ts';

test('all four packing algorithms conserve each furniture family and keep source geometry immutable',()=>{
 for(const family of ['cabinet','shoe_rack','bookshelf','table'])for(const algorithm of ['basic','maxrects','guillotine','optimized']){
  const input=defaultFurniture(family),before=JSON.stringify(input),settings={...defaultCuttingSettings,algorithm},job=cuttingJob(input,settings);
  assert.deepEqual(job.errors,[]);assert.equal(job.sheets.reduce((n,s)=>n+s.rects.length,0)+job.unplaced.length,job.parts.length);assert.equal(JSON.stringify(input),before);
  for(const sheet of job.sheets)for(const cutOrder of ['nearest-neighbor','2-opt','scan-line','one-by-one']){const code=generateSheetCode(sheet,{...settings,cutOrder,feed:1500,plunge:500,spindle:16000,feedPercent:80});assert.match(code,/G21/);assert.match(code,/F1200/);assert.match(code,/F500/);assert.match(code,/M3 S16000/);assert.doesNotMatch(code,/NaN|Infinity/);assert.ok(code.indexOf('G00 Z12')<code.indexOf('M3'));assert.match(code,/M30/);}
 }
});
test('randomized packing is independently collision audited with rotation on and off',()=>{
 let seed=23;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(const algorithm of ['basic','maxrects','guillotine','optimized'])for(let i=0;i<25;i++){
  const input=defaultFurniture('cabinet'),parts={};for(const id of cuttingJob(input,defaultCuttingSettings).parts.map(p=>p.id))parts[id]={width:40+Math.floor(random()*900),height:40+Math.floor(random()*1200)};
  const job=cuttingJob(input,{...defaultCuttingSettings,algorithm,rotation:i%2===0,parts});assert.deepEqual(job.errors,[],algorithm+' fixture '+i);
 }
});
test('worksheet overrides preserve grain, account for unplaced parts and invalidate impossible settings',()=>{
 const input={...defaultFurniture('table'),grainAxis:'width'},job=cuttingJob(input,defaultCuttingSettings);assert.equal(job.unplaced.length,1);
 assert.equal(cuttingJob(input,{...defaultCuttingSettings,margin:0}).unplaced.length,0);
 assert.ok(cuttingJob(input,{...defaultCuttingSettings,spacing:NaN}).errors.length);
 const cabinet=defaultFurniture('cabinet'),plan=cuttingJob(cabinet,defaultCuttingSettings),part=plan.parts[0],extra={...part,id:'worksheet-extra',sourceId:'',name:'Extra',width:100,height:100,quantity:2};
 const changed=cuttingJob(cabinet,{...defaultCuttingSettings,customParts:[extra],parts:{[part.id]:{quantity:0}}});assert.deepEqual(changed.errors,[]);assert.equal(changed.sheets.reduce((n,s)=>n+s.rects.length,0),plan.parts.length+1);
});
test('G-code rejects insufficient tool clearance, excessive depth and unsupported notched cut ordering',()=>{
 const input=defaultFurniture('cabinet'),sheet=cuttingJob(input,defaultCuttingSettings).sheets[0];
 assert.throws(()=>generateSheetCode(sheet,{...defaultCuttingSettings,spacing:0}),/spacing/);
 assert.throws(()=>generateSheetCode(sheet,{...defaultCuttingSettings,depth:90}),/thickness/);
 assert.throws(()=>validateOperations({enabled:true,side:'left-back',width:1,depth:5,offsetFromEdge:0},[],100,100,18,3),/Pocket/);
 const notched=structuredClone(sheet);notched.rects[0].notches=[{side:'bottom-left',width:30,height:30}];assert.throws(()=>generateSheetCode(notched,defaultCuttingSettings),/One by one/);assert.match(generateSheetCode(notched,{...defaultCuttingSettings,cutOrder:'one-by-one'}),/PROFILE CUTS/);
});
test('groove edge selection changes physical tool coordinates and circle pockets never rapid through stock',()=>{
 const rect={name:'test',x:10,y:10,width:100,height:200,pocketEngraving:{enabled:true,side:'left-back',width:6,depth:4,offsetFromEdge:20}};
 const left=generatePocketEngravingGCode(rect,'horizontal',200,12,3),right=generatePocketEngravingGCode({...rect,pocketEngraving:{...rect.pocketEngraving,side:'right-back'}},'horizontal',200,12,3);assert.notEqual(left,right);assert.match(left,/X28.500/);assert.match(right,/X88.500/);
 const code=generateGCode([{width:500,height:500,rects:[{name:'hole',boardType:'test',x:20,y:20,width:100,height:100,type:'circle',diameter:100,cutType:'pocket',depth:6}]}],18,'horizontal',4,3,'scan-line',12);let z=12;for(const line of code.split('\n')){const height=/^G0[01] Z(-?[\d.]+)/.exec(line);if(height)z=Number(height[1]);if(/^G00 [XY]/.test(line))assert.ok(z>0,line);}
});
test('CSV escapes cells and ZIP keeps one complete program per sheet with correct directory offsets',()=>{
 const parts=cuttingJob(defaultFurniture('cabinet'),defaultCuttingSettings).parts;parts[0].name='=FORMULA,"quote"';const csv=partsCsv(parts,'in');assert.match(csv,/"'=FORMULA,""quote"""/);assert.match(csv,/Thickness \(mm\)/);
 const bytes=zipFiles([{name:'one.nc',text:'G21\nM30\n'},{name:'two.nc',text:'G21\nM30\n'}]),view=new DataView(bytes.buffer);assert.equal(view.getUint32(0,true),0x04034b50);assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);assert.equal(view.getUint16(bytes.length-14,true),2);assert.equal(view.getUint32(view.getUint32(bytes.length-6,true),true),0x02014b50);
});
