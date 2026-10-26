import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {DEFAULT_CABINET,panelBounds} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {cabinetInterior,cabinetUsableDepth,compartmentDefault,sectionDefault} from '../../src/lib/furniture/compartments.ts';
import {panelContour} from '../../src/lib/furniture/panel-contour.ts';
import {panelGeometry} from '../../src/components/furniture/panel-geometry.ts';
import {cuttingJob,defaultCuttingSettings,generateSheetCode,partsCsv} from '../../src/lib/cutting/workspace.ts';
import {freezeReview,productionIssues,syntheticProfile} from '../../src/lib/production/review.ts';
const fixture=()=>{const c={...DEFAULT_CABINET,widthMm:1625.6,heightMm:2133.6,doorPosition:'overlay',compartmentMode:'manual',stockWidthMm:2440,stockHeightMm:2440},width=(cabinetInterior(c).width-18)/2;return {...c,compartments:[{...compartmentDefault('a',width),sections:[{...sectionDefault('shelves'),type:'shelf'}]},{...compartmentDefault('b',width),sections:[{...sectionDefault('lower'),heightMm:500,type:'shelf',shelfMode:'adjustable'},{...sectionDefault('upper'),type:'shelf'}]}]};};
const valid=c=>{const r=calculateCabinet(c);assert.deepEqual(r.blockingErrors,[]);return r;};
test('cabinet shelves and section dividers retain rear alignment and exactly one inch front setback',()=>{
 for(const position of ['inset','overlay']){
  const c={...fixture(),doorPosition:position},r=valid(c),depth=cabinetUsableDepth(c),shelves=r.panels.filter(p=>p.role==='shelf');
  for(const p of shelves){assert.equal(p.heightMm,depth-25.4);const b=panelBounds(p);assert.ok(Math.abs(b.min[2]-c.backThicknessMm)<1e-8);assert.ok(Math.abs(c.backThicknessMm+depth-b.max[2]-25.4)<1e-8);}
 }
 const p=valid(DEFAULT_CABINET).panels.find(p=>p.role==='shelf');assert.equal(p.heightMm,348.6);
});
test('frame-side shelf regains its rear width, with clearance-aware notches and matching separator profile',()=>{
 const c=fixture(),r=valid(c),fixed=r.panels.find(p=>p.label==='Shelf 2.1.1'),adjustable=r.panels.find(p=>p.label==='Adjustable shelf 2.2.1'),separator=r.panels.find(p=>p.label==='Section separator 2.1');
 assert.equal(fixed.widthMm,c.compartments[1].widthMm+9);assert.deepEqual(fixed.notches,[{side:'bottom-left',width:18,height:76.2-25.4}]);
 assert.equal(adjustable.widthMm,fixed.widthMm-2*c.shelfSideClearanceMm);assert.equal(adjustable.notches[0].width,18-c.shelfSideClearanceMm);assert.deepEqual(separator.notches,fixed.notches);
 assert.ok(r.panels.filter(p=>p.componentId.startsWith('layout/a')).every(p=>!p.notches?.length));
});
test('notched 3D faces have exact removed area and raycasting passes through the cutout',()=>{
 const p=valid(fixture()).panels.find(p=>p.notches?.length),g=panelGeometry(p),vertices=g.getAttribute('position'),normals=g.getAttribute('normal');let area=0;
 for(let i=0;i<vertices.count;i+=3)if(normals.getZ(i)>.9){const a=new THREE.Vector3().fromBufferAttribute(vertices,i),b=new THREE.Vector3().fromBufferAttribute(vertices,i+1),c=new THREE.Vector3().fromBufferAttribute(vertices,i+2);area+=b.sub(a).cross(c.sub(a)).length()/2;}
 const n=p.notches[0];assert.ok(Math.abs(area-(p.widthMm*p.heightMm-n.width*n.height))<.1);
 const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(g,material);mesh.updateMatrixWorld();
 const ray=new THREE.Raycaster(new THREE.Vector3(-p.widthMm/2+n.width/2,-p.heightMm/2+n.height/2,100),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObject(mesh).length,0);
 ray.set(new THREE.Vector3(0,0,100),new THREE.Vector3(0,0,-1));assert.ok(ray.intersectObject(mesh).length>0);g.dispose();material.dispose();
});
test('nesting retains notches and exports contour code; rectangular frozen review refuses to omit them',()=>{
 const c=fixture(),settings={...defaultCuttingSettings,cutOrder:'one-by-one'},job=cuttingJob(c,settings);assert.deepEqual(job.errors,[]);assert.equal(job.unplaced.length,0);
 const parts=job.parts.filter(p=>p.notches?.length);assert.ok(parts.length>=3);
 for(const p of parts){const rect=job.sheets.flatMap(s=>s.rects).find(r=>r.name===p.id+'#1');assert.deepEqual(rect.notches,p.notches);assert.equal(rect.width,p.width);assert.equal(rect.height,p.height);}
 for(const s of job.sheets){const code=generateSheetCode(s,settings);assert.doesNotMatch(code,/NaN|Infinity/);assert.match(code,/G1/);}
 assert.ok(productionIssues(freezeReview(c),syntheticProfile).some(x=>x.includes('contour cutting')));
 assert.equal(panelContour(100,200,[{side:'bottom-left',width:18,height:76.2-25.4}]).length,6);
});

