import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allocateHeight,editSectionHeight,equalWidths,fitNestedWidths} from '../../src/lib/furniture/cabinet-allocation.ts';
import {sectionDefault,compartmentDefault,cabinetCompartments,cabinetDrawerDepth,sectionMinimumHeight} from '../../src/lib/furniture/compartments.ts';
import {DEFAULT_CABINET} from '../../src/lib/furniture/editor.ts';

test('height allocations reserve each divider and share flexible space exactly',()=>{
 const a=allocateHeight([762,0],1778,18);assert.equal(a.resolved[1],998);assert.equal(a.dividers,18);assert.equal(a.valid,true);
 assert.equal(allocateHeight([1778,0],1778,18).valid,false);
 for(let count=1;count<=8;count++){const a=allocateHeight(Array(count).fill(0),1778,18);assert.equal(a.valid,true);assert.ok(Math.abs(a.resolved.reduce((x,y)=>x+y,0)+a.dividers-1778)<1e-8);}
 for(const heights of [[NaN],[Infinity],[-1],[1],[0,0]])assert.equal(allocateHeight(heights,50,18).valid,false);
 assert.equal(allocateHeight([500],1000,18).valid,true);assert.equal(allocateHeight([500],1000,18).empty,500);
});
test('manual height edits leave empty space and never create another section',()=>{
 const old=[sectionDefault('first')],next=editSectionHeight(old,0,762);
 assert.equal(old.length,1);assert.equal(old[0].heightMm,0);assert.equal(next.length,1);
 const a=allocateHeight(next.map(s=>s.heightMm),1778,18);assert.deepEqual(a.resolved,[762]);assert.equal(a.valid,true);assert.equal(a.empty,1016);
 assert.equal(allocateHeight([762,200],1778,18).empty,798);
 assert.equal(allocateHeight([762,0],1778,18).empty,0);
});
test('nested widths and automatic resizing retain all configured sections and IDs',()=>{
 const comp=compartmentDefault('first',800);comp.sections[0].type='divider';comp.sections[0].children=[compartmentDefault('a',391,0),compartmentDefault('b',391,0)];
 comp.sections[0].children[1].sections[0].type='hanging';
 const resized=fitNestedWidths({...comp,widthMm:600},18);assert.equal(resized.sections[0].children[0].widthMm,291);assert.equal(resized.sections[0].children[1].sections[0].type,'hanging');assert.equal(comp.sections[0].children[0].widthMm,391);
 const input={...DEFAULT_CABINET,widthMm:1800,compartmentMode:'auto',compartments:[comp,compartmentDefault('second',800)]};
 const small=cabinetCompartments({...input,widthMm:700});assert.equal(small.length,2);assert.equal(small[0].id,'first');assert.equal(small[1].id,'second');assert.equal(small.reduce((n,c)=>n+c.widthMm,0)+18,664);
 const widths=equalWidths(small,664,18);assert.equal(widths[0].widthMm,323);
});

test('drawer depth reserves body thickness and section minima include contents and supports',()=>{
 const input={...DEFAULT_CABINET,bodyThicknessMm:18,doorThicknessMm:25,compartmentMode:'auto'};
 assert.equal(cabinetDrawerDepth(input,true)-cabinetDrawerDepth(input,false),18);
 const drawer={...sectionDefault('drawer'),type:'drawer',drawers:[{id:'a',heightMm:150,depthMm:0},{id:'b',heightMm:200,depthMm:0}]};
 assert.equal(sectionMinimumHeight(drawer,18),368);
 assert.equal(sectionMinimumHeight({...sectionDefault('shelf'),type:'shelf',shelfCount:3},18),254);
});
