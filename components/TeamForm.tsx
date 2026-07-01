'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface CreateProps {
  mode: 'create'
}

interface EditProps {
  mode: 'edit'
  teamId: string
  initialName: string
}

type Props = CreateProps | EditProps

export default function TeamForm(props: Props) {
  const router = useRouter()
  const [name, setName] = useState(props.mode === 'edit' ? props.initialName : '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)

    const supabase = createClient()

    if (props.mode === 'create') {
      const { error: err } = await supabase
        .from('teams')
        .insert({ name: name.trim() })
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
      setName('')
    } else {
      const { error: err } = await supabase
        .from('teams')
        .update({ name: name.trim() })
        .eq('id', props.teamId)
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    }

    router.push('/admin/teams')
    router.refresh()
  }

  async function handleDelete() {
    if (props.mode !== 'edit') return
    const confirmed = window.confirm(
      'Delete this team? Members assigned to it will be left without a team.'
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('teams')
      .delete()
      .eq('id', props.teamId)

    if (err) {
      setError(err.message)
      setDeleting(false)
      return
    }

    router.push('/admin/teams')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="label">Team name *</label>
        <input
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Habitat for Humanity"
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving || deleting} className="btn-primary">
          {saving
            ? 'Saving…'
            : props.mode === 'create'
            ? 'Create team'
            : 'Save changes'}
        </button>

        {props.mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="btn-danger"
          >
            {deleting ? 'Deleting…' : 'Delete team'}
          </button>
        )}
      </div>
    </form>
  )
}
