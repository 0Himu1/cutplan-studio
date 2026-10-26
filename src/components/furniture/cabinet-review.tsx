'use client';

import { useId, useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { calculateCabinet } from '@/lib/furniture/cabinet';
import { CABINET_FIXTURES } from '@/lib/furniture/cabinet-fixtures';

const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 });
const mm = (value: number) => number.format(value);

export function CabinetReview() {
  const id = useId();
  const [fixtureId, setFixtureId] = useState(CABINET_FIXTURES[0].id);
  const fixture = CABINET_FIXTURES.find(item => item.id === fixtureId)!;
  const result = calculateCabinet(fixture.input);
  const c = fixture.input;

  return <section className="mt-12 border-t border-line pt-7" aria-labelledby={`${id}-heading`}>
    <div className="flex items-start gap-3">
      <ClipboardList size={19} className="mt-1 shrink-0 text-accent-ink" aria-hidden="true" />
      <div><h2 id={`${id}-heading`} className="text-[length:20px] font-[550] tracking-[-.025em]">Cabinet panel review</h2>
        <p className="mt-2 max-w-[70ch] text-[length:13px] text-muted">Inspect a proposed construction example. These measurements are separate from your saved project.</p></div>
    </div>
    <p className="mt-5 max-w-[75ch] rounded-[7px] bg-accent-soft px-4 py-3 text-[length:13px] leading-[1.7] text-accent-ink">Not approved for manufacturing. Construction drawings, joints, hardware and load limits still need review. This cut list cannot be quoted or sent to a machine.</p>
    <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-6 [@media(width<=760px)]:grid-cols-1">
      <div><label htmlFor={`${id}-example`} className="block text-[length:13px] font-[550]">Review example</label>
        <select id={`${id}-example`} value={fixtureId} onChange={event => setFixtureId(event.target.value)} className="mt-2 min-h-11 w-full rounded-[7px] border border-line bg-base px-3 py-2 text-[length:14px] text-ink [@media(width<=760px)]:text-[length:16px]">
          {CABINET_FIXTURES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></div>
      <p className="text-[length:13px] leading-[1.7] text-muted"><span className="block font-[550] text-ink tabular-nums">{mm(c.widthMm)} × {mm(c.heightMm)} × {mm(c.depthMm)} mm</span>Overall width × height × depth</p>
    </div>
    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[length:12px] leading-[1.7] text-muted">
      <p>Body {c.bodyThicknessMm} mm; back {c.backThicknessMm} mm; doors {c.doorThicknessMm} mm</p>
      <p>{c.shelfCount} shelves; {c.doorCount} doors; {c.skirtingHeightMm} mm raised bottom</p>
    </div>
    {result.blockingErrors.length ? <div role="alert" className="mt-6 rounded-[10px] border border-line p-5"><h3 className="text-[length:15px] font-[550]">This example cannot produce a cut list</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-[length:13px] leading-[1.7] text-danger-ink">{result.blockingErrors.map((error, index) => <li key={`${error.field}-${index}`}>{error.message}</li>)}</ul><p className="mt-3 text-[length:13px] text-muted">Choose another example. No partial panel set is shown.</p></div> : <div className="mt-6" aria-live="polite" aria-atomic="true">
      <p className="mb-3 text-[length:13px] font-[550]">{result.panels.length} individual panels <span className="font-normal text-muted">— cut width × height × thickness, in mm</span></p>
      <ul className="divide-y divide-line border-y border-line">
        {result.panels.map(panel => <li key={panel.panelId}>
          <details className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 rounded-[7px] px-2 py-3 hover:bg-surface [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3 [@media(width<=540px)]:flex-col [@media(width<=540px)]:items-start [@media(width<=540px)]:gap-1">
                <span className="text-[length:13px] font-[550]">{panel.label}</span>
                <span className="whitespace-nowrap text-[length:13px] tabular-nums">{mm(panel.widthMm)} × {mm(panel.heightMm)} × {mm(panel.thicknessMm)}</span>
              </span><ChevronDown size={16} className="shrink-0 text-muted group-open:rotate-180" aria-hidden="true" />
            </summary>
            <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-5 gap-y-2 px-2 pb-4 pt-2 text-[length:12px] leading-[1.7] [@media(width<=540px)]:grid-cols-1 [@media(width<=540px)]:gap-y-1">
              <dt className="text-muted">Panel identity</dt><dd className="wrap-anywhere">{panel.panelId}</dd>
              <dt className="text-muted">Board role</dt><dd>{panel.materialSlot === 'front' ? 'Door board' : panel.materialSlot === 'back' ? 'Back board' : 'Body board'}; no catalog material assigned</dd>
              <dt className="text-muted">Center X, Y, Z (mm)</dt><dd className="tabular-nums">{panel.pose.positionMm.map(mm).join(', ')}</dd>
              <dt className="text-muted">Rotation X, Y, Z (rad)</dt><dd className="tabular-nums">{panel.pose.rotationRad.map(mm).join(', ')}</dd>
              {panel.notches?.length&&<><dt className="text-muted">Corner notches</dt><dd>{panel.notches.map(n=>`${n.side}: ${mm(n.width)} × ${mm(n.height)} mm`).join("; ")}</dd></>}
              <dt className="text-muted">Stock rotation</dt><dd>{panel.allowedRotationsDeg.join('° or ')}°; {panel.notches?.length?'corner profile locks orientation':panel.grainAxis==='none'?'grain unrestricted':'grain preserved'}</dd>
            </dl>
          </details>
        </li>)}
      </ul>
    </div>}
    <details className="mt-5 rounded-[7px] border border-line px-4 py-1 text-[length:13px]">
      <summary className="min-h-11 cursor-pointer py-3 font-[550]">Construction rules and review limits</summary>
      <ul className="mb-4 max-w-[75ch] list-disc space-y-2 pl-5 leading-[1.7] text-muted">
        <li>Full-height sides; top and bottom fit between them. Width loses the two side thicknesses once.</li>
        <li>An inset back fits inside the opening. An outside back covers the full height and width; carcass depth reduces by back thickness.</li>
        <li>Shelves lose {c.shelfSideClearanceMm} mm at each side. Clear openings are equal after accounting for every shelf thickness.</li>
        <li>Inset doors have {c.doorGapMm} mm perimeter and meeting gaps. Shelves stop behind the doors with the same clearance.</li>
        <li>A raised bottom includes one front plinth recessed {c.plinthSetbackMm} mm. Fixings and additional supports need approval.</li>
        <li>Stock is illustrative: {c.stockWidthMm} × {c.stockHeightMm} mm with {c.stockMarginMm} mm margins per side. Each cut face must be at least 50 mm; thickness is exempt. Stock fit is checked per panel; this is not nesting.</li>
        <li>Coordinates use left-to-right X, bottom-to-top Y and back-to-front Z. Positions are panel centers; local cut faces lie on X/Y before rotation.</li>
        <li>No drawer, joint, hinge hole, wall fixing, pricing or CNC calculation is included. Changing examples does not save dimensions or create project revisions.</li>
      </ul>
    </details>
  </section>;
}
