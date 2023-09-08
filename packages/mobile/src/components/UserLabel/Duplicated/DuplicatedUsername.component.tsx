import { DuplicatedUsernameComponentProps } from '../../../screens/DuplicatedUsername/DuplicatedUsername.types'
import { defaultTheme } from '../../../styles/themes/default.theme'
import React from 'react'
import { View } from 'react-native'
import { Appbar } from '../../Appbar/Appbar.component'
import { Typography } from '../../Typography/Typography.component'

const DuplicatedUsernameComponent: React.FC<DuplicatedUsernameComponentProps> = ({ handleBackButton }) => {
  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'duplicated-username-component'}
    >
      <Appbar title={'Duplicated'} back={handleBackButton} />
      <Typography fontSize={12}>Duplicated</Typography>
    </View>
  )
}

export default DuplicatedUsernameComponent
