export const numberKeys = ['widthMm','heightMm','depthMm','bodyThicknessMm','backThicknessMm','doorThicknessMm','shelfCount','doorCount','skirtingHeightMm','shelfSideClearanceMm','doorGapMm','plinthSetbackMm','stockWidthMm','stockHeightMm','stockMarginMm'];
export const cabinetSchema = {
  bsonType:'object', required:[...numberKeys,'backPosition','grainAxis'], additionalProperties:false,
  properties:{
    ...Object.fromEntries(numberKeys.map(key=>[key,{bsonType:['double','int','long','decimal'],minimum:0,maximum:100000}])),
    panelOverrides:{bsonType:'object',additionalProperties:false,patternProperties:{'^cabinet/(side-left|side-right|top|bottom|back|plinth-front|shelf-([1-9]|1[0-9]|20)|door-[12])$':{bsonType:'object',additionalProperties:false,properties:{boardId:{bsonType:'string'},frontFinishId:{bsonType:'string'},backFinishId:{bsonType:'string'},thicknessMm:{bsonType:['double','int'],minimum:0},stockWidthMm:{bsonType:['double','int'],minimum:0},stockHeightMm:{bsonType:['double','int'],minimum:0},grainAxis:{enum:['none','width','height']},edges:{bsonType:'object',additionalProperties:false,properties:Object.fromEntries(['top','bottom','left','right'].map(edge=>[edge,{bsonType:'string'}]))}}}}},
    backPosition:{enum:['inset','outside']}, grainAxis:{enum:['none','width','height']}
  }
};
const common={schemaVersion:{enum:[1]},name:{bsonType:'string',minLength:1,maxLength:120}};
export const snapshotSchema = { oneOf:[
  {bsonType:'object',required:['schemaVersion','name','furnitureType','stage'],additionalProperties:false,
    properties:{...common,furnitureType:{enum:['cabinet','shoe_rack','bookshelf','table']},stage:{enum:['project-shell']}}},
  {bsonType:'object',required:['schemaVersion','name','furnitureType','stage','cabinet','engineVersion','templateKey'],additionalProperties:false,
    properties:{...common,furnitureType:{enum:['cabinet']},stage:{enum:['cabinet-design']},cabinet:cabinetSchema,
      engineVersion:{enum:['cabinet-review-1.0.0']},templateKey:{enum:['cabinet-between-sides-inset-doors-v1']}}}
]};


const familyConfiguration=(family)=>{
 const schema=structuredClone(cabinetSchema);schema.required.push('family');schema.properties.family={enum:[family]};
 schema.properties.panelOverrides.patternProperties=Object.fromEntries(Object.entries(schema.properties.panelOverrides.patternProperties).map(([key,value])=>[key.replace('^cabinet/',`^${family}/`),value]));
 if(family==='bookshelf'){
  schema.required.push('mounting','shelfMode','wallSubstrate','fixingNotes');Object.assign(schema.properties,{mounting:{enum:['floor','wall']},shelfMode:{enum:['fixed','adjustable']},wallSubstrate:{enum:['unknown','masonry','concrete','stud']},fixingNotes:{bsonType:'string',maxLength:240},doorCount:{enum:[0]}});
 }
 return schema;
};
for(const family of ['shoe_rack','bookshelf'])snapshotSchema.oneOf.push({bsonType:'object',required:['schemaVersion','name','furnitureType','stage','configuration','engineVersion','templateKey'],additionalProperties:false,properties:{...common,furnitureType:{enum:[family]},stage:{enum:['furniture-design']},configuration:familyConfiguration(family),engineVersion:{enum:['casework-review-1.0.0']},templateKey:{enum:[family==='shoe_rack'?'shoe-rack-between-sides-v1':'bookshelf-open-casework-v1']}}});

const table=familyConfiguration('table');table.required.push('tableKind');table.properties.tableKind={enum:['study','dining','side']};
for(const key of ['doorCount','shelfCount','skirtingHeightMm'])table.properties[key]={enum:[0]};
table.properties.panelOverrides.patternProperties=Object.fromEntries(Object.values(table.properties.panelOverrides.patternProperties).map(value=>['^table/(top|side-left|side-right|back)$',value]));
snapshotSchema.oneOf.push({bsonType:'object',required:['schemaVersion','name','furnitureType','stage','configuration','engineVersion','templateKey'],additionalProperties:false,properties:{...common,furnitureType:{enum:['table']},stage:{enum:['furniture-design']},configuration:table,engineVersion:{enum:['casework-review-1.0.0']},templateKey:{enum:['table-panel-trestle-v1']}}});

// Added after the family copies: compartment options belong only to cabinets.
const boundedNumber={bsonType:['double','int','long','decimal'],minimum:0,maximum:100000};
const stableId={bsonType:'string',pattern:'^[a-zA-Z0-9_-]{1,32}$'};
function compartmentTree(depth=0){
 const drawer={bsonType:'object',additionalProperties:false,required:['id','heightMm','depthMm'],properties:{id:stableId,heightMm:{...boundedNumber,minimum:50},depthMm:boundedNumber}};
 const section={bsonType:'object',additionalProperties:false,required:['id','heightMm','type','shelfCount','shelfMode','external','rodOffsetMm','slideClearanceMm','drawers','children'],properties:{id:stableId,heightMm:boundedNumber,type:{enum:['open','shelf','hanging','drawer','divider']},shelfCount:{bsonType:['int','long','double','decimal'],minimum:0,maximum:20},shelfMode:{enum:['fixed','adjustable']},external:{bsonType:'bool'},rodOffsetMm:boundedNumber,slideClearanceMm:{...boundedNumber,maximum:30},drawers:{bsonType:'array',maxItems:6,items:drawer},children:depth<3?compartmentTree(depth+1):{bsonType:'array',maxItems:0}}};
 return {bsonType:'array',minItems:1,maxItems:6,items:{bsonType:'object',additionalProperties:false,required:['id','widthMm','doorCount','sections'],properties:{id:stableId,widthMm:boundedNumber,doorCount:{enum:[0,1,2]},sections:{bsonType:'array',minItems:1,maxItems:8,items:section}}}};
}
// Non-divider sections carry an empty children array, so only recursive entries require minItems.
function allowEmptyChildren(schema){if(schema&&typeof schema==='object'){if(schema.properties?.children?.minItems)delete schema.properties.children.minItems;for(const value of Object.values(schema))if(value&&typeof value==='object')allowEmptyChildren(value);}}
const tree=compartmentTree();allowEmptyChildren(tree);
Object.assign(cabinetSchema.properties,{doorPosition:{enum:['inset','overlay']},compartmentMode:{enum:['auto','manual']},compartments:tree});
const assignment=Object.values(cabinetSchema.properties.panelOverrides.patternProperties)[0];
cabinetSchema.properties.panelOverrides.maxProperties=256;
cabinetSchema.properties.panelOverrides.patternProperties['^cabinet/layout/([a-zA-Z0-9_-]{1,32}/){1,12}(partition|separator|shelf-([1-9]|1[0-9]|20)|door-[12]|bottom|left|right|back|front|face)$']=assignment;

// Role defaults apply only to cabinets; family schemas above retain their prior contract.
const groupMaterial=structuredClone(Object.values(cabinetSchema.properties.panelOverrides.patternProperties)[0]);
groupMaterial.properties.previewColor={bsonType:'string',pattern:'^#[0-9A-Fa-f]{6}$'};
cabinetSchema.properties.materialDefaults={bsonType:'object',additionalProperties:false,properties:Object.fromEntries(['body','back','front'].map(slot=>[slot,structuredClone(groupMaterial)]))};
