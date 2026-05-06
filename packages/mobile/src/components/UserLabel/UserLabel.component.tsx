import React from 'react'
import { View, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { UserLabelProps, UserLabelType } from './UserLabel.types'
import { icons } from '../../assets'

const classes = StyleSheet.create({
  mainWrapper: {
    marginLeft: 8,
  },
  wrapperGray: {
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 8,
    backgroundColor: defaultTheme.palette.background.gray06,
  },
  wrapperRed: {
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 8,
    flexDirection: 'row',
    backgroundColor: defaultTheme.palette.typography.error,
  },
  textBlack: {
    color: 'black',
  },
  textWhite: {
    color: 'white',
  },
  image: {
    width: 13,
    height: 12,
    marginRight: 4,
    marginLeft: 4,
  },
})

const UserLabel: React.FC<UserLabelProps> = ({
  type,
  username,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
}) => {
  const isUnregistered = type === UserLabelType.UNREGISTERED

  return (
    <TouchableWithoutFeedback
      onPress={() => (isUnregistered ? unregisteredUsernameHandleBack(username) : duplicatedUsernameHandleBack())}
      testID={'user-label'}
    >
      <View style={classes.mainWrapper}>
        <View style={isUnregistered ? classes.wrapperGray : classes.wrapperRed}>
          {!isUnregistered && <Image source={icons.icon_warning} style={classes.image} />}
          <Typography fontSize={12} style={isUnregistered ? classes.textBlack : classes.textWhite}>
            {type}
          </Typography>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export default UserLabel
