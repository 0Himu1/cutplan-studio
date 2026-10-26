/** Shared clear-space accounting. Zero means an explicitly selected automatic allocation in saved v1 trees. */
export function allocateHeight(heights: number[], available: number, thickness: number) {
  const dividers = Math.max(0, heights.length - 1) * thickness;
  const capacity = available - dividers;
  const manual = heights.reduce((sum, height) => sum + (Number.isFinite(height)?height:0), 0);
  const automatic = heights.filter(height => height === 0).length;
  const remaining = capacity - manual;
  const resolved = heights.map(height => height === 0 ? remaining / automatic : height);
  const valid = heights.length > 0 && [available, thickness, ...heights].every(Number.isFinite)
    && thickness > 0 && heights.every(height => height >= 0)
    && remaining >= -.1
    && resolved.every(height => height >= 50);
  const empty=automatic?0:Math.max(0,remaining);
  return {dividers, capacity, manual, automatic, remaining, empty, resolved, valid};
}

/** Manual edits never create sections. Unallocated height remains an explicit empty space. */
export function editSectionHeight<T extends {heightMm:number}>(sections:T[], index:number, height:number):T[] {
  return sections.map((section, i) => i === index ? {...section, heightMm:height} : section);
}

/** Widths always reserve physical partitions; no rounding is written back to canonical millimeters. */
export function equalWidths<T extends {widthMm:number}>(items:T[], available:number, thickness:number):T[] {
  return items.map(item => ({...item, widthMm:(available - (items.length - 1) * thickness) / items.length}));
}

/** Reorder identities without rewriting dimensions, nested configuration or material paths. */
export function moveSection<T extends {id:string}>(items:T[],id:string,to:number):T[]{
  const from=items.findIndex(item=>item.id===id);
  if(from<0||!Number.isInteger(to)||to<0||to>=items.length||from===to)return items;
  const next=[...items],item=next.splice(from,1)[0];next.splice(to,0,item);return next;
}

/** Resize nested partitions proportionally, retaining section settings and stable identities. */
export function fitNestedWidths<T extends {widthMm:number;sections:{children:T[]}[]}>(comp:T, thickness:number):T {
  return {...comp, sections:comp.sections.map(section=>{
    if(!section.children.length)return section;
    const clear=comp.widthMm-(section.children.length-1)*thickness,total=section.children.reduce((sum,child)=>sum+child.widthMm,0);
    return {...section,children:section.children.map(child=>fitNestedWidths({...child,widthMm:clear*child.widthMm/total},thickness))};
  })};
}
