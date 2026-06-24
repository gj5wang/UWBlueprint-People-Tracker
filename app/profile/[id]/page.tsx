import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canEditMember, canViewMember } from '@/lib/permissions'
import { type MemberFull, type Team } from '@/types'
import ProfileForm from '@/components/ProfileForm'
import Navbar from '@/components/Navbar'

interface Props {
  params: { id: string }
}

export default async function ProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Viewer's record
  const { data: viewerRecord } = await supabase
    .from('members')
    .select('id, roles, team_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!viewerRecord) redirect('/sheet')

  const viewerTier = getPermissionTier(viewerRecord.roles)

  // Target member
  const { data: member } = await supabase
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
    .eq('id', params.id)
    .single()

  if (!member) notFound()

  // Check access — team leads can only see their own team
  if (!canViewMember(viewerTier, viewerRecord.team_id, member.team_id)) {
    redirect('/sheet')
  }

  // Fetch all teams for the team selector
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .order('name')

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={viewerTier}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <ProfileForm
          member={member as unknown as MemberFull}
          viewerTier={viewerTier}
          viewerMemberId={viewerRecord.id}
          teams={(teams ?? []) as Team[]}
        />
      </main>
    </div>
  )
}
