import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ContextMenu } from './ContextMenu.component'
import { ContextMenuItemProps } from './ContextMenu.types'

storiesOf('ContextMenu', module).add('Default', () => {
  const items: ContextMenuItemProps[] = [
    {
      title: 'Create channel',
      action: () => {
        console.log('clicked on create channel')
      }
    },
    {
      title: 'Add members',
      action: () => {
        console.log('clicked on add members')
      }
    },
    {
      title: 'Settings',
      action: () => {
        console.log('clicked on settings')
      }
    }
  ]
  return (
    <ContextMenu
      visible={true}
      handleClose={() => {
        console.log('closing menu')
      }}
      title={'Rockets'}
      items={items}
    />
  )
})
