'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type MemberFull, type PermissionTier, type Team, EXECUTIVE_ROLES, PROJECT_ROLES } from '@/types'
import { canEditMember } from '@/lib/permissions'
import { Save, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import AvatarUpload from '@/components/AvatarUpload'

interface Props {
  member: MemberFull
  viewerTier: PermissionTier
  viewerMemberId: string
  teams: Team[]
  backHref?: string
}

export default function ProfileForm({ member, viewerTier, viewerMemberId, teams, backHref = '/sheet' }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member.avatar_url ?? null)

  const isOwnProfile = member.id === viewerMemberId
  const canEdit = canEditMember(viewerTier, viewerMemberId, member.id)

  const isTier2Viewer = viewerTier === 'team_lead' || viewerTier === 'vp' || viewerTier === 'super_admin'
  const isSuperAdmin = viewerTier === 'super_admin'

  // Own profile: everyone can see/edit all their own fields (except skill_level/notes)
  // Other's profile: gated by tier
  const showTier2 = isOwnProfile || isTier2Viewer
  const showTier3 = isOwnProfile || isSuperAdmin

  // Parse socials JSONB into individual fields
  const socialsObj = (member.socials ?? {}) as Record<string, string>

  const [form, setForm] = useState({
    // Tier 1
    first_name: member.first_name,
    last_name: member.last_name,
    bp_email: member.bp_email,
    team_id: member.team_id ?? '',
    roles: member.roles,
    program: member.program ?? '',
    year_of_study: member.year_of_study ?? '',
    status: member.status,
    // Tier 2
    study_coop: member.study_coop ?? '',
    location: member.location ?? '',
    terms_on_bp: member.terms_on_bp?.toString() ?? '',
    skill_level: member.skill_level ?? '',
    notes: member.notes ?? '',
    coming_back: member.coming_back?.toString() ?? '',
    role_next_term: member.role_next_term ?? '',
    // Tier 3
    personal_email: member.personal_email ?? '',
    gender: member.gender ?? '',
    ethnic_background: member.ethnic_background ?? '',
    social_linkedin: socialsObj.linkedin ?? '',
    social_github: socialsObj.github ?? '',
    social_instagram: socialsObj.instagram ?? '',
    social_twitter: socialsObj.twitter ?? '',
    // Public bio — visible to all, editable by self
    bio: member.bio ?? '',
  })

  function toggleRole(role: string) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Tier 1 — all editors
    const update: Partial<MemberFull> = {
      first_name: form.first_name,
      last_name: form.last_name,
      program: form.program || null,
      year_of_study: form.year_of_study || null,
      status: form.status as MemberFull['status'],
      // Bio — editable by self or super_admin
      ...(isOwnProfile || isSuperAdmin ? { bio: form.bio || null } : {}),
    }

    // BP email — editable on own profile, or by VP/super admin on any profile
    if (isOwnProfile || viewerTier === 'vp' || viewerTier === 'super_admin') {
      update.bp_email = form.bp_email
    }
    // Team + roles — VP and super admin only
    if (viewerTier === 'vp' || viewerTier === 'super_admin') {
      update.team_id = form.team_id || null
      update.roles = form.roles
    }

    // Tier 2 — own profile OR team lead and above
    if (isOwnProfile || isTier2Viewer) {
      update.study_coop = form.study_coop || null
      update.location = form.location || null
      update.terms_on_bp = form.terms_on_bp ? parseInt(form.terms_on_bp) : null
      update.coming_back = form.coming_back === '' ? null : form.coming_back === 'true'
      update.role_next_term = form.role_next_term || null
    }

    // Skill level + notes — team lead and above, but NEVER for own profile
    if (isTier2Viewer && !isOwnProfile) {
      update.skill_level = form.skill_level || null
      update.notes = form.notes || null
    }

    // Tier 3 — own profile OR super admin
    if (isOwnProfile || isSuperAdmin) {
      update.personal_email = form.personal_email || null
      update.gender = form.gender || null
      update.ethnic_background = form.ethnic_background || null

      // Build socials object
      const socials: Record<string, string> = {}
      if (form.social_linkedin) socials.linkedin = form.social_linkedin
      if (form.social_github) socials.github = form.social_github
      if (form.social_instagram) socials.instagram = form.social_instagram
      if (form.social_twitter) socials.twitter = form.social_twitter
      update.socials = Object.keys(socials).length > 0 ? socials : null
    }

    const { error: dbError } = await supabase
      .from('members')
      .update(update)
      .eq('id', member.id)

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <AvatarUpload
            memberId={member.id}
            currentUrl={avatarUrl}
            firstName={member.first_name}
            lastName={member.last_name}
            canEdit={canEdit}
            onUpdate={(url) => setAvatarUrl(url)}
          />

          <div>
            {!isOwnProfile && (
              <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-1">
                <ChevronLeft size={14} /> Back
              </Link>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {isOwnProfile ? 'My Profile' : `${member.first_name} ${member.last_name}`}
            </h1>
            {!isOwnProfile && (
              <p className="text-sm text-gray-500 mt-0.5">{member.bp_email}</p>
            )}
          </div>
        </div>

        {canEdit && (
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            <Save size={15} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
          Profile updated successfully.
        </div>
      )}

      {/* ── Section 1: Basic info ── */}
      <section className="card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First name</label>
            <input className="input" value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              disabled={!canEdit} required />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              disabled={!canEdit} required />
          </div>
          <div>
            <label className="label">BP Email</label>
            <input className="input" type="email" value={form.bp_email}
              onChange={e => setForm(f => ({ ...f, bp_email: e.target.value }))}
              disabled={!canEdit} />
          </div>
          <div>
            <label className="label">Program</label>
            <input className="input" value={form.program}
              onChange={e => setForm(f => ({ ...f, program: e.target.value }))}
              disabled={!canEdit} placeholder="e.g. Computer Science" />
          </div>
          <div>
            <label className="label">Year of study</label>
            <input className="input" value={form.year_of_study}
              onChange={e => setForm(f => ({ ...f, year_of_study: e.target.value }))}
              disabled={!canEdit} placeholder="e.g. 3A" />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
              disabled={!canEdit}>
              <option value="current">Current</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        {/* Bio — editable by self, always visible */}
        <div className="sm:col-span-2">
          <label className="label">Bio</label>
          {(isOwnProfile || isSuperAdmin) ? (
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Write a short bio about yourself…"
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              disabled={!canEdit}
            />
          ) : (
            <p className="text-sm text-gray-700 py-2 whitespace-pre-wrap">
              {member.bio
                ? member.bio
                : <span className="text-gray-400 italic">No bio yet.</span>}
            </p>
          )}
        </div>

        {/* Team — editable by VP/super admin; read-only display for everyone else */}
        <div>
          <label className="label">Team</label>
          {(viewerTier === 'vp' || viewerTier === 'super_admin') ? (
            <select className="input" value={form.team_id}
              onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
              disabled={!canEdit}>
              <option value="">— No team —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            <p className="text-sm text-gray-700 py-2">
              {(member.team as any)?.name ?? <span className="text-gray-400">Not assigned</span>}
            </p>
          )}
        </div>

        {/* Roles — editable by VP/super admin; read-only for others */}
        <div>
          <label className="label">Roles</label>
          {(viewerTier === 'vp' || viewerTier === 'super_admin') ? (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Executive</p>
                <div className="flex flex-wrap gap-2">
                  {EXECUTIVE_ROLES.map(role => (
                    <button key={role} type="button" onClick={() => toggleRole(role)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        form.roles.includes(role)
                          ? 'bg-blueprint-blue text-white border-blueprint-blue'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blueprint-blue'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Project</p>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_ROLES.map(role => (
                    <button key={role} type="button" onClick={() => toggleRole(role)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        form.roles.includes(role)
                          ? 'bg-blueprint-blue text-white border-blueprint-blue'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blueprint-blue'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {member.roles.length > 0
                ? member.roles.map(r => <span key={r} className="badge-blue">{r}</span>)
                : <span className="text-sm text-gray-400">No roles assigned</span>}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: Team details ── */}
      {showTier2 && (
        <section className="card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Team Details</h2>
            {!isOwnProfile && (
              <p className="text-xs text-gray-400 mt-0.5">Visible to team leads and above</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Study / Co-op</label>
              <select className="input" value={form.study_coop}
                onChange={e => setForm(f => ({ ...f, study_coop: e.target.value }))}
                disabled={!canEdit}>
                <option value="">— Select —</option>
                <option value="study">Study</option>
                <option value="coop">Co-op</option>
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                disabled={!canEdit} placeholder="e.g. Waterloo, Toronto" />
            </div>
            <div>
              <label className="label">Terms on BP</label>
              <input className="input" type="number" min={0} value={form.terms_on_bp}
                onChange={e => setForm(f => ({ ...f, terms_on_bp: e.target.value }))}
                disabled={!canEdit} />
            </div>
            <div>
              <label className="label">Coming back next term?</label>
              <select className="input" value={form.coming_back}
                onChange={e => setForm(f => ({ ...f, coming_back: e.target.value }))}
                disabled={!canEdit}>
                <option value="">— Unknown —</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="label">Role next term</label>
              <input className="input" value={form.role_next_term}
                onChange={e => setForm(f => ({ ...f, role_next_term: e.target.value }))}
                disabled={!canEdit} placeholder="e.g. Project Lead" />
            </div>
          </div>

          {/* Skill level + notes — only visible when viewing someone else, team lead and above */}
          {!isOwnProfile && isTier2Viewer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <label className="label">
                  Skill level
                  <span className="ml-1.5 text-xs text-amber-600 font-normal">(hidden from member)</span>
                </label>
                <select className="input" value={form.skill_level}
                  onChange={e => setForm(f => ({ ...f, skill_level: e.target.value }))}
                  disabled={!canEdit}>
                  <option value="">— Not set —</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">
                  Notes
                  <span className="ml-1.5 text-xs text-amber-600 font-normal">(hidden from member)</span>
                </label>
                <textarea className="input resize-none" rows={3} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  disabled={!canEdit} placeholder="Internal notes about this member…" />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Section 3: Personal / sensitive info ── */}
      {showTier3 && (
        <section className="card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Information</h2>
            {!isOwnProfile && (
              <p className="text-xs text-gray-400 mt-0.5">Visible to Co-presidents and VP Talent only</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Personal email</label>
              <input className="input" type="email" value={form.personal_email}
                onChange={e => setForm(f => ({ ...f, personal_email: e.target.value }))}
                disabled={!canEdit} placeholder="personal@email.com" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                disabled={!canEdit}>
                <option value="">— Prefer not to say —</option>
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Genderqueer">Genderqueer</option>
                <option value="Transgender">Transgender</option>
                <option value="Two-Spirit">Two-Spirit</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="label">Ethnic background</label>
              <input className="input" value={form.ethnic_background}
                onChange={e => setForm(f => ({ ...f, ethnic_background: e.target.value }))}
                disabled={!canEdit} />
            </div>
          </div>

          {/* Socials */}
          <div>
            <p className="label mb-2">Socials (if shared)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-gray-400 font-normal">LinkedIn</label>
                <input className="input" value={form.social_linkedin}
                  onChange={e => setForm(f => ({ ...f, social_linkedin: e.target.value }))}
                  disabled={!canEdit} placeholder="linkedin.com/in/username" />
              </div>
              <div>
                <label className="label text-gray-400 font-normal">GitHub</label>
                <input className="input" value={form.social_github}
                  onChange={e => setForm(f => ({ ...f, social_github: e.target.value }))}
                  disabled={!canEdit} placeholder="github.com/username" />
              </div>
              <div>
                <label className="label text-gray-400 font-normal">Instagram</label>
                <input className="input" value={form.social_instagram}
                  onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))}
                  disabled={!canEdit} placeholder="@username" />
              </div>
              <div>
                <label className="label text-gray-400 font-normal">Twitter / X</label>
                <input className="input" value={form.social_twitter}
                  onChange={e => setForm(f => ({ ...f, social_twitter: e.target.value }))}
                  disabled={!canEdit} placeholder="@username" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Save (bottom) */}
      {canEdit && (
        <div className="flex justify-end pb-4">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={15} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  )
}
