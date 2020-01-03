import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'

import PublishChannelModal from './PublishChannelModal'

storiesOf('Components/UI/PublishChannelModal', module).add('playground', () => (
  <PublishChannelModal
    open
    handleClose={action('handleClose')}
    handleQuit={action('handleQuit')}
    publicChannelFee={0.12}
    zcashRate={10}
  />
))
