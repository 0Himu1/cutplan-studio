import { furnitureInput, familyOf, calculateFurniture, FAMILY_ENGINE, FAMILY_TEMPLATES, type FurnitureInput } from '../furniture/families.ts';
import { cabinetInput } from '../furniture/editor.ts';
import { ENGINE_VERSION, TEMPLATE_KEY, type CabinetInput } from '../furniture/cabinet.ts';

export type ProjectSnapshot = {
  schemaVersion: 1;
  name: string;
  furnitureType: 'cabinet' | 'shoe_rack' | 'bookshelf' | 'table';
  stage: 'project-shell';
} | {
  schemaVersion: 1; name: string; furnitureType: 'cabinet'; stage: 'cabinet-design';
  engineVersion: typeof ENGINE_VERSION; templateKey: typeof TEMPLATE_KEY; cabinet: CabinetInput;
} | {schemaVersion:1;name:string;furnitureType:'shoe_rack'|'bookshelf'|'table';stage:'furniture-design';engineVersion:typeof FAMILY_ENGINE;templateKey:string;configuration:FurnitureInput};

export function designSnapshot(name: string, cabinet: CabinetInput): ProjectSnapshot {
  return { schemaVersion: 1, name: name.trim(), furnitureType: 'cabinet', stage: 'cabinet-design', engineVersion: ENGINE_VERSION, templateKey: TEMPLATE_KEY, cabinet };
}

export function furnitureSnapshot(name:string,input:FurnitureInput):ProjectSnapshot {
  if(!input.family)return designSnapshot(name,input);
  return {schemaVersion:1,name:name.trim(),furnitureType:input.family,stage:'furniture-design',engineVersion:FAMILY_ENGINE,templateKey:FAMILY_TEMPLATES[input.family],configuration:input};
}
export function snapshotFurniture(snapshot:ProjectSnapshot|undefined):FurnitureInput|undefined {return snapshot?.stage==='cabinet-design'?snapshot.cabinet:snapshot?.stage==='furniture-design'?snapshot.configuration:undefined;}

export type CloudProject = {
  id: string; source_draft_id: string; name: string; furniture_type: ProjectSnapshot['furnitureType'];
  version: number; current_revision_id: string | null; sync_status: 'pending' | 'ready';
  pending_operation_id: string | null; created_at: string; updated_at: string;
};

export type SaveInput = { operationId: string; sourceDraftId: string; projectId?: string; expectedVersion: number; snapshot: ProjectSnapshot };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
export const isProjectId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{24}$/.test(v);

export function saveInput(value: Record<string, unknown> | null): SaveInput | null {
  if (!value || Object.keys(value).some(k => !['operationId','sourceDraftId','projectId','expectedVersion','snapshot'].includes(k))) return null;
  const { operationId, sourceDraftId, projectId, expectedVersion, snapshot } = value;
  if (!isUuid(operationId) || !isUuid(sourceDraftId) || !Number.isSafeInteger(expectedVersion) || (expectedVersion as number)<0
    || (projectId !== undefined && !isProjectId(projectId)) || ((expectedVersion as number)>0 && !projectId)) return null;
  if (!snapshot || typeof snapshot!=='object' || Array.isArray(snapshot)) return null;
  const s = snapshot as Record<string, unknown>;
  if (s.schemaVersion!==1 || typeof s.name!=='string' || !s.name.trim() || s.name.trim().length>120 || /[\u0000-\u001f\u007f]/.test(s.name)
    || !['cabinet','shoe_rack','bookshelf','table'].includes(s.furnitureType as string)) return null;
  if(s.stage==='furniture-design'){
    if(Object.keys(s).sort().join(',')!=='configuration,engineVersion,furnitureType,name,schemaVersion,stage,templateKey'||s.engineVersion!==FAMILY_ENGINE)return null;
    const configuration=furnitureInput(s.configuration);if(!configuration||!configuration.family||familyOf(configuration)!==s.furnitureType||s.templateKey!==calculateFurniture(configuration).templateKey)return null;
    return {operationId,sourceDraftId,...(projectId?{projectId:projectId as string}:{}),expectedVersion:expectedVersion as number,snapshot:furnitureSnapshot(s.name,configuration)};
  }
  if (s.stage === 'cabinet-design') {
    if (Object.keys(s).sort().join(',') !== 'cabinet,engineVersion,furnitureType,name,schemaVersion,stage,templateKey'
      || s.furnitureType !== 'cabinet' || s.engineVersion !== ENGINE_VERSION || s.templateKey !== TEMPLATE_KEY) return null;
    const cabinet = cabinetInput(s.cabinet);
    if (!cabinet) return null;
    return { operationId, sourceDraftId, ...(projectId ? { projectId: projectId as string } : {}), expectedVersion: expectedVersion as number, snapshot: designSnapshot(s.name, cabinet) };
  }
  if (s.stage !== 'project-shell' || Object.keys(s).sort().join(',') !== 'furnitureType,name,schemaVersion,stage') return null;
  return { operationId,sourceDraftId,...(projectId ? {projectId:projectId as string}:{}),expectedVersion:expectedVersion as number,
    snapshot:{schemaVersion:1,name:s.name.trim(),furnitureType:s.furnitureType as ProjectSnapshot['furnitureType'],stage:'project-shell'} };
}

export class ProjectError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ProjectError';
    this.status = status;
    this.code = code;
  }
}
