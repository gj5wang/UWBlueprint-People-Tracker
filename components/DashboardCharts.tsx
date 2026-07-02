'use client'

import { useState } from 'react'

type ChartItem = { label: string; count: number }

interface DashboardChartsProps {
  totalMembers: number
  currentMembers: number
  alumniMembers: number
  byTeam: ChartItem[]
  byRole: ChartItem[]
  byProgram: ChartItem[]
  byYear: ChartItem[]
  retention: ChartItem[]
  byStudyCoop: ChartItem[]
  bySkillLevel: ChartItem[]
  byGender: ChartItem[]
  byEthnicity: ChartItem[]
}

const PALETTE_BG = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-rose-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-lime-500',
]

const PALETTE_HEX = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#fb923c', '#fbbf24', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#84cc16',
]

function StatCard({ label, value, accent = 'text-gray-900', sub }: {
  label: string; value: number | string; accent?: string; sub?: string
}) {
  return (
    <div className="card p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

type ViewType = 'bar' | 'pie'

function ViewToggle({ view, onChange }: { view: ViewType; onChange: (v: ViewType) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => onChange('bar')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          view === 'bar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Bar
      </button>
      <button
        onClick={() => onChange('pie')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          view === 'pie' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Pie
      </button>
    </div>
  )
}

function PieChart({ data }: { data: ChartItem[] }) {
  const filtered = data.filter(d => d.count > 0)
  const total = filtered.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-gray-400 italic">No data yet</p>

  let cumulative = 0
  const slices = filtered.map((item, i) => {
    const pct = item.count / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const r = 45
    const x1 = 50 + r * Math.cos(startAngle)
    const y1 = 50 + r * Math.sin(startAngle)
    const x2 = 50 + r * Math.cos(endAngle)
    const y2 = 50 + r * Math.sin(endAngle)
    const largeArc = pct > 0.5 ? 1 : 0
    const d = pct === 1
      ? `M50,50 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`
      : `M50,50 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`
    return { ...item, d, color: PALETTE_HEX[i % PALETTE_HEX.length], pct }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1" />
        ))}
      </svg>
      <div className="space-y-1.5 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-600 truncate max-w-[140px]">{s.label}</span>
            </div>
            <span className="font-medium text-gray-700 ml-2 shrink-0">
              {s.count} <span className="text-gray-400 font-normal">({Math.round(s.pct * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBar({ data }: { data: ChartItem[] }) {
  const filtered = data.filter(d => d.count > 0)
  const max = Math.max(...filtered.map(d => d.count), 1)
  const total = filtered.reduce((s, d) => s + d.count, 0)
  if (filtered.length === 0) return <p className="text-sm text-gray-400 italic">No data yet</p>

  return (
    <div className="space-y-3">
      {filtered.map(({ label, count }, i) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 truncate max-w-[200px]">{label}</span>
            <span className="text-gray-500 ml-2 shrink-0">
              {count} <span className="text-gray-400">({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${PALETTE_BG[i % PALETTE_BG.length]}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Chart({ data, title }: { data: ChartItem[]; title: string }) {
  const [view, setView] = useState<ViewType>('bar')
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <ViewToggle view={view} onChange={setView} />
      </div>
      {view === 'bar' ? <HorizontalBar data={data} /> : <PieChart data={data} />}
    </div>
  )
}

export default function DashboardCharts({
  totalMembers, currentMembers, alumniMembers,
  byTeam, byRole, byProgram, byYear,
  retention, byStudyCoop, bySkillLevel,
  byGender, byEthnicity,
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={totalMembers} />
        <StatCard
          label="Current"
          value={currentMembers}
          accent="text-emerald-600"
          sub={`${totalMembers > 0 ? Math.round((currentMembers / totalMembers) * 100) : 0}% of total`}
        />
        <StatCard label="Alumni" value={alumniMembers} accent="text-gray-500" />
        <StatCard
          label="Teams"
          value={byTeam.filter(t => t.label !== 'Unknown').length}
          accent="text-blue-600"
        />
      </div>

      {/* Team + Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart data={byTeam} title="Members by Team" />
        <Chart data={byRole} title="Role Distribution" />
      </div>

      {/* Program + Year */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart data={byProgram} title="Program" />
        <Chart data={byYear} title="Year of Study" />
      </div>

      {/* Retention + Study/Co-op */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Chart data={retention} title="Returning Next Term" />
        <Chart data={byStudyCoop} title="Study / Co-op Status" />
      </div>

      {/* Skill level */}
      <Chart data={bySkillLevel} title="Skill Level Distribution" />

      {/* Demographics */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Demographics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Visible to Co-presidents and VP Talent only</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Chart data={byGender} title="Gender" />
          <Chart data={byEthnicity} title="Ethnic Background" />
        </div>
      </div>
    </div>
  )
}
