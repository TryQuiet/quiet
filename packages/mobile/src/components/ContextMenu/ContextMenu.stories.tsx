import React from 'react'

import { storiesOf } from '@storybook/react-native'

import { ContextMenu } from './ContextMenu.component'
import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'

const community_items: ContextMenuItemProps[] = [
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

const invitation_items: ContextMenuItemProps[] = [
  {
    title: 'Copy link',
    action: () => {
      console.log('clicked on copy link')
    }
  },
  {
    title: 'Cancel',
    action: () => {
      console.log('clicked on cancel')
    }
  }
]

const args: ContextMenuProps = {
  visible: true,
  handleClose: () => {
    console.log('closing menu')
  },
  title: '',
  items: []
}

storiesOf('ContextMenu', module)
  .add('Community', () => {
    return (
      <ContextMenu
        title={'Rockets'}
        items={community_items}
        visible={true}
        handleClose={() => {
          console.log('closing menu')
        }}
      />
    )
  })
  .add('Invitation', () => {
    return (
      <ContextMenu
        title={'Add members'}
        items={invitation_items}
        hint={'Anyone with Quiet app can follow this link to join this community. Only share with people you trust.'}
        link={'https://chat.quiet.org/quiet://?code=bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'}
        visible={true}
        handleClose={() => {
          console.log('closing menu')
        }}
      />
    )
  })
