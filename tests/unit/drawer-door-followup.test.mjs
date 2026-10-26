import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CABINET} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {sectionDefault} from '../../src/lib/furniture/compartments.ts';
import {panelPresentation} from '../../src/lib/furniture/presentation.ts';
const config=external=>({...DEFAULT_CABINET,widthMm:800,heightMm:1800,doorPosition:'overlay',compartmentMode:'manual',compartments:[{id:'one',widthMm:764,doorCount:1,sections:[{...sectionDefault('bottom'),heightMm:400},{...sectionDefault('drawers'),heightMm:300,type:'drawer',external},{...sectionDefault('top'),heightMm:0,type:'hanging'}]}]});
test('internal sections share one continuous compartment door; external drawers alone split coverage',()=>{
 const closed=calculateCabinet(config(false)),external=calculateCabinet(config(true));
 assert.deepEqual(closed.blockingErrors,[]);assert.deepEqual(external.blockingErrors,[]);
 const doors=closed.panels.filter(p=>p.role==='door');assert.equal(doors.length,1);assert.equal(doors[0].heightMm,1800-DEFAULT_CABINET.skirtingHeightMm-2*DEFAULT_CABINET.doorGapMm);
 assert.equal(external.panels.filter(p=>p.role==='door').length,2);
 const face=external.panels.find(p=>p.componentId.endsWith('/face'));for(const door of external.panels.filter(p=>p.role==='door'))assert.ok(Math.abs(door.pose.positionMm[1]-face.pose.positionMm[1])>=(door.heightMm+face.heightMm)/2);
});
test('drawer material roles, back thickness and complete reversible extension agree for every box piece',()=>{
 const c=config(true),r=calculateCabinet(c),parts=r.panels.filter(p=>p.role==='drawer');assert.equal(parts.length,6);
 const back=parts.find(p=>p.componentId.endsWith('/back')),face=parts.find(p=>p.componentId.endsWith('/face'));
 assert.equal(back.materialSlot,'back');assert.equal(back.thicknessMm,c.backThicknessMm);assert.equal(face.materialSlot,'front');assert.equal(face.thicknessMm,c.doorThicknessMm);
 const travel=parts[0].drawerTravelMm;assert.ok(travel>0);
 for(const p of parts){const original=structuredClone(p);assert.equal(p.drawerTravelMm,travel);const pose=panelPresentation(p,[400,900,200],0,1);assert.equal(pose.position[2],p.pose.positionMm[2]+travel);assert.deepEqual(panelPresentation(p,[400,900,200],0,0).position,p.pose.positionMm);assert.deepEqual(p,original);}
 assert.ok(r.panels.filter(p=>p.role!=='drawer').every(p=>!p.drawerTravelMm));
});
