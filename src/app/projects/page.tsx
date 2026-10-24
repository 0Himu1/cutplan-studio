import type { Metadata } from 'next';
import { ProjectsWorkspace } from '@/components/drafts/project-dashboard';

export const metadata: Metadata = { title: 'Projects' };

export default function Projects() {
  return <ProjectsWorkspace />;
}
