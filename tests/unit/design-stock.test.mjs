import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CABINET,cabinetInput,initialHistory,edit} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {designSnapshot,saveInput} from '../../src/lib/projects/contracts.ts';
import {nestFurniture} from '../../src/lib/furniture/nesting.ts';
import {freezeReview,productionIssues,syntheticProfile} from '../../src/lib/production/review.ts';

test('oversized designs recalculate in either edit order and save without inventing stock or changing grain',()=>{
 const base={...DEFAULT_CABINET,grainAxis:'height'};
 for(const axes of [['widthMm','heightMm','depthMm'],['heightMm','widthMm','depthMm']]){
  let history=initialHistory(base);
  const values={widthMm:1800,heightMm:2600,depthMm:600};
  for(const axis of axes)history=edit(history,{...history.present,[axis]:values[axis]});
  const input=history.present,result=calculateCabinet(input);
  assert.deepEqual(result.blockingErrors,[]);assert.equal(input.widthMm,1800);assert.equal(input.heightMm,2600);assert.equal(input.depthMm,600);
  assert.equal(input.stockWidthMm,base.stockWidthMm);assert.equal(input.stockHeightMm,base.stockHeightMm);assert.equal(input.grainAxis,'height');
  assert.ok(result.stockIssues.some(issue=>issue.field==='cabinet/back'));
  const back=result.panels.find(panel=>panel.role==='back');assert.equal(back.widthMm,1764);assert.equal(back.heightMm,2564);
  assert.deepEqual(cabinetInput(input),input);
  const snapshot=designSnapshot('Large cabinet',input),saved=saveInput({operationId:'00000000-0000-4000-8000-000000000901',sourceDraftId:'00000000-0000-4000-8000-000000000902',expectedVersion:0,snapshot});assert.ok(saved);assert.equal(saved.snapshot.cabinet.heightMm,2600);
  assert.ok(nestFurniture(input).unplaced.some(panel=>panel.panelId==='cabinet/back'));
  assert.ok(productionIssues(freezeReview(input),syntheticProfile).some(issue=>issue.includes('incomplete')));
 }
});
test('larger selected stock resolves warnings; invalid construction still blocks',()=>{
 const input={...DEFAULT_CABINET,widthMm:1800,heightMm:2600,depthMm:600};
 assert.ok(calculateCabinet(input).stockIssues.length);
 const result=calculateCabinet({...input,stockWidthMm:2000,stockHeightMm:3000});assert.deepEqual(result.blockingErrors,[]);assert.equal(result.stockIssues,undefined);
 for(const changes of [{widthMm:0},{heightMm:NaN},{depthMm:-1},{stockMarginMm:9000}])assert.ok(calculateCabinet({...input,...changes}).blockingErrors.length);
});
