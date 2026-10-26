import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CABINET, cabinetInput, edit,initialHistory,undo,redo } from '../../src/lib/furniture/editor.ts';
import { calculateCabinet } from '../../src/lib/furniture/cabinet.ts';
import { parseOverrides,validateMaterials } from '../../src/lib/furniture/materials.ts';
import { designSnapshot } from '../../src/lib/projects/contracts.ts';
import { snapshotHash } from '../../src/lib/projects/identity.ts';
const board='00000000-0000-4000-8000-000000000001',finish='00000000-0000-4000-8000-000000000002',edge='00000000-0000-4000-8000-000000000003';
const assignment={boardId:board,thicknessMm:24,stockWidthMm:1219,stockHeightMm:2438,frontFinishId:finish,edges:{top:edge},grainAxis:'none'};
const catalog={items:[{id:board,kind:'board',name:'Board',board_skus:{thickness_mm:24,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}},{id:finish,kind:'finish',name:'Finish'},{id:edge,kind:'edging',name:'Edge',edging_skus:{width_mm:25}}],compatibility:[{board_item_id:board,finish_item_id:finish}]};
test('panel assignments validate identifiers, bounded stock and compatibility; stale and undersize edging fail',()=>{
  assert.ok(parseOverrides({'cabinet/side-left':assignment}));
  for(const value of [null,[],{'cabinet/nope':assignment},{'cabinet/top':{...assignment,thicknessMm:0}},{'cabinet/top':{...assignment,unknown:1}},{'cabinet/top':{boardId:board}}])assert.equal(parseOverrides(value),null);
  assert.deepEqual(validateMaterials({'cabinet/side-left':assignment},catalog),[]);
  assert.ok(validateMaterials({'cabinet/side-left':assignment},{...catalog,compatibility:[]}).length);
  assert.ok(validateMaterials({'cabinet/side-left':assignment},{...catalog,items:catalog.items.filter(item=>item.id!==board)}).length);
  assert.ok(validateMaterials({'cabinet/side-left':{...assignment,thicknessMm:30}},catalog).length);
});
test('asymmetric side thickness recalculates neighboring panels; material history and hashes include overrides',()=>{
  const input={...DEFAULT_CABINET,panelOverrides:{'cabinet/side-left':assignment}};
  const result=calculateCabinet(input);assert.deepEqual(result.blockingErrors,[]);
  const find=id=>result.panels.find(panel=>panel.componentId===id);
  assert.equal(find('side-left').thicknessMm,24);assert.equal(find('side-left').pose.positionMm[0],12);
  assert.equal(find('top').widthMm,758);assert.equal(find('top').pose.positionMm[0],403);
  assert.equal(find('shelf-1').widthMm,754);
  assert.deepEqual(cabinetInput(input).panelOverrides,{'cabinet/side-left':assignment});
  const history=edit(initialHistory(DEFAULT_CABINET),input);
  assert.equal(undo(history).present.panelOverrides,undefined);
  assert.deepEqual(redo(undo(history)).present.panelOverrides,input.panelOverrides);
  assert.notEqual(snapshotHash(designSnapshot('Cabinet',input)),snapshotHash(designSnapshot('Cabinet',DEFAULT_CABINET)));
});
test('per-panel stock fit warns while removed identities remain invalid',()=>{
  const result=calculateCabinet({...DEFAULT_CABINET,panelOverrides:{'cabinet/side-left':{...assignment,stockWidthMm:1220,stockHeightMm:420,grainAxis:'width'}}});
  assert.deepEqual(result.blockingErrors,[]);assert.ok(result.stockIssues.length);
  assert.ok(calculateCabinet({...DEFAULT_CABINET,panelOverrides:{'cabinet/shelf-20':assignment}}).blockingErrors.length);
});

