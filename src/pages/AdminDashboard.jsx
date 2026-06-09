import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LOGO from '../assets/emerge-logo.png'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import * as XLSX from 'xlsx'

const BENEFITS = [
  'Salary', 'Medical insurance / allowance', 'Transport allowance',
  'Lunch allowance', 'Housing allowance', 'Professional / capacity development',
  'Staff savings & credit scheme', 'Overtime pay', 'Annual leave',
  'Maternity / paternity leave', 'Baby care facility for nursing mothers',
  'Sick leave', 'Bereavement contributions', 'Bereavement leave',
  'Weekly day off', 'Birthday recognition / day off',
  'Rewards & recognition for best performers', 'Staff retreats',
  'Staff workshops / seminars',
  'Contribution to staff parties (weddings, introductions, etc.)',
]

const LIFE_EVENTS = ['Wedding', 'Introduction', 'Bereavement']
const SALARY_COLORS = { '5%': '#a3c4bc', '10%': '#5b9aa0', '15%': '#1a5276' }
const PREF_COLORS = { cash: '#5b9aa0', inkind: '#e67e22', '': '#ccc' }

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f5f5f2; --surface: #ffffff; --surface2: #eeede9;
  --border: rgba(0,0,0,0.09); --border-strong: rgba(0,0,0,0.15);
  --text: #1a1a18; --muted: #6b6b67; --hint: #9e9e9a;
  --accent: #1a1a18; --accent-inv: #ffffff;
  --green: #2e7d32; --green-bg: #eaf3de;
  --radius: 8px; --radius-lg: 12px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111110; --surface: #1a1a18; --surface2: #222220;
    --border: rgba(255,255,255,0.08); --border-strong: rgba(255,255,255,0.15);
    --text: #f0f0ec; --muted: #9e9e9a; --hint: #6b6b67;
    --accent: #f0f0ec; --accent-inv: #111110;
    --green: #81c784; --green-bg: #1b3a1d;
  }
}
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

