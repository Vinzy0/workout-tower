import { describe, expect, it } from 'vitest'
import { mergeById } from './merge'

describe('mergeById', () => {
  it('keeps records from both sides and the newer copy of shared ids', () => {
    const local = [
      { id: 'a', updatedAt: 1, v: 'local-old' },
      { id: 'b', updatedAt: 5, v: 'local-only' },
    ]
    const remote = [
      { id: 'a', updatedAt: 2, v: 'remote-new' },
      { id: 'c', updatedAt: 1, v: 'remote-only' },
    ]
    const out = Object.fromEntries(mergeById(local, remote).map((r) => [r.id, r.v]))
    expect(out).toEqual({ a: 'remote-new', b: 'local-only', c: 'remote-only' })
  })
})
