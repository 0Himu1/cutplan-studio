import type { CabinetInput } from './cabinet.ts';

// Synthetic review cases, never catalog stock or customer project defaults.
const base: CabinetInput = {
  widthMm: 800, heightMm: 1200, depthMm: 400,
  bodyThicknessMm: 18, backThicknessMm: 6, doorThicknessMm: 18,
  shelfCount: 2, doorCount: 2, skirtingHeightMm: 0,
  shelfSideClearanceMm: 2, doorGapMm: 2, plinthSetbackMm: 40,
  backPosition: 'inset', stockWidthMm: 1219, stockHeightMm: 2438,
  stockMarginMm: 10, grainAxis: 'none'
};
export const CABINET_FIXTURES: readonly { id: string; label: string; input: CabinetInput }[] = [
  { id: 'inset', label: 'Inset back, two doors', input: { ...base } },
  { id: 'outside-plinth', label: 'Outside back, raised bottom', input: { ...base, backPosition: 'outside', skirtingHeightMm: 80 } },
  { id: 'open', label: 'Open cabinet, one shelf', input: { ...base, doorCount: 0, shelfCount: 1 } },
  { id: 'stock-error', label: 'Oversized cabinet (validation example)', input: { ...base, heightMm: 2600 } }
];