test('assembly schedules and CSV retain automatic notch dimensions',async()=>{
 const {assemblyReview}=await import('../../src/lib/assembly/model.ts'),{assemblyPdf}=await import('../../src/lib/assembly/pdf.ts'),{PDFDocument}=await import('pdf-lib');
 const c=fixture(),r=await assemblyReview(freezeReview(c),'synthetic_fixture');assert.ok(r.parts.some(p=>p.notches?.length));
 const bytes=await assemblyPdf(r),again=await assemblyPdf(r);assert.deepEqual(bytes,again);const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>4);
 const csv=partsCsv(cuttingJob(c,defaultCuttingSettings).parts,'in');assert.match(csv,/Corner notches \(mm\)/);assert.match(csv,/bottom-left: 18 x 50.8/);
});

test('main partitions use full depth while nested section partitions keep the one-inch setback',()=>{
 for(const position of ['overlay','inset']){
  const c={...fixture(),doorPosition:position},comp=c.compartments[1],width=(comp.widthMm-18)/2;
  comp.sections=[{...sectionDefault('nested'),type:'divider',children:[compartmentDefault('left',width,0),compartmentDefault('right',width,0)]}];
  const r=valid(c),depth=cabinetUsableDepth(c),partitions=r.panels.filter(p=>p.label==='Compartment partition');assert.equal(partitions.length,2);
  for(const p of partitions){const expected=p.panelId==='cabinet/layout/b/partition'?depth:depth-25.4;const b=panelBounds(p);assert.equal(p.widthMm,expected);assert.ok(Math.abs(b.min[2]-c.backThicknessMm)<1e-8);assert.ok(Math.abs(b.max[2]-(c.backThicknessMm+expected))<1e-8);}
  const frame=r.panels.find(p=>p.label==='Door frame 2'),bounds=panelBounds(frame);assert.equal(frame.widthMm,76.2);assert.ok(Math.abs(bounds.max[2]-(c.backThicknessMm+depth))<1e-8);
  const parts=cuttingJob(c,defaultCuttingSettings).parts;for(const p of partitions)assert.equal(parts.find(part=>part.id===p.panelId).width,p.panelId==='cabinet/layout/b/partition'?depth:depth-25.4);
 }
 const shallow=fixture();shallow.depthMm=50;assert.ok(calculateCabinet(shallow).blockingErrors.some(e=>e.message.includes('partitions need at least 50 mm')));
});
