import {staffPermission} from '@/lib/auth/permissions';
import {isUuid} from '@/lib/projects/contracts';
import {AcceptedOrder} from '@/components/operations/accepted-order';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!await staffPermission('fulfillment')||!isUuid(id))return <section className="p-8"><h1>Staff access required</h1></section>;return <AcceptedOrder id={id}/>;}
