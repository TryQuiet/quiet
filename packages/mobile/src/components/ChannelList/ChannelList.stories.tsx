import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelList } from './ChannelList.component'

storiesOf('ChannelList', module).add('Default', () => (
  <ChannelList
    // @ts-ignore
    community={{
      name: 'Quiet'
    }}
    tiles={[
      {
        name: 'general',
        address: 'general',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false,
        redirect: (address: string) => { console.log(`Clicked ${address}`) }
      },
      {
        name: 'spam',
        address: 'spam',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false,
        redirect: (address: string) => { console.log(`Clicked ${address}`) }
      },
      {
        name: 'design',
        address: 'design',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '6/1/22',
        unread: true,
        redirect: (address: string) => { console.log(`Clicked ${address}`) }
      },
      {
        name: 'qa',
        address: 'qa',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: 'Yesterday',
        unread: false,
        redirect: (address: string) => { console.log(`Clicked ${address}`) }
      }
    ]}
  />
))
.add('Empty', () => (
  <ChannelList
    // @ts-ignore
    community={{
      name: 'Quiet'
    }}
    tiles={[]}
  />
))
