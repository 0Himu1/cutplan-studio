import test from 'node:test';
import assert from 'node:assert/strict';
import {finishMapping} from '../../src/lib/furniture/finish-mapping.ts';

test('finish crops preserve pixel proportions, physical sheet scale and grain rotation',()=>{
 for(const [iw,ih] of [[4000,2000],[2000,4000],[2048,2048]])for(const rotated of [false,true]){
  const m=finishMapping(400,1800,iw,ih,1220,2440,rotated);
  const horizontalPixels=Math.hypot(m[0]*iw,m[3]*ih),verticalPixels=Math.hypot(m[1]*iw,m[4]*ih);
  assert.ok(Math.abs(horizontalPixels/400-verticalPixels/1800)<1e-10);
  assert.ok(Math.abs(m[0]*.5+m[1]*.5+m[2]-.5)<1e-10);
  assert.ok(Math.abs(m[3]*.5+m[4]*.5+m[5]-.5)<1e-10);
  const smaller=finishMapping(200,900,iw,ih,1220,2440,rotated);
  for(const i of [0,1,3,4])assert.equal(smaller[i],m[i]/2);
  const highResolution=finishMapping(400,1800,iw*2,ih*2,1220,2440,rotated);
  assert.deepEqual(highResolution,m);
 }
});

test('full sheet maps once; oversize preview tiles without stretching; defaults remain finite',()=>{
 assert.deepEqual(finishMapping(1220,2440,2000,4000,1220,2440),[1,0,0,0,1,0,0,0,1]);
 assert.equal(finishMapping(2440,2440,2000,4000,1220,2440)[0],2);
 assert.ok(finishMapping(400,1800,2048,2048).every(Number.isFinite));
});
