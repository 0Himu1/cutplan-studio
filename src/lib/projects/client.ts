import type { CloudProject, SaveInput } from './contracts';

export type RevisionSummary = { id: string; revision_number: number; created_at: string };
export type ProjectRevisionResponse = {
  project: CloudProject;
  revision: { id: string; number: number; snapshot: SaveInput['snapshot']; createdAt: string } | null;
  history: RevisionSummary[];
  hasMoreHistory: boolean;
};

export class ClientProjectError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) { super(message); this.name='ClientProjectError'; this.code=code; this.status=status; }
}

export async function projectRequest<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response=await fetch(path,{...init,headers:{...(init?.body?{'Content-Type':'application/json'}:{}),...init?.headers},cache:'no-store',signal:AbortSignal.timeout(15_000)});
    const data=await response.json() as {error?:unknown;code?:unknown}&T;
    if (!response.ok) throw new ClientProjectError(typeof data.error==='string'?data.error:'This project request could not be completed.',typeof data.code==='string'?data.code:'request_failed',response.status);
    return data;
  } catch(error) {
    if (error instanceof ClientProjectError) throw error;
    throw new ClientProjectError('Could not reach account storage. Your work is still here; check your connection and retry.','network_error',503);
  }
}

export function pendingSaveKey(userId: string, identity: string) { return `cutplan.pending-save.v1.${userId}.${identity}`; }
export function readPendingSave(key: string): SaveInput | null {
  try { const value=JSON.parse(window.localStorage.getItem(key)??'null') as SaveInput|null; return value&&typeof value.operationId==='string'?value:null; } catch { return null; }
}
