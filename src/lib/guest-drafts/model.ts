import { furnitureInput, familyOf, type FurnitureInput } from '../furniture/families.ts';
import { cabinetInput } from '../furniture/editor.ts';
import type { CabinetInput } from '../furniture/cabinet.ts';

export const FURNITURE_TYPES = ['cabinet', 'shoe_rack', 'bookshelf', 'table'] as const;
export type FurnitureType = typeof FURNITURE_TYPES[number];
export const TYPE_LABELS: Record<FurnitureType, string> = {
  cabinet: 'Cabinet', shoe_rack: 'Shoe rack', bookshelf: 'Bookshelf', table: 'Table'
};
export const MAX_DRAFTS = 100;
export const MAX_NAME_LENGTH = 120;

export interface GuestDraft {
  id: string;
  name: string;
  furnitureType: FurnitureType;
  createdAt: string;
  updatedAt: string;
  version: number;
  cabinet?: CabinetInput;
  design?: FurnitureInput;
}

export interface DraftEnvelope { schemaVersion: 4; projects: GuestDraft[] }
export type DraftState = {
  status: 'loading' | 'ready' | 'unavailable' | 'corrupt' | 'newer-version';
  projects: GuestDraft[];
};

export function isFurnitureType(value: unknown): value is FurnitureType {
  return typeof value === 'string' && FURNITURE_TYPES.includes(value as FurnitureType);
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Enter a project name.';
  if (name.trim().length > MAX_NAME_LENGTH) return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  if (/[\u0000-\u001f\u007f]/.test(name)) return 'Use a name without control characters.';
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDraft(value: unknown): value is GuestDraft {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.id)
    && typeof value.name === 'string' && validateName(value.name) === null && value.name === value.name.trim()
    && isFurnitureType(value.furnitureType)
    && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
    && typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt))
    && Date.parse(value.updatedAt) >= Date.parse(value.createdAt)
    && Number.isSafeInteger(value.version) && Number(value.version) >= 1
    && (value.cabinet === undefined || (value.furnitureType === 'cabinet' && cabinetInput(value.cabinet) !== null))
    && (value.design === undefined || (value.furnitureType !== 'cabinet' && furnitureInput(value.design)!==null && familyOf(value.design as FurnitureInput)===value.furnitureType));
}

export function parseDrafts(raw: string | null): DraftState {
  if (raw === null) return { status: 'ready', projects: [] };
  try {
    if (raw.length > 1_000_000) return { status: 'corrupt', projects: [] };
    const value: unknown = JSON.parse(raw);
    if (isRecord(value) && typeof value.schemaVersion === 'number' && value.schemaVersion > 4) {
      return { status: 'newer-version', projects: [] };
    }
    if (!isRecord(value) || ![1,2,3,4].includes(value.schemaVersion as number) || !Array.isArray(value.projects)
      || value.projects.length > MAX_DRAFTS || !value.projects.every(isDraft)
      || new Set(value.projects.map(project => project.id)).size !== value.projects.length) {
      return { status: 'corrupt', projects: [] };
    }
    // Only known fields cross the persistence boundary.
    const projects = value.projects.map(({ id, name, furnitureType, createdAt, updatedAt, version, cabinet, design }) =>
      ({ id, name, furnitureType, createdAt, updatedAt, version, ...(cabinet ? { cabinet: cabinetInput(cabinet)! } : {}), ...(design?{design:furnitureInput(design)!}:{}) }));
    return { status: 'ready', projects: projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
  } catch {
    return { status: 'corrupt', projects: [] };
  }
}
