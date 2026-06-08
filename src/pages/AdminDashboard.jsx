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
.topbar-left { display: flex; align-items: center; gap: 14px; }
.topbar-logo { height: 36px; width: auto; filter: brightness(0) invert(1); display: block; }
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
          <img src="data:image/png;base64,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" alt="Emerge Livelihoods" className="topbar-logo" />
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