/* ── Top bar ── */
.topbar { background: var(--surface); border-bottom: 0.5px solid var(--border-strong); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 10; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.topbar-logo { height: 28px; width: auto; display: block; }
.org-mark { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.sep { color: var(--hint); }
.page-title { font-family: 'DM Serif Display', serif; font-size: 17px; font-weight: 400; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.btn { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 7px 16px; border-radius: var(--radius); cursor: pointer; transition: opacity 0.15s; border: none; }
.btn-export { background: var(--green); color: #fff; }
.btn-export:hover { opacity: 0.85; }
.btn-signout { background: var(--surface2); color: var(--muted); border: 0.5px solid var(--border-strong); }
.btn-signout:hover { color: var(--text); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.section-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 0.5px solid var(--border); }
.section-label:first-child { margin-top: 0; }

/* ── Stat cards ── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 1rem; }
.stats-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 1rem; }
.stat-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin-bottom: 6px; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 30px; font-weight: 400; line-height: 1; color: var(--text); }
.stat-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
.stat-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
.pill-green { background: var(--green-bg); color: var(--green); }
.pill-amber { background: #fff8e1; color: #b45309; }
.pill-red { background: #fef2f2; color: #991b1b; }

/* ── Charts ── */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 1rem; }
.chart-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.5rem; }
.chart-card.full { grid-column: 1 / -1; }
.card-title { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hint); margin-bottom: 1.25rem; }
.no-data { color: var(--muted); font-size: 13px; padding: 1rem 0; }

/* ── Life event prefs ── */
.life-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 1rem; }
.life-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.25rem; }
.life-title { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 10px; }
.pref-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.pref-bar-label { min-width: 52px; color: var(--muted); font-size: 12px; }
.pref-bar-bg { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
.pref-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.pref-count { font-size: 12px; color: var(--muted); min-width: 28px; text-align: right; }

/* ── Acting position ── */
.acting-row { display: flex; gap: 14px; align-items: stretch; margin-bottom: 1rem; }
.acting-yesno { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.25rem; flex: 0 0 220px; }
.acting-quotes { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.25rem; flex: 1; overflow: hidden; }
.quote-list { display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; }
.quote-item { background: var(--surface2); border-radius: var(--radius); padding: 9px 12px; font-size: 13px; color: var(--text); line-height: 1.5; border-left: 3px solid var(--border-strong); }

/* ── Training ── */
.training-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.training-tag { background: var(--surface2); border: 0.5px solid var(--border-strong); border-radius: 20px; padding: 5px 12px; font-size: 13px; color: var(--text); }
.training-full { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
.training-item { background: var(--surface2); border-radius: var(--radius); padding: 8px 12px; font-size: 13px; color: var(--text); border-left: 2px solid var(--border-strong); }

/* ── Response table ── */
.table-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
.table-header { padding: 1rem 1.5rem; border-bottom: 0.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.table-header-title { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hint); }
.resp-count { font-size: 12px; color: var(--muted); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--hint); text-align: left; padding: 10px 16px; border-bottom: 0.5px solid var(--border); background: var(--surface2); white-space: nowrap; }
.data-table td { font-size: 13px; padding: 10px 16px; border-bottom: 0.5px solid var(--border); color: var(--text); vertical-align: top; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
.badge-5 { background: #d4edda; color: #155724; }
.badge-10 { background: #cce5ff; color: #004085; }
.badge-15 { background: #f8d7da; color: #721c24; }
.badge-yes { background: #d4edda; color: #155724; }
.badge-no { background: #f8d7da; color: #721c24; }
.empty { text-align: center; padding: 3rem; color: var(--muted); font-size: 14px; }
.loading { text-align: center; padding: 4rem; color: var(--muted); }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row-3 { grid-template-columns: 1fr 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  .charts-grid .chart-card.full { grid-column: 1; }
  .life-grid { grid-template-columns: 1fr; }
  .acting-row { flex-direction: column; }
  .main { padding: 1rem; }
  .topbar { padding: 0 1rem; }
}
`

// ── helpers ──────────────────────────────────────────────────
function avgRating(responses, benefit) {
  const vals = responses.map(r => r.ratings?.[benefit]).filter(v => v !== undefined && v !== null)
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

function salaryDist(responses) {
  const counts = {}
  responses.forEach(r => { const v = r.salary_increment; if (v) counts[v] = (counts[v] || 0) + 1 })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function priorityCount(responses) {
  const counts = {}
  responses.forEach(r => {
    ;(r.priorities || []).forEach((b, i) => {
      if (!b) return
      if (!counts[b]) counts[b] = { benefit: b, score: 0, count: 0 }
      counts[b].score += (6 - i)
      counts[b].count += 1
    })
  })
  return Object.values(counts).sort((a, b) => b.score - a.score).slice(0, 10)
}

function avgRatingsAll(responses) {
  return BENEFITS.map(b => ({
    benefit: b.length > 28 ? b.slice(0, 28) + '…' : b,
    fullName: b,
    avg: parseFloat(avgRating(responses, b)) || 0,
  })).sort((a, b) => a.avg - b.avg)
}

function lifeEventStats(responses) {
  const stats = {}
  LIFE_EVENTS.forEach(ev => { stats[ev] = { cash: 0, inkind: 0, none: 0 } })
  responses.forEach(r => {
    const prefs = r.life_event_preferences || {}
    LIFE_EVENTS.forEach(ev => {
      const p = prefs[ev]?.preference || ''
      if (p === 'cash') stats[ev].cash++
      else if (p === 'inkind') stats[ev].inkind++
      else stats[ev].none++
    })
  })
  return stats
}

function actingStats(responses) {
  let yes = 0, no = 0, unanswered = 0
  responses.forEach(r => {
    if (r.acting_position === 'yes') yes++
    else if (r.acting_position === 'no') no++
    else unanswered++
  })
  return { yes, no, unanswered }
}

function exportToExcel(responses) {
  const wb = XLSX.utils.book_new()
  const rows = responses.map(r => {
    const row = {
      'Submitted At': new Date(r.submitted_at).toLocaleString(),
      'Name': r.employee?.name || '',
      'Employment Type': r.employee?.employmentType || '',
      'Programme': r.employee?.programme || '',
      'Department': r.employee?.department || '',
      'Years at Emerge': r.employee?.yearsAtEmerge || '',
      'Period From': r.employee?.from || '',
      'Period To': r.employee?.to || '',
      'Gross Pay (MWK)': r.employee?.grossPay || '',
      'Net Pay (MWK)': r.employee?.netPay || '',
      'Salary Increment Recommendation': r.salary_increment || '',
      'Priorities (1st–6th)': (r.priorities || []).join(' | '),
      'Wedding Preference': r.life_event_preferences?.Wedding?.preference || '',
      'Wedding Detail': r.life_event_preferences?.Wedding?.detail || '',
      'Introduction Preference': r.life_event_preferences?.Introduction?.preference || '',
      'Introduction Detail': r.life_event_preferences?.Introduction?.detail || '',
      'Bereavement Preference': r.life_event_preferences?.Bereavement?.preference || '',
      'Bereavement Detail': r.life_event_preferences?.Bereavement?.detail || '',
      'Training Area of Interest': r.training_area || '',
      'Willing to Take Acting Position': r.acting_position || '',
      'No-Allowance Motivation Impact': r.acting_no_allowance_impact || '',
      'Recommendations': r.recommendations || '',
      'Suggestions': r.suggestions || '',
    }
    BENEFITS.forEach(b => { row[`Rating: ${b}`] = r.ratings?.[b] !== undefined ? r.ratings[b] : '' })
    Object.keys(r.ratings || {}).filter(k => !BENEFITS.includes(k)).forEach(k => {
      row[`Rating (custom): ${k}`] = r.ratings[k]
    })
    return row
  })
  const ws1 = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws1, 'All Responses')

  const avgRows = BENEFITS.map(b => ({
    Benefit: b,
    'Average Rating': avgRating(responses, b) ?? 'N/A',
    'Responses Count': responses.filter(r => r.ratings?.[b] !== undefined).length,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(avgRows), 'Average Ratings')

  const prioRows = priorityCount(responses).map(p => ({ Benefit: p.benefit, 'Weighted Score': p.score, 'Times Selected': p.count }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prioRows), 'Priority Rankings')

  const salRows = salaryDist(responses).map(s => ({
    'Increment %': s.name, 'Responses': s.value,
    'Percentage': responses.length ? ((s.value / responses.length) * 100).toFixed(1) + '%' : '0%',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salRows), 'Salary Distribution')

  const leRows = LIFE_EVENTS.map(ev => {
    const stats = lifeEventStats(responses)
    return {
      Event: ev, Cash: stats[ev].cash, 'In-kind': stats[ev].inkind,
      'Not answered': stats[ev].none,
      Total: responses.length,
    }
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leRows), 'Life Event Preferences')

  const trainingRows = responses.filter(r => r.training_area).map(r => ({
    Name: r.employee?.name || 'Anonymous',
    Department: r.employee?.department || '',
    'Training Area': r.training_area,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trainingRows), 'Training Interests')

  const actingRows = responses.map(r => ({
    Name: r.employee?.name || 'Anonymous',
    'Acting Position': r.acting_position || 'Not answered',
    'No-Allowance Impact': r.acting_no_allowance_impact || '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actingRows), 'Acting Position')

  XLSX.writeFile(wb, `Emerge_Benefits_Review_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{payload[0]?.payload?.fullName || label}</div>
      <div style={{ fontWeight: 500 }}>Avg: {payload[0]?.value}</div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────
export default function AdminDashboard() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('responses').select('*').order('submitted_at', { ascending: false })
      if (!error) setResponses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  // Computed
  const avgRatingsData = avgRatingsAll(responses)
  const salaryData = salaryDist(responses)
  const prioData = priorityCount(responses)
  const leStats = lifeEventStats(responses)
  const acting = actingStats(responses)
  const trainingResponses = responses.filter(r => r.training_area)

  const ratedCount = responses.reduce((acc, r) => acc + Object.values(r.ratings || {}).filter(v => v !== undefined).length, 0)

  const avgOverall = responses.length
    ? (responses.reduce((acc, r) => {
        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
        return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / responses.length).toFixed(2)
    : '—'

  // Weakest benefit
  const ratedBenefits = avgRatingsData.filter(b => b.avg > 0)
  const weakest = ratedBenefits.length ? ratedBenefits[0] : null
  const strongest = ratedBenefits.length ? ratedBenefits[ratedBenefits.length - 1] : null

  // Acting motivaton impact quotes
  const actingImpactQuotes = responses.filter(r => r.acting_no_allowance_impact).map(r => r.acting_no_allowance_impact)

  return (
    <>
      <style>{css}</style>

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <img src={LOGO} alt="Emerge Livelihoods" className="topbar-logo" />
          <span className="sep">·</span>
          <span className="page-title">Benefits Review Dashboard</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-export" onClick={() => exportToExcel(responses)} disabled={!responses.length}>
            ↓ Export to Excel
          </button>
          <button className="btn btn-signout" onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div className="main">
        {loading ? (
          <div className="loading">Loading responses…</div>
        ) : (
          <>
            {/* ── Overview KPIs ── */}
            <p className="section-label">Overview</p>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Total responses</div>
                <div className="stat-value">{responses.length}</div>
                <div className="stat-sub">employees submitted</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg overall rating</div>
                <div className="stat-value">{avgOverall}</div>
                <div className="stat-sub">out of 5.00</div>
                {avgOverall !== '—' && (
                  <div className={`stat-pill ${parseFloat(avgOverall) >= 3.5 ? 'pill-green' : parseFloat(avgOverall) >= 2.5 ? 'pill-amber' : 'pill-red'}`}>
                    {parseFloat(avgOverall) >= 3.5 ? '▲ Healthy' : parseFloat(avgOverall) >= 2.5 ? '→ Moderate' : '▼ Needs attention'}
                  </div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-label">Weakest benefit</div>
                <div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>{weakest ? weakest.fullName : '—'}</div>
                {weakest && <div className="stat-pill pill-red">Avg {weakest.avg}</div>}
              </div>
              <div className="stat-card">
                <div className="stat-label">Strongest benefit</div>
                <div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>{strongest ? strongest.fullName : '—'}</div>
                {strongest && <div className="stat-pill pill-green">Avg {strongest.avg}</div>}
              </div>
            </div>

            {/* ── Benefits charts ── */}
            <p className="section-label">Benefits ratings</p>
            <div className="charts-grid">
              <div className="chart-card full">
                <div className="card-title">Average rating per benefit (0–5)</div>
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart data={avgRatingsData} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis type="category" dataKey="benefit" width={230} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {avgRatingsData.map((entry, i) => (
                        <Cell key={i} fill={entry.avg < 2 ? '#e74c3c' : entry.avg < 3.5 ? '#f39c12' : '#27ae60'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="card-title">Top priority benefits (weighted score)</div>
                {prioData.length === 0 ? <p className="no-data">No priority data yet.</p> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={prioData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <YAxis type="category" dataKey="benefit" width={200}
                        tickFormatter={v => v.length > 24 ? v.slice(0, 24) + '…' : v}
                        tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <Tooltip formatter={(v) => [v, 'Weighted score']} />
                      <Bar dataKey="score" fill="#3498db" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <div className="card-title">Salary increment recommendations</div>
                {salaryData.length === 0 ? <p className="no-data">No data yet.</p> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={salaryData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {salaryData.map((entry, i) => <Cell key={i} fill={SALARY_COLORS[entry.name] || '#95a5a6'} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Tooltip formatter={(v) => [v, 'Employees']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Life event preferences ── */}
            <p className="section-label">Life event contribution preferences</p>
            <div className="stats-row-3" style={{ marginBottom: 14 }}>
              {LIFE_EVENTS.map(ev => {
                const total = leStats[ev].cash + leStats[ev].inkind
                const cashPct = total ? Math.round((leStats[ev].cash / total) * 100) : 0
                const inkindPct = total ? Math.round((leStats[ev].inkind / total) * 100) : 0
                return (
                  <div className="stat-card" key={ev}>
                    <div className="stat-label">{ev} — majority preference</div>
                    <div className="stat-value" style={{ fontSize: 20, paddingTop: 4 }}>
                      {total === 0 ? '—' : leStats[ev].cash >= leStats[ev].inkind ? 'Cash' : 'In-kind'}
                    </div>
                    <div className="stat-sub" style={{ marginTop: 8 }}>
                      <div className="pref-bar-row">
                        <span className="pref-bar-label">Cash</span>
                        <div className="pref-bar-bg">
                          <div className="pref-bar-fill" style={{ width: cashPct + '%', background: '#5b9aa0' }} />
                        </div>
                        <span className="pref-count">{leStats[ev].cash}</span>
                      </div>
                      <div className="pref-bar-row">
                        <span className="pref-bar-label">In-kind</span>
                        <div className="pref-bar-bg">
                          <div className="pref-bar-fill" style={{ width: inkindPct + '%', background: '#e67e22' }} />
                        </div>
                        <span className="pref-count">{leStats[ev].inkind}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Acting position KPIs ── */}
            <p className="section-label">Acting position</p>
            <div className="acting-row">
              <div className="acting-yesno">
                <div className="card-title">Willing to act above level?</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: '#eaf3de', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontFamily: 'DM Serif Display', color: '#2e7d32' }}>{acting.yes}</div>
                    <div style={{ fontSize: 11, color: '#3b6d11', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Yes</div>
                  </div>
                  <div style={{ flex: 1, background: '#fef2f2', borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontFamily: 'DM Serif Display', color: '#991b1b' }}>{acting.no}</div>
                    <div style={{ fontSize: 11, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--hint)' }}>
                  {acting.unanswered} not answered · {responses.length} total
                </div>
              </div>
              <div className="acting-quotes">
                <div className="card-title">Motivation impact if no acting allowance</div>
                {actingImpactQuotes.length === 0
                  ? <p className="no-data">No responses yet.</p>
                  : (
                    <div className="quote-list">
                      {actingImpactQuotes.map((q, i) => (
                        <div key={i} className="quote-item">{q}</div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* ── Training interests ── */}
            <p className="section-label">Training & capacity development interests</p>
            <div className="chart-card" style={{ marginBottom: '1rem' }}>
              <div className="card-title">{trainingResponses.length} employees specified training interests</div>
              {trainingResponses.length === 0
                ? <p className="no-data">No training preferences recorded yet.</p>
                : (
                  <div className="training-full">
                    {trainingResponses.map((r, i) => (
                      <div key={i} className="training-item">
                        <span style={{ color: 'var(--muted)', marginRight: 8, fontSize: 12 }}>
                          {r.employee?.name || 'Anonymous'}{r.employee?.department ? ` · ${r.employee.department}` : ''}
                        </span>
                        {r.training_area}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* ── All responses table ── */}
            <p className="section-label">All responses</p>
            <div className="table-card">
              <div className="table-header">
                <span className="table-header-title">Individual submissions</span>
                <span className="resp-count">{responses.length} total</span>
              </div>
              {responses.length === 0 ? (
                <div className="empty">No responses submitted yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Dept</th>
                        <th>Yrs</th>
                        <th>Increment</th>
                        <th>Avg rating</th>
                        <th>Top priority</th>
                        <th>Acting</th>
                        <th>Wedding pref</th>
                        <th>Training interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map(r => {
                        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
                        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                        const inc = r.salary_increment
                        const badgeClass = inc === '5%' ? 'badge-5' : inc === '10%' ? 'badge-10' : inc === '15%' ? 'badge-15' : ''
                        const wedding = r.life_event_preferences?.Wedding?.preference
                        return (
                          <tr key={r.id}>
                            <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
                            <td title={r.employee?.name}>{r.employee?.name || <span style={{ color: 'var(--hint)' }}>Anon</span>}</td>
                            <td>{r.employee?.employmentType || '—'}</td>
                            <td>{r.employee?.department || '—'}</td>
                            <td>{r.employee?.yearsAtEmerge || '—'}</td>
                            <td>{inc ? <span className={`badge ${badgeClass}`}>{inc}</span> : <span style={{ color: 'var(--hint)' }}>—</span>}</td>
                            <td>{avg}</td>
                            <td title={(r.priorities || []).join(', ')}>{r.priorities?.[0] || <span style={{ color: 'var(--hint)' }}>—</span>}</td>
                            <td>
                              {r.acting_position
                                ? <span className={`badge badge-${r.acting_position}`}>{r.acting_position}</span>
                                : <span style={{ color: 'var(--hint)' }}>—</span>}
                            </td>
                            <td>{wedding ? (wedding === 'cash' ? 'Cash' : 'In-kind') : <span style={{ color: 'var(--hint)' }}>—</span>}</td>
                            <td title={r.training_area}>
                              {r.training_area
                                ? r.training_area.slice(0, 40) + (r.training_area.length > 40 ? '…' : '')
                                : <span style={{ color: 'var(--hint)' }}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
