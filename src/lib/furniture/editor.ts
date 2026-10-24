import { parseOverrides } from './materials.ts';
import { calculateCabinet, type CabinetInput, type Panel } from './cabinet.ts';
import { furnitureInput, type FurnitureInput } from './families.ts';
import { CABINET_FIXTURES } from './cabinet-fixtures.ts';
import {cabinetExtras} from './compartments.ts';

export const DEFAULT_CABINET: CabinetInput = { ...CABINET_FIXTURES[0].input };
export type Unit = 'mm' | 'in';
export const toDisplay = (mm: number, unit: Unit) => unit === 'in' ? mm / 25.4 : mm;
export const toMm = (value: number, unit: Unit) => unit === 'in' ? value * 25.4 : value;

/** Reconstruct in canonical key order; never persist unknown fields or UI units. */
export function cabinetInput(value: unknown): CabinetInput | null {
  if (calculateCabinet(value).blockingErrors.length) return null;
  const record = value as CabinetInput;
  return {...Object.fromEntries(Object.keys(DEFAULT_CABINET).map(key => [key, record[key as keyof CabinetInput]])),...cabinetExtras(record),...(record.panelOverrides?{panelOverrides:parseOverrides(record.panelOverrides)!}:{})} as CabinetInput;
}
export const configurationKey = (input: FurnitureInput) => JSON.stringify(furnitureInput(input));
export type History = { past: FurnitureInput[]; present: FurnitureInput; future: FurnitureInput[] };
export const initialHistory = (input: FurnitureInput): History => ({ past: [], present: { ...input }, future: [] });
export function edit(history: History, input: FurnitureInput): History {
  const valid = furnitureInput(input);
  if (!valid || configurationKey(valid) === configurationKey(history.present)) return history;
  return { past: [...history.past, history.present].slice(-100), present: valid, future: [] };
}
export function undo(history: History): History {
  if (!history.past.length) return history;
  return { past: history.past.slice(0,-1), present: history.past.at(-1)!, future: [history.present, ...history.future].slice(0,100) };
}
export function redo(history: History): History {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present].slice(-100), present: history.future[0], future: history.future.slice(1) };
}

/** Project all eight transformed vertices; front/floor and future 3D share physical poses. */
export function panelBounds(panel: Panel): { min: [number,number,number]; max: [number,number,number] } {
  const [rx,ry,rz]=panel.pose.rotationRad;
  const points: number[][]=[];
  for(const x of [-panel.widthMm/2,panel.widthMm/2]) for(const y of [-panel.heightMm/2,panel.heightMm/2]) for(const z of [-panel.thicknessMm/2,panel.thicknessMm/2]) {
    const y1=y*Math.cos(rx)-z*Math.sin(rx), z1=y*Math.sin(rx)+z*Math.cos(rx);
    const x2=x*Math.cos(ry)+z1*Math.sin(ry), z2=-x*Math.sin(ry)+z1*Math.cos(ry);
    points.push([x2*Math.cos(rz)-y1*Math.sin(rz),x2*Math.sin(rz)+y1*Math.cos(rz),z2].map((v,i)=>v+panel.pose.positionMm[i]));
  }
  return { min: [0,1,2].map(i=>Math.min(...points.map(p=>p[i]))) as [number,number,number], max: [0,1,2].map(i=>Math.max(...points.map(p=>p[i]))) as [number,number,number] };
}

export type Recovery = { schemaVersion: 1; baseVersion: number; input: FurnitureInput };
export function parseRecovery(raw: string | null): Recovery | null {
  if (!raw) return null;
  try {
    if (raw.length > 100_000) return null;
    const value=JSON.parse(raw);
    if (!value || value.schemaVersion!==1 || !Number.isSafeInteger(value.baseVersion) || value.baseVersion<1) return null;
    const input=furnitureInput(value.input);
    return input ? { schemaVersion:1, baseVersion:value.baseVersion, input } : null;
  } catch { return null; }
}

