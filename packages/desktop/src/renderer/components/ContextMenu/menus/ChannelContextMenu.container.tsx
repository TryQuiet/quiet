import React, { FC, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

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
  const [showDebug, setShowDebug] = useState<boolean>(false)
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [canAddMembers, setCanAddMembers] = useState<boolean>(false)

  const channel = useSelector(publicChannels.selectors.currentChannel)
  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)
  const genericChannelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  let title = ''
  if (channel) {
    title = `${channel.name}`
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const deleteChannelModal = useModal(ModalName.deleteChannel)
  const addMembersChannelModal = useModal(ModalName.addMembersChannel)

  const items: ContextMenuItemProps[] = []

  useEffect(() => {
    if (channel == null) {
      setCanAddMembers(false)
      setCanDelete(false)
      return
    }

    if (channel.public ?? true) {
      setCanAddMembers(false)
      setCanDelete(genericChannelPermissions.public.delete)
    } else {
      if (currentChannelPermissions == null) {
        setCanAddMembers(false)
        setCanDelete(false)
      } else {
        setCanAddMembers(currentChannelPermissions.addMembers)
        setCanDelete(currentChannelPermissions.delete)
      }
    }
  }, [channel, genericChannelPermissions, currentChannelPermissions])

  if (canAddMembers === true) {
    items.push({
      title: 'Add members',
      action: () => {
        channelContextMenu.handleClose() // Dismiss context menu before displaying modal
        addMembersChannelModal.handleOpen()
      },
    })
  }

  if (canDelete) {
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
          data-testid={`contextMenu-channel-settings-type-icon`}
        />
      }
      {...channelContextMenu}
    >
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu
