import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPermissionTier, canDownloadCSV } from '@/lib/permissions'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: viewerRecord } = await supabase
    .from('members')
    .select('id, roles')
    .eq('user_id', user.id)
    .single()

  if (!viewerRecord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tier = getPermissionTier(viewerRecord.roles)
  if (!canDownloadCSV(tier)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: members, error } = await supabase
    .from('members')
    .select(`
      first_name, last_name, bp_email, personal_email,
      roles, program, year_of_study, status,
      study_coop, location, terms_on_bp, skill_level,
      coming_back, role_next_term, gender, ethnic_background,
      team:teams(name)
    `)
    .order('last_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const headers = [
    'First Name', 'Last Name', 'BP Email', 'Personal Email',
    'Team', 'Roles', 'Program', 'Year of Study', 'Status',
    'Study/Co-op', 'Location', 'Terms on BP', 'Skill Level',
    'Coming Back', 'Role Next Term', 'Gender', 'Ethnic Background',
  ]

  const rows = (members ?? []).map((m: any) => [
    m.first_name,
    m.last_name,
    m.bp_email,
    m.personal_email ?? '',
    m.team?.name ?? '',
    (m.roles ?? []).join('; '),
    m.program ?? '',
    m.year_of_study ?? '',
    m.status,
    m.study_coop ?? '',
    m.location ?? '',
    m.terms_on_bp?.toString() ?? '',
    m.skill_level ?? '',
    m.coming_back === null ? '' : m.coming_back ? 'Yes' : 'No',
    m.role_next_term ?? '',
    m.gender ?? '',
    m.ethnic_background ?? '',
  ])

  const escape = (val: string) =>
    `"${String(val).replace(/"/g, '""')}"`

  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bp-members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
