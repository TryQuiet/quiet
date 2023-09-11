import { DuplicatedUsernameComponentProps } from '../../../screens/DuplicatedUsername/DuplicatedUsername.types'
import { defaultTheme } from '../../../styles/themes/default.theme'
import React from 'react'
import { View, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { Appbar } from '../../Appbar/Appbar.component'
import { Typography } from '../../Typography/Typography.component'
import ExclamationMark from '../../../../assets/icons/exclamationMark.png'
import UserLabel from '../UserLabel.component'
import { UserLabelType } from '../UserLabel.types'

const classes = StyleSheet.create({
  mainWrapper: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  image: {
    width: 96,
    height: 83,
  },
  title: {
    marginTop: 24,
    marginBottom: 24,
  },
  labelWrapper: {
    flexDirection: 'row',
    marginTop: 24,
  },
})

const DuplicatedUsernameComponent: React.FC<DuplicatedUsernameComponentProps> = ({ handleBackButton }) => {
  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'duplicated-username-component'}
    >
      <Appbar title={'Warning!'} back={handleBackButton} />
      <View style={classes.mainWrapper}>
        <Image source={ExclamationMark} style={classes.image} />

        <Typography fontSize={16} fontWeight={'medium'} style={classes.title}>
          Multiple users with same name
        </Typography>

        <Typography fontSize={14} style={{ textAlign: 'center' }}>
          An unregistered user is using the same name as another user. This should be rare, and could mean someone is
          impersonating another user.
        </Typography>
        <View style={classes.labelWrapper}>
          <Typography fontSize={14}>These users will be marked</Typography>
          <UserLabel
            type={UserLabelType.DUPLICATE}
            username={''}
            duplicatedUsernameHandleBack={function (): void {}}
            unregisteredUsernameHandleBack={function (username: string): void {}}
          />
        </View>
      </View>
    </View>
  )
}

export default DuplicatedUsernameComponent
