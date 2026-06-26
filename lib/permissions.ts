import {
  type PermissionTier,
  type AnyRole,
  SUPER_ADMIN_ROLES,
  VP_ROLES,
  TEAM_LEAD_ROLES,
} from '@/types'

/**
 * Derive the highest permission tier from a member's roles.
 * If a member holds multiple roles, they get the highest tier.
 */
export function getPermissionTier(roles: string[]): PermissionTier {
  const roleSet = roles as AnyRole[]

  if (roleSet.some((r) => SUPER_ADMIN_ROLES.includes(r as any))) {
    return 'super_admin'
  }
  if (roleSet.some((r) => VP_ROLES.includes(r as any))) {
    return 'vp'
  }
  if (roleSet.some((r) => TEAM_LEAD_ROLES.includes(r as any))) {
    return 'team_lead'
  }
  return 'member'
}

/** Columns visible at each tier (additive) */
export const COLUMN_VISIBILITY: Record<PermissionTier, string[]> = {
  member: [
    'first_name',
    'last_name',
    'bp_email',
    'team',
    'roles',
    'program',
    'year_of_study',
    'status',
  ],
  team_lead: [
    'first_name',
    'last_name',
    'bp_email',
    'team',
    'roles',
    'program',
    'year_of_study',
    'status',
    'study_coop',
    'location',
    'terms_on_bp',
    'skill_level',
    'notes',
    'coming_back',
    'role_next_term',
  ],
  vp: [
    'first_name',
    'last_name',
    'bp_email',
    'team',
    'roles',
    'program',
    'year_of_study',
    'status',
    'study_coop',
    'location',
    'terms_on_bp',
    'skill_level',
    'notes',
    'coming_back',
    'role_next_term',
  ],
  super_admin: [
    'first_name',
    'last_name',
    'bp_email',
    'team',
    'roles',
    'program',
    'year_of_study',
    'status',
    'study_coop',
    'location',
    'terms_on_bp',
    'skill_level',
    'notes',
    'coming_back',
    'role_next_term',
    'personal_email',
    'socials',
    'gender',
    'ethnic_background',
  ],
}

/** Fields hidden from the member when viewing their own profile */
export const SELF_HIDDEN_FIELDS = ['skill_level', 'notes']

export function canViewColumn(
  viewer: PermissionTier,
  column: string,
  isOwnProfile: boolean
): boolean {
  if (isOwnProfile && SELF_HIDDEN_FIELDS.includes(column)) return false
  return COLUMN_VISIBILITY[viewer].includes(column)
}

export function canViewMember(
  viewer: PermissionTier,
  viewerTeamId: string | null,
  memberTeamId: string | null
): boolean {
  if (viewer === 'team_lead') {
    return viewerTeamId !== null && viewerTeamId === memberTeamId
  }
  // members, VPs, super admins can see all
  return true
}

export function canEditMember(
  viewer: PermissionTier,
  viewerMemberId: string,
  targetMemberId: string
): boolean {
  if (viewer === 'super_admin' || viewer === 'vp') return true
  // Team leads can edit their team members
  // Members can only edit themselves
  return viewerMemberId === targetMemberId
}

export function canConfigureDropdowns(tier: PermissionTier): boolean {
  return tier === 'super_admin'
}

export function canDownloadCSV(tier: PermissionTier): boolean {
  return tier === 'super_admin'
}

export function canViewDashboard(tier: PermissionTier): boolean {
  return true // All members have a personal dashboard
}
