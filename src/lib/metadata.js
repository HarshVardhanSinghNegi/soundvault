import { parseBlob } from 'music-metadata-browser'

// Pulls title/artist tags out of an audio file. Falls back to the
// filename (minus extension) when a file has no usable tags.
export async function extractTrackInfo(file) {
  let title = stripExtension(file.name)
  let artist = ''
  let durationSeconds = null
  let embeddedArt = null

  try {
    const metadata = await parseBlob(file)
    const common = metadata.common || {}
    const format = metadata.format || {}

    if (common.title) title = common.title
    if (common.artist) artist = common.artist
    if (format.duration) durationSeconds = Math.round(format.duration)

    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0]
      embeddedArt = new Blob([pic.data], { type: pic.format || 'image/jpeg' })
    }
  } catch (err) {
    // Tag parsing failed (corrupt tags, unusual format, etc). Not fatal —
    // we already have a filename-based title to fall back on.
    console.warn(`Could not read tags from ${file.name}:`, err)
  }

  return { title, artist, durationSeconds, embeddedArt }
}

function stripExtension(filename) {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(0, idx) : filename
}

export function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
