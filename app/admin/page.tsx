import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canConfigureDropdowns } from '@/lib/permissions'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Users, Tag, Download, BarChart2 } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
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
  const { count: memberCount } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar
        userFullName={`${viewerRecord.first_name} ${viewerRecord.last_name}`}
        permissionTier={tier}
      />
      <main className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Admin</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Members */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-blueprint-blue-light p-2.5">
                <Users size={18} className="text-blueprint-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{memberCount ?? '—'}</p>
                <p className="text-xs text-gray-500">Total members</p>
              </div>
            </div>
            <Link href="/admin/members/new" className="btn-primary w-full">
              Add member
            </Link>
          </div>

          {/* Teams */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-green-50 p-2.5">
                <Tag size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teams?.length ?? '—'}</p>
                <p className="text-xs text-gray-500">Teams</p>
              </div>
            </div>
            <Link href="/admin/teams" className="btn-secondary w-full">
              Manage teams
            </Link>
          </div>

          {/* Export */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-purple-50 p-2.5">
                <Download size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Export data</p>
                <p className="text-xs text-gray-500">Download all member info as CSV</p>
              </div>
            </div>
            <a href="/api/members/export" download className="btn-secondary w-full inline-flex items-center justify-center gap-2">
              <Download size={15} />
              Download CSV
            </a>
          </div>
        </div>

        {/* Teams list */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Teams</h2>
          <div className="card divide-y divide-blueprint-gray-border">
            {(teams ?? []).map((team) => (
              <div key={team.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">{team.name}</span>
                <Link
                  href={`/admin/teams/${team.id}`}
                  className="text-xs text-blueprint-blue hover:underline"
                >
                  Edit
                </Link>
              </div>
            ))}
            {(teams?.length ?? 0) === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No teams yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
