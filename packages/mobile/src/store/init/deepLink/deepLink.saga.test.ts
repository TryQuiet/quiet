import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { communities, connection, getInvitationCodes, identity } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { deepLinkSaga } from './deepLink.saga'
import {
  type Community,
  CommunityOwnership,
  type Identity,
  InvitationData,
  InvitationDataVersion,
  CreateNetworkPayload,
} from '@quiet/types'
import {
  composeInvitationShareUrl,
  validInvitationCodeTestData,
  getValidInvitationUrlTestData,
  validInvitationDatav1,
} from '@quiet/common'

describe('deepLinkSaga', () => {
  let store: Store

  const { code } = getValidInvitationUrlTestData(validInvitationDatav1[0])

  const validCode = code()
  const validData = validInvitationDatav1[0]

  const id = '00d045ab'

  const community: Community = {
    id,
    name: '',
    CA: {
      rootCertString: '',
      rootKeyString: '',
    },
    rootCa: '',
    peerList: [],
    onionAddress: '',
    ownerCertificate: '',
  }

  const _identity: Partial<Identity> = {
    id,
    nickname: '',
    userCsr: null,
    userCertificate: null,
    joinTimestamp: 0,
  }

  beforeEach(async () => {
    store = (await prepareStore()).store
  })

  test('joins community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const createNetworkPayload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      inviteData: validData,
    }
    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put(initActions.resetDeepLink())
      .put(communities.actions.createNetwork(createNetworkPayload))
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
      .run()
  })

  test('displays error if user already belongs to a community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    store.dispatch(
      communities.actions.addNewCommunity({
        ...community,
        name: 'rockets',
      })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
          },
        },
      })
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          inviteData: validData,
        })
      )
      .run()
  })

  test("doesn't display error if user is connecting with the same community", async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    community.psk = validData.psk

    const createNetworkPayload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      inviteData: validData,
    }

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'You already belong to a community',
              message: "We're sorry but for now you can only be a member of a single community at a time",
            },
          },
        },
      })
      .put.like({
        action: {
          type: communities.actions.createNetwork.type,
          payload: createNetworkPayload,
        },
      })
      .run()
  })

  test('displays error if invitation code is invalid', async () => {
    const invalidData: InvitationData = {
      pairs: [
        {
          onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
          peerId: 'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE',
        },
      ],
      psk: 'BNlxfE=',
      ownerOrbitDbIdentity: 'testId',
    }
    const createNetworkPayload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      inviteData: invalidData,
    }
    const invalidCode = composeInvitationShareUrl(invalidData)
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )
    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(invalidCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put.like({
        action: {
          type: navigationActions.replaceScreen.type,
          payload: {
            screen: ScreenNames.ErrorScreen,
            params: {
              title: 'Invalid invitation link',
              message: 'Please check your invitation link and try again',
            },
          },
        },
      })
      .not.put(communities.actions.createNetwork(createNetworkPayload))
      .run()
  })
})
