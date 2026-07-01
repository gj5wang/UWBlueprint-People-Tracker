'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type PermissionTier } from '@/types'
import { MessageSquare, Trash2, Send } from 'lucide-react'

interface NoteAuthor {
  first_name: string
  last_name: string
}

export interface Note {
  id: string
  member_id: string
  author_id: string
  content: string
  created_at: string
  author: NoteAuthor
}

interface Props {
  memberId: string
  viewerMemberId: string
  viewerTier: PermissionTier
  initialNotes: Note[]
}

export default function MemberNotes({
  memberId,
  viewerMemberId,
  viewerTier,
  initialNotes,
}: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd =
    viewerTier === 'team_lead' || viewerTier === 'vp' || viewerTier === 'super_admin'

  async function addNote() {
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('member_notes')
      .insert({
        member_id: memberId,
        author_id: viewerMemberId,
        content: content.trim(),
      })
      .select(
        'id, member_id, author_id, content, created_at, author:members!author_id(first_name, last_name)'
      )
      .single()

    if (err) {
      setError(err.message)
    } else if (data) {
      setNotes([data as unknown as Note, ...notes])
      setContent('')
    }
    setSubmitting(false)
  }

  async function deleteNote(noteId: string) {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('member_notes')
      .delete()
      .eq('id', noteId)

    if (!err) {
      setNotes(notes.filter((n) => n.id !== noteId))
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-gray-400" />
        <h2 className="text-base font-semibold text-gray-900">Notes</h2>
        <span className="text-xs text-gray-400 ml-1">— not visible to this member</span>
      </div>

      {/* Add note */}
      {canAdd && (
        <div className="mb-5">
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Add a private note… (Ctrl+Enter to submit)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
            }}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={addNote}
              disabled={submitting || !content.trim()}
              className="btn-primary gap-2"
            >
              <Send size={14} />
              {submitting ? 'Posting…' : 'Add note'}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8 card">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {note.author.first_name} {note.author.last_name}
                    {' · '}
                    {formatDate(note.created_at)}
                  </p>
                </div>
                {(note.author_id === viewerMemberId ||
                  viewerTier === 'super_admin') && (
                  <button
                    type="button"
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Delete note"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
