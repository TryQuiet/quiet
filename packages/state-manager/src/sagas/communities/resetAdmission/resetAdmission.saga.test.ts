import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga-test-plan/matchers'
import type { StaticProvider } from 'redux-saga-test-plan/providers'
import { CommunityOwnership, ErrorMessages, SocketActions } from '@quiet/types'
import { runSaga } from 'redux-saga'
import type { Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { communitiesSelectors } from '../communities.selectors'
import { errorsSelectors } from '../../errors/errors.selectors'
import { resetAdmissionSaga } from './resetAdmission.saga'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { errorsActions } from '../../errors/errors.slice'

describe('reset timed-out admission', () => {
  const action = communitiesActions.resetAdmission('community')
  const selectors: StaticProvider[] = [
    [select(communitiesSelectors.currentCommunityId), 'community'],
    [select(communitiesSelectors.currentCommunity), { inviteData: { kind: 'member' } }],
    [select(errorsSelectors.admissionFailure), 'timeout'],
    [select(errorsSelectors.currentCommunityErrors), {}],
  ]

  it('waits for backend cleanup before exposing a platform-finalizable result', async () => {
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
    expect(dispatched).not.toContain(communitiesActions.resetApp.type)
    expect(dispatched).toContain(communitiesActions.setAdmissionResetResult.type)
    expect(dispatched).toContain(communitiesActions.setAdmissionResetStatus.type)
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

  it('makes failed startup receipt cleanup retryable without a rehydrated community entity', async () => {
    const emitWithAck = jest.fn(async () => false)

    await expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
      .provide([
        [select(communitiesSelectors.currentCommunityId), 'community'],
        [select(errorsSelectors.admissionFailure), 'interrupted'],
        [select(errorsSelectors.currentCommunityErrors), {}],
        [select(communitiesSelectors.currentCommunity), undefined],
      ])
      .put(communitiesActions.setAdmissionResetStatus('pending'))
      .put(communitiesActions.setAdmissionResetStatus('failed'))
      .not.put(communitiesActions.resetApp(undefined))
      .run()

    expect(emitWithAck).toHaveBeenCalledWith(SocketActions.RESET_ADMISSION, { id: 'community' })
  })

  it('makes a lost acknowledgement retryable when socket teardown cancels the saga', async () => {
    const emitWithAck = jest.fn(() => new Promise<boolean>(() => undefined))
    const dispatched: Array<{ type: string; payload?: unknown }> = []
    const store = prepareStore().store
    store.dispatch(
      communitiesActions.addNewCommunity({
        id: 'community',
        name: 'Community',
        teamId: 'team-id',
        ownership: CommunityOwnership.User,
      })
    )
    store.dispatch(communitiesActions.setCurrentCommunity('community'))
    store.dispatch(
      errorsActions.addError({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'community',
        message: ErrorMessages.ADMISSION_TIMEOUT,
      })
    )
    const task = runSaga(
      {
        dispatch: dispatchedAction => dispatched.push(dispatchedAction as { type: string; payload?: unknown }),
        getState: store.getState,
      },
      resetAdmissionSaga,
      { emitWithAck } as unknown as Socket,
      action
    )

    await new Promise(resolve => setTimeout(resolve, 0))
    task.cancel()
    await task.toPromise()

    expect(dispatched[dispatched.length - 1]).toEqual(communitiesActions.setAdmissionResetStatus('failed'))
  })

  it.each([
    ['other-community', true],
    ['community', false],
  ])('ignores stale or non-recoverable resets', async (id, recoverable) => {
    const emitWithAck = jest.fn()
    await expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
      .provide([
        [select(communitiesSelectors.currentCommunityId), id],
        [select(errorsSelectors.admissionFailure), recoverable ? 'timeout' : null],
        [select(errorsSelectors.currentCommunityErrors), {}],
      ])
      .not.put(communitiesActions.resetApp(undefined))
      .run()
    expect(emitWithAck).not.toHaveBeenCalled()
  })

  it('clears an invalid provisional invite through the backend before offering finalization', async () => {
    const emitWithAck = jest.fn(async () => true)
    await expectSaga(resetAdmissionSaga, { emitWithAck } as unknown as Socket, action)
      .provide([
        [select(communitiesSelectors.currentCommunityId), 'community'],
        [select(communitiesSelectors.currentCommunity), { inviteData: { kind: 'device' } }],
        [select(errorsSelectors.admissionFailure), null],
        [
          select(errorsSelectors.currentCommunityErrors),
          { [SocketActions.LAUNCH_COMMUNITY]: { message: ErrorMessages.INVALID_INVITE } },
        ],
      ])
      .put(communitiesActions.setAdmissionResetResult({ type: 'invalid' }))
      .put(communitiesActions.setAdmissionResetStatus('complete'))
      .not.put(communitiesActions.resetApp(undefined))
      .run()
  })
})
