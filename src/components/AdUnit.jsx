import { useEffect, useRef } from 'react'

const AD_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT

// Renders a real Google AdSense unit once VITE_ADSENSE_CLIENT and a slot id
// are configured; otherwise renders the same dashed placeholder box so
// layout looks right before you've been approved for AdSense.
export default function AdUnit({ slot, format = 'auto', fullWidthResponsive = true, className = '', style }) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!AD_CLIENT || !slot || pushedRef.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushedRef.current = true
    } catch (err) {
      console.warn('AdSense request failed:', err)
    }
  }, [slot])

  if (!AD_CLIENT || !slot) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-line text-muted text-[10px] font-mono uppercase tracking-wider ${className}`}
        style={style}
      >
        Ad space
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={style}
      data-ad-client={AD_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  )
}
