import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
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

const SALARY_COLORS = { '5%': '#a3c4bc', '10%': '#5b9aa0', '15%': '#1a5276' }
const BAR_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6']

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
.topbar { background: var(--surface); border-bottom: 0.5px solid var(--border-strong); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 10; }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.org-mark { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.sep { color: var(--hint); }
.page-title { font-family: 'DM Serif Display', serif; font-size: 18px; font-weight: 400; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.btn { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; padding: 7px 16px; border-radius: var(--radius); cursor: pointer; transition: opacity 0.15s; border: none; }
.btn-export { background: var(--green); color: #fff; }
.btn-export:hover { opacity: 0.85; }
.btn-signout { background: var(--surface2); color: var(--muted); border: 0.5px solid var(--border-strong); }
.btn-signout:hover { color: var(--text); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 2rem; }
.stat-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--hint); margin-bottom: 6px; }
.stat-value { font-family: 'DM Serif Display', serif; font-size: 32px; font-weight: 400; line-height: 1; color: var(--text); }
.stat-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 2rem; }
.chart-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); padding: 1.5rem; }
.chart-card.full { grid-column: 1 / -1; }
.card-title { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hint); margin-bottom: 1.25rem; }
.table-card { background: var(--surface); border: 0.5px solid var(--border-strong); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
.table-header { padding: 1rem 1.5rem; border-bottom: 0.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.table-header-title { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hint); }
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
@media (max-width: 768px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  .charts-grid .chart-card.full { grid-column: 1; }
  .main { padding: 1rem; }
  .topbar { padding: 0 1rem; }
}
`

function avgRating(responses, benefit) {
  const vals = responses.map(r => r.ratings?.[benefit]).filter(v => v !== undefined && v !== null)
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

function salaryDist(responses) {
  const counts = {}
  responses.forEach(r => {
    const v = r.salary_increment
    if (v) counts[v] = (counts[v] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function priorityCount(responses) {
  const counts = {}
  responses.forEach(r => {
    (r.priorities || []).forEach((b, i) => {
      if (!b) return
      if (!counts[b]) counts[b] = { benefit: b, score: 0, count: 0 }
      counts[b].score += (6 - i) // weight: 1st = 6pts, 6th = 1pt
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

function exportToExcel(responses) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Full responses
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
    BENEFITS.forEach(b => {
      row[`Rating: ${b}`] = r.ratings?.[b] !== undefined ? r.ratings[b] : ''
    })
    // Custom benefits
    Object.keys(r.ratings || {}).filter(k => !BENEFITS.includes(k)).forEach(k => {
      row[`Rating (custom): ${k}`] = r.ratings[k]
    })
    return row
  })
  const ws1 = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws1, 'All Responses')

  // Sheet 2: Average ratings
  const avgRows = BENEFITS.map(b => ({
    Benefit: b,
    'Average Rating': avgRating(responses, b) ?? 'N/A',
    'Responses Count': responses.filter(r => r.ratings?.[b] !== undefined).length,
  }))
  const ws2 = XLSX.utils.json_to_sheet(avgRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Average Ratings')

  // Sheet 3: Priority rankings
  const prioRows = priorityCount(responses).map(p => ({
    Benefit: p.benefit,
    'Weighted Score': p.score,
    'Times Selected': p.count,
  }))
  const ws3 = XLSX.utils.json_to_sheet(prioRows)
  XLSX.utils.book_append_sheet(wb, ws3, 'Priority Rankings')

  // Sheet 4: Salary distribution
  const salRows = salaryDist(responses).map(s => ({
    'Increment %': s.name,
    'Responses': s.value,
    'Percentage': responses.length ? ((s.value / responses.length) * 100).toFixed(1) + '%' : '0%',
  }))
  const ws4 = XLSX.utils.json_to_sheet(salRows)
  XLSX.utils.book_append_sheet(wb, ws4, 'Salary Distribution')

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

export default function AdminDashboard() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .order('submitted_at', { ascending: false })
      if (!error) setResponses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const avgRatingsData = avgRatingsAll(responses)
  const salaryData = salaryDist(responses)
  const prioData = priorityCount(responses)

  const ratedCount = responses.reduce((acc, r) => {
    return acc + Object.values(r.ratings || {}).filter(v => v !== undefined).length
  }, 0)

  const avgOverall = responses.length
    ? (responses.reduce((acc, r) => {
        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
        return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / responses.length).toFixed(2)
    : '—'

  return (
    <>
      <style>{css}</style>

      <div className="topbar">
        <div className="topbar-left">
          <span className="org-mark">Emerge · Livelihoods</span>
          <span className="sep">·</span>
          <span className="page-title">Benefits Review Dashboard</span>
        </div>
        <div className="topbar-right">
          <button
            className="btn btn-export"
            onClick={() => exportToExcel(responses)}
            disabled={!responses.length}
          >
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
            {/* Stats */}
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
              </div>
              <div className="stat-card">
                <div className="stat-label">Benefits rated</div>
                <div className="stat-value">{ratedCount}</div>
                <div className="stat-sub">total individual ratings</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Salary majority</div>
                <div className="stat-value">
                  {salaryData.length
                    ? salaryData.sort((a, b) => b.value - a.value)[0].name
                    : '—'}
                </div>
                <div className="stat-sub">most recommended increment</div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Avg ratings per benefit — full width */}
              <div className="chart-card full">
                <div className="card-title">Average Rating per Benefit (0–5)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={avgRatingsData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis type="category" dataKey="benefit" width={220} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {avgRatingsData.map((entry, i) => (
                        <Cell key={i} fill={entry.avg < 2 ? '#e74c3c' : entry.avg < 3.5 ? '#f39c12' : '#27ae60'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Priority ranking */}
              <div className="chart-card">
                <div className="card-title">Top Priority Benefits (weighted score)</div>
                {prioData.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No priority data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={prioData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <YAxis type="category" dataKey="benefit" width={200}
                        tickFormatter={v => v.length > 24 ? v.slice(0, 24) + '…' : v}
                        tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                      <Tooltip formatter={(v, n, p) => [v, 'Weighted score']} labelFormatter={l => l} />
                      <Bar dataKey="score" fill="#3498db" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Salary distribution */}
              <div className="chart-card">
                <div className="card-title">Salary Increment Recommendations</div>
                {salaryData.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, padding: '1rem 0' }}>No data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={salaryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
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
            </div>

            {/* Responses table */}
            <div className="table-card">
              <div className="table-header">
                <span className="table-header-title">All Responses</span>
                <span className="resp-count">{responses.length} submissions</span>
              </div>
              {responses.length === 0 ? (
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
                      {responses.map(r => {
                        const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
                        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                        const inc = r.salary_increment
                        const badgeClass = inc === '5%' ? 'badge-5' : inc === '10%' ? 'badge-10' : inc === '15%' ? 'badge-15' : ''
                        return (
                          <tr key={r.id}>
                            <td title={new Date(r.submitted_at).toLocaleString()}>
                              {new Date(r.submitted_at).toLocaleDateString()}
                            </td>
                            <td title={r.employee?.name}>{r.employee?.name || <span style={{ color: 'var(--hint)' }}>Anonymous</span>}</td>
                            <td>{r.employee?.employmentType || '—'}</td>
                            <td>{r.employee?.programme || '—'}</td>
                            <td>{r.employee?.department || '—'}</td>
                            <td>{r.employee?.yearsAtEmerge || '—'}</td>
                            <td>
                              {inc
                                ? <span className={`badge ${badgeClass}`}>{inc}</span>
                                : <span style={{ color: 'var(--hint)' }}>—</span>}
                            </td>
                            <td>{avg}</td>
                            <td title={(r.priorities || []).join(', ')}>
                              {r.priorities?.[0] || <span style={{ color: 'var(--hint)' }}>—</span>}
                            </td>
                            <td title={r.recommendations}>
                              {r.recommendations
                                ? r.recommendations.slice(0, 60) + (r.recommendations.length > 60 ? '…' : '')
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
