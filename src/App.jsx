import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTracks } from './hooks/useTracks'
import { useDownloader } from './hooks/useDownloader'
import Player from './components/Player'
import TrackList from './components/TrackList'
import UploadPanel from './components/UploadPanel'
import AdminLogin from './components/AdminLogin'
import AdSpace from './components/AdSpace'
import AdUnit from './components/AdUnit'

export default function App() {
  const { isAdmin, signIn, signOut } = useAuth()
  const { tracks, loading, error, uploadBulk, deleteBulk } = useTracks()
  const { downloadTrack, downloadingId } = useDownloader()

  const [currentIndex, setCurrentIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [visualizerMode, setVisualizerMode] = useState('bars')
  // null = playing through the full library in list order; otherwise this is
  // the exact ordered set of tracks the person picked to play.
  const [customQueue, setCustomQueue] = useState(null)

  const activeQueue = customQueue || tracks
  const currentTrack = currentIndex != null ? activeQueue[currentIndex] : null

  function playTrack(track) {
    const idx = tracks.findIndex((t) => t.id === track.id)
    if (idx === -1) return
    const alreadyOnThisTrack = customQueue == null && idx === currentIndex
    // A plain click on a track (outside of "select tracks to play" mode)
    // always plays through the full library, starting from that track.
    setCustomQueue(null)
    if (alreadyOnThisTrack) {
      setIsPlaying((p) => !p)
    } else {
      setCurrentIndex(idx)
      setIsPlaying(true)
    }
  }

  function playQueue(selectedTracks) {
    if (selectedTracks.length === 0) return
    setCustomQueue(selectedTracks)
    setCurrentIndex(0)
    setIsPlaying(true)
  }

  function exitQueue() {
    const playingTrack = currentTrack
    setCustomQueue(null)
    if (playingTrack) {
      const idx = tracks.findIndex((t) => t.id === playingTrack.id)
      setCurrentIndex(idx === -1 ? null : idx)
    }
  }

  function goNext() {
    if (activeQueue.length === 0) return
    setCurrentIndex((prev) => {
      const base = prev == null ? -1 : prev
      return (base + 1) % activeQueue.length
    })
    setIsPlaying(true)
  }

  function goPrev() {
    if (activeQueue.length === 0) return
    setCurrentIndex((prev) => {
      const base = prev == null ? 0 : prev
      return (base - 1 + activeQueue.length) % activeQueue.length
    })
    setIsPlaying(true)
  }

  async function handleDeleteSelected(selected) {
    await deleteBulk(selected)
    setCustomQueue(null)
    setCurrentIndex(null)
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen">
      <Player
        track={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={goNext}
        onPrev={goPrev}
        visualizerMode={visualizerMode}
        setVisualizerMode={setVisualizerMode}
        downloadTrack={downloadTrack}
        downloadingId={downloadingId}
        queueInfo={customQueue ? { count: customQueue.length, onExit: exitQueue } : null}
      />

      {/* spacer so content clears the fixed player */}
      <div className="h-[168px] sm:h-[160px]" />

      <div className="flex justify-center items-start gap-4 px-3 pb-16 max-w-[1400px] mx-auto">
        <AdSpace side="left" />

        <main className="w-full md:w-1/3 md:min-w-[420px]">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display text-lg">SoundVault</h1>
          </div>
          <AdminLogin isAdmin={isAdmin} signIn={signIn} signOut={signOut} />

          {isAdmin && <UploadPanel uploadBulk={uploadBulk} />}

          {loading && <p className="text-sm text-muted text-center py-10">Loading tracks…</p>}
          {error && <p className="text-sm text-red-400 text-center py-4">Couldn't load tracks: {error}</p>}

          {!loading && !error && (
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlay={playTrack}
              onPlayQueue={playQueue}
              onDownload={downloadTrack}
              downloadingId={downloadingId}
              isAdmin={isAdmin}
              onDeleteSelected={handleDeleteSelected}
            />
          )}

          <div className="mt-6">
            <AdUnit
              slot={import.meta.env.VITE_ADSENSE_SLOT_BOTTOM}
              className="w-full min-h-[100px]"
            />
          </div>
        </main>

        <AdSpace side="right" />
      </div>
    </div>
  )
}
