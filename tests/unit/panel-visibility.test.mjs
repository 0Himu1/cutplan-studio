import test from 'node:test';
import assert from 'node:assert/strict';
import {panelVisible} from '../../src/lib/furniture/presentation.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {DEFAULT_CABINET} from '../../src/lib/furniture/editor.ts';

test('visibility filters only cabinet doors and back, preserving drawers and calculated panels',()=>{
 const calculation=calculateCabinet(DEFAULT_CABINET),snapshot=JSON.stringify(calculation);
 for(const panel of calculation.panels){
  assert.equal(panelVisible(panel),true);
  assert.equal(panelVisible(panel,true,false),panel.role!=='door');
  assert.equal(panelVisible(panel,false,true),panel.role!=='back');
 }
 assert.equal(panelVisible({role:'drawer'},true,true),true);
 assert.equal(panelVisible({role:'divider'},true,true),true);
 assert.equal(JSON.stringify(calculation),snapshot);
});
