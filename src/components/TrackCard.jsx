import CDArt from './CDArt'
import { formatDuration } from '../lib/metadata'

export default function TrackCard({
  track,
  view,
  isCurrent,
  isPlaying,
  onPlay,
  onDownload,
  downloadDisabled,
  selectable,
  selected,
  orderNumber,
  onToggleSelect,
}) {
  if (view === 'list') {
    return (
      <div
        className={`group flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
          isCurrent ? 'bg-surface2' : 'hover:bg-surface2/60'
        }`}
        onClick={() => (selectable ? onToggleSelect(track) : onPlay(track))}
      >
        {selectable && (
          orderNumber != null ? (
            <span className="w-4 h-4 shrink-0 rounded-full bg-brass text-ink text-[10px] font-mono flex items-center justify-center">
              {orderNumber}
            </span>
          ) : (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect(track)}
              onClick={(e) => e.stopPropagation()}
              className="accent-brass shrink-0"
            />
          )
        )}
        <CDArt imageUrl={track.imageUrl} title={track.title} spinning={isCurrent && isPlaying} size="sm" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${isCurrent ? 'text-brass' : 'text-cream'}`}>{track.title}</p>
          <p className="text-xs text-muted truncate">{track.artist || 'Unknown artist'}</p>
        </div>
        <span className="font-mono text-[10px] text-muted shrink-0">
          {formatDuration(track.duration_seconds)}
        </span>
        {!selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(track)
            }}
            disabled={downloadDisabled}
            className="shrink-0 text-muted hover:text-brass opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20"
            aria-label={`Download ${track.title}`}
            title="Download"
          >
            <DownloadIcon />
          </button>
        )}
      </div>
    )
  }

  // grid view
  return (
    <div
      className="group flex flex-col items-center text-center cursor-pointer relative"
      onClick={() => (selectable ? onToggleSelect(track) : onPlay(track))}
    >
      {selectable && (
        orderNumber != null ? (
          <span className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-brass text-ink text-[10px] font-mono flex items-center justify-center">
            {orderNumber}
          </span>
        ) : (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(track)}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1 left-1 z-10 accent-brass"
          />
        )
      )}
      <div className="relative w-full">
        <CDArt imageUrl={track.imageUrl} title={track.title} spinning={isCurrent && isPlaying} size="lg" />
        {!selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(track)
            }}
            disabled={downloadDisabled}
            className="absolute bottom-1 right-1 bg-ink/80 rounded-full p-1.5 text-cream opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-20"
            aria-label={`Download ${track.title}`}
            title="Download"
          >
            <DownloadIcon size={12} />
          </button>
        )}
      </div>
      <p className={`mt-1.5 text-xs leading-tight truncate w-full ${isCurrent ? 'text-brass' : 'text-cream'}`}>
        {track.title}
      </p>
    </div>
  )
}

function DownloadIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.6l3.3-3.3 1.4 1.4L12 17l-4.7-5.3 1.4-1.4L12 13.6V3zM5 19h14v2H5z" />
    </svg>
  )
}
