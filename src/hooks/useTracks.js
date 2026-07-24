import { useCallback, useEffect, useState } from 'react'
import { supabase, AUDIO_BUCKET, IMAGES_BUCKET, publicUrlFor } from '../supabaseClient'
import { extractTrackInfo } from '../lib/metadata'

function withUrls(row) {
  return {
    ...row,
    audioUrl: publicUrlFor(AUDIO_BUCKET, row.audio_path),
    imageUrl: row.image_path ? publicUrlFor(IMAGES_BUCKET, row.image_path) : null,
  }
}

export function useTracks() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTracks(data.map(withUrls))
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Uploads one file (plus optional matching cover image) and inserts its row.
  // Reports progress via onProgress(fileName, status).
  const uploadOne = useCallback(async (audioFile, imageFile, onProgress) => {
    onProgress?.(audioFile.name, 'reading tags…')
    const { title, artist, durationSeconds, embeddedArt } = await extractTrackInfo(audioFile)

    const stamp = Date.now()
    const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const audioPath = `${stamp}-${safeName}`

    onProgress?.(audioFile.name, 'uploading audio…')
    const { error: audioErr } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(audioPath, audioFile, { cacheControl: '3600', upsert: false })
    if (audioErr) throw new Error(`${audioFile.name}: ${audioErr.message}`)

    let imagePath = null
    const artToUpload = imageFile || embeddedArt
    if (artToUpload) {
      onProgress?.(audioFile.name, 'uploading artwork…')
      const ext = imageFile ? imageFile.name.split('.').pop() : (artToUpload.type.split('/')[1] || 'jpg')
      imagePath = `${stamp}-${safeName}.${ext}`
      const { error: imgErr } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(imagePath, artToUpload, { cacheControl: '3600', upsert: false })
      if (imgErr) {
        // Artwork failing shouldn't block the track — it just falls back to the CD.
        console.warn('Artwork upload failed, continuing without it:', imgErr.message)
        imagePath = null
      }
    }

    onProgress?.(audioFile.name, 'saving…')
    const { error: insertErr } = await supabase.from('tracks').insert({
      title,
      artist,
      duration_seconds: durationSeconds,
      audio_path: audioPath,
      image_path: imagePath,
    })
    if (insertErr) throw new Error(`${audioFile.name}: ${insertErr.message}`)

    onProgress?.(audioFile.name, 'done')
  }, [])

  // Bulk upload: audioFiles is a FileList/array; imageFiles is an optional
  // map of audio filename -> matching image File (same base filename).
  const uploadBulk = useCallback(async (audioFiles, imageFilesByBaseName, onProgress) => {
    const results = []
    for (const file of audioFiles) {
      const base = file.name.replace(/\.[^.]+$/, '')
      const matchingImage = imageFilesByBaseName?.get(base) || null
      try {
        await uploadOne(file, matchingImage, onProgress)
        results.push({ name: file.name, ok: true })
      } catch (err) {
        results.push({ name: file.name, ok: false, error: err.message })
      }
    }
    await refresh()
    return results
  }, [uploadOne, refresh])

  const deleteBulk = useCallback(async (trackRows) => {
    const audioPaths = trackRows.map((t) => t.audio_path).filter(Boolean)
    const imagePaths = trackRows.map((t) => t.image_path).filter(Boolean)

    if (audioPaths.length) {
      await supabase.storage.from(AUDIO_BUCKET).remove(audioPaths)
    }
    if (imagePaths.length) {
      await supabase.storage.from(IMAGES_BUCKET).remove(imagePaths)
    }
    const ids = trackRows.map((t) => t.id)
    const { error } = await supabase.from('tracks').delete().in('id', ids)
    if (error) throw new Error(error.message)
    await refresh()
  }, [refresh])

  return { tracks, loading, error, refresh, uploadBulk, deleteBulk }
}
