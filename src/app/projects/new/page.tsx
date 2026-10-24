import type { Metadata } from 'next';
import { NewProjectForm } from '@/components/drafts/new-project-form';
import { isFurnitureType } from '@/lib/guest-drafts/model';

export const metadata: Metadata = { title: 'New project' };

export default async function NewProject({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const { type } = await searchParams;
  return <NewProjectForm initialType={isFurnitureType(type) ? type : 'cabinet'} />;
}
