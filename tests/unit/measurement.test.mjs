import test from 'node:test';
import assert from 'node:assert/strict';
import {inchSutaFromMm,mmFromInchSuta,measurementNumber,inchSutaDisplay} from '../../src/lib/measurement.ts';
test('inch/suta uses eight suta per inch, supports fractions, zero and overflow carry',()=>{
 assert.equal(mmFromInchSuta(1,0),25.4);assert.equal(mmFromInchSuta(0,1),3.175);assert.equal(mmFromInchSuta(10,4),266.7);assert.equal(mmFromInchSuta(0,.5),1.5875);assert.equal(mmFromInchSuta(10,8),279.4);assert.deepEqual(inchSutaDisplay(mmFromInchSuta(10,8)),{inch:'11',suta:'0'});assert.deepEqual(inchSutaDisplay(0),{inch:'0',suta:'0'});
 for(const value of [0,.001,3.175,6,18,800,901,1219,2438,10000]){const p=inchSutaFromMm(value);assert.ok(p);assert.ok(p.suta>=0&&p.suta<8);assert.ok(Math.abs(mmFromInchSuta(p.inch,p.suta)-value)<1e-9);}
});
test('invalid measurements do not silently clamp or become zero',()=>{
 for(const value of [-1,NaN,Infinity,-Infinity])assert.equal(inchSutaFromMm(value),null);
 for(const args of [[-1,0],[0,-1],[NaN,0],[1,Infinity]])assert.ok(Number.isNaN(mmFromInchSuta(...args)));
 for(const raw of ['',' ','-1','1e3','Infinity','NaN','1,2,3','12junk'])assert.ok(Number.isNaN(measurementNumber(raw)));
 assert.equal(measurementNumber('0'),0);assert.equal(measurementNumber('.5'),.5);assert.equal(measurementNumber('1,5'),1.5);
});
