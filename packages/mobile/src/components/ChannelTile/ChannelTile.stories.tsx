import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelTile } from './ChannelTile.component'

storiesOf('ChannelTile', module)
    .add('Default', () => (
        <ChannelTile
            name={'general'}
            id={'general'}
            message={
                'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
            }
            date={'1:55pm'}
            unread={false}
            redirect={(id: string) => {
                console.log(`Clicked ${id}`)
            }}
        />
    ))
    .add('Unread', () => (
        <ChannelTile
            name={'general'}
            id={'general'}
            message={
                'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
            }
            date={'1:55pm'}
            unread={true}
            redirect={(id: string) => {
                console.log(`Clicked ${id}`)
            }}
        />
    ))
