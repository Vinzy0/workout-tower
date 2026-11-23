import { CaretRight } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { TopBar } from '../components/ui'
import { createPreset } from '../data'
import { storage } from '../platform/storage'

export function Presets() {
  const nav = useNavigate()
  const presets = useLiveQuery(storage.listPresets)

  const create = async () => {
    const p = await createPreset()
    nav(`/presets/${p.id}?add=1`)
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Workouts" />
      <div className="stagger flex-1 space-y-1.5 overflow-y-auto px-[18px]">
        {presets?.length === 0 && <p className="py-8 text-center text-muted">No workouts yet.</p>}
        {presets?.map((p) => (
          <button key={p.id} onClick={() => nav(`/presets/${p.id}`)} className="row press flex w-full items-center gap-3 px-4 py-4 text-left">
            <div className="min-w-0 flex-1">
              <div className="truncate">{p.name}</div>
              <div className="text-xs text-muted">{p.exerciseIds.length} exercises</div>
            </div>
            <CaretRight className="text-muted" />
          </button>
        ))}
      </div>
      <div className="safe-bottom px-[18px] pt-3">
        <button onClick={create} className="btn-primary press h-14 w-full text-base">
          New workout
        </button>
      </div>
    </div>
  )
}
