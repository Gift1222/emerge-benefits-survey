import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const BENEFITS = [
  'Salary',
  'Medical insurance / allowance',
  'Transport allowance',
  'Lunch allowance',
  'Housing allowance',
  'Professional / capacity development',
  'Staff savings & credit scheme',
  'Overtime pay',
  'Annual leave',
  'Maternity / paternity leave',
  'Baby care facility for nursing mothers',
  'Sick leave',
  'Bereavement contributions',
  'Bereavement leave',
  'Weekly day off',
  'Birthday recognition / day off',
  'Rewards & recognition for best performers',
  'Staff retreats',
  'Staff workshops / seminars',
  'Contribution to staff parties (weddings, introductions, etc.)',
]

const SCALE = [
  { n: 0, label: 'Non-existent' },
  { n: 1, label: 'Poor' },
  { n: 2, label: 'Fair / needs improvement' },
  { n: 3, label: 'Good' },
  { n: 4, label: 'Very good' },
  { n: 5, label: 'Outstanding' },
]

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #fafaf8; --surface: #ffffff; --surface2: #f5f4f1;
  --border: rgba(0,0,0,0.1); --border-strong: rgba(0,0,0,0.2);
  --text: #1a1a18; --muted: #6b6b67; --hint: #9e9e9a;
  --accent: #1a1a18; --accent-inv: #ffffff;
  --success-bg: #eaf3de; --success-border: #639922; --success-text: #3b6d11;
  --error-bg: #fef2f2; --error-border: #fca5a5; --error-text: #991b1b;
  --radius: 8px; --radius-lg: 12px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141412; --surface: #1e1e1b; --surface2: #272724;
    --border: rgba(255,255,255,0.1); --border-strong: rgba(255,255,255,0.2);
    --text: #f0f0ec; --muted: #9e9e9a; --hint: #6b6b67;
    --accent: #f0f0ec; --accent-inv: #141412;
    --success-bg: #173404; --success-border: #639922; --success-text: #c0dd97;
    --error-bg: #2d0a0a; --error-border: #7f1d1d; --error-text: #fca5a5;
  }
}
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 2rem 1rem 4rem; line-height: 1.6; }
.page-wrap { max-width: 720px; margin: 0 auto; }
.header { margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-strong); }
.org-mark { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }
.org-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
h1 { font-family: 'DM Serif Display', serif; font-size: 28px; font-weight: 400; line-height: 1.2; color: var(--text); margin-bottom: 0.75rem; }
.intro { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 580px; }
.section { margin-bottom: 2.5rem; }
.section-title { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 0.5px solid var(--border); }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; color: var(--muted); }
.field input, .field select { font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 9px 11px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); color: var(--text); width: 100%; transition: border-color 0.15s, box-shadow 0.15s; -webkit-appearance: none; }
.field input:focus, .field select:focus { outline: none; border-color: var(--text); box-shadow: 0 0 0 2px rgba(0,0,0,0.06); }
.field select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b67' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
.scale-legend { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 1.25rem; }
.scale-item { background: var(--surface2); border-radius: var(--radius); padding: 8px 4px; text-align: center; }
.scale-num { font-size: 16px; font-weight: 500; color: var(--text); display: block; }
.scale-lbl { font-size: 11px; color: var(--muted); line-height: 1.3; margin-top: 2px; display: block; }
.benefits-table { width: 100%; border-collapse: collapse; }
.benefits-table thead th { font-size: 12px; font-weight: 500; color: var(--muted); text-align: center; padding: 6px 4px 10px; border-bottom: 0.5px solid var(--border-strong); }
.benefits-table thead th:first-child { text-align: left; padding-left: 0; }
.benefits-table tbody tr { border-bottom: 0.5px solid var(--border); transition: background 0.1s; }
.benefits-table tbody tr:last-child { border-bottom: none; }
.benefits-table tbody tr:hover { background: var(--surface2); }
.benefits-table td { padding: 10px 4px; vertical-align: middle; }
.benefits-table td:first-child { font-size: 14px; color: var(--text); padding-left: 0; padding-right: 12px; }
.rating-cell { text-align: center; }
.rating-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; font-size: 13px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--border-strong); color: var(--muted); transition: all 0.15s; background: none; font-family: 'DM Sans', sans-serif; }
.rating-btn:hover { background: var(--surface2); color: var(--text); }
.rating-btn.selected { background: var(--accent); color: var(--accent-inv); border-color: var(--accent); }
.add-row-btn { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--muted); background: none; border: 0.5px dashed var(--border-strong); border-radius: var(--radius); padding: 8px 14px; cursor: pointer; margin-top: 10px; width: 100%; transition: background 0.15s; }
.add-row-btn:hover { background: var(--surface2); color: var(--text); }
.priorities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.priority-field { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); }
.priority-num { font-size: 12px; font-weight: 500; color: var(--hint); min-width: 16px; }
.priority-field select { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--text); padding: 0; -webkit-appearance: none; }
.priority-field select:focus { outline: none; }
.salary-options { display: flex; gap: 12px; }
.salary-opt { flex: 1; }
.salary-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px 8px; border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s; font-size: 12px; color: var(--muted); gap: 4px; background: var(--surface); width: 100%; font-family: 'DM Sans', sans-serif; }
.salary-card:hover { background: var(--surface2); }
.salary-card.selected { border: 1.5px solid var(--accent); background: var(--surface2); }
.pct { font-size: 26px; font-weight: 500; color: var(--text); }
textarea { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text); background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius); padding: 11px 12px; resize: vertical; min-height: 100px; line-height: 1.6; width: 100%; transition: border-color 0.15s; }
textarea:focus { outline: none; border-color: var(--text); }
textarea::placeholder { color: var(--hint); }
.submit-row { display: flex; align-items: center; justify-content: space-between; padding-top: 1.5rem; border-top: 0.5px solid var(--border); margin-top: 0.5rem; }
.progress-text { font-size: 13px; color: var(--muted); }
.progress-text strong { color: var(--text); }
.submit-btn { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 11px 32px; background: var(--accent); color: var(--accent-inv); border: none; border-radius: var(--radius); cursor: pointer; transition: opacity 0.15s; }
.submit-btn:hover { opacity: 0.82; }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.success-banner { background: var(--success-bg); border: 0.5px solid var(--success-border); border-radius: var(--radius-lg); padding: 2rem; text-align: center; color: var(--success-text); margin-top: 1.5rem; }
.check-icon { font-size: 40px; margin-bottom: 0.75rem; }
.error-banner { background: var(--error-bg); border: 0.5px solid var(--error-border); color: var(--error-text); border-radius: var(--radius-lg); padding: 1rem 1.25rem; font-size: 14px; margin-top: 1rem; }
.form-footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 0.5px solid var(--border); display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: var(--hint); }
.footer-credit { line-height: 1.6; }
.footer-credit strong { font-weight: 500; color: var(--muted); }
@media (max-width: 540px) {
  .field-grid, .field-grid-3 { grid-template-columns: 1fr; }
  .scale-legend { grid-template-columns: repeat(3, 1fr); }
  .priorities-grid { grid-template-columns: 1fr; }
  .salary-options { flex-direction: column; }
  .submit-row { flex-direction: column; gap: 12px; align-items: stretch; }
  .submit-btn { text-align: center; }
  h1 { font-size: 22px; }
  body { padding: 1.25rem 1rem 3rem; }
  .benefits-table thead th:not(:first-child) { font-size: 11px; padding: 6px 2px; }
  .rating-btn { width: 28px; height: 28px; font-size: 12px; }
}
`

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th']

export default function SurveyForm() {
  const [employee, setEmployee] = useState({
    name: '', employmentType: '', programme: '', department: '',
    yearsAtEmerge: '', from: '', to: '', grossPay: '', netPay: '',
  })
  const [ratings, setRatings] = useState({})
  const [priorities, setPriorities] = useState(['', '', '', '', '', ''])
  const [salaryIncrement, setSalaryIncrement] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [customBenefits, setCustomBenefits] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const allBenefits = [...BENEFITS, ...customBenefits]
  const ratedCount = allBenefits.filter(b => ratings[b] !== undefined).length

  function addCustomBenefit() {
    const name = window.prompt('Enter the name of the benefit:')
    if (name && name.trim()) setCustomBenefits(prev => [...prev, name.trim()])
  }

  function setRating(benefit, value) {
    setRatings(prev => ({ ...prev, [benefit]: value }))
  }

  function setPriority(index, value) {
    setPriorities(prev => { const next = [...prev]; next[index] = value; return next })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const payload = {
      employee,
      ratings,
      priorities: priorities.filter(Boolean),
      salary_increment: salaryIncrement || null,
      recommendations: recommendations || null,
      suggestions: suggestions || null,
    }
    const { error } = await supabase.from('responses').insert([payload])
    if (error) {
      setError('Something went wrong. Please try again. (' + error.message + ')')
      setSubmitting(false)
    } else {
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (submitted) {
    return (
      <>
        <style>{css}</style>
        <div className="page-wrap">
          <div className="header">
            <div className="org-mark"><span className="org-dot" />Emerge · Livelihoods</div>
            <h1>Employee Benefits Review Form</h1>
          </div>
          <div className="success-banner">
            <div className="check-icon">✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: '0.4rem' }}>Review submitted</h2>
            <p style={{ fontSize: 14, opacity: 0.85 }}>
              Thank you — your employee benefits review has been received. Your feedback helps shape a better workplace for everyone at Emerge.
            </p>
          </div>
          <div className="form-footer">
            <div className="footer-credit">
              <strong>Review facilitated by:</strong><br />
              Lillian Nabirye — WUSC Volunteer &nbsp;·&nbsp; Chitty — Human Resources Coordinator, Emerge Livelihoods
            </div>
            <div>Emerge Livelihoods · Malawi</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <div className="page-wrap">

        {/* Header */}
        <div className="header">
          <div className="org-mark"><span className="org-dot" />Emerge · Livelihoods</div>
          <h1>Employee Benefits Review Form</h1>
          <p className="intro">
            This review is an intentional activity aimed at improving the quality and nature of our organisational offerings.
            We appreciate your clarity and honesty as we strive to build a thriving, self-reliant ecosystem in Malawi and beyond.
          </p>
        </div>

        {/* Employee Information */}
        <div className="section">
          <p className="section-title">Employee information</p>
          <div className="field-grid">
            <div className="field">
              <label>Name and title <em style={{ fontStyle: 'normal', color: 'var(--hint)' }}>(optional)</em></label>
              <input type="text" placeholder="e.g. Jane Banda, Programme Officer"
                value={employee.name} onChange={e => setEmployee(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Nature of employment</label>
              <select value={employee.employmentType} onChange={e => setEmployee(p => ({ ...p, employmentType: e.target.value }))}>
                <option value="">Select type…</option>
                <option>Permanent</option><option>Temporary</option>
                <option>Contract</option><option>Volunteer</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label>Programme</label>
              <select value={employee.programme} onChange={e => setEmployee(p => ({ ...p, programme: e.target.value }))}>
                <option value="">Select programme…</option>
                <option>Livelihoods</option><option>Ventures</option><option>Fund</option><option>Other</option>
              </select>
            </div>
            <div className="field">
              <label>Department</label>
              <input type="text" placeholder="e.g. Finance, Operations…"
                value={employee.department} onChange={e => setEmployee(p => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
          <div className="field-grid-3">
            <div className="field">
              <label>Years at Emerge</label>
              <input type="number" min="0" max="50" placeholder="e.g. 3"
                value={employee.yearsAtEmerge} onChange={e => setEmployee(p => ({ ...p, yearsAtEmerge: e.target.value }))} />
            </div>
            <div className="field">
              <label>From</label>
              <input type="month" value={employee.from} onChange={e => setEmployee(p => ({ ...p, from: e.target.value }))} />
            </div>
            <div className="field">
              <label>To</label>
              <input type="month" value={employee.to} onChange={e => setEmployee(p => ({ ...p, to: e.target.value }))} />
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label>Gross pay (MWK)</label>
              <input type="text" placeholder="e.g. 250,000"
                value={employee.grossPay} onChange={e => setEmployee(p => ({ ...p, grossPay: e.target.value }))} />
            </div>
            <div className="field">
              <label>Net pay (MWK)</label>
              <input type="text" placeholder="e.g. 215,000"
                value={employee.netPay} onChange={e => setEmployee(p => ({ ...p, netPay: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Benefits Rating */}
        <div className="section">
          <p className="section-title">Benefits rating</p>
          <div className="scale-legend">
            {SCALE.map(s => (
              <div key={s.n} className="scale-item">
                <span className="scale-num">{s.n}</span>
                <span className="scale-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <table className="benefits-table">
            <thead>
              <tr>
                <th>Benefit</th>
                {SCALE.map(s => <th key={s.n}>{s.n}</th>)}
              </tr>
            </thead>
            <tbody>
              {allBenefits.map(benefit => (
                <tr key={benefit}>
                  <td>{benefit}</td>
                  {SCALE.map(s => (
                    <td key={s.n} className="rating-cell">
                      <button
                        className={`rating-btn${ratings[benefit] === s.n ? ' selected' : ''}`}
                        onClick={() => setRating(benefit, s.n)}
                        type="button"
                        aria-label={`Rate ${benefit} as ${s.n}`}
                      >
                        {s.n}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row-btn" type="button" onClick={addCustomBenefit}>
            + Add another benefit
          </button>
        </div>

        {/* Priorities */}
        <div className="section">
          <p className="section-title">Top 6 priority benefits</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            From the list above, select your six most important benefits in order of priority.
          </p>
          <div className="priorities-grid">
            {priorities.map((val, i) => (
              <div key={i} className="priority-field">
                <span className="priority-num">{ORDINALS[i]}</span>
                <select value={val} onChange={e => setPriority(i, e.target.value)}>
                  <option value="">Choose benefit…</option>
                  {allBenefits.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Increment */}
        <div className="section">
          <p className="section-title">Salary increment recommendation</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            Given the current organisational position, your experience, and role obligations, what percentage increment would you recommend to management?
          </p>
          <div className="salary-options">
            {[{ v: '5%', label: 'Modest' }, { v: '10%', label: 'Moderate' }, { v: '15%', label: 'Significant' }].map(opt => (
              <div key={opt.v} className="salary-opt">
                <button
                  type="button"
                  className={`salary-card${salaryIncrement === opt.v ? ' selected' : ''}`}
                  onClick={() => setSalaryIncrement(opt.v)}
                >
                  <span className="pct">{opt.v}</span>
                  {opt.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="section">
          <p className="section-title">Recommendations for improvement</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            From your ratings above, what would be your recommendations for improvement on the weaker areas?
          </p>
          <textarea
            placeholder="Share your thoughts on areas that need attention…"
            value={recommendations}
            onChange={e => setRecommendations(e.target.value)}
          />
        </div>

        {/* Suggestions */}
        <div className="section">
          <p className="section-title">Any other suggestions</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            Any other suggestions you would like management to take into consideration regarding employee benefits.
          </p>
          <textarea
            placeholder="Share any additional suggestions…"
            value={suggestions}
            onChange={e => setSuggestions(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="submit-row">
          <p className="progress-text">
            Rated <strong>{ratedCount}</strong> of <strong>{allBenefits.length}</strong> benefits
          </p>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting} type="button">
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-footer">
          <div className="footer-credit">
            <strong>Review facilitated by:</strong><br />
            Lillian Nabirye — WUSC Volunteer &nbsp;·&nbsp; Chitty — Human Resources Coordinator, Emerge Livelihoods
          </div>
          <div>Emerge Livelihoods · Malawi</div>
        </div>
      </div>
    </>
  )
}
