import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/sheet'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // ── Auto-provision member record ──────────────────────────
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        // 1. Check if already linked by user_id
        const { data: existing } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          // 2. Check if an admin pre-created a row with this email (user_id is null)
          const { data: preCreated } = await supabase
            .from('members')
            .select('id')
            .eq('bp_email', user.email)
            .is('user_id', null)
            .maybeSingle()

          if (preCreated) {
            // Claim the pre-created record
            await supabase
              .from('members')
              .update({ user_id: user.id })
              .eq('id', preCreated.id)
          } else {
            // Create a brand-new member record from Google profile
            const meta = user.user_metadata ?? {}
            const firstName: string =
              meta.given_name ?? meta.full_name?.split(' ')[0] ?? ''
            const lastName: string =
              meta.family_name ??
              meta.full_name?.split(' ').slice(1).join(' ') ??
              ''

            await supabase.from('members').insert({
              user_id: user.id,
              bp_email: user.email,
              first_name: firstName,
              last_name: lastName,
              roles: [],
              status: 'current',
            })
          }
        }
      }
      // ─────────────────────────────────────────────────────────

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
