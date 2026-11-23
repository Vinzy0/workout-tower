import { CaretLeft } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '../components/Avatar'
import { ValueCard } from '../components/ValueCard'
import { fmtNum, weightValues } from '../core/units'
import { createPreset } from '../data'
import { pickPhoto, resize } from '../platform/camera'
import { haptics } from '../platform/haptics'
import { storage } from '../platform/storage'

const STEPS = 5

/** First launch: what the tower is, weekly goal, name, a practice number, first workout. */
export function Onboarding() {
  const nav = useNavigate()
  const settings = useLiveQuery(storage.getSettings)
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(2)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string>()
  const [demo, setDemo] = useState(10)

  const next = async () => {
    haptics.tap()
    if (step === 1) await storage.setGoal(goal)
    if (step === 2 && settings) await storage.putSettings({ ...settings, profile: { ...settings.profile, name: name.trim(), avatar } })
    setStep((s) => s + 1)
  }

  const screens = [
    {
      title: 'Build a tower, one week at a time',
      body: 'Hit your weekly workouts and a new block lands on top. Miss a week and it cracks. Miss two and it falls.',
      content: <MiniTower />,
      cta: "Let's go",
    },
    {
      title: 'How many workouts a week?',
      body: 'Pick something you can keep doing. You can change it anytime.',
      content: (
        <div className="grid w-full grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => {
                haptics.tick()
                setGoal(n)
              }}
              className={`chunky tabular h-16 rounded-2xl font-display text-2xl font-black transition-colors ${
                n === goal ? 'bg-healthy text-on-pastel [--lip:#8fbf88]' : 'bg-surface [--lip:#26262b]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ),
      cta: `${goal} a week`,
    },
    {
      title: 'What should we call you?',
      body: 'Just for you. It shows on your profile.',
      content: (
        <div className="flex w-full flex-col items-center gap-4">
          <button
            onClick={async () => {
              const raw = await pickPhoto('library')
              if (raw) setAvatar(await resize(raw, 256, true))
            }}
            className="press"
            aria-label="Pick a profile photo"
          >
            <Avatar profile={{ name, avatar }} size={104} />
          </button>
          <span className="text-xs font-bold text-muted">Tap to add a photo</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-14 w-full rounded-2xl bg-surface px-4 text-center font-display text-xl font-black outline-none placeholder:text-faint"
          />
        </div>
      ),
      cta: name.trim() ? 'Continue' : 'Skip',
    },
    {
      title: 'Log with one thumb',
      body: 'Hold the number, drag up or down, let go. Try it.',
      content: (
        <div className="w-40">
          <ValueCard values={weightValues(2.5, 'kg')} value={demo} onChange={setDemo} format={fmtNum} caption="kg each" title="Practice" />
          <p className={`mt-3 text-center font-extrabold transition-opacity ${demo !== 10 ? 'text-healthy opacity-100' : 'opacity-0'}`}>Nice, you got it.</p>
        </div>
      ),
      cta: 'Continue',
    },
    {
      title: 'Make your first workout',
      body: 'Pick exercises from the library. Takes under a minute.',
      content: <MiniTower small />,
      cta: 'Pick exercises',
    },
  ]
  const sc = screens[step]

  const finish = async (pick: boolean) => {
    haptics.success()
    if (pick) nav(`/presets/${(await createPreset()).id}?add=1`, { replace: true })
    else nav('/', { replace: true })
  }

  return (
    <div className="safe-top safe-bottom flex h-full flex-col px-[18px]">
      <div className="flex items-center gap-3 py-2">
        <button
          aria-label="Back"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`press grid h-10 w-10 place-items-center rounded-xl text-muted ${step === 0 ? 'invisible' : ''}`}
        >
          <CaretLeft size={22} weight="bold" />
        </button>
        <div className="bar flex-1">
          <div className="bg-healthy" style={{ width: `${((step + 1) / STEPS) * 100}%` }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 text-center"
        >
          {sc.content}
          <div>
            <h1 className="text-[28px] leading-tight">{sc.title}</h1>
            <p className="mt-2 font-semibold text-muted">{sc.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <button onClick={() => (step === STEPS - 1 ? finish(true) : next())} className="btn-primary chunky h-14 w-full text-lg">
        {sc.cta}
      </button>
      {step === STEPS - 1 && (
        <button onClick={() => finish(false)} className="h-10 text-sm font-bold text-muted">
          Later, take me to my tower
        </button>
      )}
    </div>
  )
}

function MiniTower({ small = false }: { small?: boolean }) {
  const blocks = ['slab-gold', 'slab-stone', 'slab-wood']
  return (
    <div className={`flex flex-col items-center gap-2.5 ${small ? 'scale-75' : ''}`}>
      {blocks.map((b, i) => (
        <motion.div
          key={b}
          initial={{ y: -260, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.15 + (2 - i) * 0.25 }}
          className={`slab ${b} grid h-12 place-items-center font-display text-xl font-black`}
          style={{ width: 150 + i * 30 }}
        >
          {3 - i}
        </motion.div>
      ))}
    </div>
  )
}
