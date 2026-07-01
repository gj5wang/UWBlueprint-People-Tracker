import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canConfigureDropdowns } from '@/lib/permissions'
import Navbar from '@/components/Navbar'
import TeamForm from '@/components/TeamForm'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'

export default async function TeamsPage() {
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

  const { data: teams } = await supabase.from('teams').select('id, name').order('name')

  return (
    <div className="flex min-h-screen flex-col bg-blueprint-gray-light">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={tier}
        memberId={viewerRecord.id}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          <ChevronLeft size={15} /> Back to admin
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Manage teams</h1>

        {/* Existing teams list */}
        <div className="card divide-y divide-blueprint-gray-border mb-6">
          {(teams ?? []).map((team) => (
            <div key={team.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700">{team.name}</span>
              <Link
                href={`/admin/teams/${team.id}`}
                className="inline-flex items-center gap-1 text-xs text-blueprint-blue hover:underline"
              >
                <Pencil size={12} />
                Edit
              </Link>
            </div>
          ))}
          {(teams?.length ?? 0) === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No teams yet.</p>
          )}
        </div>

        {/* Create new team */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Create new team</h2>
          <TeamForm mode="create" />
        </div>
      </main>
    </div>
  )
}
