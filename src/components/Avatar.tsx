import { User } from '@phosphor-icons/react'
import type { Profile } from '../core/types'

export function Avatar({ profile, size = 44 }: { profile?: Profile; size?: number }) {
  const initial = profile?.name?.trim()[0]?.toUpperCase()
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-attention font-display font-black text-on-pastel"
      style={{ width: size, height: size, fontSize: size * 0.42, boxShadow: '0 0 0 2px #0d0d0f, 0 0 0 4px #26262b' }}
    >
      {profile?.avatar ? (
        <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
      ) : initial ? (
        initial
      ) : (
        <User size={size * 0.5} weight="bold" />
      )}
    </span>
  )
}
