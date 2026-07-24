import { useMemo, useState } from 'react'
import TrackCard from './TrackCard'

export default function TrackList({
  tracks,
  currentTrack,
  isPlaying,
  onPlay,
  onPlayQueue,
  onDownload,
  downloadingId,
  isAdmin,
  onDeleteSelected,
}) {
  const [view, setView] = useState('grid') // 'grid' | 'list'
  // 'none' | 'queue' (anyone: build a custom play order) | 'delete' (admin only)
  const [mode, setMode] = useState('none')
  // Ordered array, not a Set — the order tracks are clicked in is the play order.
  const [queueSelection, setQueueSelection] = useState([])
  const [deleteSelectedIds, setDeleteSelectedIds] = useState(new Set())

  const deleteSelectedTracks = useMemo(
    () => tracks.filter((t) => deleteSelectedIds.has(t.id)),
    [tracks, deleteSelectedIds]
  )

  function toggleQueueSelect(track) {
    setQueueSelection((prev) => {
      const exists = prev.some((t) => t.id === track.id)
      return exists ? prev.filter((t) => t.id !== track.id) : [...prev, track]
    })
  }

  function toggleDeleteSelect(track) {
    setDeleteSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(track.id)) next.delete(track.id)
      else next.add(track.id)
      return next
    })
  }

  function exitMode() {
    setMode('none')
    setQueueSelection([])
    setDeleteSelectedIds(new Set())
  }

  function handlePlaySelected() {
    if (queueSelection.length === 0) return
    onPlayQueue(queueSelection)
    exitMode()
  }

  async function handleDelete() {
    if (deleteSelectedTracks.length === 0) return
    const ok = window.confirm(
      `Delete ${deleteSelectedTracks.length} track${deleteSelectedTracks.length > 1 ? 's' : ''}? This can't be undone.`
    )
    if (!ok) return
    await onDeleteSelected(deleteSelectedTracks)
    exitMode()
  }

  const orderOf = (track) => {
    const idx = queueSelection.findIndex((t) => t.id === track.id)
    return idx === -1 ? null : idx + 1
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <ViewButton active={view === 'grid'} onClick={() => setView('grid')}>
            Grid
          </ViewButton>
          <ViewButton active={view === 'list'} onClick={() => setView('list')}>
            List
          </ViewButton>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {mode === 'queue' && (
            <>
              <span className="text-xs text-muted font-mono">{queueSelection.length} selected</span>
              <button
                onClick={handlePlaySelected}
                disabled={queueSelection.length === 0}
                className="text-xs px-2.5 py-1.5 rounded bg-brass text-ink font-medium disabled:opacity-30"
              >
                Play selected
              </button>
              <button onClick={exitMode} className="text-xs px-2.5 py-1.5 rounded text-muted hover:text-cream">
                Cancel
              </button>
            </>
          )}

          {mode === 'delete' && (
            <>
              <span className="text-xs text-muted font-mono">{deleteSelectedIds.size} selected</span>
              <button
                onClick={handleDelete}
                disabled={deleteSelectedIds.size === 0}
                className="text-xs px-2.5 py-1.5 rounded bg-red-900/60 text-red-100 hover:bg-red-800/70 disabled:opacity-30"
              >
                Delete
              </button>
              <button onClick={exitMode} className="text-xs px-2.5 py-1.5 rounded text-muted hover:text-cream">
                Cancel
              </button>
            </>
          )}

          {mode === 'none' && (
            <>
              <button
                onClick={() => setMode('queue')}
                className="text-xs px-2.5 py-1.5 rounded border border-line text-muted hover:text-cream hover:border-brass/60"
              >
                Select tracks to play
              </button>
              {isAdmin && (
                <button
                  onClick={() => setMode('delete')}
                  className="text-xs px-2.5 py-1.5 rounded border border-line text-muted hover:text-cream hover:border-brass/60"
                >
                  Select to delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="text-sm text-muted text-center py-10">
          No tracks yet. {isAdmin ? 'Upload some above to get started.' : 'Check back soon.'}
        </p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              view="grid"
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onDownload={onDownload}
              downloadDisabled={!!downloadingId}
              selectable={mode !== 'none'}
              selected={mode === 'queue' ? orderOf(track) != null : deleteSelectedIds.has(track.id)}
              orderNumber={mode === 'queue' ? orderOf(track) : null}
              onToggleSelect={mode === 'queue' ? toggleQueueSelect : toggleDeleteSelect}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              view="list"
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onDownload={onDownload}
              downloadDisabled={!!downloadingId}
              selectable={mode !== 'none'}
              selected={mode === 'queue' ? orderOf(track) != null : deleteSelectedIds.has(track.id)}
              orderNumber={mode === 'queue' ? orderOf(track) : null}
              onToggleSelect={mode === 'queue' ? toggleQueueSelect : toggleDeleteSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ViewButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
        active ? 'bg-brass text-ink' : 'text-muted hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}
