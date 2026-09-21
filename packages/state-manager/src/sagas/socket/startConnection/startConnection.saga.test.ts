import { SocketEvents, type AdmissionResetCompletePayload } from '@quiet/types'
import type { Socket } from '../../../types'
import { communitiesActions } from '../../communities/communities.slice'
import { subscribe } from './startConnection.saga'

describe('startConnection socket subscription', () => {
  it('forwards durable admission reset completion for state-aware handling', () => {
    const listeners = new Map<string, (payload: unknown) => void>()
    const socket = {
      on: jest.fn((event: string, listener: (payload: unknown) => void) => {
        listeners.set(event, listener)
      }),
      off: jest.fn(),
    } as unknown as Socket
    const channel = subscribe(socket)
    const receive = jest.fn()
    channel.take(receive)
    const payload: AdmissionResetCompletePayload = {
      id: 'deleted-community-id',
      invitationType: 'device',
    }

    listeners.get(SocketEvents.ADMISSION_RESET_COMPLETE)?.(payload)

    expect(receive).toHaveBeenCalledWith(communitiesActions.admissionResetCompleted(payload))
    channel.close()
    expect(socket.off).toHaveBeenCalledWith(SocketEvents.ADMISSION_RESET_COMPLETE)
  })
})
