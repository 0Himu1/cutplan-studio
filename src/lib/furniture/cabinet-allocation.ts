/** Shared clear-space accounting. Zero means an explicitly selected automatic allocation in saved v1 trees. */
export function allocateHeight(heights: number[], available: number, thickness: number) {
  const dividers = Math.max(0, heights.length - 1) * thickness;
  const capacity = available - dividers;
  const manual = heights.reduce((sum, height) => sum + height, 0);
  const automatic = heights.filter(height => height === 0).length;
  const remaining = capacity - manual;
  const resolved = heights.map(height => height === 0 ? remaining / automatic : height);
  const valid = heights.length > 0 && [available, thickness, ...heights].every(Number.isFinite)
    && thickness > 0 && heights.every(height => height >= 0)
    && remaining >= -.1 && (automatic > 0 || Math.abs(remaining) <= .1)
    && resolved.every(height => height >= 50);
  return {dividers, capacity, manual, automatic, remaining, resolved, valid};
}

/** A manual edit retains an explicit flexible remainder rather than leaving a disconnected gap. */
export function editSectionHeight<T extends {heightMm:number}>(sections:T[], index:number, height:number, available:number, thickness:number, remainder:()=>T):T[] {
  const next = sections.map((section, i) => i === index ? {...section, heightMm:height} : section);
  if (Number.isFinite(height) && height > 0 && !next.some(section => section.heightMm === 0) && next.length < 8) {
    const space = available - next.reduce((sum, section) => sum + section.heightMm, 0) - next.length * thickness;
    if (space >= 50) next.push(remainder());
  }
  return next;
}

/** Widths always reserve physical partitions; no rounding is written back to canonical millimeters. */
export function equalWidths<T extends {widthMm:number}>(items:T[], available:number, thickness:number):T[] {
  return items.map(item => ({...item, widthMm:(available - (items.length - 1) * thickness) / items.length}));
}

/** Resize nested partitions proportionally, retaining section settings and stable identities. */
export function fitNestedWidths<T extends {widthMm:number;sections:{children:T[]}[]}>(comp:T, thickness:number):T {
  return {...comp, sections:comp.sections.map(section=>{
    if(!section.children.length)return section;
    const clear=comp.widthMm-(section.children.length-1)*thickness,total=section.children.reduce((sum,child)=>sum+child.widthMm,0);
    return {...section,children:section.children.map(child=>fitNestedWidths({...child,widthMm:clear*child.widthMm/total},thickness))};
  })};
}
