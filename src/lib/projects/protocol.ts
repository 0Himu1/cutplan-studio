import { ProjectError, type CloudProject, type ProjectSnapshot } from './contracts.ts';
import { snapshotHash } from './identity.ts';

export type SaveOperation = {
  id: string; owner_user_id: string; project_id: string; revision_id: string; expected_version: number;
  snapshot_hash: string; state: 'pending' | 'ready'; payload: ProjectSnapshot | null; created_at: string;
};
export type SavePorts = {
  commit: (operation: SaveOperation) => Promise<void>;
  verify: (operation: SaveOperation) => Promise<void>;
  finish: (operation: SaveOperation) => Promise<CloudProject>;
  read: (operation: SaveOperation) => Promise<CloudProject>;
};

// Re-entering the same operation resumes each durable boundary. No compensating deletion
// can remove a revision that another request has already made ready.
export async function resumeSave(operation: SaveOperation, ports: SavePorts) {
  if (operation.state==='ready') return ports.read(operation);
  if (!operation.payload || snapshotHash(operation.payload)!==operation.snapshot_hash)
    throw new ProjectError(503,'integrity_error','This save needs recovery. Your local work is still available.');
  await ports.commit(operation);
  await ports.verify(operation);
  return ports.finish(operation);
}
