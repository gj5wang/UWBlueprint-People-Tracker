'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { type MemberFull, type PermissionTier } from '@/types'
import { Search } from 'lucide-react'

// Initials fallback avatar
function Avatar({ member }: { member: MemberFull }) {
  const initials = `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`.toUpperCase()

  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={`${member.first_name} ${member.last_name}`}
        className="h-14 w-14 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div className="h-14 w-14 rounded-full bg-blueprint-blue flex items-center justify-center shrink-0">
      <span className="text-white text-lg font-semibold">{initials}</span>
    </div>
  )
}

interface Props {
  members: MemberFull[]
  viewerTier: PermissionTier
  viewerMemberId: string
  viewerTeamId: string | null
}

export default function MemberSheet({ members, viewerTier, viewerMemberId, viewerTeamId }: Props) {
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('current')

  // Unique teams for filter
  const teams = useMemo(() => {
    const map = new Map<string, string>()
    members.forEach(m => { if (m.team) map.set(m.team.id, m.team.name) })
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [members])

  const filtered = useMemo(() => {
    let rows = members

    // Team leads only see their own team
    if (viewerTier === 'team_lead' && viewerTeamId) {
      rows = rows.filter(m => m.team_id === viewerTeamId)
    }
    if (teamFilter !== 'all') {
      rows = rows.filter(m => m.team_id === teamFilter)
    }
    if (statusFilter !== 'all') {
      rows = rows.filter(m => m.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(m =>
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        m.bp_email.toLowerCase().includes(q) ||
        m.roles.some(r => r.toLowerCase().includes(q)) ||
        m.team?.name.toLowerCase().includes(q) ||
        m.program?.toLowerCase().includes(q)
      )
    }

    return [...rows].sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    )
  }, [members, search, teamFilter, statusFilter, viewerTier, viewerTeamId])

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, role, team, program…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {viewerTier !== 'team_lead' && (
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="input w-auto">
            <option value="all">All teams</option>
            {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All statuses</option>
          <option value="current">Current</option>
          <option value="alumni">Alumni</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{filtered.length}</span> member{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center text-gray-400 text-sm">
          No members found.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(member => {
            const isMe = member.id === viewerMemberId
            const meta = [
              member.program,
              member.year_of_study,
              member.team?.name,
            ].filter(Boolean).join(' · ')

            return (
              <Link
                key={member.id}
                href={`/profile/${member.id}`}
                className={`group flex items-center gap-4 rounded-xl border px-5 py-4 transition-all hover:border-blueprint-blue hover:shadow-sm bg-white ${
                  isMe ? 'border-blueprint-blue/40 bg-blueprint-blue-light/20' : 'border-blueprint-gray-border'
                }`}
              >
                {/* Avatar */}
                <Avatar member={member} />

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 group-hover:text-blueprint-blue transition-colors">
                      {member.first_name} {member.last_name}
                    </span>
                    {isMe && (
                      <span className="text-xs text-blueprint-blue font-medium bg-blueprint-blue-light px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    <span className={`badge ${member.status === 'current' ? 'badge-green' : 'badge-gray'}`}>
                      {member.status === 'current' ? 'Current' : 'Alumni'}
                    </span>
                  </div>

                  {/* Roles */}
                  {member.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.roles.map(r => (
                        <span key={r} className="badge-blue">{r}</span>
                      ))}
                    </div>
                  )}

                  {/* Email + program + year */}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span>{member.bp_email}</span>
                    {meta && <span className="text-gray-400">·</span>}
                    {meta && <span>{meta}</span>}
                  </div>

                  {/* Bio snippet */}
                  {member.bio && (
                    <p className="mt-1.5 text-xs text-gray-400 italic line-clamp-1">
                      {member.bio}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <svg
                  className="shrink-0 text-gray-300 group-hover:text-blueprint-blue transition-colors"
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
