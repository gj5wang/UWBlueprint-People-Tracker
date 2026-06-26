import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier } from '@/lib/permissions'
import Navbar from '@/components/Navbar'
import ProfileForm from '@/components/ProfileForm'
import DashboardCharts from '@/components/DashboardCharts'
import { type MemberFull, type Team } from '@/types'

function countBy(items: any[], key: (item: any) => string | null | undefined) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const val = key(item) || 'Unknown'
    counts[val] = (counts[val] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get viewer's own full record
  const { data: viewerRecord } = await supabase
    .from('members')
    .select(`
      id, user_id, first_name, last_name, bp_email, team_id,
      roles, program, year_of_study, status,
      study_coop, location, terms_on_bp, skill_level, notes,
      coming_back, role_next_term,
      personal_email, socials, gender, ethnic_background,
      created_at, updated_at,
      team:teams(id, name)
    `)
    .eq('user_id', user.id)
    .single()

  if (!viewerRecord) redirect('/sheet')

  const tier = getPermissionTier(viewerRecord.roles)

  // Fetch teams for the profile form dropdown
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')

  // ── Org stats — super admin only ──────────────────────────
  let statsData = null

  if (tier === 'super_admin') {
    const { data: members } = await supabase.from('members').select(`
      roles, program, year_of_study, status,
      study_coop, skill_level, coming_back,
      gender, ethnic_background,
      team:teams(name)
    `)

    const list = members ?? []
    const roleCounts: Record<string, number> = {}
    for (const m of list) {
      for (const r of (m.roles ?? [])) {
        roleCounts[r] = (roleCounts[r] ?? 0) + 1
      }
    }

    statsData = {
      totalMembers: list.length,
      currentMembers: list.filter(m => m.status === 'current').length,
      alumniMembers: list.filter(m => m.status === 'alumni').length,
      byTeam: countBy(list, m => (m.team as any)?.name),
      byRole: Object.entries(roleCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
      byProgram: countBy(list, m => m.program),
      byYear: countBy(list, m => m.year_of_study),
      retention: [
        { label: 'Coming back', count: list.filter(m => m.coming_back === true).length },
        { label: 'Not coming back', count: list.filter(m => m.coming_back === false).length },
        { label: 'Unknown', count: list.filter(m => m.coming_back == null).length },
      ],
      byStudyCoop: countBy(list, m => m.study_coop),
      bySkillLevel: countBy(list, m => m.skill_level),
      byGender: countBy(list, m => m.gender),
      byEthnicity: countBy(list, m => m.ethnic_background),
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={tier}
      />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 space-y-10">

        {/* ── Org statistics — super admin only ── */}
        {tier === 'super_admin' && statsData && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">Organization Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Visible to Co-presidents and VP Talent only</p>
            </div>
            <DashboardCharts
              totalMembers={statsData.totalMembers}
              currentMembers={statsData.currentMembers}
              alumniMembers={statsData.alumniMembers}
              byTeam={statsData.byTeam}
              byRole={statsData.byRole}
              byProgram={statsData.byProgram}
              byYear={statsData.byYear}
              retention={statsData.retention}
              byStudyCoop={statsData.byStudyCoop}
              bySkillLevel={statsData.bySkillLevel}
              byGender={statsData.byGender}
              byEthnicity={statsData.byEthnicity}
            />
          </section>
        )}

        {/* ── My Profile — all members ── */}
        <section className="max-w-3xl">
          <ProfileForm
            member={viewerRecord as unknown as MemberFull}
            viewerTier={tier}
            viewerMemberId={viewerRecord.id}
            teams={(teams ?? []) as Team[]}
          />
        </section>

      </main>
    </div>
  )
}
