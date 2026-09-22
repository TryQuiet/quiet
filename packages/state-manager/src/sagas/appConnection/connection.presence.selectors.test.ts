import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../utils/tests/prepareStore'
import { connectionSelectors } from './connection.selectors'
import { connectionActions } from './connection.slice'
import { networkActions } from '../network/network.slice'
import { type DeviceNetworkEndpoint } from '@quiet/types'

const endpoint = (userId: string, deviceId: string, peerId: string): DeviceNetworkEndpoint => ({
  teamId: 'teamId',
  userId,
  deviceId,
  peerId,
  onionAddress: `${peerId}.onion`,
})

/**
 * A user is one identity on several devices, so presence is a property of the user: online when
 * ANY of their devices' peers is connected. These are the three cases the DM list, the membership
 * list and the DM header all resolve through.
 */
describe('connectedUserIds', () => {
  setupCrypto()

  const alice = 'alice-user-id'
  const bob = 'bob-user-id'

  it('reports a user online when one of two devices is connected', () => {
    const store = prepareStore().store
    store.dispatch(
      connectionActions.setNetworkEndpoints({
        endpoints: [endpoint(alice, 'aliceDeviceA', 'alicePeerA'), endpoint(alice, 'aliceDeviceB', 'alicePeerB')],
      })
    )
    store.dispatch(networkActions.addConnectedPeers(['alicePeerB']))

    const connected = connectionSelectors.connectedUserIds(store.getState())
    expect(connected.has(alice)).toBe(true)
    expect(connectionSelectors.isUserConnected(store.getState())(alice)).toBe(true)
  })

  it('reports a user offline when none of their devices is connected', () => {
    const store = prepareStore().store
    store.dispatch(
      connectionActions.setNetworkEndpoints({
        endpoints: [endpoint(alice, 'aliceDeviceA', 'alicePeerA'), endpoint(alice, 'aliceDeviceB', 'alicePeerB')],
      })
    )

    const connected = connectionSelectors.connectedUserIds(store.getState())
    expect(connected.has(alice)).toBe(false)
    expect(connectionSelectors.isUserConnected(store.getState())(alice)).toBe(false)
  })

  it('does not report a user online because another user is connected', () => {
    const store = prepareStore().store
    store.dispatch(
      connectionActions.setNetworkEndpoints({
        endpoints: [endpoint(alice, 'aliceDeviceA', 'alicePeerA'), endpoint(bob, 'bobDeviceA', 'bobPeerA')],
      })
    )
    store.dispatch(networkActions.addConnectedPeers(['bobPeerA']))

    const connected = connectionSelectors.connectedUserIds(store.getState())
    expect(connected.has(bob)).toBe(true)
    expect(connected.has(alice)).toBe(false)
    expect(connectionSelectors.isUserConnected(store.getState())(alice)).toBe(false)
  })

  it('treats an unknown or missing user id as offline', () => {
    const store = prepareStore().store
    store.dispatch(
      connectionActions.setNetworkEndpoints({ endpoints: [endpoint(alice, 'aliceDeviceA', 'alicePeerA')] })
    )
    store.dispatch(networkActions.addConnectedPeers(['alicePeerA']))

    const isConnected = connectionSelectors.isUserConnected(store.getState())
    expect(isConnected(undefined)).toBe(false)
    expect(isConnected('nobody')).toBe(false)
  })
})
