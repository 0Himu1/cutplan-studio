export const EDGES = ['top','bottom','left','right'] as const;
export type PanelMaterial = {
  boardId?: string; thicknessMm?: number; stockWidthMm?: number; stockHeightMm?: number;
  frontFinishId?: string; backFinishId?: string;
  edges?: Partial<Record<typeof EDGES[number],string>>;
  grainAxis?: 'none'|'width'|'height';
};
export type PanelOverrides = Record<string,PanelMaterial>;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
export function parseOverrides(value:unknown):PanelOverrides|null {
  if(!record(value)||Object.keys(value).length>256)return null;
  const result:PanelOverrides={};
  for(const id of Object.keys(value).sort()){
    const item=value[id];
    const layoutId=/^cabinet\/layout\/(?:[a-zA-Z0-9_-]{1,32}\/){1,12}(?:partition|separator|shelf-(?:[1-9]|1\d|20)|door-[12]|bottom|left|right|back|front|face)$/.test(id);
    if((!layoutId&&!/^(?:cabinet|shoe_rack|bookshelf)\/(side-left|side-right|top|bottom|back|plinth-front|shelf-(?:[1-9]|1\d|20)|door-[12])$|^table\/(top|side-left|side-right|back)$/.test(id))||!record(item))return null;
    if(Object.keys(item).some(key=>!['boardId','thicknessMm','stockWidthMm','stockHeightMm','frontFinishId','backFinishId','edges','grainAxis'].includes(key)))return null;
    const next:PanelMaterial={};
    for(const key of ['boardId','frontFinishId','backFinishId'] as const){if(item[key]!==undefined){if(typeof item[key]!=='string'||!uuid.test(item[key]))return null;next[key]=item[key];}}
    for(const key of ['thicknessMm','stockWidthMm','stockHeightMm'] as const){if(item[key]!==undefined){if(typeof item[key]!=='number'||!Number.isFinite(item[key])||item[key]<=0||item[key]>100000)return null;next[key]=item[key];}}
    if(next.boardId&&(!next.thicknessMm||!next.stockWidthMm||!next.stockHeightMm))return null;
    if(!next.boardId&&(next.thicknessMm!==undefined||next.stockWidthMm!==undefined||next.stockHeightMm!==undefined||next.frontFinishId||next.backFinishId))return null;
    if(item.grainAxis!==undefined){if(!['none','width','height'].includes(String(item.grainAxis)))return null;next.grainAxis=item.grainAxis as PanelMaterial['grainAxis'];}
    if(item.edges!==undefined){if(!record(item.edges)||Object.keys(item.edges).some(key=>!EDGES.includes(key as typeof EDGES[number])))return null;next.edges={};for(const edge of EDGES){const edgeId=item.edges[edge];if(edgeId!==undefined){if(typeof edgeId!=='string'||!uuid.test(edgeId))return null;next.edges[edge]=edgeId;}}}
    result[id]=next;
  }
  return result;
}

export type SellableMaterial={id:string;category_code?:string|null;price?:{price_bdt:number;unit:string};kind:'board'|'finish'|'edging';name:string;code:string;board_skus?:Record<string,unknown>|null;finish_skus?:Record<string,unknown>|null;edging_skus?:Record<string,unknown>|null};
export type MaterialCatalog={items:SellableMaterial[];compatibility:{board_item_id:string;finish_item_id:string}[]};
export function compatibleFinishes(catalog:MaterialCatalog,boardId:string|undefined){
 return catalog.items.filter(item=>item.kind==='finish'&&catalog.compatibility.some(pair=>pair.board_item_id===boardId&&pair.finish_item_id===item.id));
}
export function validateMaterials(overrides:PanelOverrides,catalog:MaterialCatalog):string[] {
  const errors:string[]=[];
  for(const [id,item] of Object.entries(overrides)){
    const board=catalog.items.find(candidate=>candidate.id===item.boardId&&candidate.kind==='board');
    if(item.boardId){
      if(!board){errors.push(`${id}: board is no longer available.`);continue;}
      const spec=board.board_skus;
      if(Number(spec?.thickness_mm)!==item.thicknessMm||Number(spec?.sheet_width_mm)!==item.stockWidthMm||Number(spec?.sheet_height_mm)!==item.stockHeightMm)errors.push(`${id}: board specification changed; select it again.`);
      const grain=String(spec?.grain_direction??'none');
      if(grain!=='none'&&item.grainAxis!==grain)errors.push(`${id}: board grain direction must be preserved.`);
    }
    for(const finishId of [item.frontFinishId,item.backFinishId])if(finishId&&(!board||!catalog.items.some(candidate=>candidate.id===finishId&&candidate.kind==='finish')||!catalog.compatibility.some(pair=>pair.board_item_id===board.id&&pair.finish_item_id===finishId)))errors.push(`${id}: finish is not compatible with this board.`);
    for(const edgingId of Object.values(item.edges??{})){
      const edging=catalog.items.find(candidate=>candidate.id===edgingId&&candidate.kind==='edging');
      if(!board||!edging||Number(edging.edging_skus?.width_mm)<Number(item.thicknessMm))errors.push(`${id}: edging must cover the selected board thickness.`);
    }
  }
  return errors;
}

