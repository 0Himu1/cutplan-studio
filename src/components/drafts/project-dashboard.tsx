'use client';

import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { TYPE_LABELS, type GuestDraft } from '@/lib/guest-drafts/model';
import { useGuestDrafts } from '@/lib/guest-drafts/store';
import { FurnitureDiagram } from '@/components/furniture-diagram';
import { StorageNotice } from './storage-notice';
import { ProjectActions } from './project-actions';
import { AccountProjects } from '@/components/projects/account-projects';

export function NewProjectLink() {
	const { status } = useGuestDrafts();
	if (status !== 'ready')
		return (
			<button
				type="button"
				className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted"
				disabled
			>
				<Plus size={17} aria-hidden="true" />
				New project
			</button>
		);
	return (
		<Link
			className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted"
			href="/projects/new"
		>
			<Plus size={17} aria-hidden="true" />
			New project
		</Link>
	);
}

export function DraftCard({ draft }: { draft: GuestDraft }) {
	const label = TYPE_LABELS[draft.furnitureType];
	const date = new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'Asia/Dhaka',
	}).format(new Date(draft.updatedAt));
	return (
		<article
			className="project-card min-w-0 [border:1px_solid_var(--border)] rounded-[12px] overflow-clip [&_.project-actions]:pt-3 [&_.project-actions]:pr-3 [&_.project-actions]:pb-[10px] [&_.project-actions]:pl-3"
			aria-labelledby={`draft-${draft.id}`}
		>
			<Link
				href={`/projects/${draft.id}`}
				className="project-card-link block [&:focus-visible]:[outline-offset:-4px]"
				aria-label={`Open ${draft.name}`}
			>
				<div className="project-thumbnail bg-surface pt-3 pr-6 pb-[18px] pl-6 text-center [&_.furniture-diagram]:max-w-[230px] [&_.furniture-diagram]:h-[150px] [&_>_span]:block [&_>_span]:text-muted [&_>_span]:text-[length:12px]">
					<FurnitureDiagram type={draft.furnitureType} compact />
					<span>{label} schematic</span>
				</div>
				<div className="project-card-copy pt-5 pr-5 pb-0 pl-5 [&_h3]:text-[length:16px] [&_h3]:font-[550] [&_h3]:wrap-anywhere [&_h3]:leading-[1.45] [&_p]:text-[length:12px] [&_p]:text-muted [&_p]:mt-[7px] [&_p]:mr-0 [&_p]:mb-3 [&_p]:ml-0 [&_time]:text-[length:12px] [&_time]:text-muted [&_time]:tabular-nums">
					<h3 id={`draft-${draft.id}`}>{draft.name}</h3>
					<p>
						{label}
						<span aria-hidden="true"> / </span>Browser draft
					</p>
					<time dateTime={draft.updatedAt}>Edited {date}</time>
				</div>
			</Link>
			<ProjectActions draft={draft} />
		</article>
	);
}

export function RecentDrafts() {
	const state = useGuestDrafts();
	return (
		<section
			className="projects-preview mt-[38px]"
			aria-labelledby="recent-title"
		>
			<div className="section-heading flex items-center justify-between gap-4 mb-5 [&_h2]:text-[length:15px] [&_h2]:font-[550] [&_h2]:tracking-[-.02em] [&_>_span]:text-[length:12px] [&_>_span]:text-muted [@media(width<=760px)]:[&_>_span]:hidden">
				<h2 id="recent-title">Recent projects</h2>
				{state.projects.length > 0 && (
					<Link
						className="subtle-link flex items-center gap-[6px] text-ink text-[length:12px] mt-3 mr-0 mb-[26px] ml-0 min-h-7 [&:hover]:underline [&:hover]:underline-offset-[4px] view-all [&.subtle-link]:mt-0 [&.subtle-link]:mr-0 [&.subtle-link]:mb-0 [&.subtle-link]:ml-0"
						href="/projects"
					>
						View all <ArrowUpRight size={14} aria-hidden="true" />
					</Link>
				)}
			</div>
			<StorageNotice status={state.status} />
			{state.status === 'loading' && (
				<p
					role="status"
					className="local-note text-muted text-[length:12px] leading-[1.7] mt-4"
				>
					Loading browser drafts…
				</p>
			)}
			{state.status === 'ready' &&
				(state.projects.length ? (
					<>
						<div className="project-grid grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[22px] items-start [@media(width<=540px)]:grid-cols-[1fr] [@media(540px<width<=1100px)]:grid-cols-[repeat(2,minmax(0,1fr))]">
							{state.projects.slice(0, 3).map(draft => (
								<DraftCard draft={draft} key={draft.id} />
							))}
						</div>
						<p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">
							Saved on this browser only. Clearing site data removes these
							drafts.
						</p>
					</>
				) : (
					<div className="empty-projects [border:1px_dashed_var(--border)] rounded-[10px] flex gap-[18px] items-center pt-[25px] pr-7 pb-[25px] pl-7 [@media(width<=760px)]:gap-3 [@media(width<=760px)]:pt-[22px] [@media(width<=760px)]:pr-[18px] [@media(width<=760px)]:pb-[22px] [@media(width<=760px)]:pl-[18px] [&_h3]:text-[length:13px] [&_h3]:font-[500] [&_p]:text-[length:12px] [&_p]:mt-1 [&_p]:text-muted">
						<span
							className="empty-project-mark text-diagram flex"
							aria-hidden="true"
						>
							<Plus size={22} strokeWidth={1.5} />
						</span>
						<div>
							<h3>A little room for your ideas.</h3>
							<p>Create your first project to start a browser draft.</p>
							<Link
								className="text-link inline-flex gap-[10px] items-center mt-6 min-h-[30px] text-[length:12px] font-[550] text-accent-ink [&:hover]:underline [&:hover]:underline-offset-[5px]"
								href="/projects/new"
							>
								Create a project
							</Link>
						</div>
					</div>
				))}
		</section>
	);
}

