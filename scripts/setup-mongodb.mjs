import { MongoClient } from 'mongodb';
import { snapshotSchema } from './cabinet-document-schema.mjs';

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;
if (!uri || !databaseName) throw new Error('Set MONGODB_URI and MONGODB_DATABASE in .env.local first.');
if (!/^[A-Za-z0-9_-]{1,64}$/.test(databaseName)) throw new Error('MONGODB_DATABASE has an unsupported name.');

const client = new MongoClient(uri, {
  appName: 'CutPlan Studio database setup',
  serverSelectionTimeoutMS: 10_000,
  timeoutMS: 20_000,
});

const revisionValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['_id','projectId','ownerUserId','operationId','revisionNumber','schemaVersion','engineVersion','snapshot','snapshotHash','createdAt'],
    additionalProperties: false,
    properties: {
      _id: { bsonType: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
      projectId: { bsonType: 'objectId' }, ownerUserId: { bsonType: 'string' }, operationId: { bsonType: 'string' },
      revisionNumber: { bsonType: 'int', minimum: 1 }, schemaVersion: { enum: [1] }, engineVersion: { enum: ['project-shell-v1','cabinet-review-1.0.0','casework-review-1.0.0'] },
      snapshotHash: { bsonType: 'string', pattern: '^[0-9a-f]{64}$' }, createdAt: { bsonType: 'date' },
      snapshot: snapshotSchema,
    },
  },
};
const workingValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['_id','ownerUserId','version','currentRevisionId','lastOperationId','snapshotHash','snapshot','updatedAt'],
    additionalProperties: false,
    properties: {
      _id: { bsonType: 'objectId' }, ownerUserId: { bsonType: 'string' }, version: { bsonType: 'int', minimum: 1 },
      currentRevisionId: { bsonType: 'string' }, lastOperationId: { bsonType: 'string' },
      snapshotHash: { bsonType: 'string', pattern: '^[0-9a-f]{64}$' }, updatedAt: { bsonType: 'date' },
      snapshot: revisionValidator.$jsonSchema.properties.snapshot,
    },
  },
};

async function ensureCollection(db, name, validator) {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  if (!exists) await db.createCollection(name, { validator, validationLevel: 'strict', validationAction: 'error' });
  else await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
}

try {
  await client.connect();
  const db = client.db(databaseName);
  await ensureCollection(db, 'design_revisions', revisionValidator);
  await ensureCollection(db, 'furniture_projects', workingValidator);
  await db.collection('design_revisions').createIndex({ projectId: 1, revisionNumber: 1 }, { unique: true, name: 'one_revision_number_per_project' });
  await db.collection('design_revisions').createIndex({ ownerUserId: 1, projectId: 1, createdAt: -1 }, { name: 'owner_project_history' });
  await db.collection('furniture_projects').createIndex({ ownerUserId: 1, updatedAt: -1 }, { name: 'owner_recent_projects' });
  console.log(`MongoDB collections, validators and indexes are ready in ${databaseName}.`);
} finally {
  await client.close();
}

