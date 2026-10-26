import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CABINET,cabinetInput} from '../../src/lib/furniture/editor.ts';
import {allocateHeight,editSectionHeight,moveSection} from '../../src/lib/furniture/cabinet-allocation.ts';
import {sectionDefault,compartmentDefault,cabinetInterior} from '../../src/lib/furniture/compartments.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';

test('manual empty space is valid, saved and left below a top-aligned section stack',()=>{
 const bottom={...sectionDefault('lower'),heightMm:200,type:'shelf'},top={...sectionDefault('upper'),heightMm:300,type:'hanging'};
 const input={...DEFAULT_CABINET,compartmentMode:'manual',compartments:[{...compartmentDefault('main',764,0),sections:[bottom,top]}]};
 const a=allocateHeight([200,300],cabinetInterior(input).height,18);assert.equal(a.empty,646);assert.equal(a.valid,true);assert.equal(a.dividers,18);
 const result=calculateCabinet(input);assert.deepEqual(result.blockingErrors,[]);assert.equal(result.hardware[0].positionMm[1],1132);
 const separator=result.panels.find(p=>p.componentId==='layout/main/upper/separator');assert.equal(separator.pose.positionMm[1],873);
 assert.ok(result.panels.find(p=>p.label==='Shelf 1.2.1').pose.positionMm[1]<result.hardware[0].positionMm[1]);
 assert.deepEqual(cabinetInput(input).compartments[0].sections,[bottom,top]);
 const moved=moveSection([top,bottom],'lower',0).reverse();const after=calculateCabinet({...input,compartments:[{...input.compartments[0],sections:moved}]});assert.deepEqual(after.blockingErrors,[]);assert.equal(after.hardware[0].positionMm[1],914);assert.equal(allocateHeight(moved.map(s=>s.heightMm),1164,18).empty,646);
});

test('editing and removing manual sections never inserts an automatic filler',()=>{
 const sections=[{...sectionDefault('first'),heightMm:800}],edited=editSectionHeight(sections,0,300);assert.equal(edited.length,1);assert.equal(edited[0].heightMm,300);assert.equal(allocateHeight([300],1164,18).empty,864);
 assert.equal(allocateHeight([300,1000],1164,18).valid,false);assert.equal(allocateHeight([300,NaN],1164,18).valid,false);assert.equal(allocateHeight([300,0],1164,18).empty,0);
});
