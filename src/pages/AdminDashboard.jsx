import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
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

// ── Brand palette ──────────────────────────────────────────────────────────
const C_NAVY   = '#3B4167'
const C_TEAL   = '#4C808A'
const C_NAVY_L = '#5c6499'   // lighter navy for accents
const C_TEAL_L = '#70adb8'   // lighter teal
const C_RED    = '#c0392b'
const C_AMBER  = '#e67e22'
const C_GREEN  = '#27ae60'

const SALARY_COLORS = { '5%': C_TEAL_L, '10%': C_TEAL, '15%': C_NAVY }

const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f5f5f2; --surface: #ffffff; --surface2: #eeede9;
  --border: rgba(0,0,0,0.09); --border-strong: rgba(0,0,0,0.15);
  --text: #1a1a18; --muted: #6b6b67; --hint: #9e9e9a;
  --accent: ${C_NAVY}; --accent2: ${C_TEAL};
  --accent-inv: #ffffff;
  --green: ${C_GREEN}; --green-bg: #eaf3de;
  --radius: 8px; --radius-lg: 12px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111110; --surface: #1a1a18; --surface2: #222220;
    --border: rgba(255,255,255,0.08); --border-strong: rgba(255,255,255,0.15);
    --text: #f0f0ec; --muted: #9e9e9a; --hint: #6b6b67;
    --accent: ${C_TEAL_L}; --accent2: ${C_TEAL};
    --accent-inv: #111110;
    --green: #81c784; --green-bg: #1b3a1d;
  }
}
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
.topbar { background: var(--accent); border-bottom: none; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 10; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.org-mark { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
.sep { color: rgba(255,255,255,0.4); }
.page-title { font-family: 'DM Serif Display', serif; font-size: 18px; font-weight: 400; color: #ffffff; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.btn { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 7px 16px; border-radius: var(--radius); cursor: pointer; transition: opacity 0.15s; border: none; }
.btn-export { background: ${C_TEAL}; color: #fff; }
.btn-export:hover { opacity: 0.85; }
.btn-signout { background: rgba(255,255,255,0.15); color: #fff; border: 0.5px solid rgba(255,255,255,0.3); }
.btn-signout:hover { background: rgba(255,255,255,0.25); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.main { padding: 2rem; max-width: 1280px; margin: 0 auto; }
.section-heading { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); margin: 2rem 0 0.75rem; padding-bottom: 6px; border-bottom: 2px solid var(--accent2); display: flex; align-items: center; gap: 6px; }
.section-heading::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent2); display: inline-block; }
.stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.1rem 1.3rem; border-top: 3px solid var(--accent2); }
.stat-card.accent { border-top-color: var(--accent); }
.stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin-bottom: 6px; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 28px; font-weight: 400; line-height: 1; color: var(--text); }
.stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 1.5rem; }
.chart-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.5rem; }
.chart-card.full { grid-column: 1 / -1; }
.card-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 6px; }
.card-subtitle { font-size: 12px; color: var(--muted); margin-bottom: 1.25rem; }
.table-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
.table-header { padding: 1rem 1.5rem; border-bottom: 0.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface2); }
.table-header-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
.resp-count { font-size: 12px; color: var(--muted); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--hint); text-align: left; padding: 10px 16px; border-bottom: 0.5px solid var(--border); background: var(--surface2); white-space: nowrap; }
.data-table td { font-size: 13px; padding: 10px 16px; border-bottom: 0.5px solid var(--border); color: var(--text); vertical-align: top; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--surface2); }
.badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
.badge-5 { background: #d4edda; color: #155724; }
.badge-10 { background: #cce5ff; color: #004085; }
.badge-15 { background: #f8d7da; color: #721c24; }
.empty { text-align: center; padding: 3rem; color: var(--muted); font-size: 14px; }
.loading { text-align: center; padding: 4rem; color: var(--muted); }
.legend-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.quadrant-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.filters-bar { display: flex; gap: 10px; margin-bottom: 1.25rem; flex-wrap: wrap; align-items: center; }
.filter-select { font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 6px 10px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); color: var(--text); cursor: pointer; }
.filter-label { font-size: 12px; color: var(--muted); }
@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
  .charts-grid .chart-card.full { grid-column: 1; }
  .main { padding: 1rem; }
  .topbar { padding: 0 1rem; }
}
@media (max-width: 600px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
}
`

// ── Calculation helpers ────────────────────────────────────────────────────
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
      counts[b].score += 6 - i
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

// KPI: benefits gap = count of benefits with avg < 2 across all respondents
function benefitsGapScore(responses) {
  return BENEFITS.filter(b => {
    const a = parseFloat(avgRating(responses, b))
    return !isNaN(a) && a < 2
  }).length
}

// KPI: weighted salary sentiment index (5%=5, 10%=10, 15%=15, weighted avg)
function salarySentimentIndex(responses) {
  const valid = responses.filter(r => r.salary_increment)
  if (!valid.length) return '—'
  const sum = valid.reduce((acc, r) => acc + parseInt(r.salary_increment), 0)
  return (sum / valid.length).toFixed(1) + '%'
}

// KPI: response completion rate (avg % of benefits rated per response)
function completionRate(responses) {
  if (!responses.length) return '—'
  const rates = responses.map(r => {
    const rated = Object.values(r.ratings || {}).filter(v => v !== undefined && v !== null).length
    return rated / BENEFITS.length
  })
  return Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) + '%'
}

// Importance vs Satisfaction data (for quadrant scatter)
function importanceSatisfactionData(responses) {
  const prioScores = {}
  responses.forEach(r => {
    ;(r.priorities || []).forEach((b, i) => {
      if (!b) return
      prioScores[b] = (prioScores[b] || 0) + (6 - i)
    })
  })
  const maxPrio = Math.max(...Object.values(prioScores), 1)
  return BENEFITS.map(b => {
    const satisfaction = parseFloat(avgRating(responses, b)) || 0
    const importance = ((prioScores[b] || 0) / maxPrio) * 5
    return {
      name: b.length > 22 ? b.slice(0, 22) + '…' : b,
      fullName: b,
      x: parseFloat(satisfaction.toFixed(2)),
      y: parseFloat(importance.toFixed(2)),
    }
  })
}

// Programme-level average ratings
function programmeAvgs(responses) {
  const map = {}
  responses.forEach(r => {
    const prog = r.employee?.programme || 'Unknown'
    if (!map[prog]) map[prog] = []
    const vals = Object.values(r.ratings || {}).filter(v => v !== undefined && v !== null)
    if (vals.length) map[prog].push(vals.reduce((a, b) => a + b, 0) / vals.length)
  })
  return Object.entries(map).map(([programme, vals]) => ({
    programme,
    avg: vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0,
    count: responses.filter(r => (r.employee?.programme || 'Unknown') === programme).length,
  })).sort((a, b) => b.avg - a.avg)
}

// Score distribution for heatmap-style stacked bar per benefit (top 8 by variance)
function scoreDistribution(responses) {
  return BENEFITS.slice(0, 8).map(b => {
    const dist = { benefit: b.length > 22 ? b.slice(0, 22) + '…' : b }
    for (let i = 0; i <= 5; i++) {
      dist[`s${i}`] = responses.filter(r => r.ratings?.[b] === i).length
    }
    return dist
  })
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
    'Status': (parseFloat(avgRating(responses, b)) || 0) < 2 ? 'Act Now' : (parseFloat(avgRating(responses, b)) || 0) < 3.5 ? 'Monitor' : 'Strong',
    'Responses Count': responses.filter(r => r.ratings?.[b] !== undefined).length,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(avgRows), 'Average Ratings')
  const prioRows = priorityCount(responses).map(p => ({ Benefit: p.benefit, 'Weighted Score': p.score, 'Times Selected': p.count }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prioRows), 'Priority Rankings')
  const salRows = salaryDist(responses).map(s => ({ 'Increment %': s.name, 'Responses': s.value, 'Percentage': responses.length ? ((s.value / responses.length) * 100).toFixed(1) + '%' : '0%' }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salRows), 'Salary Distribution')
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

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 500, marginBottom: 2 }}>{d?.fullName}</div>
      <div style={{ color: 'var(--muted)' }}>Satisfaction: {d?.x} / 5</div>
      <div style={{ color: 'var(--muted)' }}>Importance: {d?.y?.toFixed(2)} / 5</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterProg, setFilterProg] = useState('All')
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

  const programmes = ['All', ...Array.from(new Set(responses.map(r => r.employee?.programme).filter(Boolean)))]
  const filtered = filterProg === 'All' ? responses : responses.filter(r => r.employee?.programme === filterProg)

  const avgRatingsData = avgRatingsAll(filtered)
  const salaryData = salaryDist(filtered)
  const prioData = priorityCount(filtered)
  const importanceData = importanceSatisfactionData(filtered)
  const progData = programmeAvgs(responses)
  const scoreDistData = scoreDistribution(filtered)

  const ratedCount = filtered.reduce((acc, r) => acc + Object.values(r.ratings || {}).filter(v => v !== undefined).length, 0)
  const avgOverall = filtered.length
    ? (filtered.reduce((acc, r) => {
        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
        return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / filtered.length).toFixed(2)
    : '—'

  const gapScore = benefitsGapScore(filtered)
  const sentimentIdx = salarySentimentIndex(filtered)
  const completion = completionRate(filtered)

  const SCORE_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', C_TEAL_L, C_TEAL, C_NAVY]

  return (
    <>
      <style>{css}</style>

      <div className="topbar">
        <div className="topbar-left">
          <span className="org-mark">Emerge · Livelihoods</span>
          <span className="sep">·</span>
          <span className="page-title">HR Benefits Dashboard</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-export" onClick={() => exportToExcel(filtered)} disabled={!filtered.length}>
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
            {/* Filters */}
            <div className="filters-bar" style={{ marginTop: '1.5rem' }}>
              <span className="filter-label">Filter by programme:</span>
              <select className="filter-select" value={filterProg} onChange={e => setFilterProg(e.target.value)}>
                {programmes.map(p => <option key={p}>{p}</option>)}
              </select>
              {filterProg !== 'All' && (
                <button className="filter-select" style={{ cursor: 'pointer', color: C_TEAL }} onClick={() => setFilterProg('All')}>
                  × Clear filter
                </button>
              )}
            </div>

            {/* ── KPI Cards ── */}
            <div className="section-heading">Top-line KPIs</div>
            <div className="stats-row">
              <div className="stat-card accent">
                <div className="stat-label">Total responses</div>
                <div className="stat-value">{filtered.length}</div>
                <div className="stat-sub">employees submitted</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Overall satisfaction</div>
                <div className="stat-value">{avgOverall}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/5</span></div>
                <div className="stat-sub">mean across all benefits</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Benefits gap score</div>
                <div className="stat-value" style={{ color: gapScore > 3 ? C_RED : gapScore > 0 ? C_AMBER : C_GREEN }}>{gapScore}</div>
                <div className="stat-sub">benefits rated ≤ 2 (poor)</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Salary sentiment</div>
                <div className="stat-value">{sentimentIdx}</div>
                <div className="stat-sub">weighted avg preferred increment</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completion rate</div>
                <div className="stat-value">{completion}</div>
                <div className="stat-sub">avg benefits rated per submission</div>
              </div>
            </div>

            {/* ── Benefit Satisfaction ── */}
            <div className="section-heading">KPI 1 — Benefit Satisfaction Scores</div>
            <div className="charts-grid">
              <div className="chart-card full">
                <div className="card-title">Average Rating per Benefit (0–5)</div>
                <div className="card-subtitle">Sorted lowest → highest. Red = act now (&lt;2), amber = monitor (2–3.5), green = strong (&gt;3.5)</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={avgRatingsData} layout="vertical" margin={{ left: 10, right: 50 }}>
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis type="category" dataKey="benefit" width={230} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: 'var(--muted)' }}>
                      {avgRatingsData.map((entry, i) => (
                        <Cell key={i} fill={entry.avg < 2 ? C_RED : entry.avg < 3.5 ? C_AMBER : C_GREEN} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Score distribution stacked bar */}
              <div className="chart-card full">
                <div className="card-title">Score Distribution — First 8 Benefits</div>
                <div className="card-subtitle">How many employees chose each score (0–5) per benefit. Reveals split opinions hidden by averages.</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={scoreDistData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis type="category" dataKey="benefit" width={190} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {[0,1,2,3,4,5].map(s => (
                      <Bar key={s} dataKey={`s${s}`} stackId="a" fill={SCORE_COLORS[s]} name={`Score ${s}`} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <div className="legend-row">
                  {[0,1,2,3,4,5].map((s,i) => (
                    <div key={s} className="legend-item">
                      <div className="legend-dot" style={{ background: SCORE_COLORS[i] }} />
                      {s} — {['Non-existent','Poor','Fair','Good','Very good','Outstanding'][s]}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Priority Index ── */}
            <div className="section-heading">KPI 2 — Employee Priority Index</div>
            <div className="charts-grid">
              <div className="chart-card full">
                <div className="card-title">Weighted Priority Ranking</div>
                <div className="card-subtitle">1st choice = 6 pts … 6th choice = 1 pt. Separates what employees have from what they genuinely want.</div>
                {prioData.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No priority data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={prioData} layout="vertical" margin={{ left: 10, right: 40 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <YAxis type="category" dataKey="benefit" width={220}
                        tickFormatter={v => v.length > 26 ? v.slice(0, 26) + '…' : v}
                        tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <Tooltip formatter={(v) => [v, 'Weighted score']} />
                      <Bar dataKey="score" fill={C_NAVY} radius={[0, 4, 4, 0]}
                        label={{ position: 'right', fontSize: 11, fill: 'var(--muted)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Salary Increment ── */}
            <div className="section-heading">KPI 3 — Salary Increment Sentiment</div>
            <div className="charts-grid">
              <div className="chart-card">
                <div className="card-title">Increment Preference Distribution</div>
                <div className="card-subtitle">A single management-ready number: where does consensus land?</div>
                {salaryData.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={salaryData} dataKey="value" nameKey="name" cx="50%" cy="45%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}>
                        {salaryData.map((entry, i) => (
                          <Cell key={i} fill={SALARY_COLORS[entry.name] || '#95a5a6'} />
                        ))}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Tooltip formatter={(v) => [v, 'Employees']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-card">
                <div className="card-title">Increment Preference by Programme</div>
                <div className="card-subtitle">Cross-tab to check if certain programmes skew toward higher expectations.</div>
                {(() => {
                  const progSalary = programmes.filter(p => p !== 'All').map(prog => {
                    const sub = responses.filter(r => r.employee?.programme === prog)
                    const dist = salaryDist(sub)
                    const entry = { programme: prog }
                    dist.forEach(d => { entry[d.name] = d.value })
                    return entry
                  }).filter(e => programmes.filter(p => p !== 'All').length)
                  return progSalary.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No programme data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={progSalary} margin={{ left: 0, right: 10 }}>
                        <XAxis dataKey="programme" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="5%" fill={C_TEAL_L} stackId="s" radius={[0,0,0,0]} />
                        <Bar dataKey="10%" fill={C_TEAL} stackId="s" />
                        <Bar dataKey="15%" fill={C_NAVY} stackId="s" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </div>
            </div>

            {/* ── Programme Benchmarks ── */}
            <div className="section-heading">KPI 4 — Departmental & Programme Benchmarks</div>
            <div className="charts-grid">
              <div className="chart-card">
                <div className="card-title">Avg Benefit Score by Programme</div>
                <div className="card-subtitle">A benefit averaging 4 org-wide might score 1 in one programme — benchmarks surface those gaps.</div>
                {progData.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No programme data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={progData} margin={{ left: 0, right: 20 }}>
                      <XAxis dataKey="programme" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <Tooltip formatter={(v, n, p) => [v, `Avg score (n=${p.payload.count})`]} />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]}
                        label={{ position: 'top', fontSize: 12, fill: 'var(--muted)' }}>
                        {progData.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? C_NAVY : C_TEAL} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Radar chart — top 8 benefits */}
              <div className="chart-card">
                <div className="card-title">Benefit Profile Radar — Top 8 Benefits</div>
                <div className="card-subtitle">Shape of satisfaction across key benefits at a glance.</div>
                {filtered.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={BENEFITS.slice(0, 8).map(b => ({
                      benefit: b.length > 18 ? b.slice(0, 18) + '…' : b,
                      avg: parseFloat(avgRating(filtered, b)) || 0,
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="benefit" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                      <Radar name="Avg score" dataKey="avg" stroke={C_TEAL} fill={C_TEAL} fillOpacity={0.3} />
                      <Tooltip formatter={v => [v, 'Avg score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Importance vs Satisfaction Quadrant ── */}
            <div className="section-heading">KPI 5 — Importance vs Satisfaction Quadrant</div>
            <div className="charts-grid">
              <div className="chart-card full">
                <div className="card-title">Action Priority Matrix</div>
                <div className="card-subtitle">
                  Top-left = high importance, low satisfaction → <strong>act now</strong>.
                  Top-right = high importance, high satisfaction → <strong>protect &amp; invest</strong>.
                  Bottom-left = low priority → <strong>deprioritise</strong>.
                  Bottom-right = low importance, high satisfaction → <strong>maintain</strong>.
                </div>
                {filtered.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>Submit responses to see the matrix.</div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 10, left: 60, fontSize: 10, color: C_RED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Act now ▲ high importance</div>
                    <div style={{ position: 'absolute', top: 10, right: 20, fontSize: 10, color: C_GREEN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Protect &amp; invest</div>
                    <div style={{ position: 'absolute', bottom: 40, left: 60, fontSize: 10, color: 'var(--hint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Low priority</div>
                    <div style={{ position: 'absolute', bottom: 40, right: 20, fontSize: 10, color: C_TEAL, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Maintain ▼ low importance</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ left: 20, right: 20, top: 30, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis type="number" dataKey="x" domain={[0, 5]} name="Satisfaction"
                          label={{ value: 'Satisfaction (avg rating)', position: 'insideBottom', offset: -10, fontSize: 11, fill: 'var(--muted)' }}
                          tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                        <YAxis type="number" dataKey="y" domain={[0, 5]} name="Importance"
                          label={{ value: 'Importance (priority rank)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: 'var(--muted)' }}
                          tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                        {/* Quadrant dividers */}
                        <CartesianGrid x1="50%" y1="0%" x2="50%" y2="100%" stroke={C_NAVY} strokeDasharray="4 4" />
                        <Tooltip content={<ScatterTooltip />} />
                        <Scatter data={importanceData}
                          fill={C_TEAL}
                          shape={(props) => {
                            const { cx, cy, payload } = props
                            const isActNow = payload.x < 2.5 && payload.y >= 2.5
                            const isProtect = payload.x >= 2.5 && payload.y >= 2.5
                            const color = isActNow ? C_RED : isProtect ? C_GREEN : payload.x >= 2.5 ? C_TEAL : C_AMBER
                            return <circle cx={cx} cy={cy} r={7} fill={color} fillOpacity={0.8} stroke="white" strokeWidth={1} />
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="legend-row" style={{ marginTop: 6 }}>
                  {[{ c: C_RED, l: 'Act now (high importance, low satisfaction)' },
                    { c: C_GREEN, l: 'Protect & invest' },
                    { c: C_TEAL, l: 'Maintain (low importance, high satisfaction)' },
                    { c: C_AMBER, l: 'Low priority' }].map(({ c, l }) => (
                    <div key={l} className="legend-item">
                      <div className="legend-dot" style={{ background: c, borderRadius: '50%' }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── All Responses Table ── */}
            <div className="section-heading">All Submissions</div>
            <div className="table-card">
              <div className="table-header">
                <span className="table-header-title">Response Log</span>
                <span className="resp-count">{filtered.length} submissions {filterProg !== 'All' ? `(${filterProg})` : ''}</span>
              </div>
              {filtered.length === 0 ? (
                <div className="empty">No responses submitted yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Submitted</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Programme</th>
                        <th>Department</th>
                        <th>Years</th>
                        <th>Increment</th>
                        <th>Avg Rating</th>
                        <th>Top Priority</th>
                        <th>Recommendations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(r => {
                        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
                        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                        const inc = r.salary_increment
                        const badgeClass = inc === '5%' ? 'badge-5' : inc === '10%' ? 'badge-10' : inc === '15%' ? 'badge-15' : ''
                        return (
                          <tr key={r.id}>
                            <td title={new Date(r.submitted_at).toLocaleString()}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                            <td title={r.employee?.name}>{r.employee?.name || <span style={{ color: 'var(--hint)' }}>Anonymous</span>}</td>
                            <td>{r.employee?.employmentType || '—'}</td>
                            <td>{r.employee?.programme || '—'}</td>
                            <td>{r.employee?.department || '—'}</td>
                            <td>{r.employee?.yearsAtEmerge || '—'}</td>
                            <td>{inc ? <span className={`badge ${badgeClass}`}>{inc}</span> : <span style={{ color: 'var(--hint)' }}>—</span>}</td>
                            <td>{avg}</td>
                            <td title={(r.priorities || []).join(', ')}>{r.priorities?.[0] || <span style={{ color: 'var(--hint)' }}>—</span>}</td>
                            <td title={r.recommendations}>
                              {r.recommendations ? r.recommendations.slice(0, 60) + (r.recommendations.length > 60 ? '…' : '') : <span style={{ color: 'var(--hint)' }}>—</span>}
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
