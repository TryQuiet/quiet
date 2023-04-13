import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { publicChannels } from '@quiet/state-manager'

import { useContextMenu } from '../../../../hooks/useContextMenu'
import { MenuName } from '../../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

export const ChannelContextMenu: FC = () => {
  const dispatch = useDispatch()

  const channel = useSelector(publicChannels.selectors.currentChannel)

  let title = ''
  if (channel) {
    title = `#${channel.name}`
  }

  const channelContextMenu = useContextMenu(MenuName.Channel)

  const items: ContextMenuItemProps[] = [
    { title: 'Delete', action: () => {} }
  ]

  // @ts-expect-error
  return <ContextMenu title={title} items={items} {...channelContextMenu} />
}
