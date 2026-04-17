import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import DebugChannelComponent from '../../debugInfo/debugChannelComponent'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { exportChats } from '../../../../utils/functions/exportMessages'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'

export const ChannelContextMenu: FC = () => {
  const [showDebug, setShowDebug] = React.useState(false)
  const isOwner = useSelector(communities.selectors.isOwner)
  const channel = useSelector(publicChannels.selectors.currentChannel)
  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  let title = ''
  if (channel) {
    title = `${channel.name}`
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const deleteChannelModal = useModal(ModalName.deleteChannel)
  const addMembersChannelModal = useModal(ModalName.addMembersChannel)

  const items: ContextMenuItemProps[] = []

  if (!(channel?.public ?? true)) {
    items.push({
      title: 'Add members',
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        addMembersChannelModal.handleOpen()
      },
    })
  }

  if (isOwner) {
    items.push({
      title: 'Delete',
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        deleteChannelModal.handleOpen()
      },
    })
  }

  items.push({
    title: 'Export messages',
    action: () => channel && exportChats(channel?.name, channelMessages),
  })

  if (process.env.NODE_ENV === 'development') {
    items.push({
      title: 'Debug',
      action: () => setShowDebug(true),
    })
  }

  return showDebug ? (
    <ContextMenu title={title + ' Debug'} {...channelContextMenu} handleBack={() => setShowDebug(false)}>
      <DebugChannelComponent />
    </ContextMenu>
  ) : (
    <ContextMenu
      title={title}
      titleIcon={
        <ChannelTypeIcon
          isPublic={channel?.public ?? true}
          fill={'currentColor'}
          style={{ fontSize: 16, fontWeight: 'medium' }}
          data-testid={`${channel?.name}-settings-channel-icon`}
        />
      }
      {...channelContextMenu}
    >
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu
