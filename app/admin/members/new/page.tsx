import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canConfigureDropdowns } from '@/lib/permissions'
import Navbar from '@/components/Navbar'
import NewMemberForm from '@/components/NewMemberForm'
import { type Team } from '@/types'

export default async function NewMemberPage() {
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
        <h1 className="text-xl font-bold text-gray-900 mb-6">Add member</h1>
        <NewMemberForm teams={(teams ?? []) as Team[]} />
      </main>
    </div>
  )
}
