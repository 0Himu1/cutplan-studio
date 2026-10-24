import { parseOverrides, type PanelOverrides } from './materials.ts';
import {buildCompartments,validCompartments,type CabinetCompartment,type CabinetHardware} from './compartments.ts';
/** Pure cabinet mathematics. No browser, renderer, database or provider dependencies.
 * Adapted from the legacy body/door/shelf calculators; see docs/delivery/phase-06-report.md.
 */
export const ENGINE_VERSION = 'cabinet-review-1.0.0';
export const TEMPLATE_KEY = 'cabinet-between-sides-inset-doors-v1';

export type CabinetInput = {
  widthMm: number; heightMm: number; depthMm: number;
  bodyThicknessMm: number; backThicknessMm: number; doorThicknessMm: number;
  shelfCount: number; doorCount: number; skirtingHeightMm: number;
  shelfSideClearanceMm: number; doorGapMm: number; plinthSetbackMm: number;
  backPosition: 'inset' | 'outside';
  stockWidthMm: number; stockHeightMm: number; stockMarginMm: number;
  grainAxis: 'none' | 'width' | 'height';
  panelOverrides?: PanelOverrides;
  doorPosition?: 'inset'|'overlay';
  compartmentMode?: 'auto'|'manual';
  compartments?: CabinetCompartment[];
};
export type Panel = {
  panelId: string; componentId: string; label: string;
  role: 'side' | 'top' | 'bottom' | 'back' | 'shelf' | 'door' | 'plinth' | 'divider' | 'drawer';
  materialSlot: 'body' | 'back' | 'front';
  widthMm: number; heightMm: number; thicknessMm: number;
  pose: { positionMm: [number, number, number]; rotationRad: [number, number, number] };
  grainAxis: CabinetInput['grainAxis']; allowedRotationsDeg: (0 | 90)[];
  hingeSide?:'left'|'right';
};
export type Calculation = {
  schemaVersion: 1; engineVersion: string; templateKey: string;
  manufacturingApproved: false; eligibleForQuote: false;
  panels: Panel[]; blockingErrors: { field: string; message: string }[]; warnings: string[];
  hardware?: CabinetHardware[];
};

const numericKeys = ['widthMm', 'heightMm', 'depthMm', 'bodyThicknessMm', 'backThicknessMm', 'doorThicknessMm', 'shelfCount', 'doorCount', 'skirtingHeightMm', 'shelfSideClearanceMm', 'doorGapMm', 'plinthSetbackMm', 'stockWidthMm', 'stockHeightMm', 'stockMarginMm'] as const;
const keys = new Set<string>([...numericKeys, 'backPosition', 'grainAxis', 'panelOverrides','doorPosition','compartmentMode','compartments']);

