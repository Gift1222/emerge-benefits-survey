import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #fafaf8; --surface: #ffffff; --border: rgba(0,0,0,0.12);
    --border-strong: rgba(0,0,0,0.2); --text: #1a1a18; --muted: #6b6b67;
    --hint: #9e9e9a; --accent: #1a1a18; --accent-inv: #ffffff;
    --error-bg: #fef2f2; --error-border: #fca5a5; --error-text: #991b1b;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #141412; --surface: #1e1e1b; --border: rgba(255,255,255,0.1);
      --border-strong: rgba(255,255,255,0.2); --text: #f0f0ec;
      --muted: #9e9e9a; --hint: #6b6b67; --accent: #f0f0ec; --accent-inv: #141412;
      --error-bg: #2d0a0a; --error-border: #7f1d1d; --error-text: #fca5a5;
    }
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 400px; }
  .org-mark { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 7px; }
  .org-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); }
  h1 { font-family: 'DM Serif Display', serif; font-size: 22px; font-weight: 400; margin-bottom: 0.4rem; }
  .subtitle { font-size: 13px; color: var(--muted); margin-bottom: 2rem; }
  .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  label { font-size: 13px; color: var(--muted); }
  input { font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 9px 11px; border: 0.5px solid var(--border-strong); border-radius: 8px; background: var(--bg); color: var(--text); width: 100%; }
  input:focus { outline: none; border-color: var(--text); box-shadow: 0 0 0 2px rgba(0,0,0,0.06); }
  .btn { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 11px; background: var(--accent); color: var(--accent-inv); border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 8px; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.82; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .error { background: var(--error-bg); border: 0.5px solid var(--error-border); color: var(--error-text); border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px; }
`

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="card">
        <div className="org-mark"><span className="org-dot" />Emerge · Livelihoods</div>
        <h1>Admin Sign In</h1>
        <p className="subtitle">Access the Benefits Review Dashboard</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@emergelivelihoods.org" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </>
  )
}
