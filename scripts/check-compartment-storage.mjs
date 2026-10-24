import {MongoClient} from 'mongodb';
import {snapshotSchema} from './cabinet-document-schema.mjs';
import {defaultFurniture} from '../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../src/lib/projects/contracts.ts';
import {compartmentDefault,sectionDefault} from '../src/lib/furniture/compartments.ts';

const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000,timeoutMS:20000});
const name='cutplan_compartment_probe_'+Date.now();let created=false;
try{
 await client.connect();const db=client.db(process.env.MONGODB_DATABASE);
 for(const name of ['design_revisions','furniture_projects']){
  const info=await db.listCollections({name}).next(),schema=info?.options?.validator?.$jsonSchema?.properties?.snapshot;
  if(!schema?.oneOf?.find(v=>v.properties?.cabinet)?.properties.cabinet.properties.compartments)throw new Error(name+': compartment validator missing');
  if(info.options.validationLevel!=='strict'||info.options.validationAction!=='error')throw new Error(name+': strict validation missing');
 }
 console.log('Both existing collections retain strict compartment-aware snapshot validation.');
 if(process.argv.includes('--isolated-write-test')){
  // This temporary collection contains synthetic snapshots only. Existing application records are never written.
  await db.createCollection(name,{validator:{$jsonSchema:{bsonType:'object',required:['snapshot'],additionalProperties:false,properties:{_id:{bsonType:'objectId'},snapshot:snapshotSchema}}},validationLevel:'strict',validationAction:'error'});created=true;
  const collection=db.collection(name),c={...defaultFurniture('cabinet'),compartmentMode:'manual',doorPosition:'overlay',compartments:[compartmentDefault('main',764)]};
  c.compartments[0].sections=[{...sectionDefault('split'),type:'divider',children:[compartmentDefault('a',373,0),compartmentDefault('b',373,0)]}];
  const values=[...['cabinet','shoe_rack','bookshelf','table'].map(f=>furnitureSnapshot('Synthetic storage probe',defaultFurniture(f))),furnitureSnapshot('Synthetic nested storage probe',c)];
  await collection.insertMany(values.map(snapshot=>({snapshot})));if(await collection.countDocuments()!==5)throw new Error('Synthetic storage round trip failed.');
  let denied=false;try{await collection.insertOne({snapshot:{...values[4],cabinet:{...c,doorPosition:'unsupported'}}});}catch(error){if(error.code===121)denied=true;else throw error;}if(!denied)throw new Error('Malformed snapshot was accepted.');
  console.log('Five old/new synthetic snapshots round-tripped; invalid door mode denied.');
 }
}finally{
 if(created){await client.db(process.env.MONGODB_DATABASE).collection(name).drop();console.log('Temporary synthetic probe collection removed.');}
 await client.close();
}
