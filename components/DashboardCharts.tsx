'use client'

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

const PALETTE = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
  'bg-rose-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-lime-500',
]

function StatCard({ label, value, accent = 'text-gray-900', sub }: {
  label: string
  value: number | string
  accent?: string
  sub?: string
}) {
  return (
    <div className="card p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function HorizontalBar({ data, title }: { data: ChartItem[]; title: string }) {
  const filtered = data.filter(d => d.count > 0)
  const max = Math.max(...filtered.map(d => d.count), 1)
  const total = filtered.reduce((s, d) => s + d.count, 0)

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No data yet</p>
      ) : (
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
                  className={`h-3 rounded-full transition-all ${PALETTE[i % PALETTE.length]}`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SegmentedBar({ data, title }: { data: ChartItem[]; title: string }) {
  const filtered = data.filter(d => d.count > 0)
  const total = filtered.reduce((s, d) => s + d.count, 0)

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 italic">No data yet</p>
      ) : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
            {filtered.map(({ label, count }, i) => (
              <div
                key={label}
                className={`${PALETTE[i % PALETTE.length]}`}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${label}: ${count}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map(({ label, count }, i) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${PALETTE[i % PALETTE.length]}`} />
                  <span className="text-gray-600">{label}</span>
                </div>
                <span className="font-medium text-gray-700 ml-4">
                  {count} <span className="text-gray-400 font-normal">({Math.round((count / total) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
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
        <HorizontalBar data={byTeam} title="Members by Team" />
        <HorizontalBar data={byRole} title="Role Distribution" />
      </div>

      {/* Program + Year */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HorizontalBar data={byProgram} title="Program" />
        <HorizontalBar data={byYear} title="Year of Study" />
      </div>

      {/* Retention + Study/Co-op */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SegmentedBar data={retention} title="Returning Next Term" />
        <SegmentedBar data={byStudyCoop} title="Study / Co-op Status" />
      </div>

      {/* Skill level */}
      <HorizontalBar data={bySkillLevel} title="Skill Level Distribution" />

      {/* ── Demographics ── */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Demographics</h3>
          <p className="text-xs text-gray-400 mt-0.5">Visible to Co-presidents and VP Talent only</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SegmentedBar data={byGender} title="Gender" />
          <HorizontalBar data={byEthnicity} title="Ethnic Background" />
        </div>
      </div>
    </div>
  )
}
