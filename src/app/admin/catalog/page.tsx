import { staffPermission } from '@/lib/auth/permissions';
import { CatalogWorkspace } from '@/components/catalog/workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Material catalog'};
export default async function CatalogPage(){
 if(!await staffPermission('catalog'))return <section className="mx-auto max-w-220 px-6 py-12"><h1 className="text-2xl font-semibold">Staff access required</h1><p className="mt-4 text-muted">Sign in with an active catalog administrator account to manage materials.</p></section>;
 return <CatalogWorkspace/>;
}
