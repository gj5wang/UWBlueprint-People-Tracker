'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Team, EXECUTIVE_ROLES, PROJECT_ROLES } from '@/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  teams: Team[]
}

const YEAR_OPTIONS = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', 'Graduate']

export default function NewMemberForm({ teams }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    bp_email: '',
    team_id: '',
    roles: [] as string[],
    program: '',
    year_of_study: '',
    status: 'current' as 'current' | 'alumni',
  })

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter((r) => r !== role)
        : [...f.roles, role],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.from('members').insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      bp_email: form.bp_email.trim().toLowerCase(),
      team_id: form.team_id || null,
      roles: form.roles,
      program: form.program.trim() || null,
      year_of_study: form.year_of_study || null,
      status: form.status,
    })

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  const RolePill = ({ role }: { role: string }) => (
    <button
      key={role}
      type="button"
      onClick={() => toggleRole(role)}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        form.roles.includes(role)
          ? 'bg-blueprint-blue text-white border-blueprint-blue'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blueprint-blue'
      }`}
    >
      {role}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={15} /> Back to admin
      </Link>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-5">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name *</label>
            <input
              required
              className="input"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Last name *</label>
            <input
              required
              className="input"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label">Blueprint email *</label>
          <input
            required
            type="email"
            placeholder="name@uwblueprint.org"
            className="input"
            value={form.bp_email}
            onChange={(e) => setForm((f) => ({ ...f, bp_email: e.target.value }))}
          />
          <p className="mt-1 text-xs text-gray-400">
            When this person signs in with Google, their account will be automatically linked.
          </p>
        </div>

        {/* Team */}
        <div>
          <label className="label">Team</label>
          <select
            className="input"
            value={form.team_id}
            onChange={(e) => setForm((f) => ({ ...f, team_id: e.target.value }))}
          >
            <option value="">— No team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Roles */}
        <div>
          <label className="label">Roles</label>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Executive
              </p>
              <div className="flex flex-wrap gap-2">
                {EXECUTIVE_ROLES.map((r) => (
                  <RolePill key={r} role={r} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Project
              </p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ROLES.map((r) => (
                  <RolePill key={r} role={r} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Program + Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Program</label>
            <input
              placeholder="e.g. Computer Science"
              className="input"
              value={form.program}
              onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Year of study</label>
            <select
              className="input"
              value={form.year_of_study}
              onChange={(e) => setForm((f) => ({ ...f, year_of_study: e.target.value }))}
            >
              <option value="">—</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Status *</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as 'current' | 'alumni' }))
            }
          >
            <option value="current">Current</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creating…' : 'Create member'}
          </button>
          <Link href="/admin" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  )
}
