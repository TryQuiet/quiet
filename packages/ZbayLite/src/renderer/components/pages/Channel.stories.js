import React from 'react'
import Immutable from 'immutable'
import { storiesOf } from '@storybook/react'
import { withKnobs, number } from '@storybook/addon-knobs'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import { withStore } from '../../../../.storybook/decorators'
import Channel from './Channel'
import create from '../../store/create'
import { IdentityState, Identity } from '../../store/handlers/identity'
import { createReceivedMessage, now } from '../../testUtils'
import { ReceivedMessage, ChannelMessages } from '../../store/handlers/messages'
import { ChannelState } from '../../store/handlers/channel'

const channelId = 'this-is-test-channel-id'
storiesOf('Pages/Channel', module)
  .addDecorator(withKnobs)
  .addDecorator(e => {
    const store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity({
            address:
              'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
            transparentAddress: 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1',
            balance: BigNumber(number('balance', 1))
          })
        }),
        channel: ChannelState({
          spentFilterValue: 38,
          id: channelId,
          members: new BigNumber(0),
          message: 'This is a test message'
        }),
        messages: Immutable.Map({
          [channelId]: ChannelMessages({
            messages: Immutable.List(
              Immutable.fromJS(
                R.range(0, 8).map(id =>
                  ReceivedMessage(
                    createReceivedMessage({
                      id,
                      createdAt: now.minus({ hours: 2 * id }).toSeconds()
                    })
                  )
                )
              )
            )
          })
        })
      })
    })
    return withStore(store)(e)
  })
  .add('playground', () => {
    return <Channel />
  })
