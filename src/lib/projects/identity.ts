import { createHash } from 'node:crypto';
import type { ProjectSnapshot, SaveInput } from './contracts.ts';
import { furnitureInput } from '../furniture/families.ts';
import { cabinetInput } from '../furniture/editor.ts';

export const projectIdentity = (owner: string, source: string) => createHash('sha256').update(`cutplan:project:${owner}:${source}`).digest('hex').slice(0,24);
export const snapshotHash = (snapshot: ProjectSnapshot) => createHash('sha256').update(JSON.stringify({ schemaVersion:snapshot.schemaVersion,name:snapshot.name,furnitureType:snapshot.furnitureType,stage:snapshot.stage,
  ...(snapshot.stage === 'cabinet-design' ? { engineVersion:snapshot.engineVersion, templateKey:snapshot.templateKey, cabinet:cabinetInput(snapshot.cabinet) } : snapshot.stage==='furniture-design'?{engineVersion:snapshot.engineVersion,templateKey:snapshot.templateKey,configuration:furnitureInput(snapshot.configuration)}:{}) })).digest('hex');
export const requestHash = (owner: string, input: SaveInput, projectId: string) => createHash('sha256').update(JSON.stringify([owner,projectId,input.sourceDraftId,input.expectedVersion,snapshotHash(input.snapshot)])).digest('hex');
