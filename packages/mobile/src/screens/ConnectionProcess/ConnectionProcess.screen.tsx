import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, errors, network } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { createLogger } from '../../utils/logger'
import { ErrorMessages, LoadingPanelType, SocketActions } from '@quiet/types'

const logger = createLogger('ConnectionProcessScreen')

export const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const isJoiningCompletedSelector = useSelector(connection.selectors.isJoiningCompleted)
  const loadingPanelType = useSelector(network.selectors.loadingPanelType)
  const admissionFailure = useSelector(errors.selectors.admissionFailure)
  const admissionResetStatus = useSelector(communities.selectors.admissionResetStatus)
  const currentCommunityId = useSelector(communities.selectors.currentCommunityId)
  const currentCommunityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const hasCurrentCommunityError = Boolean(currentCommunityId && Object.keys(currentCommunityErrors).length > 0)
  const launchError = currentCommunityErrors[SocketActions.LAUNCH_COMMUNITY]
  const invalidInvite = launchError?.message === ErrorMessages.INVALID_INVITE

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
      dispatch(navigationActions.clearBackStack())
    }
  }, [isJoiningCompletedSelector])

  useEffect(() => {
    if (invalidInvite && currentCommunityId && admissionResetStatus === 'idle') {
      dispatch(communities.actions.resetAdmission(currentCommunityId))
    }
  }, [admissionResetStatus, currentCommunityId, invalidInvite, dispatch])

  useEffect(() => {
    if (hasCurrentCommunityError && admissionFailure == null && !invalidInvite) {
      dispatch(navigationActions.clearBackStack())
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
    }
  }, [hasCurrentCommunityError, admissionFailure, invalidInvite, dispatch])

  useEffect(() => {
    if (loadingPanelType === LoadingPanelType.Failed && admissionResetStatus === 'idle') {
      dispatch(navigationActions.clearBackStack())
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.JoinCommunityScreen }))
    }
  }, [admissionResetStatus, loadingPanelType])

  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}
