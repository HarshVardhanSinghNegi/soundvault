import { useEffect, useRef, useState } from 'react'
import CDArt from './CDArt'
import Visualizer from './Visualizer'
import { formatDuration } from '../lib/metadata'

export default function Player({
  track,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrev,
  visualizerMode,
  setVisualizerMode,
  downloadTrack,
  downloadingId,
  queueInfo,
}) {
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)

  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)

  // Wire up the Web Audio graph exactly once per <audio> element instance.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (sourceNodeRef.current) return // already wired

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    const source = ctx.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    sourceNodeRef.current = source

    // No cleanup that closes the context: this player is a page-lifetime
    // singleton, and createMediaElementSource can only ever be called once
    // per <audio> element. Closing here also fires during React
    // StrictMode's dev-mode double-invoke of effects, which left the refs
    // pointing at an already-closed, unresumable AudioContext.
  }, [])

  // Load a new track source when it changes.
  useEffect(() => {
    if (!track || !audioRef.current) return
    audioRef.current.src = track.audioUrl
    setProgress(0)
    setDuration(0)
    if (isPlaying) {
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
      audioRef.current.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [isPlaying, track])

  // Must run inside the click handler itself (not an effect) — some browsers
  // only treat AudioContext.resume() as allowed when it's called synchronously
  // in direct response to a user gesture like a click.
  function handleTogglePlay() {
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    setIsPlaying((p) => !p)
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function handleTimeUpdate() {
    setProgress(audioRef.current.currentTime)
  }
  function handleLoadedMetadata() {
    setDuration(audioRef.current.duration)
  }
  function handleSeek(e) {
    const value = Number(e.target.value)
    audioRef.current.currentTime = value
    setProgress(value)
  }

  const hasTrack = !!track

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext}
        preload="metadata"
      />
      <div className="w-full md:w-1/3 md:min-w-[420px] mx-auto px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3">
          <CDArt imageUrl={track?.imageUrl} title={track?.title} spinning={isPlaying} size="sm" />

          <div className="min-w-0 flex-1">
            <p className="font-display text-sm sm:text-base truncate leading-tight">
              {track?.title || 'Nothing playing'}
            </p>
            <p className="text-xs text-muted truncate">{track?.artist || 'Pick a track below'}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <IconButton label="Previous track" onClick={onPrev} disabled={!hasTrack}>
              <PrevIcon />
            </IconButton>
            <IconButton
              label={isPlaying ? 'Pause' : 'Play'}
              onClick={handleTogglePlay}
              disabled={!hasTrack}
              primary
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton label="Next track" onClick={onNext} disabled={!hasTrack}>
              <NextIcon />
            </IconButton>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted w-8 text-right">
            {formatDuration(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            disabled={!hasTrack}
            className="flex-1 accent-brass h-1"
          />
          <span className="font-mono text-[10px] text-muted w-8">
            {formatDuration(duration)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="h-9 flex-1 rounded bg-ink/60 overflow-hidden">
            <Visualizer analyser={analyserRef.current} mode={visualizerMode} active={isPlaying} />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ToggleChip active={visualizerMode === 'bars'} onClick={() => setVisualizerMode('bars')}>
              Bars
            </ToggleChip>
            <ToggleChip active={visualizerMode === 'wave'} onClick={() => setVisualizerMode('wave')}>
              Wave
            </ToggleChip>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <VolumeIcon />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 accent-brass h-1"
            />
          </div>

          {hasTrack && (
            <button
              type="button"
              onClick={() => downloadTrack(track)}
              disabled={!!downloadingId}
              className="shrink-0 text-muted hover:text-brass transition-colors disabled:opacity-30"
              aria-label="Download this track"
              title={downloadingId ? 'A download is already in progress' : 'Download'}
            >
              <DownloadIcon />
            </button>
          )}
        </div>

        {queueInfo && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wide">
              Playing {queueInfo.count} selected track{queueInfo.count > 1 ? 's' : ''}
            </span>
            <button
              onClick={queueInfo.onExit}
              className="text-[10px] font-mono text-brass hover:text-brassLight uppercase tracking-wide"
            >
              Exit queue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function IconButton({ children, label, onClick, disabled, primary }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        primary ? 'bg-brass text-ink hover:bg-brassLight' : 'text-cream hover:bg-surface2'
      }`}
    >
      {children}
    </button>
  )
}

function ToggleChip({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wide transition-colors ${
        active ? 'bg-brass text-ink' : 'text-muted hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}
function PrevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zM20 6v12l-10-6z" />
    </svg>
  )
}
function NextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 6h2v12h-2zM4 6v12l10-6z" />
    </svg>
  )
}
function VolumeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted">
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.6l3.3-3.3 1.4 1.4L12 17l-4.7-5.3 1.4-1.4L12 13.6V3zM5 19h14v2H5z" />
    </svg>
  )
}
