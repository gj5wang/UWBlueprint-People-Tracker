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

  // If they've authenticated but don't have a member record yet,
  // a super admin needs to create one for them.
  if (!viewerRecord) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="card max-w-md p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Account pending
            </h2>
            <p className="text-sm text-gray-500">
              Your @uwblueprint.org account is verified, but your member profile
              hasn't been created yet. Please ask a super admin (Co-president or
              VP Talent) to add you.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const viewerTier = getPermissionTier(viewerRecord.roles)

  // Fetch all members with their team
  const { data: members, error } = await supabase
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
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Failed to fetch members:', error)
  }

  const memberList = (members ?? []) as unknown as MemberFull[]

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={viewerTier}
      />

      <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Members</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              Viewing as <span className="font-medium">{viewerTier.replace('_', ' ')}</span>
            </p>
          </div>
          {canConfigureDropdowns(viewerTier) && (
            <Link href="/admin/members/new" className="btn-primary">
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
