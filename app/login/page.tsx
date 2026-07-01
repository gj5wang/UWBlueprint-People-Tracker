'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/** Blueprint pinwheel logo — 6 curved arms spiral intertwining */
function BlueprintLogo({ size = 64, color = 'white' }: { size?: number; color?: string }) {
  const arms = [
    'M65,50 Q50,50 50,88',
    'M57.5,63 Q50,50 17.1,69',
    'M42.5,63 Q50,50 17.1,31',
    'M35,50 Q50,50 50,12',
    'M42.5,37 Q50,50 82.9,31',
    'M57.5,37 Q50,50 82.9,69',
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {arms.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      ))}
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'uwblueprint.org',
        },
      },
    })
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0f1740 0%, #1e3a8a 45%, #2563EB 100%)',
      }}
    >
      {/* Subtle decorative circles */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo + wordmark */}
      <div className="relative mb-8 flex flex-col items-center gap-4">
        <BlueprintLogo size={64} color="white" />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">UW Blueprint</h1>
          <p className="text-sm text-blue-200/70 mt-1 font-medium tracking-wide uppercase">
            People Tracker
          </p>
        </div>
      </div>

      {/* Glass card */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-1">Welcome back</h2>
        <p className="text-sm text-blue-200/70 mb-6">
          Sign in with your{' '}
          <span className="font-medium text-blue-300">@uwblueprint.org</span> account.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-200">
            {error === 'auth_failed'
              ? 'Authentication failed. Please try again.'
              : 'An error occurred. Please try again.'}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-md transition hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-5 text-center text-xs text-blue-200/50">
          Only @uwblueprint.org accounts are permitted.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
