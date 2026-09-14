import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { SocketActions } from '@quiet/types'
import type { Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { errorsSelectors } from '../../errors/errors.selectors'
import { resetAdmissionSaga } from './resetAdmission.saga'

describe('reset timed-out admission', () => {
  const action = communitiesActions.resetAdmission('community')
  const selectors: StaticProvider[] = [
    [select(communitiesSelectors.currentCommunityId), 'community'],
    [select(communitiesSelectors.currentCommunity), { inviteData: { kind: 'member' } }],
    [select(errorsSelectors.admissionFailure), 'timeout'],
  ]

  it('waits for backend cleanup before resetting local state', async () => {
    let finish!: (success: boolean) => void
    const emitWithAck = jest.fn(
      () =>
        new Promise<boolean>(resolve => {
          finish = resolve
        })
    )
    const dispatched: string[] = []
    const task = expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
      .provide(selectors)
      .withReducer((state = {}, action) => {
        dispatched.push(action.type)
        return state
      })
      .run(false)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(emitWithAck).toHaveBeenCalledWith(SocketActions.RESET_ADMISSION, { id: 'community' })
    expect(dispatched).not.toContain(communitiesActions.resetApp.type)
    finish(true)
    await task
    expect(dispatched).toContain(communitiesActions.resetApp.type)
    expect(dispatched).toContain(communitiesActions.setJoinCommunityError.type)
  })

  it.each([false, undefined, new Error('disconnected')])(
    'retains invitation data on cleanup failure: %s',
    async result => {
      const emitWithAck = jest.fn(async () => {
        if (result instanceof Error) throw result
        return result
      })
      await expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
        .provide(selectors)
        .put(communitiesActions.setAdmissionResetStatus('failed'))
        .not.put(communitiesActions.resetApp(undefined))
        .run()
    }
  )

  it.each([
    ['other-community', true],
    ['community', false],
  ])('ignores stale or non-recoverable resets', async (id, recoverable) => {
    const emitWithAck = jest.fn()
    await expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
      .provide([
        [select(communitiesSelectors.currentCommunityId), id],
        [select(errorsSelectors.admissionFailure), recoverable ? 'timeout' : null],
      ])
      .not.put(communitiesActions.resetApp(undefined))
      .run()
    expect(emitWithAck).not.toHaveBeenCalled()
  })
})
