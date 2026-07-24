import { useState } from 'react'

export default function AdminLogin({ isAdmin, signIn, signOut }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (isAdmin) {
    return (
      <div className="flex justify-end mb-3">
        <button
          onClick={signOut}
          className="text-xs px-3 py-1.5 rounded border border-line text-muted hover:text-cream hover:border-brass/60"
        >
          Sign out of admin
        </button>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError(error.message)
    else setOpen(false)
  }

  return (
    <div className="flex justify-end mb-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-1.5 rounded border border-line text-muted hover:text-cream hover:border-brass/60"
        >
          Admin sign in
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-1.5 justify-end">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-xs bg-surface border border-line rounded px-2 py-1.5 w-36 focus:border-brass outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-xs bg-surface border border-line rounded px-2 py-1.5 w-28 focus:border-brass outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="text-xs px-2.5 py-1.5 rounded bg-brass text-ink disabled:opacity-40"
          >
            {busy ? '…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs px-2 py-1.5 text-muted hover:text-cream"
          >
            Cancel
          </button>
          {error && <p className="text-xs text-red-400 w-full text-right">{error}</p>}
        </form>
      )}
    </div>
  )
}
