import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelList } from './ChannelList.component'

storiesOf('ChannelList', module).add('Default', () => (
  <ChannelList
    tiles={[
      {
        name: 'general',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false
      },
      {
        name: 'spam',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false
      },
      {
        name: 'design',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '6/1/22',
        unread: true
      },
      {
        name: 'qa',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: 'Yesterday',
        unread: false
      }
    ]}
  />
))
