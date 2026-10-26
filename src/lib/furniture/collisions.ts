import {Box3,Euler,Matrix4,Vector3} from 'three';
import type {Panel} from './cabinet.ts';
import {panelContour} from './panel-contour.ts';

type Point=[number,number,number];
export type PanelClash={panelIds:[string,string];labels:[string,string];position:Point;size:Point};
const epsilon=1e-7;
const equal=(a:number,b:number)=>Math.abs(a-b)<epsilon;

function inside(x:number,y:number,outline:[number,number][]){
 let result=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const [ax,ay]=outline[i],[bx,by]=outline[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
 }
 return result;
}

/** Merge adjacent rectangular solids before applying the overlap tolerance. */
function mergeBoxes(input:Box3[]){
 const boxes=input.map(box=>box.clone());let changed=true;
 while(changed){changed=false;
  outer:for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)for(const axis of ['x','y','z'] as const){
   const a=boxes[i],b=boxes[j],others=(['x','y','z'] as const).filter(key=>key!==axis);
   if(others.every(key=>equal(a.min[key],b.min[key])&&equal(a.max[key],b.max[key]))&&(equal(a.max[axis],b.min[axis])||equal(b.max[axis],a.min[axis]))){
    a.union(b);boxes.splice(j,1);changed=true;break outer;
   }
  }
 }
 return boxes;
}

/** Exact rectangular decomposition of the same orthogonal outline used by panelGeometry. */
export function panelSolidBoxes(panel:Panel):Box3[]{
 const outline=panelContour(panel.widthMm,panel.heightMm,panel.notches);
 const xs=[...new Set(outline.map(point=>point[0]))].sort((a,b)=>a-b),ys=[...new Set(outline.map(point=>point[1]))].sort((a,b)=>a-b),boxes:Box3[]=[];
 for(let x=0;x<xs.length-1;x++)for(let y=0;y<ys.length-1;y++){
  if(xs[x+1]-xs[x]<=epsilon||ys[y+1]-ys[y]<=epsilon||!inside((xs[x]+xs[x+1])/2,(ys[y]+ys[y+1])/2,outline))continue;
  boxes.push(new Box3(new Vector3(xs[x]-panel.widthMm/2,ys[y]-panel.heightMm/2,-panel.thicknessMm/2),new Vector3(xs[x+1]-panel.widthMm/2,ys[y+1]-panel.heightMm/2,panel.thicknessMm/2)));
 }
 return mergeBoxes(boxes);
}

/** Assembly diagnostics only. No design, cut list, stock, or manufacturing approval is changed. */
export function findPanelClashes(panels:readonly Panel[],toleranceMm=1):{clashes:PanelClash[];unsupportedPanels:string[]}{
 if(!Number.isFinite(toleranceMm)||toleranceMm<0)throw new Error('Collision tolerance must be finite and non-negative.');
 const unsupportedPanels:string[]=[];
 const entries=panels.flatMap(panel=>{
  const dimensions=[panel.widthMm,panel.heightMm,panel.thicknessMm];
  // World AABBs are exact for these right-angle poses. Never substitute a coarse box for an arbitrary rotation.
  if(dimensions.some(value=>!Number.isFinite(value)||value<=0)||panel.pose.positionMm.some(value=>!Number.isFinite(value))||panel.pose.rotationRad.some(value=>!Number.isFinite(value)||Math.abs(value/(Math.PI/2)-Math.round(value/(Math.PI/2)))>epsilon)){
   unsupportedPanels.push(panel.panelId);return [];
  }
  const angles=panel.pose.rotationRad.map(angle=>Math.round(angle/(Math.PI/2))*Math.PI/2) as Point;
  const matrix=new Matrix4().makeRotationFromEuler(new Euler(...angles,'XYZ'));matrix.setPosition(...panel.pose.positionMm);
  const boxes=panelSolidBoxes(panel).map(box=>box.applyMatrix4(matrix)),bounds=new Box3();for(const box of boxes)bounds.union(box);
  return [{panel,boxes,bounds}];
 });
 const clashes:PanelClash[]=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j];if(!a.bounds.intersectsBox(b.bounds))continue;
  const overlaps:Box3[]=[];
  for(const first of a.boxes)for(const second of b.boxes)if(first.intersectsBox(second)){
   const overlap=first.clone().intersect(second),size=overlap.getSize(new Vector3());if(size.x>epsilon&&size.y>epsilon&&size.z>epsilon)overlaps.push(overlap);
  }
  for(const overlap of mergeBoxes(overlaps)){
   const size=overlap.getSize(new Vector3());if(size.x<=toleranceMm+epsilon||size.y<=toleranceMm+epsilon||size.z<=toleranceMm+epsilon)continue;
   clashes.push({panelIds:[a.panel.panelId,b.panel.panelId],labels:[a.panel.label,b.panel.label],position:overlap.getCenter(new Vector3()).toArray() as Point,size:size.toArray() as Point});
  }
 }
 return {clashes,unsupportedPanels};
}