export function calculateCabinet(value: unknown): Calculation {
  const result: Calculation = {
    schemaVersion: 1, engineVersion: ENGINE_VERSION, templateKey: TEMPLATE_KEY,
    manufacturingApproved: false, eligibleForQuote: false, panels: [], blockingErrors: [],
    warnings: ['Proposed construction only. Drawings, joints, hardware and load limits need manufacturing approval. No quotation or CNC release is permitted.']
  };
  const error = (field: string, message: string) => result.blockingErrors.push({ field, message });
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    error('configuration', 'Provide a cabinet configuration.'); return result;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!keys.has(key)) error(key, 'This option is not supported by this construction template.');
  for (const key of numericKeys) {
    if (typeof record[key] !== 'number' || !Number.isFinite(record[key]) || Math.abs(record[key] as number) > 100_000) error(key, 'Enter a finite number within the supported calculation range.');
  }
  if (!['inset', 'outside'].includes(record.backPosition as string)) error('backPosition', 'Choose an inset or outside back.');
  if (!['none', 'width', 'height'].includes(record.grainAxis as string)) error('grainAxis', 'Choose a supported grain direction.');
  if(record.panelOverrides !== undefined && !parseOverrides(record.panelOverrides)) error('panelOverrides','Panel materials are invalid.');
  if(record.doorPosition!==undefined&&!['inset','overlay'].includes(String(record.doorPosition)))error('doorPosition','Choose inset or overlay doors.');
  if(record.compartmentMode!==undefined&&!['auto','manual'].includes(String(record.compartmentMode)))error('compartments','Choose automatic or manual compartments.');
  if(record.compartments!==undefined&&!validCompartments(record.compartments))error('compartments','Invalid compartment tree. Use up to 6 compartments, 8 sections per compartment and 3 nested divider levels (64 nodes total).');
  if(record.compartments!==undefined&&record.compartmentMode===undefined)error('compartments','Select a compartment layout mode.');
  if(record.compartmentMode==='manual'&&record.compartments===undefined)error('compartments','Manual layout needs compartments.');
  if (result.blockingErrors.length) return result;
  const c = record as unknown as CabinetInput;
  const advanced=c.compartmentMode!==undefined,overlay=c.doorPosition==='overlay';
  for (const key of ['widthMm', 'heightMm', 'depthMm', 'bodyThicknessMm', 'backThicknessMm', 'doorThicknessMm', 'stockWidthMm', 'stockHeightMm'] as const) {
    if (c[key] <= 0) error(key, 'This measurement must be greater than zero.');
  }
  for (const key of ['skirtingHeightMm', 'shelfSideClearanceMm', 'doorGapMm', 'plinthSetbackMm', 'stockMarginMm'] as const) {
    if (c[key] < 0) error(key, 'This measurement cannot be negative.');
  }
  if (!Number.isInteger(c.shelfCount) || c.shelfCount < 0 || c.shelfCount > 20) error('shelfCount', 'Use a whole shelf count from 0 to 20.');
  if (!Number.isInteger(c.doorCount) || c.doorCount < 0 || c.doorCount > 2) error('doorCount', 'This template supports 0, 1 or 2 inset doors.');
  if (c.doorCount && c.doorGapMm <= 0) error('doorGapMm', 'Inset doors require a positive perimeter and meeting gap.');
  if (result.blockingErrors.length) return result;
  const { widthMm: w, heightMm: h, depthMm: d, bodyThicknessMm: t, backThicknessMm: b, doorThicknessMm: dt, skirtingHeightMm: s } = c;
  const overrides=c.panelOverrides??{};
  const thickness=(id:string,fallback:number)=>overrides['cabinet/'+id]?.thicknessMm??fallback;
  const leftT=thickness('side-left',t),rightT=thickness('side-right',t),topT=thickness('top',t),bottomT=thickness('bottom',t),backT=thickness('back',b);
  const centerX=leftT+(w-leftT-rightT)/2;
  const innerW = w-leftT-rightT, innerH = h-s-topT-bottomT;
  const zStart = c.backPosition === 'outside' ? backT : 0;
  const carcassD = d - zStart;
  const doorDepth=Math.max(...Array.from({length:c.doorCount},(_,i)=>thickness('door-'+(i+1),dt)),0);
  const frontReserve = c.doorCount&&!overlay ? doorDepth + c.doorGapMm : 0;
  const shelfD = d - backT - frontReserve;
  const shelfW = innerW - 2 * c.shelfSideClearanceMm;
  const shelfThicknesses=Array.from({length:c.shelfCount},(_,i)=>thickness('shelf-'+(i+1),t));
  const opening = (innerH - shelfThicknesses.reduce((sum,value)=>sum+value,0)) / (c.shelfCount + 1);
  if (innerW < 50 || innerH < 50 || carcassD < 50 || backT >= carcassD) error('dimensions', 'The carcass needs usable internal width, height and depth.');
  if (!advanced&&c.shelfCount && (opening < 50 || shelfW < 50 || shelfD < 50)) error('shelfCount', 'Shelves must leave at least 50 mm clear openings and cut faces.');
  if (!advanced&&!overlay&&c.doorCount && (doorDepth + c.doorGapMm >= d - backT)) error('doorThicknessMm', 'Door thickness and gap leave no internal depth.');
  if (s > 0 && (s < 50 || d - c.plinthSetbackMm - thickness('plinth-front',t) < backT)) error('skirtingHeightMm', 'A plinth needs a 50 mm face and must fit between the back and front.');
  const usableW = c.stockWidthMm - 2 * c.stockMarginMm;
  const usableH = c.stockHeightMm - 2 * c.stockMarginMm;
  if (usableW <= 0 || usableH <= 0) error('stockMarginMm', 'Margins must leave positive usable stock dimensions.');
  if (result.blockingErrors.length) return result;
  const panels: Panel[] = [];
  const add = (id: string, label: string, role: Panel['role'], slot: Panel['materialSlot'], pw: number, ph: number, pt: number, position: Panel['pose']['positionMm'], rotation: Panel['pose']['rotationRad'],hingeSide?:'left'|'right') => {
    if(id.startsWith('layout/')&&overrides['cabinet/'+id]?.thicknessMm!==undefined&&overrides['cabinet/'+id].thicknessMm!==pt)error('panelOverrides','Layout parts must use a board matching the configured body, back or door thickness. Change the configuration thickness first.');
    panels.push({ panelId: `cabinet/${id}`, componentId: id, label, role, materialSlot: slot, widthMm: pw, heightMm: ph, thicknessMm: pt, pose: { positionMm: position, rotationRad: rotation }, grainAxis: overrides['cabinet/'+id]?.grainAxis??c.grainAxis, allowedRotationsDeg: (overrides['cabinet/'+id]?.grainAxis??c.grainAxis) === 'none' ? [0, 90] : [0],...(hingeSide?{hingeSide}:{}) });
  };
  // Full-height sides. Top and bottom fit between them. Depth includes the back and inset doors.
  add('side-left', 'Left side', 'side', 'body', carcassD, h, leftT, [leftT / 2, h / 2, zStart + carcassD / 2], [0, -Math.PI / 2, 0]);
  add('side-right', 'Right side', 'side', 'body', carcassD, h, rightT, [w - rightT / 2, h / 2, zStart + carcassD / 2], [0, -Math.PI / 2, 0]);
  add('top', 'Top', 'top', 'body', innerW, carcassD, topT, [centerX, h - topT / 2, zStart + carcassD / 2], [-Math.PI / 2, 0, 0]);
  add('bottom', 'Bottom', 'bottom', 'body', innerW, carcassD, bottomT, [centerX, s + bottomT / 2, zStart + carcassD / 2], [-Math.PI / 2, 0, 0]);
  add('back', 'Back', 'back', 'back', c.backPosition === 'outside' ? w : innerW, c.backPosition === 'outside' ? h : innerH, backT, [c.backPosition === 'outside'?w/2:centerX, c.backPosition === 'outside' ? h / 2 : s + bottomT + innerH / 2, backT / 2], [0, 0, 0]);
  for (let i = 0; !advanced&&i < c.shelfCount; i++) {
    add(`shelf-${i + 1}`, `Shelf ${i + 1}`, 'shelf', 'body', shelfW, shelfD, shelfThicknesses[i], [centerX, s + bottomT + opening * (i + 1) + shelfThicknesses.slice(0,i).reduce((sum,value)=>sum+value,0) + shelfThicknesses[i] / 2, backT + shelfD / 2], [-Math.PI / 2, 0, 0]);
  }
  const doorW = ((overlay?w:innerW) - (c.doorCount + 1) * c.doorGapMm) / (c.doorCount || 1);
  for (let i = 0; !advanced&&i < c.doorCount; i++) {
    add(`door-${i + 1}`, `Door ${i + 1}`, 'door', 'front', doorW, (overlay?h-s:innerH) - 2 * c.doorGapMm, thickness('door-'+(i+1),dt), [(overlay?0:leftT) + c.doorGapMm + doorW / 2 + i * (doorW + c.doorGapMm), overlay?s+(h-s)/2:s + bottomT + innerH / 2, overlay?d+c.doorGapMm+thickness('door-'+(i+1),dt)/2:d - thickness('door-'+(i+1),dt) / 2], [0, 0, 0]);
  }
  const hardware=advanced?buildCompartments(c,add,error):[];
  if(panels.length>256)error('compartments','This review supports at most 256 sheet parts. Reduce sections or drawers.');
  if (s > 0) add('plinth-front', 'Recessed plinth', 'plinth', 'body', innerW, s, thickness('plinth-front',t), [centerX, s / 2, d - c.plinthSetbackMm - thickness('plinth-front',t) / 2], [0, 0, 0]);
  for (const panel of panels) {
    if (!Number.isFinite(panel.widthMm)||!Number.isFinite(panel.heightMm)||!Number.isFinite(panel.thicknessMm)||panel.thicknessMm<=0||panel.widthMm < 50 || panel.heightMm < 50) error(panel.panelId, `${panel.label} has an invalid cut face or a face below 50 mm.`);
    const assignment=overrides[panel.panelId];
    const panelStockW=assignment?.stockWidthMm?assignment.stockWidthMm-2*c.stockMarginMm:usableW;
    const panelStockH=assignment?.stockHeightMm?assignment.stockHeightMm-2*c.stockMarginMm:usableH;
    const fits = panel.widthMm <= panelStockW && panel.heightMm <= panelStockH;
    const rotatedFits = panel.allowedRotationsDeg.includes(90) && panel.heightMm <= panelStockW && panel.widthMm <= panelStockH;
    if (!fits && !rotatedFits) error(panel.panelId, `${panel.label} does not fit usable stock with the selected grain restriction.`);
  }
  for(const id of Object.keys(overrides)) if(!panels.some(panel=>panel.panelId===id)) error('panelOverrides','Remove materials from deleted panels before applying this construction change.');
  if (!result.blockingErrors.length) {result.panels = panels;if(hardware.length)result.hardware=hardware;}
  return result;
}


