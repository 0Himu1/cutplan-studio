import type { Metadata } from 'next';
import { CloudProjectDetail } from '@/components/projects/cloud-project-detail';

export const metadata:Metadata={title:'Account project'};
export default async function AccountProject({params}:{params:Promise<{id:string}>}){const {id}=await params;return <CloudProjectDetail id={id}/>;}
