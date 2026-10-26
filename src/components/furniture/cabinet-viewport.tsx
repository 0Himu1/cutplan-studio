'use client';
import {materialForPanel,previewPanelColor,previewBoardColor} from '@/lib/furniture/materials';
import {findPanelClashes} from '@/lib/furniture/collisions';
import {panelGeometry} from './panel-geometry';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import {useTheme} from 'next-themes';
import type {GizmoAxes} from './view-gizmo';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { advancePresentation, panelPresentation, panelVisible } from '@/lib/furniture/presentation';
import type { MaterialCatalog } from '@/lib/furniture/materials';
import { calculateFurniture as calculateCabinet, type FurnitureInput as CabinetInput } from '@/lib/furniture/families';
import type {Panel} from '@/lib/furniture/cabinet';
import {useMeasurementUnit} from '@/components/measurement/unit-provider';
import {formatMeasurement,panelDimensionText,type MeasurementUnit} from '@/lib/measurement';

const viewportPalettes={
 light:{grid:'#dfe5ed',axis:'#b5c1d0',edge:'#555d6b',xrayEdge:'#38628c',xrayFill:'#8bbadc'},
 dark:{grid:'#181827',axis:'#29293e',edge:'#444455',xrayEdge:'#e6edff',xrayFill:'#bae6fd'}
};

function paintDimension(canvas:HTMLCanvasElement,panel:Panel,unit:MeasurementUnit){
 const context=canvas.getContext('2d');if(!context)return;
 context.clearRect(0,0,768,256);context.textAlign='center';context.fillStyle='#ffffff';context.strokeStyle='#151827b3';context.lineWidth=4;context.lineJoin='round';
 const text=(value:string,y:number)=>{context.strokeText(value,384,y,720);context.fillText(value,384,y,720);};
 context.font='42px sans-serif';text(panel.label,unit==='in'?50:82);context.font='bold 56px sans-serif';
 if(unit==='in'){text(`W ${formatMeasurement(panel.widthMm,unit)}`,128);text(`H ${formatMeasurement(panel.heightMm,unit)}`,206);}else text(`${Number(panel.widthMm.toFixed(2))} × ${Number(panel.heightMm.toFixed(2))} mm`,170);
}

