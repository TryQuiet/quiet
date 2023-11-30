import React, { FC, useCallback, useEffect } from 'react'
import { connection, ErrorCodes, errors } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const isJoiningCompletedSelector = useSelector(connection.selectors.isJoiningCompleted)

  const error = useSelector(errors.selectors.registrarErrors)

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  useEffect(() => {
    if (error?.code === ErrorCodes.FORBIDDEN) {
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
    }
  }, [error, dispatch])

  useEffect(() => {
    if (isJoiningCompletedSelector) {
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [isJoiningCompletedSelector])

  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}
