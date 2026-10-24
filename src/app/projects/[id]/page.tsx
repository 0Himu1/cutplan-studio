import type { Metadata } from 'next';
import { DraftDetail } from '@/components/drafts/draft-detail';

export const metadata: Metadata = { title: 'Guest draft' };

export default async function Project({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DraftDetail id={id} />;
}
