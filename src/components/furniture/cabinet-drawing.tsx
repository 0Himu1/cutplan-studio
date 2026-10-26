'use client';
import {panelContour} from '@/lib/furniture/panel-contour';

import { calculateFurniture as calculateCabinet, type FurnitureInput as CabinetInput } from '@/lib/furniture/families';
import { panelBounds } from '@/lib/furniture/editor';

export function CabinetDrawing({input,view,selected,onSelect,zoom=1}:{input:CabinetInput;view:'front'|'floor'|'right';selected:string;onSelect:(id:string)=>void;zoom?:number}){
  const panels=calculateCabinet(input).panels;
  const overallDepth=Math.max(input.depthMm,...panels.map(panel=>panelBounds(panel).max[2]));
  const horizontal=view==='right'?overallDepth:input.widthMm;
  const vertical=view==='floor'?overallDepth:input.heightMm;
  const xAxis=view==='right'?2:0, yAxis=view==='floor'?2:1;
  const scale=440/Math.max(horizontal,vertical),width=horizontal*scale,height=vertical*scale;
  const name=view==='floor'?'Floor plan':view==='right'?'Right elevation':'Front elevation';
  return <svg className="cad-drawing" role="img" aria-label={`${name}: ${horizontal} mm by ${vertical} mm`} viewBox={`-80 -65 ${width+160} ${height+130}`}>
    <g transform={`translate(${width/2} ${height/2}) scale(${zoom}) translate(${-width/2} ${-height/2})`} stroke="currentColor" fill="none" strokeWidth="1">
      {panels.map(panel=>{const box=panelBounds(panel),notched=Boolean(panel.notches?.length)&&view==='floor',Shape=notched?'polygon':'rect';return <Shape data-notched={notched||undefined} points={notched?panelContour(panel.widthMm,panel.heightMm,panel.notches).map(([x,y])=>`${(panel.pose.positionMm[0]+x-panel.widthMm/2)*scale},${(vertical-panel.pose.positionMm[2]+y-panel.heightMm/2)*scale}`).join(' '):undefined} key={panel.panelId} tabIndex={0} role="button" aria-label={`Select ${panel.label}`} onClick={()=>onSelect(panel.panelId)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(panel.panelId);}}} x={box.min[xAxis]*scale} y={(vertical-box.max[yAxis])*scale} width={Math.max(2,(box.max[xAxis]-box.min[xAxis])*scale)} height={Math.max(2,(box.max[yAxis]-box.min[yAxis])*scale)} stroke={selected===panel.panelId?'var(--accent-text)':'var(--diagram-stroke)'} strokeWidth={selected===panel.panelId?2:1} fill={selected===panel.panelId?'var(--accent)':'var(--bg-elevated)'} fillOpacity={.2}><title>{panel.label}: {panel.widthMm} × {panel.heightMm} × {panel.thicknessMm} mm</title></Shape>;})}
      <path d={`M0 -12 V-28 H${width} V-12 M-12 0 H-28 V${height} H-12`}/>
      <g fill="currentColor" stroke="none" fontSize="14"><text x={width/2} y={-36} textAnchor="middle">{horizontal} mm</text><text transform={`translate(-40 ${height/2}) rotate(-90)`} textAnchor="middle">{vertical} mm</text><text x={width/2} y={height+35} textAnchor="middle">{name}</text></g>
    </g>
  </svg>;
}
