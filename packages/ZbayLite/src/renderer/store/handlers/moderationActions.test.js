/* eslint import/first: 0 */

jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'
import { DateTime } from 'luxon'

import create from '../create'
import { createChannel } from '../../testUtils'
import { mock as zcashMock } from '../../zcash'
import { IdentityState, Identity } from './identity'
import { ChannelState } from '../handlers/channel'
import { ChannelsState } from '../handlers/channels'
import moderationActionsHandler from './moderationActions'
import { moderationActionsType } from '../../../shared/static'

describe('epics', () => {
  const store = create({
    initialState: Immutable.Map({
      identity: IdentityState({
        data: Identity({
          id: 'test-id',
          address: 'test address',
          name: 'Saturn',
          balance: '33.583004',
          signerPrivKey: '879aff43df53606d8ae1219d9347360e7a30d1c2f141e14c9bc96bb29bf930cb'
        })
      }),
      channel: ChannelState({
        spentFilterValue: 38,
        id: 'test',
        address: 'testAddress',
        shareableUri: 'test://uri',
        members: 2,
        message: 'Message written in the input'
      }),
      channels: ChannelsState({
        data: Immutable.fromJS([createChannel('test')])
      })
    })
  })
  jest.spyOn(DateTime, 'utc').mockImplementation(() => {
    return DateTime.fromSeconds(123)
  })
  it('sends moderation action', async () => {
    const actionPromise = store.dispatch(
      moderationActionsHandler.epics.handleModerationAction({
        moderationType: moderationActionsType.REMOVE_MESSAGE,
        moderationTarget: 'test-message-id'
      })
    )

    await actionPromise
    const result = zcashMock.requestManager.z_sendmany.mock.calls
    expect(
      R.sortBy(call => {
        const [, transfer] = call
        return transfer.address
      }, result)
    ).toMatchSnapshot()
  })
})
