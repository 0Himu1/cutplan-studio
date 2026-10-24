import 'server-only';
import { MongoClient, ObjectId } from 'mongodb';
import { snapshotHash } from './identity';
import { ProjectError, type ProjectSnapshot } from './contracts';

let connection: Promise<MongoClient> | undefined;
async function database() {
  const uri=process.env.MONGODB_URI, name=process.env.MONGODB_DATABASE;
  if (!uri || !name) throw new ProjectError(503,'setup_pending','Account saving is being configured. Your local draft is safe.');
  connection ??= new MongoClient(uri,{maxPoolSize:5,minPoolSize:0,maxIdleTimeMS:60_000,serverSelectionTimeoutMS:5_000,timeoutMS:10_000,appName:'CutPlan Studio'}).connect().catch(error=>{connection=undefined;throw error;});
  return (await connection).db(name);
}

export type RevisionDocument = {
  _id: string; projectId: ObjectId; ownerUserId: string; operationId: string; revisionNumber: number;
  schemaVersion: 1; engineVersion: string; snapshot: ProjectSnapshot; snapshotHash: string; createdAt: Date;
};
export type WorkingDocument = { _id: ObjectId; ownerUserId: string; version: number; currentRevisionId: string; lastOperationId: string; snapshotHash: string; snapshot: ProjectSnapshot; updatedAt: Date };

export async function commitMongoRevision(revision: RevisionDocument) {
  const db=await database();
  const revisions=db.collection<RevisionDocument>('design_revisions');
  // The only revision write is insert-once. A retry verifies existing bytes instead of updating them.
  await revisions.updateOne({_id:revision._id},{$setOnInsert:revision},{upsert:true});
  const stored=await revisions.findOne({_id:revision._id,ownerUserId:revision.ownerUserId,projectId:revision.projectId});
  if (!stored || stored.snapshotHash!==revision.snapshotHash || snapshotHash(stored.snapshot)!==revision.snapshotHash
    || stored.operationId!==revision.operationId || stored.revisionNumber!==revision.revisionNumber) throw new ProjectError(503,'integrity_error','This save needs recovery. Your current work has been preserved.');
  const working=db.collection<WorkingDocument>('furniture_projects');
  const next:WorkingDocument={_id:revision.projectId,ownerUserId:revision.ownerUserId,version:revision.revisionNumber,currentRevisionId:revision._id,lastOperationId:revision.operationId,snapshotHash:revision.snapshotHash,snapshot:revision.snapshot,updatedAt:revision.createdAt};
  if (revision.revisionNumber===1) {
    await working.updateOne({_id:next._id},{$setOnInsert:next},{upsert:true});
  } else {
    const { _id, ...fields }=next;
    await working.updateOne({_id,ownerUserId:next.ownerUserId,version:next.version-1},{$set:fields});
  }
  const head=await working.findOne({_id:next._id,ownerUserId:next.ownerUserId});
  if (!head || head.lastOperationId!==next.lastOperationId || head.version!==next.version || head.snapshotHash!==next.snapshotHash)
    throw new ProjectError(503,'integrity_error','This save needs recovery. Your current work has been preserved.');
}

export async function readMongoRevision(owner: string, projectId: string, revisionId: string, expectedHash: string) {
  const db=await database();
  const revision=await db.collection<RevisionDocument>('design_revisions').findOne({_id:revisionId,projectId:new ObjectId(projectId),ownerUserId:owner});
  if (!revision || revision.snapshotHash!==expectedHash || snapshotHash(revision.snapshot)!==expectedHash)
    throw new ProjectError(503,'integrity_error','This revision could not be verified. Retry or contact the studio owner.');
  return revision;
}

export const mongoConfigured = () => Boolean(process.env.MONGODB_URI && process.env.MONGODB_DATABASE && process.env.SUPABASE_SECRET_KEY);
