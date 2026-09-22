import { NativeModules } from 'react-native'
import { applyMiddleware, createStore, type AnyAction, type Middleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { waitFor } from '@testing-library/react-native'
import { communities } from '@quiet/state-manager'

import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationActions } from '../../navigation/navigation.slice'
import { persistor } from '../../store'
import { nativeServicesActions } from '../nativeServices.slice'
import { admissionResetMasterSaga } from '../nativeServices.master.saga'
import { rootReducer } from '../../root.reducer'
import {
  ADMISSION_FAILURE_STACK,
  finishAdmissionResetSaga,
  retryAdmissionCleanupSaga,
  retryAdmissionFinalizationSaga,
} from './resetAdmission.saga'

describe('admission reset native cleanup', () => {
  const result = { type: 'invalid' } as const

  beforeEach(() => {
    NativeModules.CommunicationModule.clearAdmissionCredentials.mockReset()
  })

  afterEach(() => jest.restoreAllMocks())

  it('acknowledges admission-only native cleanup before clearing Redux', async () => {
    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('complete'))
      .provide([
        [select(communities.selectors.admissionResetStatus), 'complete'],
        [select(communities.selectors.admissionResetResult), result],
        [call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials), undefined],
        [call.fn(persistor.flush), undefined],
      ])
      .call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials)
      .put(communities.actions.finalizeAdmissionReset(result))
      .call.fn(persistor.flush)
      .put(communities.actions.setAdmissionResetStatus('idle'))
      // The failure is reported on the invite field, so the flow comes back to the paste screen,
      // not to the three-way choice, which has nowhere to put the message.
      .put(navigationActions.resetToStack({ screens: ADMISSION_FAILURE_STACK }))
      .not.put(navigationActions.resetToScreen({ screen: ScreenNames.JoinCommunityScreen }))
      .not.call.fn(NativeModules.CommunicationModule.clearSensitiveData)
      .run()
  })

  it('keeps the reset result and presents a retry when native cleanup fails', async () => {
    NativeModules.CommunicationModule.clearAdmissionCredentials.mockRejectedValueOnce(new Error('cleanup failed'))

    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('complete'))
      .provide([[select(communities.selectors.admissionResetResult), result]])
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'Could not finish resetting Quiet',
              buttonTitle: 'Retry',
            },
          },
        },
      })
      .not.put(communities.actions.finalizeAdmissionReset(result))
      .not.call.fn(persistor.flush)
      .run()
  })

  it('globally presents backend reset retry without a rehydrated community entity', async () => {
    const sagaMiddleware = createSagaMiddleware()
    const observedActions: AnyAction[] = []
    const recordActions: Middleware = () => next => action => {
      observedActions.push(action as AnyAction)
      return next(action)
    }
    const store = createStore(rootReducer, undefined, applyMiddleware(recordActions, sagaMiddleware))
    const communityId = 'deleted-community-id'
    store.dispatch(communities.actions.setCurrentCommunity(communityId))
    const task = sagaMiddleware.run(admissionResetMasterSaga)

    store.dispatch(communities.actions.setAdmissionResetStatus('failed'))
    await waitFor(() =>
      expect(observedActions).toContainEqual(
        expect.objectContaining({
          type: navigationActions.replaceScreen.type,
          payload: expect.objectContaining({ screen: ScreenNames.ErrorScreen }),
        })
      )
    )
    const retryScreenAction = observedActions.find(
      action =>
        action.type === navigationActions.replaceScreen.type && action.payload.screen === ScreenNames.ErrorScreen
    )

    expect(communities.selectors.currentCommunity(store.getState())).toBeUndefined()
    expect(retryScreenAction).toBeDefined()
    retryScreenAction?.payload.params.onPress(store.dispatch)
    expect(observedActions).toContainEqual(communities.actions.resetAdmission(communityId))
    expect(observedActions).not.toContainEqual(communities.actions.resetApp(undefined))
    task.cancel()
  })

  it('retries only native cleanup after backend reset is complete', async () => {
    await expectSaga(retryAdmissionCleanupSaga)
      .provide([
        [select(communities.selectors.admissionResetStatus), 'complete'],
        [select(communities.selectors.admissionResetResult), result],
        [call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials), undefined],
        [call.fn(persistor.flush), undefined],
      ])
      .call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials)
      .put(communities.actions.finalizeAdmissionReset(result))
      .put(communities.actions.setAdmissionResetStatus('idle'))
      .not.put.like({ action: { type: communities.actions.resetAdmission.type } })
      .run()
  })

  it('retries persistence without repeating native or backend cleanup', async () => {
    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('complete'))
      .provide([
        [select(communities.selectors.admissionResetStatus), 'complete'],
        [select(communities.selectors.admissionResetResult), result],
        [call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials), undefined],
        [call.fn(persistor.flush), throwError(new Error('flush failed'))],
      ])
      .put(communities.actions.finalizeAdmissionReset(result))
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'Could not save the completed reset',
              buttonTitle: 'Retry',
            },
          },
        },
      })
      .not.put(communities.actions.setAdmissionResetStatus('idle'))
      .run()

    await expectSaga(retryAdmissionFinalizationSaga)
      .provide([[call.fn(persistor.flush), undefined]])
      .call.fn(persistor.flush)
      .put(communities.actions.setAdmissionResetStatus('idle'))
      .put(navigationActions.resetToStack({ screens: ADMISSION_FAILURE_STACK }))
      .not.put(navigationActions.resetToScreen({ screen: ScreenNames.JoinCommunityScreen }))
      .not.call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials)
      .not.put.like({ action: { type: communities.actions.resetAdmission.type } })
      .run()
  })

  it('lands on the paste screen with the walked path beneath it', async () => {
    // The screen shown is the one with the invite field; the entries under it are what its
    // back arrow retraces, which a one-deep reset would not leave.
    expect(ADMISSION_FAILURE_STACK[ADMISSION_FAILURE_STACK.length - 1]).toBe(ScreenNames.PasteInviteLinkScreen)
    expect(ADMISSION_FAILURE_STACK).toEqual([
      ScreenNames.GetStartedScreen,
      ScreenNames.JoinCommunityScreen,
      ScreenNames.OpenInviteLinkScreen,
      ScreenNames.PasteInviteLinkScreen,
    ])
  })

  it('does nothing unless backend cleanup is complete', async () => {
    await expectSaga(finishAdmissionResetSaga, communities.actions.setAdmissionResetStatus('pending'))
      .not.call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials)
      .not.call.fn(persistor.flush)
      .run()

    await expectSaga(retryAdmissionCleanupSaga)
      .provide([[select(communities.selectors.admissionResetStatus), 'failed']])
      .not.call.fn(NativeModules.CommunicationModule.clearAdmissionCredentials)
      .run()
  })

  it('exposes a local retry action', () => {
    expect(nativeServicesActions.retryAdmissionCleanup()).toEqual({
      type: 'NativeServices/retryAdmissionCleanup',
      payload: undefined,
    })
  })

  it('recovers a replay in rehydrated no-community state without concurrent cleanup', async () => {
    const sagaMiddleware = createSagaMiddleware()
    const observedActions: AnyAction[] = []
    const recordActions: Middleware = () => next => action => {
      observedActions.push(action as AnyAction)
      return next(action)
    }
    const rehydratedState = rootReducer(undefined, { type: '@@redux/INIT' })
    const store = createStore(rootReducer, rehydratedState, applyMiddleware(recordActions, sagaMiddleware))
    let rejectFinalization: (reason: Error) => void = () => undefined
    const flush = jest
      .spyOn(persistor, 'flush')
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFinalization = reject
          })
      )
      .mockResolvedValueOnce(undefined)

    let rejectCleanup: (reason: Error) => void = () => undefined
    NativeModules.CommunicationModule.clearAdmissionCredentials.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectCleanup = reject
        })
    )
    const task = sagaMiddleware.run(admissionResetMasterSaga)
    const replayResult = { type: 'interrupted', invitationType: 'device' } as const

    // These are the two state transitions produced by the shared replay subscriber.
    store.dispatch(communities.actions.setAdmissionResetResult(replayResult))
    store.dispatch(communities.actions.setAdmissionResetStatus('complete'))
    await waitFor(() => expect(NativeModules.CommunicationModule.clearAdmissionCredentials).toHaveBeenCalledTimes(1))

    // A repeated receipt and a premature retry are dropped while the native Promise is pending.
    store.dispatch(communities.actions.setAdmissionResetStatus('complete'))
    store.dispatch(nativeServicesActions.retryAdmissionCleanup())
    expect(NativeModules.CommunicationModule.clearAdmissionCredentials).toHaveBeenCalledTimes(1)

    rejectCleanup(new Error('cleanup failed'))
    await waitFor(() =>
      expect(observedActions).toContainEqual(
        expect.objectContaining({
          type: navigationActions.replaceScreen.type,
          payload: expect.objectContaining({ screen: ScreenNames.ErrorScreen }),
        })
      )
    )
    expect(communities.selectors.admissionResetStatus(store.getState())).toBe('complete')
    expect(communities.selectors.admissionResetResult(store.getState())).toEqual(replayResult)

    store.dispatch(nativeServicesActions.retryAdmissionCleanup())
    await waitFor(() => expect(NativeModules.CommunicationModule.clearAdmissionCredentials).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(communities.selectors.admissionResetStatus(store.getState())).toBe('finalizing'))
    expect(flush).toHaveBeenCalledTimes(1)

    rejectFinalization(new Error('flush failed'))
    await waitFor(() =>
      expect(observedActions).toContainEqual(
        expect.objectContaining({
          type: navigationActions.replaceScreen.type,
          payload: expect.objectContaining({
            screen: ScreenNames.ErrorScreen,
            params: expect.objectContaining({ title: 'Could not save the completed reset' }),
          }),
        })
      )
    )
    expect(communities.selectors.admissionResetStatus(store.getState())).toBe('finalizing')

    store.dispatch(nativeServicesActions.retryAdmissionFinalization())
    await waitFor(() => expect(flush).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(communities.selectors.admissionResetStatus(store.getState())).toBe('idle'))

    expect(communities.selectors.currentCommunityId(store.getState())).toBe('')
    expect(communities.selectors.joinCommunityError(store.getState())).toEqual(replayResult)
    expect(
      observedActions.filter(action => action.type === communities.actions.finalizeAdmissionReset.type)
    ).toHaveLength(1)
    expect(NativeModules.CommunicationModule.clearAdmissionCredentials).toHaveBeenCalledTimes(2)
    task.cancel()
  })
})
