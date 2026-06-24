// ─── Permission Tiers ───────────────────────────────────────────────────────

export type PermissionTier = 'member' | 'team_lead' | 'vp' | 'super_admin'

// ─── Roles ──────────────────────────────────────────────────────────────────

export type RoleCategory = 'executive' | 'project'

export interface Role {
  id: string
  name: string
  category: RoleCategory
}

export const EXECUTIVE_ROLES = [
  'Co-president',
  'VP Engineering',
  'VP Design',
  'VP Product',
  'VP Project Scoping',
  'Internal Director',
  'External Director',
  'VP Finance',
  'VP Talent',
  'Graphic Designer',
  'Content Strategist',
] as const

export const PROJECT_ROLES = [
  'Project Developer',
  'Product Designer',
  'Design Ops',
  'Project Lead',
  'Product Manager',
] as const

export type ExecutiveRole = (typeof EXECUTIVE_ROLES)[number]
export type ProjectRole = (typeof PROJECT_ROLES)[number]
export type AnyRole = ExecutiveRole | ProjectRole

// Roles that grant super_admin tier
export const SUPER_ADMIN_ROLES: AnyRole[] = ['Co-president', 'VP Talent']

// Roles that grant vp tier
export const VP_ROLES: AnyRole[] = [
  'VP Engineering',
  'VP Design',
  'VP Product',
  'VP Project Scoping',
  'VP Finance',
  'Internal Director',
  'External Director',
]

// Roles that grant team_lead tier
export const TEAM_LEAD_ROLES: AnyRole[] = ['Project Lead', 'Product Manager']

// ─── Member ─────────────────────────────────────────────────────────────────

export type MemberStatus = 'current' | 'alumni'

export interface Team {
  id: string
  name: string
}

/** All fields stored in DB — what you get with super_admin access */
export interface MemberFull {
  id: string
  user_id: string | null

  // Tier 1: visible to all members
  first_name: string
  last_name: string
  bp_email: string
  team_id: string | null
  team?: Team
  roles: string[]
  program: string | null
  year_of_study: string | null
  status: MemberStatus

  // Tier 2: team leads (own team) + VPs (all)
  study_coop: string | null
  location: string | null
  terms_on_bp: number | null
  skill_level: string | null        // hidden from the member themselves
  notes: string | null              // hidden from the member themselves
  coming_back: boolean | null
  role_next_term: string | null

  // Tier 3: super admin only
  personal_email: string | null
  socials: Record<string, string> | null
  gender: string | null
  ethnic_background: string | null

  created_at: string
  updated_at: string
}

/** What a regular member sees — subset of MemberFull */
export type MemberPublic = Pick<
  MemberFull,
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'bp_email'
  | 'team_id'
  | 'team'
  | 'roles'
  | 'program'
  | 'year_of_study'
  | 'status'
>

/** What a team lead sees for their own team */
export type MemberTeamLead = MemberPublic &
  Pick<
    MemberFull,
    | 'study_coop'
    | 'location'
    | 'terms_on_bp'
    | 'skill_level'
    | 'notes'
    | 'coming_back'
    | 'role_next_term'
  >

/** What a VP sees (all teams) — same fields as team lead but no team restriction */
export type MemberVP = MemberTeamLead

/** What super admin sees */
export type MemberSuperAdmin = MemberFull

// ─── Notes / Comments ───────────────────────────────────────────────────────

export interface MemberNote {
  id: string
  member_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
  updated_at: string
}
