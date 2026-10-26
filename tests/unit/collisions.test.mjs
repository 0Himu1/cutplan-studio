import test from 'node:test';
import assert from 'node:assert/strict';
import {findPanelClashes,panelSolidBoxes} from '../../src/lib/furniture/collisions.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {DEFAULT_CABINET} from '../../src/lib/furniture/editor.ts';
const panel=(id,patch={})=>({panelId:id,componentId:id,label:id,role:'shelf',materialSlot:'body',widthMm:100,heightMm:100,thicknessMm:18,pose:{positionMm:[0,0,0],rotationRad:[0,0,0]},grainAxis:'none',allowedRotationsDeg:[0,90],...patch});
const probe=(id,position,size=10)=>panel(id,{widthMm:size,heightMm:size,thicknessMm:size,pose:{positionMm:position,rotationRad:[0,0,0]}});
test('actual overlap volume is highlighted, while touching and <=1 mm penetration are ignored',()=>{
 const a=panel('a'),b=panel('b',{pose:{positionMm:[90,0,0],rotationRad:[0,0,0]}});
 const before=JSON.stringify([a,b]),report=findPanelClashes([a,b]);assert.equal(report.clashes.length,1);assert.deepEqual(report.clashes[0].size,[10,100,18]);assert.deepEqual(report.clashes[0].position,[45,0,0]);assert.deepEqual(report.clashes[0].panelIds,['a','b']);assert.equal(JSON.stringify([a,b]),before);
 for(const x of [99,99.5,100,101])assert.equal(findPanelClashes([a,panel('b',{pose:{positionMm:[x,0,0],rotationRad:[0,0,0]}})]).clashes.length,0);
});
test('all four corner cutouts are empty; the retained L-shaped material still collides',()=>{
 for(const side of ['top-left','top-right','bottom-left','bottom-right']){
  const notched=panel('notched',{notches:[{side,width:30,height:30}]}),x=side.endsWith('left')?-40:40,y=side.startsWith('top')?40:-40;
  assert.equal(findPanelClashes([notched,probe('inside notch',[x,y,0])]).clashes.length,0,side);
  assert.ok(findPanelClashes([notched,probe('solid',[0,0,0])]).clashes.length>0,side);
  const volume=panelSolidBoxes(notched).reduce((sum,box)=>{const v=box.max.clone().sub(box.min);return sum+v.x*v.y*v.z;},0);assert.equal(volume,(10000-900)*18);
 }
});
test('two notches, rotation and world translation preserve the real cutout volume',()=>{
 const notched=panel('notched',{notches:[{side:'top-left',width:30,height:30},{side:'top-right',width:30,height:30}],pose:{positionMm:[200,300,400],rotationRad:[0,0,Math.PI/2]}});
 assert.equal(findPanelClashes([notched,probe('notch',[160,260,400])]).clashes.length,0);
 assert.equal(findPanelClashes([notched,probe('notch',[160,340,400])]).clashes.length,0);
 assert.ok(findPanelClashes([notched,probe('solid',[200,300,400])]).clashes.length>0);
});
test('an upright support fits through a horizontal shelf notch without a false clash',()=>{
 const shelf=panel('shelf',{notches:[{side:'top-left',width:30,height:30}],pose:{positionMm:[0,0,0],rotationRad:[Math.PI/2,0,0]}});
 const support=panel('support',{widthMm:20,heightMm:80,thicknessMm:18,pose:{positionMm:[-40,0,40],rotationRad:[0,0,0]}});
 assert.equal(findPanelClashes([shelf,support]).clashes.length,0);
 support.pose.positionMm[0]=-15;assert.ok(findPanelClashes([shelf,support]).clashes.length>0);
});
test('overlap boxes never refill a notch, and adjoining cells merge before the 1 mm threshold',()=>{
 const a=panel('a',{notches:[{side:'top-left',width:30,height:30}]}),b=panel('b');
 for(const clash of findPanelClashes([a,b]).clashes){const [x,y]=clash.position,[w,h]=clash.size;assert.ok(x-w/2>=-20-1e-6||y+h/2<=20+1e-6);}
 const splitProbe=panel('probe',{widthMm:10,heightMm:1.5,thicknessMm:10,pose:{positionMm:[0,20,0],rotationRad:[0,0,0]}});
 const regions=findPanelClashes([a,splitProbe]).clashes;assert.equal(regions.length,1);assert.equal(regions[0].size[1],1.5);
});
test('unsupported non-right-angle poses are reported instead of using misleading bounding boxes',()=>{
 const rotated=panel('rotated',{pose:{positionMm:[0,0,0],rotationRad:[0,Math.PI/4,0]}}),report=findPanelClashes([panel('a'),rotated]);assert.deepEqual(report.clashes,[]);assert.deepEqual(report.unsupportedPanels,['rotated']);
 assert.throws(()=>findPanelClashes([],NaN));assert.throws(()=>findPanelClashes([],-1));
 assert.deepEqual(findPanelClashes(calculateCabinet(DEFAULT_CABINET).panels),{clashes:[],unsupportedPanels:[]});
});
