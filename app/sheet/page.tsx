import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier } from '@/lib/permissions'
import { type MemberFull } from '@/types'
import MemberSheet from '@/components/MemberSheet'
import Navbar from '@/components/Navbar'
import { canConfigureDropdowns } from '@/lib/permissions'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function SheetPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the viewer's own member record
  const { data: viewerRecord } = await supabase
    .from('members')
    .select('id, roles, team_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  // Auto-provision in auth callback means this shouldn't happen.
  // If it does (e.g. first-login race), redirect to dashboard to try again.
  if (!viewerRecord) redirect('/dashboard')

  const viewerTier = getPermissionTier(viewerRecord.roles)

  // Fetch all members with their team
  const { data: members, error } = await supabase
    .from('members')
    .select(`
      id, user_id, first_name, last_name, bp_email, team_id,
      roles, program, year_of_study, status,
      study_coop, location, terms_on_bp, skill_level, notes,
      coming_back, role_next_term,
      personal_email, socials, gender, ethnic_background, avatar_url, bio,
      created_at, updated_at,
      team:teams(id, name)
    `)
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Failed to fetch members:', error)
  }

  const memberList = (members ?? []) as unknown as MemberFull[]

  return (
    <div className="flex min-h-screen flex-col bg-blueprint-gray-light">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={viewerTier}
        memberId={viewerRecord.id}
      />

      <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6">
        {/* Gradient header */}
        <div
          className="mb-6 flex items-center justify-between rounded-2xl px-6 py-6 text-white shadow-blue-lg"
          style={{ background: 'linear-gradient(135deg, #0f1740 0%, #1e3a8a 45%, #2563EB 100%)' }}
        >
          <div>
            <h1 className="text-xl font-bold">Members</h1>
            <p className="text-sm text-blue-200/70 mt-0.5 capitalize">
              Viewing as <span className="font-medium text-blue-200">{viewerTier.replace('_', ' ')}</span>
            </p>
          </div>
          {canConfigureDropdowns(viewerTier) && (
            <Link
              href="/admin/members/new"
              className="flex items-center gap-1.5 rounded-xl bg-white/15 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <Plus size={16} />
              Add member
            </Link>
          )}
        </div>

        <MemberSheet
          members={memberList}
          viewerTier={viewerTier}
          viewerMemberId={viewerRecord.id}
          viewerTeamId={viewerRecord.team_id}
        />
      </main>
    </div>
  )
}
