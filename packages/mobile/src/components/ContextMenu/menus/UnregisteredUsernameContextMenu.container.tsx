import React, { FC } from 'react'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { UnregisteredUsernameArgs } from '../ContextMenu.types'

export const UnregisteredUsernameContextMenu: FC = () => {
  const title = 'Unregistered username'
  const usernameTakenContextMenu = useContextMenu<UnregisteredUsernameArgs>(MenuName.UnregisteredUsername)

  return (
    <ContextMenu
      title={title}
      items={[]}
      {...usernameTakenContextMenu}
      unregisteredUsername
      username={usernameTakenContextMenu.username}
    />
  )
}
