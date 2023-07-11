import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, errors } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.torConnectionProcess)
  const error = useSelector(errors.selectors.registrarErrors)

  const community = useSelector(communities.selectors.currentCommunity)
  const isOwner = Boolean(community?.CA)

  const openUrl = useCallback((url: string) => {
    void Linking.openURL(url)
  }, [])

  useEffect(() => {
    if (error) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
    }
  }, [error, dispatch])

  useEffect(() => {
    if (isOwner ? connectionProcessSelector.number == 85 : connectionProcessSelector.number == 95) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [connectionProcessSelector])
  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}

export default ConnectionProcessScreen