export function ProjectsWorkspace() {
	const state = useGuestDrafts();
	return (
		<div className="page-content max-w-330 mt-0 mr-auto mb-0 ml-auto pt-12 pr-12 pb-8 pl-12 w-full [@media(width<=760px)]:pt-[30px] [@media(760px<width<=1100px)]:pt-8 [@media(width>=1600px)]:pt-16 [@media(width<=420px)]:pr-5 [@media(420px<width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pb-[30px] [@media(width<=420px)]:pl-5 [@media(420px<width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7">
			<section className="page-heading flex items-center justify-between gap-6 mb-[34px] [@media(width<=760px)]:items-start [@media(width<=420px)]:gap-[18px] [@media(width<=760px)]:mb-[26px] [@media(width<=420px)]:flex-col [&_h1]:text-[length:27px] [&_h1]:leading-[1.25] [&_h1]:font-[580] [&_h1]:tracking-[-.035em] [@media(width<=760px)]:[&_h1]:text-[length:24px] [&_p]:text-muted [&_p]:mt-2 [&_p]:text-[length:13px] [@media(width<=760px)]:[&_p]:text-[length:12px] [@media(width<=760px)]:[&_p]:max-w-[30ch] [@media(width<=760px)]:[&_.button]:min-h-11 [@media(width<=760px)]:[&_.button]:pt-[10px] [@media(width<=760px)]:[&_.button]:pr-3 [@media(width<=760px)]:[&_.button]:pb-[10px] [@media(width<=760px)]:[&_.button]:pl-3">
				<div>
					<h1>Your projects</h1>
					<p>Browser drafts and signed-in account copies.</p>
				</div>
				<NewProjectLink />
			</section>
			<AccountProjects />
			<section aria-labelledby="browser-drafts-title">
				<h2
					id="browser-drafts-title"
					className="mb-5 text-[length:15px] font-[550] tracking-[-.02em]"
				>
					Browser drafts
				</h2>
				<StorageNotice status={state.status} />
				{state.status === 'loading' && (
					<p
						role="status"
						className="local-note text-muted text-[length:12px] leading-[1.7] mt-4"
					>
						Loading browser drafts…
					</p>
				)}
				{state.status === 'ready' &&
					(state.projects.length ? (
						<>
							<p className="local-note text-muted text-[length:12px] leading-[1.7] collection-note mt-0 mr-0 mb-[22px] ml-0">
								{state.projects.length}{' '}
								{state.projects.length === 1 ? 'draft' : 'drafts'}. These are
								not backed up to an account.
							</p>
							<div className="project-grid grid grid-cols-[repeat(3,minmax(0,1fr))] gap-[22px] items-start [@media(width<=540px)]:grid-cols-[1fr] [@media(540px<width<=1100px)]:grid-cols-[repeat(2,minmax(0,1fr))]">
								{state.projects.map(draft => (
									<DraftCard draft={draft} key={draft.id} />
								))}
							</div>
						</>
					) : (
						<section
							className="full-empty flex flex-col items-center text-center pt-[66px] pr-5 pb-[90px] pl-5 [@media(width<=760px)]:pt-[30px] [@media(width<=760px)]:pr-0 [@media(width<=760px)]:pb-15 [@media(width<=760px)]:pl-0 [&_.compact]:max-w-65 [&_.compact]:mb-[26px] [&_h1]:text-[length:25px] [&_h1]:font-[500] [&_h1]:tracking-[-.025em] [&_h2]:text-[length:25px] [&_h2]:font-[500] [&_h2]:tracking-[-.025em] [&_p]:mt-[14px] [&_p]:mr-0 [&_p]:mb-6 [&_p]:ml-0 [&_p]:max-w-[46ch] [&_p]:text-muted [&_p]:text-[length:14px]"
							aria-labelledby="projects-empty-title"
						>
							<FurnitureDiagram compact />
							<h2 id="projects-empty-title">A fresh start.</h2>
							<p>
								There are no saved projects here yet. Choose a furniture type
								and give your first draft a name.
							</p>
							<Link
								className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted"
								href="/projects/new"
							>
								Create your first project
							</Link>
						</section>
					))}
			</section>
		</div>
	);
}
