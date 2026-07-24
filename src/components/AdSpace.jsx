export default function AdSpace({ side }) {
  return (
    <div
      className="hidden xl:flex w-[160px] shrink-0 h-fit sticky top-24 items-center justify-center rounded-xl border border-dashed border-line text-muted text-[10px] font-mono uppercase tracking-wider aspect-[1/3]"
      aria-label={`Advertisement space, ${side}`}
    >
      Ad space
    </div>
  )
}
