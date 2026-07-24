import AdUnit from './AdUnit'

const SLOT_LEFT = import.meta.env.VITE_ADSENSE_SLOT_LEFT
const SLOT_RIGHT = import.meta.env.VITE_ADSENSE_SLOT_RIGHT

export default function AdSpace({ side }) {
  const slot = side === 'left' ? SLOT_LEFT : SLOT_RIGHT
  return (
    <div className="hidden xl:block w-[160px] shrink-0 sticky top-24" aria-label={`Advertisement space, ${side}`}>
      <AdUnit slot={slot} className="w-[160px] aspect-[1/3]" style={{ width: 160 }} />
    </div>
  )
}
