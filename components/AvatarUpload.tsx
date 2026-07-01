'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

interface Props {
  memberId: string
  currentUrl: string | null
  firstName: string
  lastName: string
  canEdit: boolean
  onUpdate: (url: string) => void
}

export default function AvatarUpload({
  memberId,
  currentUrl,
  firstName,
  lastName,
  canEdit,
  onUpdate,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)

  const initials =
    (firstName?.[0] ?? '').toUpperCase() + (lastName?.[0] ?? '').toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type + size (max 5 MB)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError(null)
    setUploading(true)

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    const supabase = createClient()

    // Upload to Storage — path: avatars/{memberId}
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${memberId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setPreviewUrl(currentUrl)
      setUploading(false)
      return
    }

    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}` // bust cache

    // Save to members table
    const { error: dbError } = await supabase
      .from('members')
      .update({ avatar_url: publicUrl })
      .eq('id', memberId)

    if (dbError) {
      setError(dbError.message)
      setPreviewUrl(currentUrl)
    } else {
      setPreviewUrl(publicUrl)
      onUpdate(publicUrl)
    }

    setUploading(false)
    // Reset input so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        {/* Avatar circle */}
        <div
          className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-blueprint-blue text-white text-2xl font-semibold select-none border-4 border-white shadow-md ${
            canEdit ? 'cursor-pointer' : ''
          }`}
          onClick={() => canEdit && !uploading && fileRef.current?.click()}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${firstName} ${lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials || '?'}</span>
          )}

          {/* Upload overlay on hover */}
          {canEdit && !uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          )}

          {/* Uploading spinner */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 size={22} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => !uploading && fileRef.current?.click()}
          className="text-xs text-blueprint-blue hover:underline disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
      )}

      {error && <p className="text-xs text-red-600 text-center max-w-[140px]">{error}</p>}
    </div>
  )
}
