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
        id: 'general',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false,
        redirect: (id: string) => { console.log(`Clicked ${id}`) }
      },
      {
        name: 'spam',
        id: 'spam',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '1:55pm',
        unread: false,
        redirect: (id: string) => { console.log(`Clicked ${id}`) }
      },
      {
        name: 'design',
        id: 'design',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: '6/1/22',
        unread: true,
        redirect: (id: string) => { console.log(`Clicked ${id}`) }
      },
      {
        name: 'qa',
        id: 'qa',
        message:
          'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
        date: 'Yesterday',
        unread: false,
        redirect: (id: string) => { console.log(`Clicked ${id}`) }
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
