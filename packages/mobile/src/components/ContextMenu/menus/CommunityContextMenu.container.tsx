import React, { FC, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { navigationSelectors } from '../../../store/navigation/navigation.selectors'
import { capitalize } from '../../../utils/functions/capitalize/capitalize'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { ContextMenuItemProps } from '../ContextMenu.types'

export const CommunityContextMenu: FC = () => {
  const screen = useSelector(navigationSelectors.currentScreen)

  const community = useSelector(communities.selectors.currentCommunity)

  let title = ''
  if (community) {
    title = capitalize(community.name)
  }

  const items: ContextMenuItemProps[] = [{ title: 'Leave community', action: () => {} }]

  const menu = useContextMenu(MenuName.Community)

  useEffect(() => {
    menu.handleClose()
  }, [screen])

  return <ContextMenu title={title} items={items} {...menu} />
}
