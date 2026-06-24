'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { type MemberFull, type PermissionTier } from '@/types'
import { COLUMN_VISIBILITY } from '@/lib/permissions'
import { Search, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'

// ─── Column definitions ──────────────────────────────────────

interface ColumnDef {
  key: string
  label: string
  render?: (member: MemberFull) => React.ReactNode
  sortable?: boolean
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'first_name', label: 'First Name', sortable: true },
  { key: 'last_name', label: 'Last Name', sortable: true },
  { key: 'bp_email', label: 'BP Email', sortable: true },
  {
    key: 'team',
    label: 'Team',
    render: (m) => m.team?.name ?? '—',
    sortable: true,
  },
  {
    key: 'roles',
    label: 'Role',
    render: (m) => (
      <div className="flex flex-wrap gap-1">
        {m.roles.map((r) => (
          <span key={r} className="badge-blue">
            {r}
          </span>
        ))}
      </div>
    ),
  },
  { key: 'program', label: 'Program', sortable: true },
  { key: 'year_of_study', label: 'Year', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (m) => (
      <span className={m.status === 'current' ? 'badge-green' : 'badge-gray'}>
        {m.status === 'current' ? 'Current' : 'Alumni'}
      </span>
    ),
    sortable: true,
  },
  // Tier 2
  { key: 'study_coop', label: 'Study / Co-op', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'terms_on_bp', label: 'Terms on BP', sortable: true },
  { key: 'skill_level', label: 'Skill Level', sortable: true },
  {
    key: 'coming_back',
    label: 'Coming Back?',
    render: (m) =>
      m.coming_back === null ? '—' : m.coming_back ? 'Yes' : 'No',
  },
  { key: 'role_next_term', label: 'Role Next Term' },
  { key: 'notes', label: 'Notes' },
  // Tier 3
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'ethnic_background', label: 'Ethnicity' },
]

// ─── Component ───────────────────────────────────────────────

interface Props {
  members: MemberFull[]
  viewerTier: PermissionTier
  viewerMemberId: string
  viewerTeamId: string | null
}

type SortDir = 'asc' | 'desc'

export default function MemberSheet({
  members,
  viewerTier,
  viewerMemberId,
  viewerTeamId,
}: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string>('last_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('current')

  // Columns visible to this viewer
  const visibleColumns = useMemo(
    () =>
      ALL_COLUMNS.filter((col) =>
        COLUMN_VISIBILITY[viewerTier].includes(col.key)
      ),
    [viewerTier]
  )

  // Unique teams for filter dropdown
  const teams = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach((m) => {
      if (m.team) map.set(m.team.id, m.team.name)
    })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [members])

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = members

    // Team leads only see their own team
    if (viewerTier === 'team_lead' && viewerTeamId) {
      rows = rows.filter((m) => m.team_id === viewerTeamId)
    }

    if (teamFilter !== 'all') {
      rows = rows.filter((m) => m.team_id === teamFilter)
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((m) => m.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (m) =>
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.bp_email.toLowerCase().includes(q) ||
          m.roles.some((r) => r.toLowerCase().includes(q)) ||
          m.team?.name.toLowerCase().includes(q)
      )
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''

      if (sortKey === 'team') {
        av = a.team?.name ?? ''
        bv = b.team?.name ?? ''
      } else {
        av = (a as any)[sortKey] ?? ''
        bv = (b as any)[sortKey] ?? ''
      }

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })

    return rows
  }, [members, search, sortKey, sortDir, teamFilter, statusFilter, viewerTier, viewerTeamId])

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function getCellValue(member: MemberFull, col: ColumnDef): React.ReactNode {
    // Hide notes/skill_level from the member themselves
    if (
      member.id === viewerMemberId &&
      (col.key === 'notes' || col.key === 'skill_level')
    ) {
      return '—'
    }
    if (col.render) return col.render(member)
    const val = (member as any)[col.key]
    return val !== null && val !== undefined && val !== '' ? String(val) : '—'
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search name, email, role, team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Team filter — hidden for team leads (they only see their team) */}
        {viewerTier !== 'team_lead' && (
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All teams</option>
            {teams.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All statuses</option>
          <option value="current">Current</option>
          <option value="alumni">Alumni</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{filtered.length}</span> member
        {filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blueprint-gray-border bg-gray-50">
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none hover:text-gray-900' : ''
                    }`}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blueprint-gray-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr
                    key={member.id}
                    className={`transition-colors hover:bg-gray-50 ${
                      member.id === viewerMemberId ? 'bg-blueprint-blue-light/40' : ''
                    }`}
                  >
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 max-w-[200px]">
                        <div className="truncate">{getCellValue(member, col)}</div>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${member.id}`}
                        className="inline-flex items-center gap-1 text-blueprint-blue hover:underline text-xs font-medium"
                      >
                        {member.id === viewerMemberId ? 'Edit' : 'View'}
                        <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
