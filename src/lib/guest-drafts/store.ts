'use client';

import { useSyncExternalStore } from 'react';
import { furnitureInput, familyOf, type FurnitureInput } from '../furniture/families';
import { cabinetInput } from '../furniture/editor';
import type { CabinetInput } from '../furniture/cabinet';
import { MAX_DRAFTS, TYPE_LABELS, isFurnitureType, parseDrafts, validateName, type DraftEnvelope, type DraftState, type FurnitureType, type GuestDraft } from './model';

export const DRAFT_STORAGE_KEY = 'cutplan.guest-drafts.v1';
const CHANGE_EVENT = 'cutplan:drafts-changed';
const LOADING: DraftState = { status: 'loading', projects: [] };
const UNAVAILABLE: DraftState = { status: 'unavailable', projects: [] };
let cachedRaw: string | null | undefined;
let cachedState = LOADING;

function snapshot(): DraftState {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw !== cachedRaw || cachedState.status === 'loading') {
      cachedRaw = raw;
      cachedState = parseDrafts(raw);
    }
    return cachedState;
  } catch { return UNAVAILABLE; }
}

function subscribe(callback: () => void) {
  const changed = (event: StorageEvent) => { if (event.key === DRAFT_STORAGE_KEY || event.key === null) callback(); };
  window.addEventListener('storage', changed);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', changed);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useGuestDrafts() {
  return useSyncExternalStore(subscribe, snapshot, () => LOADING);
}

export function refreshDrafts() { window.dispatchEvent(new Event(CHANGE_EVENT)); }
export type DraftResult = { ok: true; draft?: GuestDraft } | { ok: false; error: string };

async function withWriteLock(operation: () => DraftResult): Promise<DraftResult> {
  try {
    if (navigator.locks) return await navigator.locks.request(DRAFT_STORAGE_KEY, operation);
    return operation();
  } catch { return { ok: false, error: 'This browser could not save your change. Enable site storage or free some space, then try again.' }; }
}

function mutate(change: (projects: GuestDraft[]) => GuestDraft[] | string): DraftResult {
  const state = parseDrafts(window.localStorage.getItem(DRAFT_STORAGE_KEY));
  if (state.status !== 'ready') return { ok: false, error: 'The saved drafts need recovery before you can change them.' };
  const next = change(state.projects);
  if (typeof next === 'string') return { ok: false, error: next };
  const envelope: DraftEnvelope = { schemaVersion: 4, projects: next };
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(envelope));
  refreshDrafts();
  return { ok: true };
}

export async function createDraft(name: string, furnitureType: FurnitureType): Promise<DraftResult> {
  const invalid = validateName(name);
  if (invalid) return { ok: false, error: invalid };
  if (!isFurnitureType(furnitureType)) return { ok: false, error: 'Choose a supported furniture type.' };
  return withWriteLock(() => {
    const now = new Date().toISOString();
    const draft: GuestDraft = { id: crypto.randomUUID(), name: name.trim(), furnitureType, createdAt: now, updatedAt: now, version: 1 };
    const result = mutate(projects => projects.length >= MAX_DRAFTS ? `This browser can hold up to ${MAX_DRAFTS} drafts. Remove one before creating another.` : [draft, ...projects]);
    return result.ok ? { ok: true, draft } : result;
  });
}

export async function renameDraft(id: string, name: string, expectedVersion: number): Promise<DraftResult> {
  const invalid = validateName(name);
  if (invalid) return { ok: false, error: invalid };
  return withWriteLock(() => mutate(projects => {
    const draft = projects.find(project => project.id === id);
    if (!draft) return 'This draft was removed in another tab. Return to Projects.';
    if (draft.version !== expectedVersion) return 'This draft changed in another tab. Cancel, then reopen Rename to use its latest version.';
    return projects.map(project => project.id === id ? { ...project, name: name.trim(), version: project.version + 1, updatedAt: new Date(Math.max(Date.now(), Date.parse(project.updatedAt))).toISOString() } : project);
  }));
}

export async function deleteDraft(id: string, expectedVersion: number): Promise<DraftResult> {
  return withWriteLock(() => mutate(projects => {
    const draft = projects.find(project => project.id === id);
    if (!draft) return 'This draft was already removed. Close this dialog to see the current list.';
    if (draft.version !== expectedVersion) return 'This draft changed in another tab. Cancel and review it before deleting.';
    return projects.filter(project => project.id !== id);
  }));
}

export async function saveDraftCabinet(id: string, input: CabinetInput, expectedVersion: number): Promise<DraftResult> {
  const cabinet = cabinetInput(input);
  if (!cabinet) return { ok: false, error: 'Correct the cabinet measurements before saving.' };
  return withWriteLock(() => {
    let saved: GuestDraft | undefined;
    const result = mutate(projects => {
      const draft = projects.find(project => project.id === id);
      if (!draft || draft.furnitureType !== 'cabinet') return 'This cabinet draft is unavailable. Return to Projects.';
      if (draft.version !== expectedVersion) return 'This draft changed in another tab. Your design is preserved here. Reload the latest project before saving.';
      saved = { ...draft, cabinet, version: draft.version + 1, updatedAt: new Date(Math.max(Date.now(), Date.parse(draft.updatedAt))).toISOString() };
      return projects.map(project => project.id === id ? saved! : project);
    });
    return result.ok ? { ok: true, draft: saved } : result;
  });
}

export async function saveDraftFurniture(id:string,input:FurnitureInput,expectedVersion:number):Promise<DraftResult>{
  const design=furnitureInput(input);if(!design)return {ok:false,error:'Correct the furniture configuration before saving.'};
  return withWriteLock(()=>{let saved:GuestDraft|undefined;const result=mutate(projects=>{const draft=projects.find(project=>project.id===id);if(!draft||draft.furnitureType!==familyOf(design)||!design.family)return 'This furniture draft is unavailable.';if(draft.version!==expectedVersion)return 'This draft changed in another tab. Your design is preserved here. Reload the latest project before saving.';saved={...draft,design,version:draft.version+1,updatedAt:new Date(Math.max(Date.now(),Date.parse(draft.updatedAt))).toISOString()};return projects.map(project=>project.id===id?saved!:project);});return result.ok?{ok:true,draft:saved}:result;});
}

export async function resetDrafts(): Promise<DraftResult> {
  return withWriteLock(() => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    refreshDrafts();
    return { ok: true };
  });
}

export function downloadRecovery(): DraftResult {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw === null) return { ok: false, error: 'There is no draft data to download.' };
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cutplan-draft-recovery.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch { return { ok: false, error: 'The recovery file could not be downloaded. Check browser storage permissions.' }; }
}

export function defaultDraftName(type: FurnitureType) { return `My ${TYPE_LABELS[type].toLowerCase()}`; }
