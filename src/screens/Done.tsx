import { Camera, Check, ImageSquare } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { autoBackup } from '../backup'
import { Confetti } from '../components/Confetti'
import { toast } from '../components/toast'
import { performed } from '../core/stats'
import { computeTower } from '../core/tower'
import { fmtNum, toDisplay } from '../core/units'
import { pickPhoto, resize } from '../platform/camera'
import { haptics } from '../platform/haptics'
import { sound } from '../platform/sound'
import { storage } from '../platform/storage'

/** After Finish: celebrate, show the numbers, and offer a photo for the diary. */
export function Done() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const s = useLiveQuery(() => storage.getSession(id), [id])
  const sessions = useLiveQuery(storage.listSessions)
  const goals = useLiveQuery(storage.listGoals)
  const preset = useLiveQuery(async () => (s ? storage.getPreset(s.presetId) : undefined), [s?.presetId])
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  const photo = useLiveQuery(() => storage.getPhoto(id), [id])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    sound.fanfare()
    autoBackup() // Android app: copy to Documents/Tower so data survives an uninstall
    haptics.tap()
  }, [])

  const tower = useMemo(
    () => (sessions && goals ? computeTower(sessions.filter((x) => x.finished).map((x) => x.date), goals, Date.now()) : null),
    [sessions, goals],
  )
  if (!s || !tower) return null

  const done = performed(s)
  const sets = done.reduce((n, e) => n + e.sets.length, 0)
  const volume = done.reduce((v, e) => v + e.sets.reduce((a, x) => a + x.weight * x.reps, 0), 0)
  const minutes = s.startedAt ? Math.max(1, Math.round((s.date - s.startedAt) / 60000)) : null
  const { week, height } = tower

  const shoot = async (from: 'camera' | 'library') => {
    const raw = await pickPhoto(from)
    if (!raw) return
    setBusy(true)
    try {
      const [full, thumb] = await Promise.all([resize(raw, 1280), resize(raw, 240, true)])
      await storage.putPhoto(id, full, thumb)
      autoBackup()
      sound.shutter()
      haptics.success()
    } catch {
      toast('Could not read that photo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-[18px]">
      <Confetti />
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pt-4 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-healthy text-on-pastel"
          style={{ boxShadow: '0 6px 0 #8fbf88' }}
        >
          <Check size={44} weight="bold" />
        </motion.div>
        <h1 className="mt-5 text-[34px] leading-tight">Workout done!</h1>
        <p className="font-bold text-muted">
          {preset?.name ?? 'Workout'} · {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>

        <div className="stagger mt-5 grid w-full grid-cols-3 gap-2">
          {[
            [String(sets), sets === 1 ? 'set' : 'sets'],
            [fmtNum(Math.round(toDisplay(volume, unit))), `${unit} moved`],
            [minutes ? String(minutes) : String(done.length), minutes ? 'minutes' : 'exercises'],
          ].map(([v, l]) => (
            <div key={l} className="row py-3">
              <div className="tabular font-display text-2xl font-black">{v}</div>
              <div className="text-xs font-bold text-muted">{l}</div>
            </div>
          ))}
        </div>

        <div className="row mt-2 w-full p-3 text-left">
          <div className="mb-2 flex justify-between text-sm font-extrabold">
            <span>{week.done ? `Block stacked! Week ${height} streak` : `${week.goal - week.count} more this week`}</span>
            <span className="tabular text-muted">
              {week.count}/{week.goal}
            </span>
          </div>
          <div className="bar">
            <div className="bg-healthy" style={{ width: `${Math.min(100, (week.count / week.goal) * 100)}%` }} />
          </div>
        </div>

        <div className="mt-4 w-full">
          {photo ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <img src={photo} alt="Today's workout" className="max-h-[34vh] w-full rounded-3xl object-cover" />
              <button onClick={() => shoot('camera')} className="chip absolute right-3 bottom-3 bg-text px-3 py-1.5 text-sm text-bg">
                Retake
              </button>
            </motion.div>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() => shoot('camera')}
                className="chunky flex w-full flex-col items-center gap-2 rounded-3xl bg-people py-7 text-on-pastel [--lip:#8db0e6]"
              >
                <Camera size={40} weight="duotone" />
                <span className="font-display text-xl font-black">{busy ? 'Saving…' : 'Take a photo'}</span>
                <span className="text-sm font-semibold opacity-75">Saves to your History calendar</span>
              </button>
              <button onClick={() => shoot('library')} className="mt-1 inline-flex h-10 items-center gap-1.5 text-sm font-bold text-muted">
                <ImageSquare size={16} /> Pick from gallery instead
              </button>
            </>
          )}
        </div>
      </div>
      <button onClick={() => nav('/', { replace: true })} className="btn-primary chunky mt-3 h-14 w-full shrink-0 text-base">
        {photo ? 'Continue' : 'Skip photo'}
      </button>
    </div>
  )
}
