import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CABINET,panelBounds} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {cabinetInterior,compartmentDefault,sectionDefault} from '../../src/lib/furniture/compartments.ts';
import {doorFrameLayout} from '../../src/lib/furniture/door-frames.ts';
import {parseOverrides} from '../../src/lib/furniture/materials.ts';
import {nestFurniture} from '../../src/lib/furniture/nesting.ts';
const make=(counts=[2,2])=>{const c={...DEFAULT_CABINET,widthMm:1625.6,heightMm:2133.6,doorPosition:'overlay',compartmentMode:'manual'};const width=(cabinetInterior(c).width-(counts.length-1)*c.bodyThicknessMm)/counts.length;return {...c,compartments:counts.map((n,i)=>({...compartmentDefault('comp-'+i,width,n),sections:[{...sectionDefault('shelf'),type:'shelf'}]}))};};
const valid=c=>{const r=calculateCabinet(c);assert.deepEqual(r.blockingErrors,[]);return r;};
const overlaps=(a,b)=>{
 const x=panelBounds(a),y=panelBounds(b),low=[0,1,2].map(i=>Math.max(x.min[i],y.min[i])),high=[0,1,2].map(i=>Math.min(x.max[i],y.max[i]));
 if(![0,1,2].every(i=>low[i]<high[i]-.001))return false;
 // Horizontal shelf envelopes may overlap a frame entirely inside a removed front-left corner.
 for(const p of [a,b])if(p.notches?.some(n=>n.side==='bottom-left')){
  const bounds=panelBounds(p),n=p.notches.find(n=>n.side==='bottom-left');
  if(low[0]>=bounds.min[0]-.001&&high[0]<=bounds.min[0]+n.width+.001&&low[2]>=bounds.max[2]-n.height-.001&&high[2]<=bounds.max[2]+.001)return false;
 }
 return true;
};
test('64 by 84 cabinet books the middle hinges to separate partition and three-inch frame',()=>{
 const c=make(),before=structuredClone(c),r=valid(c),frames=r.panels.filter(p=>p.label.startsWith('Door frame')),doors=r.panels.filter(p=>p.role==='door').sort((a,b)=>a.pose.positionMm[0]-b.pose.positionMm[0]);
 assert.equal(frames.length,1);const frame=frames[0],partition=r.panels.find(p=>p.label==='Compartment partition');
 assert.equal(frame.widthMm,76.2);assert.equal(frame.thicknessMm,18);assert.equal(frame.materialSlot,'body');
 assert.equal(panelBounds(frame).min[0],panelBounds(partition).max[0]);
 assert.equal((frame.pose.positionMm[0]+partition.pose.positionMm[0])/2,c.widthMm/2);
 assert.deepEqual(doors.map(p=>p.hingeSource),['side','partition','frame','side']);
 assert.deepEqual(doors.map(p=>p.hingeSide),['left','right','left','right']);
 assert.ok(r.panels.filter(p=>p!==frame).every(p=>!overlaps(frame,p)));
 const plan=nestFurniture(c);assert.deepEqual(plan.errors,[]);assert.ok(plan.sheets.some(s=>s.placements.some(p=>p.panelId===frame.panelId)));
 assert.ok(parseOverrides({[frame.panelId]:{grainAxis:'height'}}));assert.deepEqual(c,before);
});
test('single outer doors, open compartments and all-external drawers do not create redundant frames',()=>{
 for(const counts of [[1,1],[2,0],[0,2],[0,0],[1]])assert.equal(valid(make(counts)).panels.filter(p=>p.label.startsWith('Door frame')).length,0);
 const c=make();c.compartments[1].sections=[{...sectionDefault('drawers'),type:'drawer',external:true}];assert.equal(valid(c).panels.filter(p=>p.label.startsWith('Door frame')).length,0);
 assert.equal(valid(make([2,2,2])).panels.filter(p=>p.label.startsWith('Door frame')).length,2);
});
test('framed nested content and internal drawers fit the reduced opening without intersecting the strip',()=>{
 const c=make(),comp=c.compartments[1],width=(comp.widthMm-18)/2;
 comp.sections=[{...sectionDefault('nested'),type:'divider',children:[compartmentDefault('a',width,0),compartmentDefault('b',width,0)]},{...sectionDefault('drawer'),heightMm:350,type:'drawer'}];
 const r=valid(c),frame=r.panels.find(p=>p.label.startsWith('Door frame')),box=r.panels.find(p=>p.componentId.endsWith('/drawer/drawer-1/bottom'));
 assert.ok(r.panels.filter(p=>p!==frame).every(p=>!overlaps(frame,p)));
 assert.equal(box.widthMm,comp.widthMm-9-25.4);
 assert.equal(doorFrameLayout(c.compartments,cabinetInterior(c).height,18,c.doorGapMm)[1].leftFrame,true);
});
