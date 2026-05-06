import React from 'react'
import { View } from 'react-native'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'
import { NewUsernameRequestedComponentProps } from '../../screens/NewUsernameRequested/NewUsernameRequested.types'

const NewUsernameRequestedComponent: React.FC<NewUsernameRequestedComponentProps> = ({ handler }) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.background.white,
      }}
      testID={'new-username-requested-component'}
    >
      <Appbar title={'Username taken'} crossBackIcon back={handler} />
      <View style={{ paddingLeft: 20, paddingRight: 20 }}>
        <Typography fontSize={14} style={{ marginTop: 30, marginBottom: 30 }}>
          Great! Your new username should be registered automatically the next time the community owner is online.
        </Typography>
        <Button onPress={handler} title={'Continue'} width={100} />
      </View>
    </View>
  )
}

export default NewUsernameRequestedComponent
