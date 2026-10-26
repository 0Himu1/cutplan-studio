/** Approved board families. Finishes are deliberately separate from this list. */
export const boardCategories = [
 {code:'PLAIN-MDF',name:'Plain MDF',thicknesses:[3,6,9,12,15,18,25]},
 {code:'PLAIN-WOOD-PARTICLE',name:'Plain wood-chip particle board',thicknesses:[6,9,12,15,16,18,25]},
 {code:'MR-PLYWOOD',name:'MR-grade plywood',thicknesses:[6,12,15,18,20,25]},
 {code:'GORJON-PLYWOOD',name:'Gorjon plywood',thicknesses:[3,4,6,10,12,15,16,18,25]},
 {code:'MARINE-PLYWOOD',name:'Marine-grade plywood',thicknesses:[6,12,16,18,19,25]},
 {code:'VENEERED-BOARD',name:'Veneered board',thicknesses:[12,15,18,25]},
] as const;
export type BoardCategoryCode=typeof boardCategories[number]['code'];
export function boardCategory(code:string|null|undefined){return boardCategories.find(category=>category.code===code);}
export function validBoardThickness(code:string,thickness:unknown){const category=boardCategory(code);return Boolean(category&&typeof thickness==='number'&&(category.thicknesses as readonly number[]).includes(thickness));}
type BoardLike={id:string;kind:string;name:string;category_code?:string|null;retired_at?:string|null;board_skus?:Record<string,unknown>|null};
export function boardGroups<T extends BoardLike>(items:T[]){
 const groups=new Map<string,{key:string;name:string;variants:T[]}>();
 for(const item of items){if(item.kind!=='board'||item.retired_at)continue;const category=boardCategory(item.category_code),key=category?.code??item.id;
  const group=groups.get(key)??{key,name:category?.name??item.name,variants:[]};group.variants.push(item);groups.set(key,group);
 }
 return [...groups.values()].map(group=>({...group,variants:group.variants.sort((a,b)=>Number(a.board_skus?.thickness_mm)-Number(b.board_skus?.thickness_mm))})).sort((a,b)=>a.name.localeCompare(b.name));
}
/** Preserve the current physical thickness when changing category, where stocked. */
export function preferredVariant<T extends BoardLike>(variants:T[],thickness:number){return variants.find(item=>Number(item.board_skus?.thickness_mm)===thickness)??[...variants].sort((a,b)=>Math.abs(Number(a.board_skus?.thickness_mm)-thickness)-Math.abs(Number(b.board_skus?.thickness_mm)-thickness))[0];}
