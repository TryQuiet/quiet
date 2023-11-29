import React, { FC, useCallback, useEffect } from 'react'
import { communities, connection, ErrorCodes, errors, network, publicChannels, users } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'
import ConnectionProcessComponent from '../../components/ConnectionProcess/ConnectionProcess.component'
import { Linking } from 'react-native'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const ConnectionProcessScreen: FC = () => {
  const dispatch = useDispatch()

  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const error = useSelector(errors.selectors.registrarErrors)

  const community = useSelector(communities.selectors.currentCommunity)
  const isOwner = Boolean(community?.CA)

  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)
  const messageNotNull = channelsStatusSorted.filter(channel => channel.newestMessage !== undefined)

  const certificatesMapping = useSelector(users.selectors.certificatesMapping)
  const channels = useSelector(publicChannels.selectors.publicChannels)

  const communityId = useSelector(communities.selectors.currentCommunityId)
  const initializedCommunities = useSelector(network.selectors.initializedCommunities)
  const isCommunityInitialized = Boolean(initializedCommunities[communityId])

  const currentChannelDisplayableMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

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
    const areChannelsLoaded = channels.length > 0
    const areCertificatesLoaded = Object.values(certificatesMapping).length > 0
    const isAllDataLoaded = areChannelsLoaded && areCertificatesLoaded
    console.log({ isCommunityInitialized, areMessagesLoaded, isAllDataLoaded })
    if (isCommunityInitialized && areMessagesLoaded && isAllDataLoaded) {
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
    }
  }, [isCommunityInitialized, currentChannelDisplayableMessages, certificatesMapping, channels])

  return <ConnectionProcessComponent openUrl={openUrl} connectionProcess={connectionProcessSelector} />
}