export function CabinetViewport({axes,input,selected,onSelect,catalog,embedded=false,cameraCommand,onUnavailable,memory,exploded,doorsOpen=false,showDimensions=false,xray=false,hideDoors=false,hideBack=false}:{hideDoors?:boolean;hideBack?:boolean;axes?:RefObject<GizmoAxes>;doorsOpen?:boolean;showDimensions?:boolean;xray?:boolean;memory?:RefObject<{position:number[];target:number[]}|null>;exploded?:boolean;embedded?:boolean;cameraCommand?:{view:string;serial:number;zoom:number};onUnavailable?:()=>void;input:CabinetInput;selected:string;onSelect:(id:string)=>void;catalog:MaterialCatalog}) {
  const {resolvedTheme}=useTheme();
  const viewportTheme=resolvedTheme==='dark'?'dark':'light';
  const palette=useRef(viewportPalettes[viewportTheme]);
  const updateTheme=useRef<()=>void>(()=>{});
  useEffect(()=>{palette.current=viewportPalettes[viewportTheme];updateTheme.current();},[viewportTheme]);
  const {unit}=useMeasurementUnit(),labelUnit=useRef(unit),labelTextures=useRef<{panel:Panel;canvas:HTMLCanvasElement;texture:THREE.CanvasTexture}[]>([]);
  useEffect(()=>{labelUnit.current=unit;for(const item of labelTextures.current){paintDimension(item.canvas,item.panel,unit);item.texture.needsUpdate=true;}},[unit]);
  const presentation=useRef({exploded:Boolean(exploded),doorsOpen,showDimensions,xray,hideDoors,hideBack});
  const progress=useRef({explode:0,doors:0});
  useEffect(()=>{presentation.current={exploded:Boolean(exploded),doorsOpen,showDimensions,xray,hideDoors,hideBack};},[exploded,doorsOpen,showDimensions,xray,hideDoors,hideBack]);
  const host=useRef<HTMLDivElement>(null);
  const command=useRef<(view:string,zoom:number)=>void>(()=>{});
  const localMemory=useRef<{position:number[];target:number[]}|null>(null);
  const cameraMemory=memory??localMemory;
  const initialCommand=useRef(cameraCommand);
  useEffect(()=>{if(cameraCommand)command.current(cameraCommand.view,cameraCommand.zoom);},[cameraCommand]);
  const reset=useRef<()=>void>(()=>{});
  const [failed,setFailed]=useState(false);
  const [textureFailed,setTextureFailed]=useState(false);
  const meshRef=useRef<THREE.Mesh[]>([]);
  const selectionRef=useRef(selected);
  useEffect(()=>{selectionRef.current=selected;for(const mesh of meshRef.current){const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of materials)if(material instanceof THREE.MeshStandardMaterial)material.emissive.setHex(mesh.userData.panelId===selected?0x333366:0x000000);}},[selected]);
  const [explode,setExplode]=useState(false);
  const calculated=useMemo(()=>calculateCabinet(input),[input]),panels=calculated.panels;
  const clashReport=useMemo(()=>xray?findPanelClashes(panels.filter(panel=>panelVisible(panel,hideDoors,hideBack))):{clashes:[],unsupportedPanels:[]},[panels,xray,hideDoors,hideBack]);
  const reportRef=useRef(clashReport),updateClashes=useRef<()=>void>(()=>{});
  useEffect(()=>{reportRef.current=clashReport;updateClashes.current();},[clashReport]);
  const clashPairs=new Set(clashReport.clashes.map(clash=>clash.panelIds.join('/'))).size;
  const collisionStatus=xray?<aside role="status" aria-label="Panel collision check" className="absolute bottom-18 left-4 z-10 max-w-80 rounded-md border border-[var(--border)] bg-base px-3 py-2 text-xs" title="Checks solid panel material, including corner notches. Touches and overlaps up to 1 mm are ignored. This is a visual check, not manufacturing approval.">{exploded||doorsOpen||explode?'Close doors and collapse model to inspect overlaps.':clashReport.unsupportedPanels.length?`${clashPairs} overlapping pairs · ${clashReport.unsupportedPanels.length} unsupported panels not checked`:clashPairs?`${clashPairs} overlapping panel pairs · highlighted red`:'Assembled view: no overlaps above 1 mm'}</aside>:null;
  useEffect(()=>{
    const element=host.current;if(!element||failed)return;
    let active=true;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{queueMicrotask(()=>setFailed(true));return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Interactive furniture. Drag to orbit, middle-drag to pan, wheel to zoom. Use the panel list for keyboard selection.');
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(45,Math.max(1,element.clientWidth)/Math.max(1,element.clientHeight),1,30000);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:null};
    const fit=()=>{const size=Math.max(input.widthMm,input.heightMm,input.depthMm);controls.target.set(input.widthMm/2,input.heightMm/2,input.depthMm/2);camera.position.copy(controls.target).add(new THREE.Vector3(size*1.5,size,size*1.8));controls.update();};reset.current=fit;
    command.current=(view,zoom)=>{if(zoom){camera.position.sub(controls.target).multiplyScalar(zoom>0?.8:1.25).add(controls.target);controls.update();return;}fit();const size=Math.max(input.heightMm,input.widthMm,input.depthMm,(input.widthMm+input.depthMm)*.75/camera.aspect)*2.15*(1+.5*progress.current.explode);const direction=view==='front'?new THREE.Vector3(0,0,1):view==='floor'?new THREE.Vector3(0,1,.0001):view==='right'?new THREE.Vector3(1,0,0):new THREE.Vector3(1.5,1,1.8);camera.position.copy(controls.target).add(direction.normalize().multiplyScalar(size));controls.update();};
    if(cameraMemory.current){camera.position.fromArray(cameraMemory.current.position);controls.target.fromArray(cameraMemory.current.target);controls.update();}else{command.current(initialCommand.current?.view??'iso',0);}
    const gizmoInverse=new THREE.Quaternion(),gizmoVector=new THREE.Vector3();
    const grid=new THREE.GridHelper(Math.max(input.widthMm,input.depthMm)*6,40,0x29293e,0x181827);scene.add(grid);

    scene.add(new THREE.HemisphereLight(0xffffff,0x555566,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1000,2000,1500);scene.add(light);
    const meshes:THREE.Mesh[]=[];
    labelTextures.current=[];
    for(const panel of panels){
      const mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial|THREE.MeshStandardMaterial[]>=new THREE.Mesh(panelGeometry(panel),new THREE.MeshStandardMaterial({color:0xaaa7a0,roughness:.8}));
      mesh.position.fromArray(panel.pose.positionMm);mesh.rotation.fromArray([...panel.pose.rotationRad,'XYZ']);

      mesh.userData.panelId=panel.panelId;mesh.userData.panel=panel;scene.add(mesh);meshes.push(mesh);
      const assignment=materialForPanel(input,panel);
      const front=new THREE.MeshStandardMaterial({color:previewPanelColor(input,panel,catalog,'front'),roughness:.8});
      const back=new THREE.MeshStandardMaterial({color:previewPanelColor(input,panel,catalog,'back'),roughness:.8});
      (mesh.material as THREE.Material).dispose();
      mesh.material=[...( ['right','left','top','bottom'] as const).map(edge=>new THREE.MeshStandardMaterial({color:assignment?.edges?.[edge]?'#65513d':previewBoardColor(input,panel,catalog),roughness:.8})),front,back];
      for(const material of mesh.material)material.emissive.setHex(panel.panelId===selectionRef.current?0x333366:0);
      const loader=new THREE.TextureLoader();
      for(const [finishId,material] of [[assignment?.frontFinishId,front],[assignment?.backFinishId,back]] as const){const url=catalog.items.find(item=>item.id===finishId)?.finish_skus?.texture_url;if(typeof url==='string'&&url.startsWith('https://'))loader.load(url,texture=>{if(!active){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;texture.center.set(.5,.5);texture.rotation=assignment?.grainAxis==='height'?Math.PI/2:0;material.map=texture;material.needsUpdate=true;},undefined,()=>{if(active)setTextureFailed(true);});}
      const textCanvas=document.createElement('canvas');textCanvas.width=768;textCanvas.height=256;paintDimension(textCanvas,panel,labelUnit.current);
      {const texture=new THREE.CanvasTexture(textCanvas);labelTextures.current.push({canvas:textCanvas,panel,texture});texture.colorSpace=THREE.SRGBColorSpace;const labelWidth=Math.min(panel.widthMm*.92,panel.heightMm*2.5,600);const label=new THREE.Mesh(new THREE.PlaneGeometry(labelWidth,labelWidth/3),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.FrontSide,depthWrite:false}));label.position.z=panel.thicknessMm/2+1;label.userData.dimensionLabel=true;label.visible=presentation.current.showDimensions;mesh.add(label);const reverse=new THREE.Mesh(label.geometry.clone(),(label.material as THREE.MeshBasicMaterial).clone());reverse.rotation.y=Math.PI;reverse.position.z=-panel.thicknessMm/2-1;reverse.userData.dimensionLabel=true;reverse.visible=label.visible;mesh.add(reverse);}
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x444455}));mesh.add(edges);
    }
    const clashLayer=new THREE.Group();scene.add(clashLayer);
    const rebuildClashes=()=>{
      for(const child of [...clashLayer.children]){clashLayer.remove(child);child.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials)material.dispose();}});}
      for(const clash of reportRef.current.clashes){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(...clash.size),new THREE.MeshStandardMaterial({color:'#ff0000',emissive:'#ff0000',emissiveIntensity:.5,transparent:true,opacity:.6,depthWrite:false,depthTest:false}));mesh.position.fromArray(clash.position);mesh.renderOrder=10;
        const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:'#ff0000',depthTest:false,transparent:true,opacity:.9}));edges.renderOrder=11;mesh.add(edges);clashLayer.add(mesh);
      }
      element.dataset.clashRegions=String(reportRef.current.clashes.length);element.dataset.uncheckedPanels=String(reportRef.current.unsupportedPanels.length);
    };
    updateClashes.current=rebuildClashes;rebuildClashes();
    meshRef.current=meshes;
    const rods=(calculated.hardware??[]).map(item=>{const rod=new THREE.Mesh(new THREE.CylinderGeometry(item.diameterMm/2,item.diameterMm/2,item.lengthMm,16),new THREE.MeshStandardMaterial({color:0xb8c2cc,metalness:.85,roughness:.25}));rod.rotation.z=Math.PI/2;rod.position.fromArray(item.positionMm);scene.add(rod);return {rod,item};});
    element.dataset.hardwareCount=String(rods.length);
    const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();let down=[0,0];
    const start=(event:PointerEvent)=>{down=[event.clientX,event.clientY];};
    const pickAt=(event:{clientX:number;clientY:number})=>{const box=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes.filter(mesh=>mesh.visible),false)[0];onSelect(hit?.object.userData.panelId??'');};
    const pick=(event:PointerEvent)=>{if(Math.hypot(event.clientX-down[0],event.clientY-down[1])<=5)pickAt(event);};
    const contextPick=(event:MouseEvent)=>{event.preventDefault();if(Math.hypot(event.clientX-down[0],event.clientY-down[1])>5){event.stopPropagation();return;}pickAt(event);};
    renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',pick);renderer.domElement.addEventListener('contextmenu',contextPick);
    const lost=(event:Event)=>{event.preventDefault();setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
    const observer=new ResizeObserver(()=>{const width=element.clientWidth,height=element.clientHeight;renderer.setSize(width,height);const aspect=width/Math.max(1,height),distanceScale=Math.max(1,1/aspect)/Math.max(1,1/camera.aspect);camera.position.sub(controls.target).multiplyScalar(distanceScale).add(controls.target);camera.aspect=aspect;camera.updateProjectionMatrix();controls.update();});observer.observe(element);
    const applyTheme=()=>{
      const colors=grid.geometry.getAttribute('color'),normal=new THREE.Color(palette.current.grid),axis=new THREE.Color(palette.current.axis);
      for(let i=0;i<colors.count;i++){const color=Math.floor(i/4)===20?axis:normal;colors.setXYZ(i,color.r,color.g,color.b);}colors.needsUpdate=true;
      lastXray=null;element.dataset.viewportTheme=palette.current===viewportPalettes.dark?'dark':'light';
    };
    updateTheme.current=applyTheme;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let last=performance.now(),lastXray:boolean|null=null;applyTheme();
    renderer.setAnimationLoop(()=>{
      const now=performance.now(),seconds=(now-last)/1000;last=now;
      const state=presentation.current;const previousExplode=progress.current.explode;progress.current.explode=advancePresentation(progress.current.explode,(embedded?state.exploded:explode)?1:0,seconds,reduced.matches);progress.current.doors=advancePresentation(progress.current.doors,state.doorsOpen?1:0,seconds,reduced.matches);
      camera.position.sub(controls.target).multiplyScalar((1+.5*progress.current.explode)/(1+.5*previousExplode)).add(controls.target);
      for(const mesh of meshes){mesh.visible=panelVisible(mesh.userData.panel,state.hideDoors,state.hideBack);const pose=panelPresentation(mesh.userData.panel,[input.widthMm/2,input.heightMm/2,input.depthMm/2],progress.current.explode,progress.current.doors);mesh.position.fromArray(pose.position);mesh.rotation.fromArray([...pose.rotation,'XYZ']);
        const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
        if(lastXray!==state.xray)for(const material of materials){if(!(material instanceof THREE.MeshStandardMaterial))continue;material.userData.solidColor??=material.color.clone();material.color.copy(state.xray?new THREE.Color(palette.current.xrayFill):material.userData.solidColor);material.transparent=state.xray;material.opacity=state.xray?.2:1;material.depthWrite=!state.xray;material.side=state.xray?THREE.DoubleSide:THREE.FrontSide;material.needsUpdate=true;}
        for(const child of mesh.children)if(child instanceof THREE.LineSegments)(child.material as THREE.LineBasicMaterial).color.set(state.xray?palette.current.xrayEdge:palette.current.edge);
        for(const child of mesh.children)if(child instanceof THREE.Mesh&&child.userData.dimensionLabel){child.visible=state.showDimensions;(child.material as THREE.MeshBasicMaterial).depthTest=!state.xray;}
      }
      clashLayer.visible=state.xray&&!(embedded?state.exploded:explode)&&!state.doorsOpen&&progress.current.explode===0&&progress.current.doors===0;
      element.dataset.collisionOverlayVisible=String(clashLayer.visible);element.dataset.visibleClashRegions=String(clashLayer.visible?clashLayer.children.length:0);
      lastXray=state.xray;element.dataset.explodeProgress=progress.current.explode.toFixed(3);element.dataset.doorProgress=progress.current.doors.toFixed(3);element.dataset.xray=String(state.xray);element.dataset.hideDoors=String(state.hideDoors);element.dataset.hideBack=String(state.hideBack);element.dataset.visibleDoors=String(meshes.filter(mesh=>mesh.visible&&mesh.userData.panel.role==='door').length);element.dataset.visibleBacks=String(meshes.filter(mesh=>mesh.visible&&mesh.userData.panel.role==='back').length);
      for(const {rod,item} of rods){rod.position.fromArray(item.positionMm.map((v,i)=>v+(v-[input.widthMm/2,input.heightMm/2,input.depthMm/2][i])*.5*progress.current.explode));rod.material.transparent=state.xray;rod.material.opacity=state.xray?.45:1;}
      controls.update();if(axes){gizmoInverse.copy(camera.quaternion).invert();for(const [key,x,y,z] of [['x',1,0,0],['y',0,1,0],['z',0,0,1]] as const){gizmoVector.set(x,y,z).applyQuaternion(gizmoInverse);axes.current[key]=[gizmoVector.x,gizmoVector.y,gizmoVector.z];}}renderer.render(scene,camera);
    });
    return ()=>{cameraMemory.current={position:camera.position.toArray(),target:controls.target.toArray()};active=false;updateClashes.current=()=>{};updateTheme.current=()=>{};observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();renderer.domElement.removeEventListener('pointerdown',start);renderer.domElement.removeEventListener('pointerup',pick);renderer.domElement.removeEventListener('contextmenu',contextPick);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshBasicMaterial)material.map?.dispose();material.dispose();});}});renderer.dispose();renderer.domElement.remove();};
  // Panel identity and geometry are supplied by the shared calculator.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[input,explode,catalog,onSelect,failed,cameraMemory,embedded,axes]);
  useEffect(()=>{if(failed)onUnavailable?.();},[failed,onUnavailable]);
  if(embedded)return <>{collisionStatus}{showDimensions&&<ul className="sr-only" aria-label="3D panel dimensions">{panels.filter(panel=>panelVisible(panel,hideDoors,hideBack)).map(panel=><li key={panel.panelId}>{panel.label}: {panelDimensionText(panel,unit)}</li>)}</ul>}<div ref={host} data-dimension-unit={unit} className="cad-webgl"/>{textureFailed&&<p className="cad-texture-note" role="status">Texture unavailable; named color shown.</p>}</>;
  return <section className="mt-6 border-t border-line pt-5" aria-label="Cabinet 3D viewer"><h3 className="text-sm font-medium">3D inspection</h3>{collisionStatus}<p className="mt-2 text-xs text-muted">Drag to orbit, right-drag to pan, scroll to zoom. Select a physical panel below or in the model.</p><div className="my-3 flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded border border-line px-3 text-xs" onClick={()=>reset.current()}>Reset camera</button><button type="button" aria-pressed={explode} className="min-h-11 rounded border border-line px-3 text-xs" onClick={()=>setExplode(value=>!value)}>Exploded view</button></div>{failed?<p role="status" className="py-5 text-sm text-muted">3D is unavailable on this device. Use the measured front/floor drawings and cut list.</p>:<div ref={host} className="h-[420px] w-full overflow-hidden rounded-[12px] border border-line bg-surface"/>}{textureFailed&&<p role="status" className="mt-3 text-xs text-muted">A finish texture could not load. Its named color remains visible.</p>}<label className="mt-4 block text-xs">Selected panel<select aria-label="Selected panel" className="mt-2 min-h-11 w-full rounded border border-line bg-base px-3 text-sm" value={panels.some(p=>p.panelId===selected)?selected:''} onChange={event=>onSelect(event.target.value)}><option value="">No panel selected</option>{panels.map(panel=><option key={panel.panelId} value={panel.panelId}>{panel.label}</option>)}</select></label>{panels.filter(panel=>panel.panelId===selected).map(panel=><p key={panel.panelId} className="mt-3 text-xs text-muted">{panel.label}: {panel.widthMm} × {panel.heightMm} × {panel.thicknessMm} mm</p>)}</section>;
}





