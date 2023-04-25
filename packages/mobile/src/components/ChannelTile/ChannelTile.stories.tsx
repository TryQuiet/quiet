import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelTile } from './ChannelTile.component'

storiesOf('ChannelTile', module)
  .add('Default', () => (
    <ChannelTile
      name={'general'}
      address={'general'}
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
      unread={false}
      redirect={(address: string) => { console.log(`Clicked ${address}`) }}
      deleteChannel={(channel: string) => { console.log(`Deleted channel ${channel}`) }}
    />
  ))
  .add('Deletion', () => (
    <ChannelTile
      name={'general'}
      address={'general'}
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
      unread={false}
      redirect={(address: string) => { console.log(`Clicked ${address}`) }}
      deleteChannel={(channel: string) => { console.log(`Deleted channel ${channel}`) }}
      enableDeletion
    />
  ))
  .add('Unread', () => (
    <ChannelTile
      name={'general'}
      address={'general'}
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
      unread={true}
      redirect={(address: string) => { console.log(`Clicked ${address}`) }}
      deleteChannel={(channel: string) => { console.log(`Deleted channel ${channel}`) }}
    />
  ))
