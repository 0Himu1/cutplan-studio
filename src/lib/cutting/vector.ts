import {cuttingSettingsIssues,type CuttingSettings} from './workspace.ts';
export type VectorSettings={scale:number;offsetX:number;offsetY:number;cutType:'on-line'|'outside'|'inside';unit:'mm'|'inch';depth:number;widthMm?:number;heightMm?:number};
/** Local-only SVG processing; nothing is rendered as HTML or uploaded to a service. */
export async function vectorCode(svg:string,s:CuttingSettings,v:VectorSettings){
 const issues=cuttingSettingsIssues(s);if(issues.length)throw new Error(issues.join(' '));
 if(svg.length>2000000||/<!DOCTYPE|<!ENTITY|<(script|foreignObject|image|use|style)\b|\bon\w+\s*=|(?:href|url)\s*[=(]/i.test(svg))throw new Error('Choose a self-contained SVG up to 2 MB without scripts, images or external references.');
 if(![v.scale,v.offsetX,v.offsetY,v.depth].every(Number.isFinite)||v.scale<=0||v.scale>1000||v.depth<=0||v.depth>100)throw new Error('Invalid vector scale, offset or depth.');
 const [{SVGLoader},{default:Offset}]=await Promise.all([import('three/addons/loaders/SVGLoader.js'),import('polygon-offset')]);
 const parsed=new SVGLoader().parse(svg),contours:{x:number;y:number}[][]=[],factor=v.scale*(v.unit==='inch'?25.4:1);
 const add=(points:{x:number;y:number}[],offset:number)=>{
  const vertices=points.map(p=>[p.x*factor+v.offsetX,p.y*factor+v.offsetY]);
  if(vertices.length<2)return;
  if(offset){if(vertices[0][0]!==vertices.at(-1)![0]||vertices[0][1]!==vertices.at(-1)![1])vertices.push([...vertices[0]]);const shape=new Offset().data(vertices);const results=offset>0?shape.margin(offset):shape.padding(-offset);if(!results?.length)throw new Error('Vector offset collapsed a contour. Change the tool or geometry.');for(const result of results)contours.push(result.map(([x,y])=>({x,y})));}
  else contours.push(vertices.map(([x,y])=>({x,y})));
 };
 if(parsed.paths.length>1000)throw new Error('SVG has too many paths.');
 for(const path of parsed.paths){if(v.cutType==='on-line'){for(const sub of path.subPaths)add(sub.getPoints(24),0);}else for(const shape of path.toShapes()){for(const hole of shape.holes)add(hole.getPoints(24),v.cutType==='outside'?-s.toolDiameter/2:s.toolDiameter/2);add(shape.getPoints(24),v.cutType==='outside'?s.toolDiameter/2:-s.toolDiameter/2);}}
 if(!contours.length||contours.reduce((n,c)=>n+c.length,0)>20000||contours.reduce((n,c)=>n+c.length,0)*s.passes>100000)throw new Error('SVG has no usable paths or exceeds 20,000 sampled points.');
 if(contours.some(c=>c.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>(v.widthMm??10000)||p.y>(v.heightMm??10000))))throw new Error('Vector coordinates must remain within positive 10,000 mm bounds. Adjust offsets.');
 const lines=['; UNQUALIFIED SVG PROGRAM - CONTROLLER AND HOLD-DOWN REVIEW REQUIRED','G21','G90','G17',`G0 Z${s.safeZ.toFixed(3)}`,`M3 S${s.spindle}`,'G4 P1'];
 for(const contour of contours)for(let pass=1;pass<=s.passes;pass++){const start=contour[0];lines.push(`G0 Z${s.safeZ.toFixed(3)}`,`G0 X${start.x.toFixed(3)} Y${start.y.toFixed(3)}`,`G1 Z${(-v.depth*pass/s.passes).toFixed(3)} F${s.plunge}`);for(const point of contour.slice(1))lines.push(`G1 X${point.x.toFixed(3)} Y${point.y.toFixed(3)} F${s.feed*s.feedPercent/100}`);lines.push(`G0 Z${s.safeZ.toFixed(3)}`);}
 lines.push('M5','M30');return lines.join('\n')+'\n';
}