export type MaterialSlot='body'|'back'|'front';
export type MaterialDefault=PanelMaterial&{previewColor?:string};
export type MaterialDefaults=Partial<Record<MaterialSlot,MaterialDefault>>;
export type MaterialSource={materialDefaults?:MaterialDefaults;panelOverrides?:PanelOverrides};
export function parseMaterialDefaults(value:unknown):MaterialDefaults|null{
 if(!record(value)||Object.keys(value).length>3)return null;
 const result:MaterialDefaults={};
 for(const [slot,raw]of Object.entries(value).sort(([a],[b])=>a.localeCompare(b))){
  if(!['body','back','front'].includes(slot)||!record(raw))return null;
  const {previewColor,...assignment}=raw;
  if(previewColor!==undefined&&(typeof previewColor!=='string'||!/^#[0-9a-f]{6}$/i.test(previewColor)))return null;
  const parsed=parseOverrides({'cabinet/top':assignment});if(!parsed)return null;
  result[slot as MaterialSlot]={...parsed['cabinet/top'],...(previewColor!==undefined?{previewColor}:{})};
 }
 return result;
}
/** A separate board override replaces inherited board/finish data; partial edging/grain edits retain the group board. */
export function materialForPanel(input:MaterialSource,panel:{panelId:string;materialSlot:MaterialSlot}):MaterialDefault{
 const base=input.materialDefaults?.[panel.materialSlot]??{},override=input.panelOverrides?.[panel.panelId];
 if(override?.boardId)return {...(override.boardId===base.boardId&&base.previewColor?{previewColor:base.previewColor}:{}),...override};
 return {...base,...override,edges:{...base.edges,...override?.edges}};
}
export function materialAssignments(input:MaterialSource,panels:{panelId:string;materialSlot:MaterialSlot}[]):PanelOverrides{
 return {...Object.fromEntries(Object.entries(input.materialDefaults??{}).map(([slot,value])=>['default/'+slot,value])),...Object.fromEntries(panels.map(panel=>[panel.panelId,materialForPanel(input,panel)]))};
}
export function previewPanelColor(input:MaterialSource,panel:{panelId:string;materialSlot:MaterialSlot},catalog:MaterialCatalog,face:'front'|'back'){
 const material=materialForPanel(input,panel),id=face==='front'?material.frontFinishId:material.backFinishId;
 const code=catalog.items.find(item=>item.id===id&&item.kind==='finish')?.finish_skus?.color_code;
 return typeof code==='string'&&/^#[0-9a-f]{6}$/i.test(code)?code:previewBoardColor(input,panel,catalog);
}

/** Catalog board color is shared by all panels using that board; legacy preview colors remain a fallback. */
export function previewBoardColor(input:MaterialSource,panel:{panelId:string;materialSlot:MaterialSlot},catalog:MaterialCatalog){
 const material=materialForPanel(input,panel),color=catalog.items.find(item=>item.kind==='board'&&item.id===material.boardId)?.board_skus?.color_code;
 return typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color)?color:material.previewColor??'#bda382';
}

export function physicalMaterial(value:MaterialDefault):PanelMaterial{const result={...value};delete result.previewColor;return result;}
