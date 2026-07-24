import { useCallback, useState } from 'react'

// Enforces "one download at a time": while a download is in flight, every
// consumer of this hook sees downloadingId set and can disable its button.
export function useDownloader() {
  const [downloadingId, setDownloadingId] = useState(null)

  const downloadTrack = useCallback(async (track) => {
    if (downloadingId) return // a download is already running
    setDownloadingId(track.id)
    try {
      const res = await fetch(track.audioUrl)
      const blob = await res.blob()
      const ext = guessExtension(track.audio_path)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sanitize(track.title)}${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingId(null)
    }
  }, [downloadingId])

  return { downloadTrack, downloadingId }
}

function sanitize(name) {
  return (name || 'track').replace(/[^a-zA-Z0-9._ -]/g, '_')
}
function guessExtension(path) {
  const m = /\.[a-zA-Z0-9]+$/.exec(path || '')
  return m ? m[0] : '.mp3'
}
