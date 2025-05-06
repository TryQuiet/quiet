import { getSocketFactory } from './factories'
import { SocketActions } from '@quiet/types'
import { describe, it, expect } from '@jest/globals'

describe('socketFactory', () => {
  it('defines all EmitEvents keys and builds correctly typed payloads', async () => {
    const factory = await getSocketFactory()

    for (const key of Object.values(SocketActions)) {
      const payload = await factory.build(key)
      expect(payload).toBeDefined()
      expect(typeof payload === 'object' || typeof payload === 'string' || typeof payload === 'undefined').toBe(true)
    }
  })
})
