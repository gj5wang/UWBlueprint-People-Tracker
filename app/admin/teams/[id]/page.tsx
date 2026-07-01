import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canConfigureDropdowns } from '@/lib/permissions'
import Navbar from '@/components/Navbar'
import TeamForm from '@/components/TeamForm'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function EditTeamPage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewerRecord } = await supabase
    .from('members')
    .select('id, roles, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!viewerRecord) redirect('/sheet')

  const tier = getPermissionTier(viewerRecord.roles)
  if (!canConfigureDropdowns(tier)) redirect('/sheet')

  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!team) notFound()

  // Show members on this team
  const { data: members } = await supabase
    .from('members')
    .select('id, first_name, last_name, roles, status')
    .eq('team_id', params.id)
    .order('last_name')

  return (
    <div className="flex min-h-screen flex-col bg-blueprint-gray-light">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={tier}
        memberId={viewerRecord.id}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <Link
          href="/admin/teams"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={15} /> Back to teams
        </Link>

        <h1 className="text-xl font-bold text-gray-900">Edit team</h1>

        {/* Edit / delete form */}
        <div className="card p-6">
          <TeamForm mode="edit" teamId={team.id} initialName={team.name} />
        </div>

        {/* Members on this team */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">
              Members on this team ({members?.length ?? 0})
            </h2>
          </div>
          <div className="card divide-y divide-blueprint-gray-border">
            {(members ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="text-xs text-gray-400">{m.roles.join(', ') || 'No role'}</p>
                </div>
                <span
                  className={m.status === 'current' ? 'badge-green' : 'badge-gray'}
                >
                  {m.status}
                </span>
              </div>
            ))}
            {(members?.length ?? 0) === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">
                No members on this team yet.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
