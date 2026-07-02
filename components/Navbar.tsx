'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type PermissionTier } from '@/types'
import { canConfigureDropdowns, canDownloadCSV, canViewDashboard } from '@/lib/permissions'
import { LogOut, Settings, Download, BarChart2, Users } from 'lucide-react'

interface NavbarProps {
  userFullName: string
  permissionTier: PermissionTier
  memberId: string
}

/** Blueprint gear logo — 6 L-shaped solid arms in a pinwheel */
function BlueprintLogo({ size = 36, color = 'white' }: { size?: number; color?: string }) {
  // Single arm: rectangular body pointing right, with clockwise hook at outer tip
  // M innerX,-halfW  → outer top → hook bottom-right → hook bottom-left → arm junction → innerX,+halfW
  const arm = 'M18,-8 L42,-8 L42,20 L28,20 L28,8 L18,8 Z'
  const angles = [0, 60, 120, 180, 240, 300]

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {angles.map((deg) => (
        <path
          key={deg}
          d={arm}
          fill={color}
          transform={`rotate(${deg}, 50, 50) translate(50, 50)`}
        />
      ))}
    </svg>
  )
}

export default function Navbar({ userFullName, permissionTier, memberId }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/sheet', label: 'Members', icon: Users, always: true },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart2, show: canViewDashboard(permissionTier) },
  ].filter((item) => item.always || item.show)

  return (
    <header className="bg-blueprint-navy border-b border-white/10">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/sheet" className="flex items-center gap-2.5 group">
              <div className="logo-spin">
                <BlueprintLogo size={32} color="white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white">UW Blueprint</span>
                <span className="text-xs text-blue-300/70 font-medium">People Tracker</span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? 'bg-white/15 text-white'
                      : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {canDownloadCSV(permissionTier) && (
              <Link
                href="/api/members/export"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-200/70 hover:bg-white/10 hover:text-white transition-colors"
                download
              >
                <Download size={15} />
                Export
              </Link>
            )}
            {canConfigureDropdowns(permissionTier) && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-200/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Settings size={15} />
                Admin
              </Link>
            )}

            {/* User + sign out */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/15">
              <Link
                href={`/profile/${memberId}`}
                className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {userFullName}
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-blue-200/60 hover:bg-white/10 hover:text-white transition-colors"
                title="Sign out"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
