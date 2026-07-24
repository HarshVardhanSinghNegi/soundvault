# SoundVault

A personal music player site: upload audio (title/artist read straight from
each file's tags), show cover art or a spinning CD when there isn't any,
listen with a fixed player that has a bars/waveform visualizer, and let
visitors download tracks one at a time. Only you (the signed-in admin) can
upload or delete music, in bulk.

This README covers **local setup only**. Ask separately when you're ready
for the Netlify deployment guide.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project.
2. Once it's ready, open **Project Settings → API**. You'll need the
   **Project URL** and the **anon public** key in step 4.

## 2. Create the database table

Open the **SQL Editor** in Supabase and run:

```sql
create table tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  duration_seconds int,
  audio_path text not null,
  image_path text,
  created_at timestamptz not null default now()
);

alter table tracks enable row level security;

-- Anyone can see the track list
create policy "Public can view tracks"
  on tracks for select
  using (true);

-- Only a signed-in (admin) user can add or remove tracks
create policy "Authenticated can insert tracks"
  on tracks for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can delete tracks"
  on tracks for delete
  using (auth.role() = 'authenticated');
```

## 3. Create storage buckets

In **Storage**, create two buckets:

- `audio` — Public bucket
- `artwork` — Public bucket

Then, back in the **SQL Editor**, add matching policies so anyone can
listen/view artwork, but only a signed-in user can upload or delete:

```sql
create policy "Public read audio"
  on storage.objects for select
  using (bucket_id = 'audio');

create policy "Authenticated upload audio"
  on storage.objects for insert
  with check (bucket_id = 'audio' and auth.role() = 'authenticated');

create policy "Authenticated delete audio"
  on storage.objects for delete
  using (bucket_id = 'audio' and auth.role() = 'authenticated');

create policy "Public read artwork"
  on storage.objects for select
  using (bucket_id = 'artwork');

create policy "Authenticated upload artwork"
  on storage.objects for insert
  with check (bucket_id = 'artwork' and auth.role() = 'authenticated');

create policy "Authenticated delete artwork"
  on storage.objects for delete
  using (bucket_id = 'artwork' and auth.role() = 'authenticated');
```

## 4. Create yourself as the one admin account

The site treats **anyone who can sign in** as the admin — so make sure only
you can:

1. Go to **Authentication → Providers → Email** and turn **off** "Allow new
   users to sign up." This stops anyone else from registering.
2. Go to **Authentication → Users → Add user**, and create an account with
   your own email and a password. This is the account you'll use to sign in
   as admin on the site (there's an "Admin sign in" link in the top right).

## 5. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and fill in your Project URL and anon key from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 6. Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Sign in as admin
(top right) to see the upload panel and bulk-delete controls. Everyone else
just sees the player and can play/download tracks.

## How it's organized

- `src/App.jsx` — page layout and shared player state (current track, queue, play/pause)
- `src/components/Player.jsx` — the fixed player bar, audio element, and visualizer controls
- `src/components/Visualizer.jsx` — canvas bars/waveform renderer driven by the Web Audio API
- `src/components/TrackList.jsx` / `TrackCard.jsx` — grid/list views, admin bulk-select
- `src/components/UploadPanel.jsx` — admin bulk upload (matches images to audio by filename)
- `src/components/CDArt.jsx` — the spinning vinyl fallback for tracks with no cover image
- `src/components/AdSpace.jsx` — placeholder ad columns (wide screens only for now)
- `src/hooks/useTracks.js` — reads/writes the `tracks` table and storage buckets
- `src/hooks/useAuth.js` — admin sign-in/out via Supabase Auth
- `src/hooks/useDownloader.js` — enforces one download at a time
- `src/lib/metadata.js` — reads title/artist tags out of uploaded audio files

## Notes on behavior

- **Uploads**: pick multiple audio files at once. If you also pick matching
  images (same filename, e.g. `song.mp3` + `song.jpg`), they're paired up
  automatically. If a track has embedded cover art in its tags and you don't
  supply an image, that embedded art is used instead. No image at all → the
  track shows a generated CD/vinyl icon.
- **Downloads**: any visitor can download any track, but only one download
  runs at a time site-wide — the download buttons disable themselves while
  one is in progress.
- **Custom play order**: anyone can click "Select tracks to play," tap tracks
  in the order they want to hear them (each gets a numbered badge), then hit
  "Play selected." The player then only plays those tracks, in that exact
  order, looping back to the first when it reaches the end. A small
  "Exit queue" link in the player returns to browsing/playing the full
  library normally.
- **Views**: the grid view shows large CD/thumbnail art (5 columns down to 3
  depending on screen width) with the title below; list view shows a small
  thumbnail followed by the title. Both stay within the player's width.
- **Responsive**: the player and track list are pinned to 1/3 of the screen
  width on desktop, and expand to full width on phones.
