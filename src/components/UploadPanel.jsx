import { useRef, useState } from 'react'

export default function UploadPanel({ uploadBulk }) {
  const audioInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const [audioFiles, setAudioFiles] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [progressLog, setProgressLog] = useState({})
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState(null)

  function handleAudioChange(e) {
    setAudioFiles(Array.from(e.target.files))
    setSummary(null)
  }
  function handleImageChange(e) {
    setImageFiles(Array.from(e.target.files))
  }

  async function handleUpload() {
    if (audioFiles.length === 0) return
    setBusy(true)
    setSummary(null)
    setProgressLog({})

    const imageMap = new Map()
    imageFiles.forEach((f) => imageMap.set(f.name.replace(/\.[^.]+$/, ''), f))

    const results = await uploadBulk(audioFiles, imageMap, (name, status) => {
      setProgressLog((prev) => ({ ...prev, [name]: status }))
    })

    setBusy(false)
    setSummary(results)
    setAudioFiles([])
    setImageFiles([])
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  return (
    <div className="w-full bg-surface border border-line rounded-xl p-4 mb-5">
      <p className="font-display text-sm mb-1">Add music</p>
      <p className="text-xs text-muted mb-3">
        Select one or more audio files. Titles and artists are read from each file's tags
        automatically. Optionally add matching cover images — name an image the same as its
        audio file (e.g. "song.mp3" + "song.jpg") to pair them; unmatched tracks show a CD by
        default.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <label className="flex-1 text-xs">
          <span className="block mb-1 text-muted">Audio files</span>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleAudioChange}
            className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:bg-brass file:text-ink file:text-xs file:cursor-pointer cursor-pointer"
          />
        </label>
        <label className="flex-1 text-xs">
          <span className="block mb-1 text-muted">Cover images (optional)</span>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:bg-surface2 file:text-cream file:text-xs file:cursor-pointer cursor-pointer"
          />
        </label>
      </div>

      {audioFiles.length > 0 && (
        <p className="text-xs text-muted mb-2">
          {audioFiles.length} audio file{audioFiles.length > 1 ? 's' : ''} ready
          {imageFiles.length > 0 ? `, ${imageFiles.length} image(s) to match` : ''}.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={audioFiles.length === 0 || busy}
        className="text-sm px-4 py-2 rounded-lg bg-brass text-ink font-medium hover:bg-brassLight disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy ? 'Uploading…' : 'Upload'}
      </button>

      {Object.keys(progressLog).length > 0 && (
        <ul className="mt-3 space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
          {Object.entries(progressLog).map(([name, status]) => (
            <li key={name} className="text-muted truncate">
              {name}: <span className={status === 'done' ? 'text-teal' : ''}>{status}</span>
            </li>
          ))}
        </ul>
      )}

      {summary && (
        <p className="mt-2 text-xs text-muted">
          Done — {summary.filter((r) => r.ok).length} added
          {summary.some((r) => !r.ok) &&
            `, ${summary.filter((r) => !r.ok).length} failed (${summary
              .filter((r) => !r.ok)
              .map((r) => r.name)
              .join(', ')})`}
          .
        </p>
      )}
    </div>
  )
}
