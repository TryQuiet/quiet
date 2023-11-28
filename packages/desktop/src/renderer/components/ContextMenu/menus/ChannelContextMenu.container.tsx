import React, { FC } from 'react'
import { useSelector } from 'react-redux'

import { communities, publicChannels } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

export const ChannelContextMenu: FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const channel = useSelector(publicChannels.selectors.currentChannel)

  let title = ''
  if (channel) {
    title = `#${channel.name}`
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

  // @ts-expect-error
  return <ContextMenu title={title} items={items} {...channelContextMenu} />
}

export default ChannelContextMenu
