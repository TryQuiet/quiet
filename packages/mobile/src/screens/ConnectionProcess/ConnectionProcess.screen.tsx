import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, ErrorCodes, errors, publicChannels, users } from '@quiet/state-manager'
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

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)
  const messageNotNull = channelsStatusSorted.filter(channel => channel.newestMessage !== undefined)
  const currentChannelDisplayableMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)
  const certificatesMapping = useSelector(users.selectors.certificatesMapping)

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
    const areMessagesLoaded = Object.values(currentChannelDisplayableMessages).length > 0
    const areCertificatesLoaded = Object.values(certificatesMapping).length > 0
    const isAllDataLoaded = areMessagesLoaded && areCertificatesLoaded
    console.log({ areMessagesLoaded, areCertificatesLoaded })
    if (isOwner ? connectionProcessSelector.number == 85 : isAllDataLoaded && messageNotNull.length !== 0) {
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [connectionProcessSelector, messageNotNull, currentChannelDisplayableMessages, certificatesMapping])
  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}

export default ConnectionProcessScreen
