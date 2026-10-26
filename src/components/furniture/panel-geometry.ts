import * as THREE from 'three';
import type {Panel} from '../../lib/furniture/cabinet.ts';
import {panelContour} from '../../lib/furniture/panel-contour.ts';
/** Actual finished profile, centered like the box geometry used for ordinary parts. */
export function panelGeometry(panel:Panel):THREE.BufferGeometry{
 if(!panel.notches?.length)return new THREE.BoxGeometry(panel.widthMm,panel.heightMm,panel.thicknessMm);
 const shape=new THREE.Shape(),points=panelContour(panel.widthMm,panel.heightMm,panel.notches);
 points.forEach(([x,y],i)=>{if(i===0)shape.moveTo(x-panel.widthMm/2,y-panel.heightMm/2);else shape.lineTo(x-panel.widthMm/2,y-panel.heightMm/2);});shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:panel.thicknessMm,bevelEnabled:false,steps:1,curveSegments:1});geometry.translate(0,0,-panel.thicknessMm/2);
 // Keep the same six material slots and normalized face UVs as ordinary cabinet parts.
 geometry.clearGroups();const normals=geometry.getAttribute('normal'),positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 for(let i=0;i<normals.count;i+=3){const nx=normals.getX(i),ny=normals.getY(i),nz=normals.getZ(i),material=Math.abs(nz)>.5?(nz>0?4:5):Math.abs(nx)>.5?(nx>0?0:1):(ny>0?2:3);geometry.addGroup(i,3,material);
  if(Math.abs(nz)>.5)for(let k=i;k<i+3;k++)uv.setXY(k,positions.getX(k)/panel.widthMm+.5,positions.getY(k)/panel.heightMm+.5);
 }
 return geometry;
}
