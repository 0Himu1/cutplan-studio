import type {MaterialCatalog} from '../../src/lib/furniture/materials.ts';
// Synthetic catalog for isolated tests; never published to the live catalog.
export const bodyId='00000000-0000-4000-8000-000000001101',backId='00000000-0000-4000-8000-000000001102',doorId='00000000-0000-4000-8000-000000001103',finishId='00000000-0000-4000-8000-000000001104';
export const boardCatalog:MaterialCatalog={items:[
 {id:bodyId,kind:'board',code:'TEST-BODY',name:'Test body board',board_skus:{thickness_mm:16,sheet_width_mm:2440,sheet_height_mm:2440,grain_direction:'height'}},
 {id:backId,kind:'board',code:'TEST-BACK',name:'Test back board',board_skus:{thickness_mm:6,sheet_width_mm:2440,sheet_height_mm:2440,grain_direction:'none'}},
 {id:doorId,kind:'board',code:'TEST-DOOR',name:'Test door board',board_skus:{thickness_mm:18,sheet_width_mm:2440,sheet_height_mm:2440,grain_direction:'none'}},
 {id:finishId,kind:'finish',code:'TEST-FINISH',name:'Test white finish',finish_skus:{surface:'laminate',color_code:'#f1eee5'}}
],compatibility:[{board_item_id:doorId,finish_item_id:finishId}]};
