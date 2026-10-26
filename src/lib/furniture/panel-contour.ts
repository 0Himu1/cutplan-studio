export type CornerNotch={side:'top-left'|'top-right'|'bottom-left'|'bottom-right';width:number;height:number};
/** Finished outline in panel-local XY, starting at the lower left; dimensions remain the stock envelope. */
export function panelContour(width:number,height:number,notches:readonly CornerNotch[]=[]):[number,number][]{
 const at=(side:CornerNotch['side'])=>notches.find(n=>n.side===side);
 const bl=at('bottom-left'),tl=at('top-left'),tr=at('top-right'),br=at('bottom-right');
 return [
  [0,bl?.height??0],
  ...(tl?[[0,height-tl.height],[tl.width,height-tl.height],[tl.width,height]]:[[0,height]]),
  ...(tr?[[width-tr.width,height],[width-tr.width,height-tr.height],[width,height-tr.height]]:[[width,height]]),
  ...(br?[[width,br.height],[width-br.width,br.height],[width-br.width,0]]:[[width,0]]),
  ...(bl?[[bl.width,0],[bl.width,bl.height]]:[]),
 ] as [number,number][];
}
