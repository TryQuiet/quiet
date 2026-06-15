import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, errors, network } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { createLogger } from '../../utils/logger'
import { LoadingPanelType } from '@quiet/types'

const logger = createLogger('ConnectionProcessScreen')

export const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const isJoiningCompletedSelector = useSelector(connection.selectors.isJoiningCompleted)
  const loadingPanelType = useSelector(network.selectors.loadingPanelType)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentCommunityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const hasCurrentCommunityError = Boolean(currentCommunity && currentCommunityErrors[currentCommunity?.id])

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  useEffect(() => {
    logger.info(isJoiningCompletedSelector)
    if (isJoiningCompletedSelector) {
      logger.info('Joining completed')
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.AppHomeScreen,
        })
      )
      dispatch(navigationActions.clearBackStack())
    }
  }, [isJoiningCompletedSelector])

  useEffect(() => {
    if (hasCurrentCommunityError) {
      dispatch(navigationActions.clearBackStack())
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
    }
  }, [hasCurrentCommunityError])

  useEffect(() => {
    if (loadingPanelType === LoadingPanelType.Failed) {
      dispatch(navigationActions.clearBackStack())
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.CreateCommunityScreen }))
    }
  }, [loadingPanelType])

  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}
