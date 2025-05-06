import React, { FC, useCallback, useEffect } from 'react'
import { connection } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { createLogger } from '../../utils/logger'

const logger = createLogger('ConnectionProcessScreen')

export const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const isJoiningCompletedSelector = useSelector(connection.selectors.isJoiningCompleted)

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  useEffect(() => {
    logger.info(isJoiningCompletedSelector)
    if (isJoiningCompletedSelector) {
      logger.info('Joining completed')
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [isJoiningCompletedSelector])

  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}
