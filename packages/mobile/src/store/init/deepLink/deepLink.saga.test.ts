import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { communities, connection, identity } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { deepLinkSaga } from './deepLink.saga'
import { type Community, CommunityOwnership, ConnectionProcessInfo, type Identity, InvitationData } from '@quiet/types'
import { composeInvitationShareUrl, validInvitationCodeTestData, getValidInvitationUrlTestData } from '@quiet/common'

describe('deepLinkSaga', () => {
  let store: Store

  const { code, data } = getValidInvitationUrlTestData(validInvitationCodeTestData[0])

  const validCode = code()
  const validData = data

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
    registrar: {
      privateKey: '',
      address: '',
    },
    onionAddress: '',
    privateKey: '',
    port: 0,
    registrationAttempts: 0,
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
    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
          params: {
            code: validCode,
          },
        })
      )
      .put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          peers: validData.pairs,
          psk: validData.psk,
          ownerOrbitDbIdentity: validData.ownerOrbitDbIdentity,
        })
      )
      .run()
  })

  test.skip('opens channel list screen if the same url has been used', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: 'certificate' })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          peers: validData.pairs,
          psk: validData.psk,
          ownerOrbitDbIdentity: validData.ownerOrbitDbIdentity,
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

    store.dispatch(communities.actions.addNewCommunity(community))

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
            params: {
              title: 'You already belong to a community',
              message: "We're sorry but for now you can only be a member of a single community at a time",
            },
          },
        },
      })
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          peers: validData.pairs,
          psk: validData.psk,
          ownerOrbitDbIdentity: validData.ownerOrbitDbIdentity,
        })
      )
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
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          peers: validData.pairs,
          psk: validData.psk,
          ownerOrbitDbIdentity: validData.ownerOrbitDbIdentity,
        })
      )
      .run()
  })

  test.todo('continues if link used mid registration')

  test.skip('continues if link used mid registration and locks input while waiting for server response', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
        socketIOSecret: 'secret',
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: null })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    store.dispatch(connection.actions.setTorConnectionProcess(ConnectionProcessInfo.REGISTERING_USER_CERTIFICATE))

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(validCode))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
          params: { fetching: true },
        })
      )
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          peers: validData.pairs,
          psk: validData.psk,
          ownerOrbitDbIdentity: validData.ownerOrbitDbIdentity,
        })
      )
      .run()
  })
})
