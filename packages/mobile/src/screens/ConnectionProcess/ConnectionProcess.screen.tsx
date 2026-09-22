import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, errors, network } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { createLogger } from '../../utils/logger'
import { ErrorMessages, LoadingPanelType, SocketActions } from '@quiet/types'
import { JoinRecovery } from '../../components/JoinRecovery/JoinRecovery.component'

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
  // A community on a server never connects over Tor, so the Tor explanation is
  // not true of it.
  const usesServer = useSelector(communities.selectors.usesServer)
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
          screen: ScreenNames.AppHomeScreen,
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
          screen: ScreenNames.GetStartedScreen,
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

  return (
    <JoinRecovery>
      <ConnectionProcessComponent
        openUrl={openUrl}
        connectionProcess={connectionProcessSelector}
        usesServer={usesServer}
      />
    </JoinRecovery>
  )
}
