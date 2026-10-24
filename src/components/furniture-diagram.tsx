import type { FurnitureType } from '@/lib/guest-drafts/model';

export function FurnitureDiagram({ compact = false, type = 'cabinet' }: { compact?: boolean; type?: FurnitureType }) {
  return (
    <svg className={`furniture-diagram w-full max-w-90 overflow-visible [@media(width<=760px)]:max-w-[290px] ${compact ? 'compact' : ''}`} viewBox="0 0 360 255" fill="none" aria-hidden="true">
      <path className="diagram-guide stroke-line [stroke-width:1]" d="M68 38H292M68 32V44M292 32V44M42 62V211M36 62H48M36 211H48" />
      {type === 'table' ? <><path className="diagram-structure stroke-diagram [stroke-width:1.3] [stroke-linejoin:round]" d="M60 100H300V111H60ZM75 111V218H87V111M273 111V218H285V111" /><path className="diagram-door stroke-accent [stroke-width:1.3]" d="M87 125H273V139H87" /></> : <>
        <path className="diagram-structure stroke-diagram [stroke-width:1.3] [stroke-linejoin:round]" d="M70 62H290V211H70V62ZM79 71H281V202H79V71ZM70 211V224M290 211V224" />
        {type === 'cabinet' ? <><path className="diagram-structure stroke-diagram [stroke-width:1.3] [stroke-linejoin:round]" d="M180 71V202M79 113H180M79 158H180" /><path className="diagram-door stroke-accent [stroke-width:1.3]" d="M189 80H272V194H189V80Z" /><path className="diagram-handle stroke-accent [stroke-width:2] [stroke-linecap:round]" d="M201 127V145" /></> : <><path className="diagram-structure stroke-diagram [stroke-width:1.3] [stroke-linejoin:round]" d={type === 'bookshelf' ? 'M79 114H281M79 158H281M180 71V202' : 'M79 104H281M79 137H281M79 170H281'} /><path className="diagram-door stroke-accent [stroke-width:1.3]" d="M79 202H281" /></>}
      </>}
      <path className="diagram-guide stroke-line [stroke-width:1]" d="M58 224H302M169 38H191M42 126V147" />
      <circle className="diagram-point fill-accent" cx="70" cy="62" r="3" />
      <circle className="diagram-point fill-accent" cx="290" cy="211" r="3" />
    </svg>
  );
}
