import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelTile } from './ChannelTile.component'

storiesOf('ChannelTile', module).add('Default', () => (
  <ChannelTile
    name={'general'}
    message={
      'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
    }
  />
))
