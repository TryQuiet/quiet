import React, { FC } from 'react'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { MenuName } from '../../../const/MenuNames.enum'
import { ContextMenu } from '../ContextMenu.component'
import { UnregisteredUsernameArgs } from '../ContextMenu.types'
import { View } from 'react-native'
import { Typography } from '../../Typography/Typography.component'
import { Button } from '../../Button/Button.component'
import { defaultPalette } from '../../../styles/palettes/default.palette'

export const UnregisteredUsernameContextMenu: FC = () => {
  const title = 'Unregistered username'
  const usernameTakenContextMenu = useContextMenu<UnregisteredUsernameArgs>(MenuName.UnregisteredUsername)

  return (
    <ContextMenu title={title} items={[]} {...usernameTakenContextMenu}>
      <View
        style={{ padding: 20, alignItems: 'center', borderTopWidth: 1, borderColor: defaultPalette.background.gray06 }}
      >
        <View>
          <Typography fontSize={14} style={{ textAlign: 'center', lineHeight: 20 }}>
            The username{' '}
            <Typography fontSize={14} fontWeight={'bold'}>
              @{usernameTakenContextMenu.username}
            </Typography>{' '}
            has not been registered yet with the community owner, so it’s still possible for someone else to register
            the same username. When the community owner is online,{' '}
            <Typography fontSize={14} fontWeight={'bold'}>
              @{usernameTakenContextMenu.username}
            </Typography>{' '}
            will be registered automatically and this alert will go away.
          </Typography>
        </View>

        <View style={{ marginTop: 12 }}>
          <Button width={60} title={'Ok'} onPress={usernameTakenContextMenu.handleClose} />
        </View>
      </View>
    </ContextMenu>
  )
}
