import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import LOGO from '../assets/emerge-logo.png'

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

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th']

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
body { font-family: Verdana, Geneva, Tahoma, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 0 1rem 4rem; line-height: 1.6; }
.page-wrap { max-width: 720px; margin: 0 auto; }

/* ── Centered header ─────────────────────────────── */
.header { text-align: center; padding: 2.75rem 0 2rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-strong); }
.logo-img { width: 150px; height: auto; margin-bottom: 0.75rem; }
.org-name { font-family: 'DM Serif Display', serif; font-size: 13px; font-weight: 400; color: var(--muted); letter-spacing: 0.04em; margin-bottom: 1.25rem; }
h1 { font-family: 'DM Serif Display', serif; font-size: 26px; font-weight: 400; line-height: 1.2; color: var(--text); margin-bottom: 0.75rem; }
.intro { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 540px; margin: 0 auto; }

.section { margin-bottom: 2.5rem; }
.section-title { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 0.5px solid var(--border); }
.section-desc { font-size: 13px; color: var(--muted); margin-bottom: 14px; line-height: 1.6; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 13px; color: var(--muted); }
.field input, .field textarea { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; padding: 9px 11px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); color: var(--text); width: 100%; transition: border-color 0.15s; -webkit-appearance: none; }
.field input:focus, .field textarea:focus { outline: none; border-color: #4C808A; box-shadow: 0 0 0 2px rgba(76,128,138,0.2); }
.field textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
.field textarea::placeholder { color: var(--hint); }

/* ── Custom dropdown ─────────────────────────────── */
.custom-select { position: relative; width: 100%; }
.custom-select-trigger { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; padding: 9px 32px 9px 11px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); color: var(--text); width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s; user-select: none; }
.custom-select-trigger.placeholder { color: var(--hint); }
.custom-select-trigger:focus { outline: none; border-color: #4C808A; box-shadow: 0 0 0 2px rgba(76,128,138,0.2); }
.custom-select-trigger.open { border-color: #4C808A; box-shadow: 0 0 0 2px rgba(76,128,138,0.2); }
.custom-select-arrow { pointer-events: none; flex-shrink: 0; margin-left: 8px; }
.custom-select-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius); box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; max-height: 220px; overflow-y: auto; }
.custom-select-option { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; padding: 9px 12px; cursor: pointer; color: var(--text); transition: background 0.1s; }
.custom-select-option:hover { background: rgba(76,128,138,0.1); }
.custom-select-option.selected { background: #4C808A; color: #ffffff; }
.custom-select-option.placeholder-opt { color: var(--hint); }

/* ── Priority custom dropdown (compact) ─────────── */
.priority-custom-select { position: relative; flex: 1; }
.priority-custom-trigger { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 13px; padding: 0; background: transparent; border: none; color: #ffffff; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.priority-custom-trigger.placeholder { color: #ffffff; }
.priority-custom-trigger:focus { outline: none; }
.priority-custom-dropdown { position: absolute; top: calc(100% + 8px); left: -42px; right: -12px; background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius); box-shadow: 0 4px 16px rgba(0,0,0,0.12); z-index: 100; max-height: 220px; overflow-y: auto; }
.priority-custom-option { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 13px; padding: 8px 12px; cursor: pointer; color: var(--text); transition: background 0.1s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.priority-custom-option:hover { background: rgba(76,128,138,0.1); }
.priority-custom-option.selected { background: #4C808A; color: #ffffff; }
.priority-custom-option.placeholder-opt { color: var(--hint); }

.scale-legend { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 1.25rem; }
.scale-item { background: #4C808A; border-radius: var(--radius); padding: 8px 4px; text-align: center; }
.scale-num { font-size: 16px; font-weight: 500; color: #ffffff; display: block; }
.scale-lbl { font-size: 11px; color: #ffffff; line-height: 1.3; margin-top: 2px; display: block; }
.benefits-table { width: 100%; border-collapse: collapse; }
.benefits-table thead th { font-size: 12px; font-weight: 500; color: var(--muted); text-align: center; padding: 6px 4px 10px; border-bottom: 0.5px solid var(--border-strong); }
.benefits-table thead th:first-child { text-align: left; padding-left: 0; }
.benefits-table tbody tr { border-bottom: 0.5px solid var(--border); transition: background 0.1s; }
.benefits-table tbody tr:last-child { border-bottom: none; }
.benefits-table tbody tr:hover { background: var(--surface2); }
.benefits-table td { padding: 10px 4px; vertical-align: middle; }
.benefits-table td:first-child { font-size: 14px; color: var(--text); padding-left: 0; padding-right: 12px; }
.rating-cell { text-align: center; }
.rating-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; font-size: 13px; font-weight: 500; cursor: pointer; border: 1.5px solid #4C808A; color: var(--muted); transition: all 0.15s; background: none; font-family: Verdana, Geneva, Tahoma, sans-serif; }
.rating-btn:hover { background: var(--surface2); color: var(--text); }
.rating-btn.selected { background: #4C808A; color: #ffffff; border-color: #4C808A; }
.add-row-btn { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 13px; color: var(--muted); background: none; border: 0.5px dashed var(--border-strong); border-radius: var(--radius); padding: 8px 14px; cursor: pointer; margin-top: 10px; width: 100%; transition: background 0.15s; }
.add-row-btn:hover { background: var(--surface2); color: var(--text); }
.priorities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
.priority-field { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 0.5px solid #4C808A; border-radius: var(--radius); background: #4C808A; position: relative; }
.priority-num { font-size: 12px; font-weight: 500; color: #ffffff; min-width: 16px; }

.salary-options { display: flex; gap: 12px; }
.salary-opt { flex: 1; }
.salary-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 18px 8px; border: 1.5px solid #4C808A; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s; font-size: 12px; color: var(--muted); gap: 4px; background: var(--surface); width: 100%; font-family: Verdana, Geneva, Tahoma, sans-serif; }
.salary-card:hover { background: var(--surface2); }
.salary-card.selected { border: 2px solid #4C808A; background: var(--surface2); }
.pct { font-size: 26px; font-weight: 500; color: var(--text); }

/* ── Life event table ─────────────────────────────── */
.life-event-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
.life-event-table th { font-size: 12px; font-weight: 500; color: var(--muted); text-align: left; padding: 7px 10px 7px 0; border-bottom: 0.5px solid var(--border-strong); }
.life-event-table th:not(:first-child) { text-align: center; }
.life-event-table td { padding: 10px 10px 10px 0; border-bottom: 0.5px solid var(--border); vertical-align: middle; font-size: 14px; }
.life-event-table tr:last-child td { border-bottom: none; }
.life-event-table td:not(:first-child) { text-align: center; }
.radio-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; cursor: pointer; border: 1.5px solid #4C808A; color: var(--muted); background: none; font-family: Verdana, Geneva, Tahoma, sans-serif; transition: all 0.15s; }
.radio-btn:hover { background: var(--surface2); }
.radio-btn.selected { background: #4C808A; color: #ffffff; border-color: #4C808A; }
.event-detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
.event-detail-card { background: #4C808A; border-radius: var(--radius); padding: 12px; text-align: center; }
.event-detail-label { font-size: 12px; font-weight: 500; color: #ffffff; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
.event-detail-card input, .event-detail-card textarea { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 13px; padding: 7px 9px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); color: var(--text); width: 100%; }
.event-detail-card input:focus, .event-detail-card textarea:focus { outline: none; border-color: #4C808A; }
.event-detail-card textarea { resize: vertical; min-height: 60px; }

/* ── Acting position ─────────────────────────────── */
.yes-no-row { display: flex; gap: 10px; }
.yn-btn { flex: 1; padding: 12px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; background: var(--surface); color: var(--muted); transition: all 0.15s; }
.yn-btn:hover { background: var(--surface2); }
.yn-btn.selected-yes { background: var(--success-bg); border-color: var(--success-border); color: var(--success-text); }
.yn-btn.selected-no { background: var(--error-bg); border-color: var(--error-border); color: var(--error-text); }

textarea { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; color: var(--text); background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius); padding: 11px 12px; resize: vertical; min-height: 100px; line-height: 1.6; width: 100%; transition: border-color 0.15s; }
textarea:focus { outline: none; border-color: #4C808A; }
textarea::placeholder { color: var(--hint); }

.submit-row { display: flex; align-items: center; justify-content: space-between; padding-top: 1.5rem; border-top: 0.5px solid var(--border); margin-top: 0.5rem; }
.progress-text { font-size: 13px; color: var(--muted); }
.progress-text strong { color: var(--text); }
.submit-btn { font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 14px; font-weight: 500; padding: 11px 32px; background: #4C808A; color: #ffffff; border: none; border-radius: var(--radius); cursor: pointer; transition: opacity 0.15s; }
.submit-btn:hover { opacity: 0.85; }
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
  .priorities-grid { grid-column: 1; }
  .salary-options { flex-direction: column; }
  .submit-row { flex-direction: column; gap: 12px; align-items: stretch; }
  .submit-btn { text-align: center; }
  h1 { font-size: 22px; }
  body { padding: 0 1rem 3rem; }
  .benefits-table thead th:not(:first-child) { font-size: 11px; padding: 6px 2px; }
  .rating-btn { width: 28px; height: 28px; font-size: 12px; }
  .event-detail-grid { grid-template-columns: 1fr; }
  .priorities-grid { grid-template-columns: 1fr; }
}
`

const LIFE_EVENTS = ['Wedding', 'Introduction', 'Bereavement']

// ── Custom Select Component ──────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, compact = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label || null

  if (compact) {
    return (
      <div className="priority-custom-select" ref={ref}>
        <div
          className={`priority-custom-trigger${!selectedLabel ? ' placeholder' : ''}`}
          onClick={() => setOpen(o => !o)}
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {selectedLabel || placeholder}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="custom-select-arrow">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
        {open && (
          <div className="priority-custom-dropdown">
            <div
              className={`priority-custom-option placeholder-opt${value === '' ? ' selected' : ''}`}
              onMouseDown={() => { onChange(''); setOpen(false) }}
            >{placeholder}</div>
            {options.map(o => (
              <div
                key={o.value}
                className={`priority-custom-option${value === o.value ? ' selected' : ''}`}
                onMouseDown={() => { onChange(o.value); setOpen(false) }}
              >{o.label}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="custom-select" ref={ref}>
      <div
        className={`custom-select-trigger${!selectedLabel ? ' placeholder' : ''}${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
      >
        <span>{selectedLabel || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="custom-select-arrow">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      {open && (
        <div className="custom-select-dropdown">
          <div
            className={`custom-select-option placeholder-opt${value === '' ? ' selected' : ''}`}
            onMouseDown={() => { onChange(''); setOpen(false) }}
          >{placeholder}</div>
          {options.map(o => (
            <div
              key={o.value}
              className={`custom-select-option${value === o.value ? ' selected' : ''}`}
              onMouseDown={() => { onChange(o.value); setOpen(false) }}
            >{o.label}</div>
          ))}
        </div>
      )}
    </div>
  )
}

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

  const [lifeEventPrefs, setLifeEventPrefs] = useState({
    Wedding: { preference: '', detail: '' },
    Introduction: { preference: '', detail: '' },
    Bereavement: { preference: '', detail: '' },
  })
  const [trainingArea, setTrainingArea] = useState('')
  const [actingPosition, setActingPosition] = useState('')
  const [actingNoAllowanceImpact, setActingNoAllowanceImpact] = useState('')

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

  function setLifeEvent(event, field, value) {
    setLifeEventPrefs(prev => ({
      ...prev,
      [event]: { ...prev[event], [field]: value }
    }))
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
      life_event_preferences: lifeEventPrefs,
      training_area: trainingArea || null,
      acting_position: actingPosition || null,
      acting_no_allowance_impact: actingNoAllowanceImpact || null,
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

  const Logo = () => (
    <img src={LOGO} alt="Emerge Livelihoods" className="logo-img" />
  )

  const employmentTypeOptions = [
    { value: 'Permanent', label: 'Permanent' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Volunteer', label: 'Volunteer' },
    { value: 'Other', label: 'Other' },
  ]
  const programmeOptions = [
    { value: 'Livelihoods', label: 'Livelihoods' },
    { value: 'Ventures', label: 'Ventures' },
    { value: 'Fund', label: 'Fund' },
    { value: 'Other', label: 'Other' },
  ]
  const benefitOptions = allBenefits.map(b => ({ value: b, label: b }))

  if (submitted) {
    return (
      <>
        <style>{css}</style>
        <div className="page-wrap">
          <div className="header">
            <Logo />
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
              Lillian Nabirye — WUSC Volunteer
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

        {/* ── Header ── */}
        <div className="header">
          <Logo />
          <h1>Employee Benefits Review Form</h1>
          <p className="intro">
            This review is an intentional activity aimed at improving the quality and nature of our organisational offerings.
            We appreciate your clarity and honesty as we strive to build a thriving, self-reliant ecosystem in Malawi and beyond.
          </p>
        </div>

        {/* ── Employee Information ── */}
        <div className="section">
          <p className="section-title">Employee information</p>
          <div className="field-grid">
            <div className="field">
              <label>Name and title <span style={{ color: 'var(--hint)', fontStyle: 'normal' }}>(optional)</span></label>
              <input type="text" placeholder="e.g. Ruth Gondwe, Admin Officer"
                value={employee.name} onChange={e => setEmployee(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Nature of employment</label>
              <CustomSelect
                value={employee.employmentType}
                onChange={v => setEmployee(p => ({ ...p, employmentType: v }))}
                options={employmentTypeOptions}
                placeholder="Select type…"
              />
            </div>
          </div>
          <div className="field-grid">
            <div className="field">
              <label>Programme</label>
              <CustomSelect
                value={employee.programme}
                onChange={v => setEmployee(p => ({ ...p, programme: v }))}
                options={programmeOptions}
                placeholder="Select programme…"
              />
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

        {/* ── Benefits Rating ── */}
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
                      >
                        {s.n}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row-btn" type="button" onClick={addCustomBenefit}>+ Add another benefit</button>
        </div>

        {/* ── Priorities ── */}
        <div className="section">
          <p className="section-title">Top 6 priority benefits</p>
          <p className="section-desc">From the list above, select your six most important benefits in order of priority.</p>
          <div className="priorities-grid">
            {priorities.map((val, i) => (
              <div key={i} className="priority-field">
                <span className="priority-num">{ORDINALS[i]}</span>
                <CustomSelect
                  value={val}
                  onChange={v => setPriority(i, v)}
                  options={benefitOptions}
                  placeholder="Choose benefit…"
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Salary Increment ── */}
        <div className="section">
          <p className="section-title">Salary increment recommendation</p>
          <p className="section-desc">
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

        {/* ── Life Event Contributions ── */}
        <div className="section">
          <p className="section-title">Life event contribution preferences</p>
          <p className="section-desc">
            In case of a life event such as a wedding, introduction, or bereavement, what would be your preference between cash and in-kind contributions?
          </p>
          <table className="life-event-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Cash</th>
                <th>In-kind</th>
              </tr>
            </thead>
            <tbody>
              {LIFE_EVENTS.map(ev => (
                <tr key={ev}>
                  <td style={{ fontWeight: 500 }}>{ev}</td>
                  <td>
                    <button
                      type="button"
                      className={`radio-btn${lifeEventPrefs[ev].preference === 'cash' ? ' selected' : ''}`}
                      onClick={() => setLifeEvent(ev, 'preference', lifeEventPrefs[ev].preference === 'cash' ? '' : 'cash')}
                    >
                      {lifeEventPrefs[ev].preference === 'cash' ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`radio-btn${lifeEventPrefs[ev].preference === 'inkind' ? ' selected' : ''}`}
                      onClick={() => setLifeEvent(ev, 'preference', lifeEventPrefs[ev].preference === 'inkind' ? '' : 'inkind')}
                    >
                      {lifeEventPrefs[ev].preference === 'inkind' ? '●' : '○'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="event-detail-grid">
            {LIFE_EVENTS.map(ev => (
              <div key={ev} className="event-detail-card">
                <div className="event-detail-label">{ev}</div>
                {lifeEventPrefs[ev].preference === 'cash' && (
                  <input type="text" placeholder="Amount (MWK)…"
                    value={lifeEventPrefs[ev].detail}
                    onChange={e => setLifeEvent(ev, 'detail', e.target.value)} />
                )}
                {lifeEventPrefs[ev].preference === 'inkind' && (
                  <textarea placeholder="Type of in-kind contribution…"
                    value={lifeEventPrefs[ev].detail}
                    onChange={e => setLifeEvent(ev, 'detail', e.target.value)} />
                )}
                {!lifeEventPrefs[ev].preference && (
                  <div style={{ fontSize: 12, color: '#ffffff', paddingTop: 4 }}>Select cash or in-kind above</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Training / Capacity Development ── */}
        <div className="section">
          <p className="section-title">Capacity enhancement & professional training</p>
          <p className="section-desc">
            If the organisation were to offer you professional training, which area of training would you be interested in? Please specify.
          </p>
          <div className="field">
            <textarea
              placeholder="e.g. Financial management, project management, leadership development, data analysis…"
              value={trainingArea}
              onChange={e => setTrainingArea(e.target.value)}
            />
          </div>
        </div>

        {/* ── Acting Position ── */}
        <div className="section">
          <p className="section-title">Acting position</p>
          <p className="section-desc">
            Given the opportunity, would you be happy to take on an acting position above your current level?
          </p>
          <div className="yes-no-row" style={{ marginBottom: 16 }}>
            <button type="button"
              className={`yn-btn${actingPosition === 'yes' ? ' selected-yes' : ''}`}
              onClick={() => setActingPosition(actingPosition === 'yes' ? '' : 'yes')}>
              Yes
            </button>
            <button type="button"
              className={`yn-btn${actingPosition === 'no' ? ' selected-no' : ''}`}
              onClick={() => setActingPosition(actingPosition === 'no' ? '' : 'no')}>
              No
            </button>
          </div>
          <p className="section-desc">
            In the event that such an offer does not attract an acting allowance, how does this impact your motivation to take on higher roles or duties?
          </p>
          <div className="field">
            <textarea
              placeholder="Describe how your motivation would be affected…"
              value={actingNoAllowanceImpact}
              onChange={e => setActingNoAllowanceImpact(e.target.value)}
            />
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="section">
          <p className="section-title">Recommendations for improvement</p>
          <p className="section-desc">From your ratings above, what would be your recommendations for improvement on the weaker areas?</p>
          <textarea
            placeholder="Share your thoughts on areas that need attention…"
            value={recommendations}
            onChange={e => setRecommendations(e.target.value)}
          />
        </div>

        {/* ── Suggestions ── */}
        <div className="section">
          <p className="section-title">Any other suggestions</p>
          <p className="section-desc">Any other suggestions you would like management to take into consideration regarding employee benefits.</p>
          <textarea
            placeholder="Share any additional suggestions…"
            value={suggestions}
            onChange={e => setSuggestions(e.target.value)}
          />
        </div>

        {/* ── Submit ── */}
        <div className="submit-row">
          <p className="progress-text">Rated <strong>{ratedCount}</strong> of <strong>{allBenefits.length}</strong> benefits</p>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting} type="button">
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-footer">
          <div className="footer-credit">
            <strong>Review facilitated by:</strong><br />
            Lillian Nabirye — WUSC Volunteer
          </div>
          {/* <div>Emerge Livelihoods · Malawi</div> */}
        </div>
      </div>
    </>
  )
}