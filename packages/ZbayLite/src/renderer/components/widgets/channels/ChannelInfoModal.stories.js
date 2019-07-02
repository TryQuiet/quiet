import React from 'react'
import Immutable from 'immutable'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import ChannelInfoModal from './ChannelInfoModal'
import { getZbayChannelUri } from '../../../zbay/channels'

storiesOf('Components/Widgets/Channels/ChannelInfoModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    const channel = Immutable.Map({
      name: 'Politics',
      description: 'This is a short description of a channel about politics. This should only contain multiple lines. Maybe a little bit more? Surely no less.'
    })
    const shareUri = getZbayChannelUri('eJxNjTEOwjAMRa+CPCdD1q6cxDQWsUqdKk6CoOrd6wADk633vv7fgSNMwYHgSjDBNaEIPS4BHGyFO1ajtTRykFCTJSpp9eP3I4MxFlI1/tYw1A8M16QQftsj6Vx4q5zlbwRvudXP1EIv69iB+2KeZc4ry913pue4pm3tOE48Yzmm')
    return (
      <ChannelInfoModal
        open
        handleClose={action('handleClose')}
        channel={channel}
        shareUri={shareUri}
      />
    )
  })
