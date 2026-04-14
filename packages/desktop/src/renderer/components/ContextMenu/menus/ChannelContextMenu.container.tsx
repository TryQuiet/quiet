import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'
import { createSvgIcon } from '@mui/material'
import inlineSvg from 'react-inlinesvg'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import DebugChannelComponent from '../../debugInfo/debugChannelComponent'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import { exportChats } from '../../../../utils/functions/exportMessages'

import hashIconSvg from '../../../static/images/hash.svg'
import lockIconSvg from '../../../static/images/lock-filled.svg'

export const ChannelContextMenu: FC = () => {
  const [showDebug, setShowDebug] = React.useState(false)
  const isOwner = useSelector(communities.selectors.isOwner)
  const channel = useSelector(publicChannels.selectors.currentChannel)
  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const HashIcon = createSvgIcon(inlineSvg({ src: hashIconSvg }) as React.ReactElement, 'Hash')
  const LockIcon = createSvgIcon(inlineSvg({ src: lockIconSvg }) as React.ReactElement, 'Lock')

  let title = ''
  let titleIcon: React.ReactNode = null
  if (channel) {
    title = `${channel.name} settings`
    const Icon = channel.public ? HashIcon : LockIcon
    titleIcon = <Icon viewBox='0 0 12 12' style={{ fontSize: 12, width: 12, height: 12 }} />
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
    <ContextMenu
      title={title + ' Debug'}
      titleIcon={titleIcon}
      {...channelContextMenu}
      handleBack={() => setShowDebug(false)}
    >
      <DebugChannelComponent />
    </ContextMenu>
  ) : (
    <ContextMenu title={title} titleIcon={titleIcon} {...channelContextMenu}>
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu
