import Link from 'next/link';
import { CabinetReview } from '@/components/furniture/cabinet-review';

export default function CabinetReference(){
  return <div className="mx-auto max-w-6xl p-6"><Link href="/projects" className="inline-flex min-h-11 items-center text-accent-ink">Back to projects</Link><h1 className="text-2xl">Cabinet construction reference</h1><p className="mt-3 text-sm text-muted">Synthetic review examples, separate from your project. Manufacturing approval is pending.</p><CabinetReview/></div>;
}
