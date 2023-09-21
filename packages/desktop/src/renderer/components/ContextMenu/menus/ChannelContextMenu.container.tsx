import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu, ContextMenuItemList } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const ChannelContextMenu: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const channel = useSelector(publicChannels.selectors.currentChannel)

  let title = ''
  if (channel) {
    title = `#${channel.name} settings`
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const deleteChannelModal = useModal(ModalName.deleteChannel)

  let items: ContextMenuItemProps[] = []

  if (community?.CA) {
    items = [
      ...items,
      {
        title: 'Delete',
        action: () => {
          channelContextMenu.handleClose() // Dismiss context menu before displaying modal
          deleteChannelModal.handleOpen()
        },
      },
    ]
  }

  return (
    // @ts-expect-error
    <ContextMenu title={title} {...channelContextMenu}>
      <ContextMenuItemList items={items} />
    </ContextMenu>
  )
}

export default ChannelContextMenu
