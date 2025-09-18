import React, { FC, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import { CreateCommunityPayload, LaunchCommunityPayload } from '@quiet/types'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { CreateCommunity } from '../../components/CreateCommunity/CreateCommunity.component'
import ServerOfferDrawer from '../../components/ModalBottomDrawer/drawers/ServerOffer.drawer'
import Config from 'react-native-config'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CreateCommunityScreen')

export const CreateCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const networkCreated = Boolean(currentCommunity && currentIdentity)

  const [pendingName, setPendingName] = useState<string | null>(null)
  const [showServerOffer, setShowServerOffer] = useState(false)

  const handleCommunityNameSubmit = useCallback((name: string) => {
    if (currentCommunity && currentIdentity) {
      logger.warn('Network already created, ignoring create community request and launching existing community')
      dispatch(communities.actions.launchCommunity({ id: currentCommunity.id } as LaunchCommunityPayload))
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
      dispatch(navigationActions.clearBackStack())
      return
    }
    setPendingName(name)
    if (Config.QSS_ALLOWED === 'true') {
      setShowServerOffer(true)
    } else {
      handleServerOfferClose(false, false)
    }
  }, [])

  const handleServerOfferClose = useCallback(
    (useServer: boolean, _dontShowAgain: boolean) => {
      if (pendingName) {
        const payload: CreateCommunityPayload = {
          name: pendingName,
          useServer,
        }
        dispatch(communities.actions.createCommunity(payload))
        if (useServer) {
          dispatch(navigationActions.setPendingNavigation({ screen: ScreenNames.TermsOfServiceScreen }))
        }
        dispatch(navigationActions.navigation({ screen: ScreenNames.UsernameRegistrationScreen }))
      }
      setShowServerOffer(false)
      setPendingName(null)
    },
    [dispatch, pendingName]
  )

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.JoinCommunityScreen,
      })
    )
  }, [dispatch])

  return (
    <>
      <CreateCommunity
        createCommunityAction={handleCommunityNameSubmit}
        redirectionAction={redirectionAction}
        networkCreated={networkCreated}
        ready={isWebsocketConnected}
      />
      <ServerOfferDrawer visible={showServerOffer} onClose={handleServerOfferClose} showDontShowAgain={false} />
    </>
  )
}
