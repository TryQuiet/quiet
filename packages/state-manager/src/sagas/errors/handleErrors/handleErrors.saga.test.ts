import { testSaga } from 'redux-saga-test-plan'
import { ErrorCodes, ErrorMessages, ErrorTypes, SocketActions } from '@quiet/types'
import { communitiesActions, communitiesReducer } from '../../communities/communities.slice'
import { errorsActions } from '../errors.slice'
import { handleErrorsSaga } from './handleErrors.saga'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../../utils/tests/factories'
import { communitiesSelectors } from '../../communities/communities.selectors'

describe('handle errors', () => {
  test('Error adds error to store', async () => {
    const errorPayload = {
      type: ErrorTypes.OTHER,
      message: ErrorMessages.NETWORK_SETUP_FAILED,
      code: ErrorCodes.BAD_REQUEST,
    }
    const addErrorAction = errorsActions.handleError(errorPayload)
    testSaga(handleErrorsSaga, addErrorAction).next().put(errorsActions.addError(errorPayload)).next().isDone()
  })

  test.each([ErrorMessages.ADMISSION_TIMEOUT, ErrorMessages.ADMISSION_INTERRUPTED])(
    'Recoverable admission error requests cleanup: %s',
    message => {
      const errorPayload = {
        type: SocketActions.LAUNCH_COMMUNITY,
        message,
        community: 'pending-community',
      }
      const addErrorAction = errorsActions.handleError(errorPayload)
      testSaga(handleErrorsSaga, addErrorAction)
        .next()
        .select(communitiesSelectors.currentCommunityId)
        .next('pending-community')
        .select(communitiesSelectors.admissionResetStatus)
        .next('idle')
        .put(errorsActions.addError(errorPayload))
        .next()
        .put(communitiesActions.resetAdmission('pending-community'))
        .next()
        .isDone()
    }
  )

  test('Interrupted backend receipt seeds its ID and requests guarded cleanup without a community entity', () => {
    const errorPayload = {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_INTERRUPTED,
      community: 'receipt-community',
    }

    testSaga(handleErrorsSaga, errorsActions.handleError(errorPayload))
      .next()
      .select(communitiesSelectors.currentCommunityId)
      .next('')
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .put(communitiesActions.setCurrentCommunity('receipt-community'))
      .next()
      .put(errorsActions.addError(errorPayload))
      .next()
      .put(communitiesActions.resetAdmission('receipt-community'))
      .next()
      .isDone()
  })

  test('Interrupted backend receipt does not reset a different current community', () => {
    const errorPayload = {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_INTERRUPTED,
      community: 'old-receipt-community',
    }

    testSaga(handleErrorsSaga, errorsActions.handleError(errorPayload))
      .next()
      .select(communitiesSelectors.currentCommunityId)
      .next('new-community')
      .select(communitiesSelectors.admissionResetStatus)
      .next('idle')
      .put(errorsActions.addError(errorPayload))
      .next()
      .isDone()
  })

  test.each([SocketActions.JOIN_COMMUNITY, SocketActions.LINK_DEVICE])(
    'A backend refusal for an existing community is reported as belonging to one already: %s',
    type => {
      const errorPayload = {
        type,
        message: ErrorMessages.COMMUNITY_ALREADY_INITIALIZED,
        community: 'second-community',
      }

      testSaga(handleErrorsSaga, errorsActions.handleError(errorPayload))
        .next()
        .put(communitiesActions.setJoinCommunityError({ type: 'alreadyMember' }))
        .next()
        .put(errorsActions.addError(errorPayload))
        .next()
        .isDone()
    }
  )

  test('A create refused for an existing community is not reported on the invite field', () => {
    const errorPayload = {
      type: SocketActions.CREATE_COMMUNITY,
      message: ErrorMessages.COMMUNITY_ALREADY_INITIALIZED,
      community: 'second-community',
    }

    testSaga(handleErrorsSaga, errorsActions.handleError(errorPayload))
      .next()
      .put(errorsActions.addError(errorPayload))
      .next()
      .isDone()
  })

  test('The reason for a refused join survives the bare negative acknowledgement, either order', () => {
    // The backend says it twice - on the error channel and by refusing the request - and the
    // order the two are processed in is not fixed.
    const alreadyMember = communitiesActions.setJoinCommunityError({ type: 'alreadyMember' })
    const refused = communitiesActions.setJoinCommunityError({ type: 'refused' })

    const initial = communitiesReducer(undefined, { type: '@@INIT' })

    const errorFirst = [alreadyMember, refused].reduce(communitiesReducer, initial)
    expect(errorFirst.joinCommunityError).toEqual({ type: 'alreadyMember' })

    const ackFirst = [refused, alreadyMember].reduce(communitiesReducer, initial)
    expect(ackFirst.joinCommunityError).toEqual({ type: 'alreadyMember' })
  })

  test('A later failure of another kind still replaces the reason', () => {
    const state = [
      communitiesActions.setJoinCommunityError({ type: 'alreadyMember' }),
      communitiesActions.setJoinCommunityError({ type: 'invalid' }),
    ].reduce(communitiesReducer, communitiesReducer(undefined, { type: '@@INIT' }))
    expect(state.joinCommunityError).toEqual({ type: 'invalid' })
  })

  test('Interrupted backend receipt does not restart cleanup while finalizing', () => {
    const errorPayload = {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_INTERRUPTED,
      community: 'receipt-community',
    }

    testSaga(handleErrorsSaga, errorsActions.handleError(errorPayload))
      .next()
      .select(communitiesSelectors.currentCommunityId)
      .next('')
      .select(communitiesSelectors.admissionResetStatus)
      .next('finalizing')
      .put(errorsActions.addError(errorPayload))
      .next()
      .isDone()
  })
})
