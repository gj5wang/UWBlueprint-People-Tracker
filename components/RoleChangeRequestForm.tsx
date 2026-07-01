'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EXECUTIVE_ROLES, PROJECT_ROLES } from '@/types'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

interface Props {
  memberId: string
  currentRoles: string[]
}

interface ExistingRequest {
  id: string
  requested_roles: string[]
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const ALL_ROLES = [...EXECUTIVE_ROLES, ...PROJECT_ROLES]

export default function RoleChangeRequestForm({ memberId, currentRoles }: Props) {
  const supabase = createClient()

  const [existing, setExisting] = useState<ExistingRequest | null | undefined>(undefined)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load any existing request for this member
  useEffect(() => {
    supabase
      .from('role_change_requests')
      .select('id, requested_roles, reason, status, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setExisting(data))
  }, [memberId])

  function toggleRole(role: string) {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedRoles.length === 0) {
      setError('Please select at least one role.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('role_change_requests')
      .insert({
        member_id: memberId,
        requested_roles: selectedRoles,
        current_roles: currentRoles,
        reason: reason.trim() || null,
        status: 'pending',
      })

    setLoading(false)
    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess(true)
      setExisting({
        id: '',
        requested_roles: selectedRoles,
        reason: reason.trim() || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }
  }

  // Still loading existing request
  if (existing === undefined) return null

  // Show status of most recent request
  if (existing) {
    const isPending  = existing.status === 'pending'
    const isApproved = existing.status === 'approved'

    return (
      <div className="card p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Role Change Request</h3>

        <div className={`flex items-start gap-3 rounded-lg p-4 ${
          isPending  ? 'bg-yellow-50 border border-yellow-200' :
          isApproved ? 'bg-green-50 border border-green-200' :
                       'bg-red-50 border border-red-200'
        }`}>
          {isPending  && <Clock   size={18} className="text-yellow-600 mt-0.5 shrink-0" />}
          {isApproved && <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />}
          {!isPending && !isApproved && <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />}

          <div className="text-sm space-y-1">
            <p className={`font-medium ${
              isPending ? 'text-yellow-800' : isApproved ? 'text-green-800' : 'text-red-800'
            }`}>
              {isPending  ? 'Request pending approval' :
               isApproved ? 'Request approved' :
                            'Request rejected'}
            </p>
            <p className="text-gray-600">
              Requested roles:{' '}
              <span className="font-medium">{existing.requested_roles.join(', ')}</span>
            </p>
            {existing.reason && (
              <p className="text-gray-500 italic">"{existing.reason}"</p>
            )}
            <p className="text-gray-400 text-xs">
              Submitted {new Date(existing.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* If rejected, allow submitting a new request */}
        {existing.status === 'rejected' && !success && (
          <button
            onClick={() => setExisting(null)}
            className="btn-secondary text-sm"
          >
            Submit a new request
          </button>
        )}
      </div>
    )
  }

  // Show the request form
  return (
    <div className="card p-6 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Request a Role Change</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Your request will be sent to the Co-presidents and VP Talent for approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current roles */}
        <div>
          <p className="label">Your current roles</p>
          <p className="text-sm text-gray-500">
            {currentRoles.length > 0 ? currentRoles.join(', ') : 'None assigned'}
          </p>
        </div>

        {/* Requested roles */}
        <div>
          <p className="label">Requested roles <span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mb-3">Select all roles you'd like to have next term</p>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Executive</p>
              <div className="flex flex-wrap gap-2">
                {EXECUTIVE_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selectedRoles.includes(role)
                        ? 'bg-blueprint-blue text-white border-blueprint-blue'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blueprint-blue hover:text-blueprint-blue'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Project</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selectedRoles.includes(role)
                        ? 'bg-blueprint-blue text-white border-blueprint-blue'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blueprint-blue hover:text-blueprint-blue'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedRoles.length > 0 && (
            <p className="text-xs text-blueprint-blue mt-2">
              Selected: {selectedRoles.join(', ')}
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="label" htmlFor="reason">
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="reason"
            rows={3}
            className="input resize-none"
            placeholder="Why are you requesting this role change? (e.g. stepping up to lead next term)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || selectedRoles.length === 0}
          className="btn-primary"
        >
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
