// One-off recovery tool. Never imported by the Next.js application.
import {MongoClient,BSON} from 'mongodb';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const output=process.argv[process.argv.indexOf('--out')+1];
if(!process.argv.includes('--out')||!output)throw new Error('Use --out <new private directory>.');
if(!process.env.MONGODB_URI||!process.env.MONGODB_DATABASE)throw new Error('Provide source credentials through the environment.');
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000,timeoutMS:30000,appName:'CutPlan read-only export'});
try{
 await client.connect();const db=client.db(process.env.MONGODB_DATABASE);
 const [revisions,heads]=await Promise.all([db.collection('design_revisions').find({}).toArray(),db.collection('furniture_projects').find({}).toArray()]);
 const portable={schemaVersion:1,exportedAt:new Date().toISOString(),revisions:revisions.map(r=>({...r,projectId:r.projectId.toHexString(),createdAt:r.createdAt.toISOString()})),workingDocuments:heads.map(h=>({...h,_id:h._id.toHexString(),updatedAt:h.updatedAt.toISOString()}))};
 await mkdir(resolve(output),{recursive:false,mode:0o700});
 const files={'export.json':JSON.stringify(portable),'source.ejson':BSON.EJSON.stringify({revisions,heads},{relaxed:false})};const manifest={schemaVersion:1,exportedAt:portable.exportedAt,revisions:revisions.length,heads:heads.length,files:[]};
 for(const [name,content] of Object.entries(files)){const bytes=Buffer.from(content);await writeFile(resolve(output,name),bytes,{flag:'wx',mode:0o600});manifest.files.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({exported:true,revisions:revisions.length,heads:heads.length}));
}catch(error){console.error(JSON.stringify({exported:false,error:error.code??error.name}));process.exitCode=1;}finally{await client.close();}
