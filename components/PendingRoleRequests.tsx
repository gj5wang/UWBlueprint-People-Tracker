'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, User } from 'lucide-react'

interface RoleRequest {
  id: string
  member_id: string
  requested_roles: string[]
  current_roles: string[]
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  member: {
    first_name: string
    last_name: string
    bp_email: string
    team: { name: string } | null
  } | null
}

interface Props {
  viewerMemberId: string
}

export default function PendingRoleRequests({ viewerMemberId }: Props) {
  const supabase = createClient()

  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchRequests() {
    const { data } = await supabase
      .from('role_change_requests')
      .select(`
        id, member_id, requested_roles, current_roles, reason, status, created_at,
        member:members!member_id(first_name, last_name, bp_email, team:teams(name))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    setRequests((data ?? []) as unknown as RoleRequest[])
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [])

  async function handleDecision(requestId: string, memberId: string, requestedRoles: string[], decision: 'approved' | 'rejected') {
    setActionId(requestId)
    setError(null)

    // 1. Update the request status
    const { error: reqError } = await supabase
      .from('role_change_requests')
      .update({
        status: decision,
        reviewed_by: viewerMemberId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (reqError) {
      setError(reqError.message)
      setActionId(null)
      return
    }

    // 2. If approved, update the member's roles
    if (decision === 'approved') {
      const { error: memberError } = await supabase
        .from('members')
        .update({ roles: requestedRoles })
        .eq('id', memberId)

      if (memberError) {
        setError(`Request marked approved but failed to update member roles: ${memberError.message}`)
        setActionId(null)
        return
      }
    }

    setActionId(null)
    // Remove from list
    setRequests(prev => prev.filter(r => r.id !== requestId))
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-100 rounded w-48" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Role Change Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {requests.length === 0
              ? 'No pending requests'
              : `${requests.length} pending approval`}
          </p>
        </div>
        {requests.length > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blueprint-blue text-white text-xs font-bold">
            {requests.length}
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">All caught up!</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const memberName = req.member
              ? `${req.member.first_name} ${req.member.last_name}`
              : 'Unknown member'
            const isActing = actionId === req.id

            return (
              <div key={req.id} className="rounded-xl border border-blueprint-gray-border bg-gray-50 p-4 space-y-3">
                {/* Member info */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blueprint-blue-light text-blueprint-blue">
                    <User size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{memberName}</p>
                    <p className="text-xs text-gray-400">
                      {req.member?.bp_email}
                      {req.member?.team ? ` · ${(req.member.team as any).name}` : ''}
                    </p>
                  </div>
                  <p className="ml-auto text-xs text-gray-400 shrink-0">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Role change details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-white border border-gray-200 px-3 py-2">
                    <p className="text-gray-400 font-medium mb-1">Current roles</p>
                    <p className="text-gray-700">
                      {req.current_roles.length > 0
                        ? req.current_roles.join(', ')
                        : <span className="italic text-gray-400">None</span>}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blueprint-blue-light border border-blue-100 px-3 py-2">
                    <p className="text-blueprint-blue font-medium mb-1">Requested roles</p>
                    <p className="text-blueprint-blue font-medium">
                      {req.requested_roles.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {req.reason && (
                  <p className="text-xs text-gray-500 italic bg-white border border-gray-200 rounded-lg px-3 py-2">
                    "{req.reason}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleDecision(req.id, req.member_id, req.requested_roles, 'approved')}
                    disabled={isActing}
                    className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={13} />
                    {isActing ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, req.member_id, req.requested_roles, 'rejected')}
                    disabled={isActing}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    {isActing ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
