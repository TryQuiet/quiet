import React, { FC, useEffect } from 'react'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'
import { initActions } from '../../store/init/init.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { Typography } from '../../components/Typography/Typography.component'

export const MainScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.MainScreen))
  })

  return (
    <View style={{ flex: 1 }}>
      <Typography fontSize={14}>Hello main screen!</Typography>
    </View>
  )
}
