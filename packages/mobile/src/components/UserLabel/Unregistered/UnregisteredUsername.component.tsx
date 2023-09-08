import { defaultTheme } from '../../../styles/themes/default.theme'
import React from 'react'
import { View } from 'react-native'
import { Appbar } from '../../Appbar/Appbar.component'
import { Typography } from '../../Typography/Typography.component'
import { UnregisteredUsernameComponentProps } from 'packages/mobile/src/screens/UnregisteredUsername/UnregisteredUsername.types'
import { Button } from '../../Button/Button.component'

const UnregisteredUsernameComponent: React.FC<UnregisteredUsernameComponentProps> = ({
  handleBackButton,
  username,
}) => {
  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'unregistered-username-component'}
    >
      <Appbar title={'Unregistered username'} back={handleBackButton} />
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Typography fontSize={14} style={{ textAlign: 'center' }}>
          The username @{username} has not been registered yet with the community owner, so it’s still possible for
          someone else to register the same username. When the community owner is online, @{username} will be registered
          automatically and this alert will go away.
        </Typography>
        <Button width={50} title={'OK'} onPress={handleBackButton} />
      </View>
    </View>
  )
}

export default UnregisteredUsernameComponent
