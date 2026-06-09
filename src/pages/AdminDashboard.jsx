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
.btn-pptx { background: #1d6fa8; color: #fff; }
.btn-pptx:hover { opacity: 0.85; }
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

async function exportToPptx(responses, logoSrc) {
  // Dynamically load PptxGenJS from CDN
  if (!window.PptxGenJS) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js'
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const pres = new window.PptxGenJS()
  pres.layout = 'LAYOUT_16x9'
  pres.title = 'Emerge Livelihoods — Employee Benefits Review'
  pres.author = 'Emerge Livelihoods HR'

  const C = {
    teal:      '028090',
    tealLight: 'E1F5EE',
    tealMid:   '0F6E56',
    navy:      '1A2F4A',
    white:     'FFFFFF',
    offWhite:  'F7F9F8',
    muted:     '6B7280',
    red:       'E24B4A',
    amber:     'EF9F27',
    green:     '27AE60',
    slate:     '374151',
    cardBg:    'F0F9F8',
  }

  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const total = responses.length

  // ── Helper: convert logo URL to base64 ──────────────────────
  async function imgToBase64(src) {
    return new Promise(res => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth; c.height = img.naturalHeight
        c.getContext('2d').drawImage(img, 0, 0)
        res(c.toDataURL('image/png').replace('data:image/png;base64,', 'image/png;base64,'))
      }
      img.onerror = () => res(null)
      img.src = src
    })
  }

  const logoData = await imgToBase64(logoSrc)

  // ── Helper: add logo + footer to any slide ───────────────────
  function addFooter(slide, lightBg = true) {
    if (logoData) {
      slide.addImage({ data: logoData, x: 0.4, y: 5.1, w: 1.4, h: 0.35 })
    }
    slide.addText(`Employee Benefits Review  ·  ${date}`, {
      x: 2.0, y: 5.18, w: 6.2, h: 0.2,
      fontSize: 8, color: lightBg ? C.muted : 'ADBFBE', align: 'center',
    })
    slide.addText(`${total} responses`, {
      x: 8.3, y: 5.18, w: 1.3, h: 0.2,
      fontSize: 8, color: lightBg ? C.muted : 'ADBFBE', align: 'right',
    })
  }

  // ── Helper: stat card (rounded rect + label + value) ─────────
  function addStatCard(slide, x, y, w, h, label, value, sub, accentColor) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      fill: { color: C.white },
      line: { color: 'E5E7EB', width: 0.5 },
      shadow: { type: 'outer', color: '000000', blur: 4, offset: 2, angle: 45, opacity: 0.07 },
      rectRadius: 0.1,
    })
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y, w: 0.06, h,
      fill: { color: accentColor || C.teal },
      line: { color: accentColor || C.teal, width: 0 },
      rectRadius: 0,
    })
    slide.addText(label.toUpperCase(), {
      x: x + 0.32, y: y + 0.12, w: w - 0.4, h: 0.18,
      fontSize: 8, color: C.muted, bold: true, charSpacing: 1,
    })
    slide.addText(String(value), {
      x: x + 0.32, y: y + 0.32, w: w - 0.4, h: 0.48,
      fontSize: 28, color: C.navy, bold: true, fontFace: 'Cambria',
    })
    if (sub) {
      slide.addText(sub, {
        x: x + 0.32, y: y + 0.82, w: w - 0.4, h: 0.18,
        fontSize: 9, color: C.muted,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 1 — Cover
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.navy }

    // Teal accent shape top-right
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.5, y: 0, w: 2.5, h: 5.625,
      fill: { color: C.teal, transparency: 15 },
      line: { color: C.teal, width: 0 },
    })
    s.addShape(pres.shapes.RECTANGLE, {
      x: 8.5, y: 0, w: 1.5, h: 5.625,
      fill: { color: C.teal, transparency: 5 },
      line: { color: C.teal, width: 0 },
    })

    if (logoData) {
      s.addImage({ data: logoData, x: 0.6, y: 0.5, w: 2.2, h: 0.55 })
    }

    s.addText('Employee Benefits', {
      x: 0.6, y: 1.4, w: 6.6, h: 0.8,
      fontSize: 40, color: C.white, bold: true, fontFace: 'Cambria',
    })
    s.addText('Review Report', {
      x: 0.6, y: 2.15, w: 6.6, h: 0.7,
      fontSize: 40, color: '5EEAD4', bold: false, fontFace: 'Cambria',
    })

    s.addText(`${total} Employee Responses  ·  ${date}`, {
      x: 0.6, y: 3.1, w: 6.6, h: 0.3,
      fontSize: 13, color: 'ADBFBE',
    })
    s.addText('Facilitated by Lillian Nabirye (WUSC Volunteer) & Chitty (HR Coordinator)', {
      x: 0.6, y: 3.5, w: 6.6, h: 0.25,
      fontSize: 10, color: '7A9FA0', italic: true,
    })

    s.addText('CONFIDENTIAL', {
      x: 0.6, y: 4.9, w: 3, h: 0.2,
      fontSize: 8, color: '5A7A7B', charSpacing: 3,
    })
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 2 — Summary KPIs
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Survey at a Glance', {
      x: 0.5, y: 0.25, w: 9, h: 0.55,
      fontSize: 28, color: C.navy, bold: true, fontFace: 'Cambria',
    })

    const avgOverall = responses.length
      ? (responses.reduce((acc, r) => {
          const vals = Object.values(r.ratings || {}).filter(v => v !== undefined)
          return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
        }, 0) / responses.length).toFixed(1)
      : '—'

    const avgRatingsData2 = BENEFITS.map(b => {
      const vals = responses.map(r => r.ratings?.[b]).filter(v => v !== undefined && v !== null)
      return { fullName: b, avg: vals.length ? (vals.reduce((a, c) => a + c, 0) / vals.length) : 0 }
    }).filter(b => b.avg > 0).sort((a, b) => a.avg - b.avg)

    const weakest = avgRatingsData2[0]
    const strongest = avgRatingsData2[avgRatingsData2.length - 1]

    const salData = salaryDist(responses)
    const topSal = salData.length ? salData.sort((a, b) => b.value - a.value)[0].name : '—'

    const prioTop = priorityCount(responses)[0]?.benefit || '—'

    addStatCard(s, 0.4, 0.95, 2.1, 1.15, 'Total Responses', total, 'employees', C.teal)
    addStatCard(s, 2.65, 0.95, 2.1, 1.15, 'Avg Overall Rating', avgOverall + ' / 5', 'across all benefits', C.tealMid)
    addStatCard(s, 4.9, 0.95, 2.1, 1.15, 'Top Salary Ask', topSal, 'most recommended', C.amber.replace('#', ''))
    addStatCard(s, 7.15, 0.95, 2.25, 1.15, '#1 Priority Benefit', '', '', C.navy)
    s.addText(prioTop.length > 18 ? prioTop.slice(0, 18) + '…' : prioTop, {
      x: 7.47, y: 1.27, w: 1.8, h: 0.55,
      fontSize: 13, color: C.navy, bold: true, wrap: true,
    })

    // Weakest + Strongest
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.4, y: 2.3, w: 4.3, h: 0.8,
      fill: { color: 'FEF2F2' }, line: { color: 'FECACA', width: 0.5 }, rectRadius: 0.08,
    })
    s.addText('Needs most attention', { x: 0.6, y: 2.34, w: 4.0, h: 0.2, fontSize: 9, color: C.red, bold: true })
    s.addText(weakest ? `${weakest.fullName}  (avg ${weakest.avg.toFixed(1)})` : '—', {
      x: 0.6, y: 2.54, w: 4.0, h: 0.22, fontSize: 11, color: C.slate,
    })

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.0, y: 2.3, w: 4.4, h: 0.8,
      fill: { color: 'EAF3DE' }, line: { color: 'BBF7D0', width: 0.5 }, rectRadius: 0.08,
    })
    s.addText('Highest rated', { x: 5.2, y: 2.34, w: 4.0, h: 0.2, fontSize: 9, color: C.green, bold: true })
    s.addText(strongest ? `${strongest.fullName}  (avg ${strongest.avg.toFixed(1)})` : '—', {
      x: 5.2, y: 2.54, w: 4.0, h: 0.22, fontSize: 11, color: C.slate,
    })

    // Acting position quick stat
    const acting = actingStats(responses)
    const yesP = total ? Math.round((acting.yes / total) * 100) : 0
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.4, y: 3.25, w: 4.3, h: 1.05,
      fill: { color: C.white }, line: { color: 'E5E7EB', width: 0.5 }, rectRadius: 0.08,
    })
    s.addText('Willing to take acting role', { x: 0.6, y: 3.3, w: 3.9, h: 0.22, fontSize: 9, color: C.muted, bold: true })
    s.addText(`${acting.yes} Yes  ·  ${acting.no} No`, { x: 0.6, y: 3.55, w: 3.9, h: 0.3, fontSize: 18, color: C.navy, bold: true, fontFace: 'Cambria' })
    s.addText(`${yesP}% willing`, { x: 0.6, y: 3.88, w: 3.9, h: 0.2, fontSize: 9, color: C.muted })

    // Training stat
    const trainingCount = responses.filter(r => r.training_area).length
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.0, y: 3.25, w: 4.4, h: 1.05,
      fill: { color: C.white }, line: { color: 'E5E7EB', width: 0.5 }, rectRadius: 0.08,
    })
    s.addText('Specified training interest', { x: 5.2, y: 3.3, w: 4.0, h: 0.22, fontSize: 9, color: C.muted, bold: true })
    s.addText(`${trainingCount} employees`, { x: 5.2, y: 3.55, w: 4.0, h: 0.3, fontSize: 18, color: C.navy, bold: true, fontFace: 'Cambria' })
    s.addText(`${total ? Math.round((trainingCount / total) * 100) : 0}% of respondents`, { x: 5.2, y: 3.88, w: 4.0, h: 0.2, fontSize: 9, color: C.muted })

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 3 — Average Ratings per Benefit (bar chart)
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Average Benefit Ratings', {
      x: 0.5, y: 0.2, w: 7, h: 0.5,
      fontSize: 26, color: C.navy, bold: true, fontFace: 'Cambria',
    })
    s.addText('Rated 0 (non-existent) → 5 (outstanding) by employees', {
      x: 0.5, y: 0.68, w: 7, h: 0.25,
      fontSize: 11, color: C.muted,
    })

    const avgRatingsAll2 = BENEFITS.map(b => {
      const vals = responses.map(r => r.ratings?.[b]).filter(v => v !== undefined && v !== null)
      return { label: b, value: vals.length ? parseFloat((vals.reduce((a, c) => a + c, 0) / vals.length).toFixed(2)) : 0 }
    }).sort((a, b) => a.value - b.value)

    const chartData = [{ name: 'Avg Rating', labels: avgRatingsAll2.map(d => d.label.length > 30 ? d.label.slice(0, 30) + '…' : d.label), values: avgRatingsAll2.map(d => d.value) }]

    s.addChart(pres.charts.BAR, chartData, {
      x: 0.4, y: 0.95, w: 9.2, h: 4.2,
      barDir: 'bar',
      chartColors: avgRatingsAll2.map(d => d.value < 2 ? C.red : d.value < 3.5 ? C.amber : C.green),
      chartArea: { fill: { color: C.white }, roundedCorners: true },
      catAxisLabelColor: C.slate,
      catAxisLabelFontSize: 9,
      valAxisLabelColor: C.muted,
      valAxisLabelFontSize: 9,
      valAxisMinVal: 0,
      valAxisMaxVal: 5,
      valGridLine: { color: 'E5E7EB', size: 0.5 },
      catGridLine: { style: 'none' },
      showValue: true,
      dataLabelColor: C.slate,
      dataLabelFontSize: 8,
      showLegend: false,
    })

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 4 — Priority Benefits & Salary Increment
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Priorities & Salary Recommendations', {
      x: 0.5, y: 0.2, w: 9, h: 0.5,
      fontSize: 26, color: C.navy, bold: true, fontFace: 'Cambria',
    })

    // Priority bar chart (left)
    const prioData2 = priorityCount(responses).slice(0, 8)
    s.addText('Top Priority Benefits (weighted score)', {
      x: 0.4, y: 0.75, w: 5.5, h: 0.25, fontSize: 10, color: C.muted, bold: true,
    })
    if (prioData2.length > 0) {
      s.addChart(pres.charts.BAR, [{
        name: 'Score',
        labels: prioData2.map(d => d.benefit.length > 26 ? d.benefit.slice(0, 26) + '…' : d.benefit),
        values: prioData2.map(d => d.score),
      }], {
        x: 0.4, y: 1.0, w: 5.5, h: 3.8,
        barDir: 'bar',
        chartColors: [C.teal],
        chartArea: { fill: { color: C.white }, roundedCorners: true },
        catAxisLabelColor: C.slate, catAxisLabelFontSize: 9,
        valAxisLabelColor: C.muted, valAxisLabelFontSize: 9,
        valGridLine: { color: 'E5E7EB', size: 0.5 },
        catGridLine: { style: 'none' },
        showValue: true, dataLabelColor: C.slate, dataLabelFontSize: 8,
        showLegend: false,
      })
    }

    // Salary pie (right)
    const salData2 = salaryDist(responses)
    s.addText('Salary Increment Recommendation', {
      x: 6.2, y: 0.75, w: 3.4, h: 0.25, fontSize: 10, color: C.muted, bold: true,
    })
    if (salData2.length > 0) {
      s.addChart(pres.charts.PIE, [{
        name: 'Employees',
        labels: salData2.map(d => d.name),
        values: salData2.map(d => d.value),
      }], {
        x: 6.0, y: 1.0, w: 3.6, h: 2.7,
        chartColors: ['A3C4BC', '5B9AA0', '1A5276'],
        chartArea: { fill: { color: C.white }, roundedCorners: true },
        showPercent: true,
        dataLabelColor: C.white,
        dataLabelFontSize: 11,
        dataLabelFontBold: true,
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 10,
        legendColor: C.slate,
      })
    }

    // Salary legend cards
    salData2.forEach((d, i) => {
      const x = 6.05 + i * 1.25
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 3.82, w: 1.15, h: 0.65,
        fill: { color: C.white }, line: { color: 'E5E7EB', width: 0.5 }, rectRadius: 0.07,
      })
      s.addText(d.name, { x, y: 3.86, w: 1.15, h: 0.22, fontSize: 14, color: C.navy, bold: true, align: 'center', fontFace: 'Cambria' })
      s.addText(`${d.value} emp.`, { x, y: 4.09, w: 1.15, h: 0.2, fontSize: 9, color: C.muted, align: 'center' })
    })

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 5 — Life Event Contribution Preferences
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Life Event Contribution Preferences', {
      x: 0.5, y: 0.2, w: 9, h: 0.5,
      fontSize: 26, color: C.navy, bold: true, fontFace: 'Cambria',
    })
    s.addText('Cash vs in-kind preferences for wedding, introduction, and bereavement', {
      x: 0.5, y: 0.68, w: 9, h: 0.22, fontSize: 11, color: C.muted,
    })

    const leStats2 = lifeEventStats(responses)

    LIFE_EVENTS.forEach((ev, i) => {
      const x = 0.4 + i * 3.2
      const cash = leStats2[ev].cash
      const inkind = leStats2[ev].inkind
      const tot = cash + inkind || 1
      const cashPct = Math.round((cash / tot) * 100)
      const inkindPct = 100 - cashPct
      const majority = cash >= inkind ? 'Cash' : 'In-kind'
      const majColor = cash >= inkind ? C.teal : C.amber

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.0, w: 2.95, h: 3.65,
        fill: { color: C.white }, line: { color: 'E5E7EB', width: 0.5 }, rectRadius: 0.1,
        shadow: { type: 'outer', color: '000000', blur: 4, offset: 2, angle: 45, opacity: 0.07 },
      })

      s.addText(ev.toUpperCase(), { x: x + 0.15, y: 1.1, w: 2.6, h: 0.22, fontSize: 9, color: C.muted, bold: true, charSpacing: 2 })
      s.addText(majority, { x: x + 0.15, y: 1.34, w: 2.6, h: 0.44, fontSize: 24, color: majColor, bold: true, fontFace: 'Cambria' })
      s.addText('majority preference', { x: x + 0.15, y: 1.78, w: 2.6, h: 0.2, fontSize: 9, color: C.muted })

      // Grouped bar chart
      s.addChart(pres.charts.BAR, [
        { name: 'Cash', labels: ['Cash', 'In-kind'], values: [cash, 0] },
        { name: 'In-kind', labels: ['Cash', 'In-kind'], values: [0, inkind] },
      ], {
        x: x + 0.1, y: 2.0, w: 2.75, h: 1.85,
        barDir: 'col',
        barGrouping: 'clustered',
        chartColors: [C.teal, C.amber],
        chartArea: { fill: { color: 'F7F9F8' }, roundedCorners: false },
        catAxisLabelColor: C.slate, catAxisLabelFontSize: 9,
        valAxisLabelColor: C.muted, valAxisLabelFontSize: 8,
        valGridLine: { color: 'E5E7EB', size: 0.5 },
        catGridLine: { style: 'none' },
        showValue: true, dataLabelColor: C.white, dataLabelFontSize: 10, dataLabelFontBold: true,
        showLegend: false,
        valAxisMinVal: 0,
        valAxisMaxVal: Math.max(cash, inkind) + 1,
      })

      s.addText(`${cashPct}% Cash  ·  ${inkindPct}% In-kind`, {
        x: x + 0.15, y: 3.92, w: 2.6, h: 0.2, fontSize: 8, color: C.muted, align: 'center',
      })
    })

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 6 — Acting Position & Training Interests
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Acting Position & Training Interests', {
      x: 0.5, y: 0.2, w: 9, h: 0.5,
      fontSize: 26, color: C.navy, bold: true, fontFace: 'Cambria',
    })

    const acting = actingStats(responses)
    const yesP = total ? Math.round((acting.yes / total) * 100) : 0
    const noP = total ? Math.round((acting.no / total) * 100) : 0

    // Acting donut chart
    s.addText('Willing to take acting role above current level?', {
      x: 0.4, y: 0.78, w: 4.5, h: 0.22, fontSize: 10, color: C.muted, bold: true,
    })
    s.addChart(pres.charts.DOUGHNUT, [{
      name: 'Employees',
      labels: ['Yes', 'No', 'Not answered'],
      values: [acting.yes, acting.no, acting.unanswered],
    }], {
      x: 0.3, y: 1.0, w: 3.2, h: 2.8,
      chartColors: [C.green, C.red, 'D1D5DB'],
      chartArea: { fill: { color: C.white }, roundedCorners: true },
      holeSize: 55,
      showPercent: true,
      dataLabelColor: C.white,
      dataLabelFontSize: 11,
      dataLabelFontBold: true,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 9,
      legendColor: C.slate,
    })

    s.addText(`${acting.yes} Yes  (${yesP}%)`, { x: 0.4, y: 3.85, w: 3.0, h: 0.22, fontSize: 10, color: C.green, bold: true })
    s.addText(`${acting.no} No  (${noP}%)`, { x: 0.4, y: 4.1, w: 3.0, h: 0.22, fontSize: 10, color: C.red, bold: true })

    // Training interests list
    s.addText('Training areas of interest', {
      x: 4.0, y: 0.78, w: 5.6, h: 0.22, fontSize: 10, color: C.muted, bold: true,
    })

    const trainingItems = responses.filter(r => r.training_area).slice(0, 10)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 4.0, y: 1.0, w: 5.6, h: 3.65,
      fill: { color: C.white }, line: { color: 'E5E7EB', width: 0.5 }, rectRadius: 0.1,
    })

    if (trainingItems.length === 0) {
      s.addText('No training responses recorded.', { x: 4.2, y: 2.2, w: 5.2, h: 0.4, fontSize: 12, color: C.muted, align: 'center' })
    } else {
      trainingItems.forEach((r, i) => {
        const iy = 1.1 + i * 0.36
        if (iy > 4.45) return
        const name = r.employee?.name ? `${r.employee.name}` : 'Anonymous'
        const dept = r.employee?.department ? ` · ${r.employee.department}` : ''
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: 4.1, y: iy, w: 5.4, h: 0.32,
          fill: { color: i % 2 === 0 ? C.cardBg : C.white }, line: { color: 'F3F4F6', width: 0 }, rectRadius: 0.05,
        })
        s.addText(name + dept, { x: 4.2, y: iy + 0.02, w: 2.2, h: 0.28, fontSize: 8, color: C.muted })
        s.addText(r.training_area.length > 40 ? r.training_area.slice(0, 40) + '…' : r.training_area, {
          x: 6.5, y: iy + 0.02, w: 2.9, h: 0.28, fontSize: 9, color: C.slate,
        })
      })
    }

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 7 — Recommendations & Suggestions
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.offWhite }

    s.addText('Employee Recommendations', {
      x: 0.5, y: 0.2, w: 9, h: 0.5,
      fontSize: 26, color: C.navy, bold: true, fontFace: 'Cambria',
    })
    s.addText('Selected quotes from employee responses', {
      x: 0.5, y: 0.68, w: 9, h: 0.22, fontSize: 11, color: C.muted,
    })

    const recs = responses.filter(r => r.recommendations).slice(0, 4)
    const sug = responses.filter(r => r.suggestions).slice(0, 4)

    recs.forEach((r, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 0.4 + col * 4.9
      const y = 1.0 + row * 1.55

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y, w: 4.7, h: 1.4,
        fill: { color: C.cardBg }, line: { color: 'CBE8E3', width: 0.5 }, rectRadius: 0.1,
      })
      s.addText('"', { x: x + 0.12, y: y + 0.04, w: 0.3, h: 0.3, fontSize: 22, color: C.teal, bold: true })
      const txt = r.recommendations.length > 130 ? r.recommendations.slice(0, 130) + '…' : r.recommendations
      s.addText(txt, { x: x + 0.35, y: y + 0.1, w: 4.2, h: 0.9, fontSize: 9.5, color: C.slate, wrap: true })
      const name = r.employee?.name || 'Anonymous'
      s.addText(`— ${name}`, { x: x + 0.35, y: y + 1.12, w: 4.1, h: 0.2, fontSize: 8, color: C.muted, italic: true, align: 'right' })
    })

    if (recs.length === 0) {
      s.addText('No recommendations recorded yet.', { x: 0.5, y: 2.5, w: 9, h: 0.4, fontSize: 13, color: C.muted, align: 'center' })
    }

    addFooter(s)
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE 8 — Closing / Next Steps
  // ─────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide()
    s.background = { color: C.navy }

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 3.8, w: 10, h: 1.825,
      fill: { color: C.teal, transparency: 20 },
      line: { color: C.teal, width: 0 },
    })

    if (logoData) {
      s.addImage({ data: logoData, x: 0.6, y: 0.4, w: 2.2, h: 0.55 })
    }

    s.addText('Thank You', {
      x: 0.6, y: 1.2, w: 8.8, h: 0.8,
      fontSize: 44, color: C.white, bold: true, fontFace: 'Cambria',
    })
    s.addText('Your feedback shapes a better workplace for everyone at Emerge Livelihoods.', {
      x: 0.6, y: 2.1, w: 8.5, h: 0.6,
      fontSize: 14, color: 'ADBFBE',
    })

    s.addText([
      { text: 'HR Contact: ', options: { bold: true, color: '5EEAD4' } },
      { text: 'Chitty — Human Resources Coordinator', options: { color: 'ADBFBE' } },
    ], { x: 0.6, y: 3.95, w: 8.5, h: 0.28, fontSize: 11 })

    s.addText([
      { text: 'WUSC Volunteer: ', options: { bold: true, color: '5EEAD4' } },
      { text: 'Lillian Nabirye', options: { color: 'ADBFBE' } },
    ], { x: 0.6, y: 4.28, w: 8.5, h: 0.28, fontSize: 11 })

    s.addText(`Generated ${date}  ·  ${total} responses  ·  CONFIDENTIAL`, {
      x: 0.6, y: 4.9, w: 8.5, h: 0.22, fontSize: 8, color: '5A7A7B',
    })
  }

  // ─── Save ────────────────────────────────────────────────────
  await pres.writeFile({ fileName: `Emerge_Benefits_Review_${new Date().toISOString().slice(0, 10)}.pptx` })
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