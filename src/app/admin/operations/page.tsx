import {staffPermission} from '@/lib/auth/permissions';
import {OperationsWorkspace} from '@/components/operations/workspace';
export const dynamic='force-dynamic';export const metadata={title:'Order operations'};
export default async function Page(){if(!await staffPermission('fulfillment'))return <section className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-2xl">Staff access required</h1><p className="mt-4">Active fulfillment staff access is required for private orders, bids and profiles.</p></section>;return <OperationsWorkspace/>;}
