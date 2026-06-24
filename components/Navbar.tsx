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
}

export default function Navbar({ userFullName, permissionTier }: NavbarProps) {
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
    <header className="border-b border-blueprint-gray-border bg-white">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/sheet" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blueprint-blue">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <path d="M4 4h8v8H4V4zM16 4h8v8h-8V4zM4 16h8v8H4v-8zM16 16h8v8h-8v-8z" fill="white" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-blueprint-navy">People Tracker</span>
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? 'bg-blueprint-blue-light text-blueprint-blue'
                      : 'text-gray-600 hover:bg-gray-100'
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
              <Link href="/api/members/export" className="btn-secondary hidden sm:flex" download>
                <Download size={15} />
                Export CSV
              </Link>
            )}
            {canConfigureDropdowns(permissionTier) && (
              <Link href="/admin" className="btn-secondary hidden sm:flex">
                <Settings size={15} />
                Admin
              </Link>
            )}

            {/* User + sign out */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="hidden sm:block text-sm text-gray-600">{userFullName}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
