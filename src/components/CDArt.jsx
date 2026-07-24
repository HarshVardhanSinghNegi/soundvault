export default function CDArt({ imageUrl, title, spinning = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-full aspect-square',
  }[size]

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 ${sizeClasses} ${
        spinning ? 'animate-vinyl' : ''
      }`}
      style={{ boxShadow: '0 4px 18px rgba(0,0,0,0.45)' }}
      aria-hidden="true"
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          {/* brass center pin so it still reads as a record */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[18%] h-[18%] rounded-full bg-ink border-2 border-brass/70" />
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-surface2 via-ink to-black relative">
          <div className="absolute inset-0 vinyl-grooves rounded-full" />
          <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-brass to-brassLight flex items-center justify-center">
            <span className="text-ink font-display text-[8px] leading-none px-1 text-center overflow-hidden">
              {initials(title)}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[8%] h-[8%] rounded-full bg-ink" />
          </div>
        </div>
      )}
    </div>
  )
}

function initials(title) {
  if (!title) return '♪'
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
