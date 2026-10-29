// Stage a migration prefix without editing/reordering the tracked migration directory.
import {mkdtemp,mkdir,cp,copyFile,readdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2),through=args[args.indexOf('--through')+1];
if(!args.includes('--through')||!['202610290001','202610290002','202610290003'].includes(through))throw new Error('Use --through 202610290001, 202610290002 or 202610290003. Default is a linked dry run.');
const apply=args.includes('--apply');
if(apply&&(!args.includes('--approved-hosted-migration')||process.env.PROJECT_WRITES_PAUSED!=='true'))throw new Error('approved_maintenance_window_required');
const base=join(root,'.private','project-storage');await mkdir(base,{recursive:true});const stage=await mkdtemp(join(base,'migration-stage-'));
await mkdir(join(stage,'supabase','migrations'),{recursive:true});
await copyFile(join(root,'supabase','config.toml'),join(stage,'supabase','config.toml'));
await cp(join(root,'supabase','.temp'),join(stage,'supabase','.temp'),{recursive:true});
for(const file of (await readdir(join(root,'supabase','migrations'))).filter(f=>f.endsWith('.sql')&&f.slice(0,12)<=through))
 await copyFile(join(root,'supabase','migrations',file),join(stage,'supabase','migrations',file));
execFileSync(process.execPath,[join(root,'node_modules','supabase','dist','supabase.js'),'--workdir',stage,'db','push','--linked','--skip-vault',...(apply?[]:['--dry-run'])],{cwd:root,stdio:'inherit'});
