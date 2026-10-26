import test from 'node:test';
import assert from 'node:assert/strict';
import {moveSection,allocateHeight} from '../../src/lib/furniture/cabinet-allocation.ts';
import {sectionDefault,compartmentDefault,cabinetInterior} from '../../src/lib/furniture/compartments.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {DEFAULT_CABINET,cabinetInput} from '../../src/lib/furniture/editor.ts';

test('section moves preserve exact settings, IDs, nested contents and allocated space',()=>{
 const input={...DEFAULT_CABINET,compartmentMode:'manual'},height=cabinetInterior(input).height;
 const sections=[{...sectionDefault('drawer'),type:'drawer',heightMm:300,external:true},{...sectionDefault('hanging'),type:'hanging'}];
 const before=structuredClone(sections),moved=moveSection(sections,'drawer',1);
 assert.deepEqual(sections,before);assert.equal(moved[1],sections[0]);assert.equal(moved[0],sections[1]);
 assert.deepEqual(allocateHeight(moved.map(s=>s.heightMm),height,18).resolved,[height-318,300]);
 const c={...input,compartments:[{...compartmentDefault('main',764),sections:moved}]};assert.deepEqual(calculateCabinet(c).blockingErrors,[]);assert.deepEqual(cabinetInput(c).compartments[0].sections,moved);
 const nested=[{...sectionDefault('nested'),type:'divider',children:[compartmentDefault('slot',300,0)]},sectionDefault('open')];
 assert.equal(moveSection(nested,'nested',1)[1].children,nested[0].children);
 for(const [id,to] of [['missing',0],['drawer',-1],['drawer',2],['drawer',NaN],['drawer',.5],['drawer',0]])assert.equal(moveSection(sections,id,to),sections);
 assert.deepEqual(moveSection(moved,'drawer',0),sections);
});
