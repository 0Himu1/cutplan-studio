import type { Panel } from './cabinet.ts';

/** Presentation-only transforms; the calculator's manufacturing pose is never mutated. */
export function panelPresentation(panel:Panel,center:[number,number,number],explode:number,open:number){
  const position=[...panel.pose.positionMm] as [number,number,number];
  const rotation=[...panel.pose.rotationRad] as [number,number,number];
  if(panel.role==='door'){
    const left=panel.hingeSide?panel.hingeSide==='left':position[0]<=center[0],angle=(left?-1:1)*Math.PI/2*open*(1-explode);
    const offset=(left?1:-1)*panel.widthMm/2,hinge=position[0]-offset;
    position[0]=hinge+Math.cos(angle)*offset;position[2]-=Math.sin(angle)*offset;rotation[1]+=angle;
  }
  for(let axis=0;axis<3;axis++)position[axis]+=(panel.pose.positionMm[axis]-center[axis])*.5*explode;
  return {position,rotation};
}
export function advancePresentation(current:number,target:number,seconds:number,reducedMotion:boolean){
  if(reducedMotion)return target;
  const next=current+(target-current)*(1-Math.exp(-Math.min(.05,Math.max(0,seconds))*9));
  return Math.abs(target-next)<.001?target:next;
}
