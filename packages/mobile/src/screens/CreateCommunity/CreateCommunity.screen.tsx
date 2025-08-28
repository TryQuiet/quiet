import React, { FC, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import { CreateCommunityPayload } from '@quiet/types'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { CreateCommunity } from '../../components/CreateCommunity/CreateCommunity.component'
import ServerOfferDrawer from '../../components/ModalBottomDrawer/drawers/ServerOffer.drawer'
import { QSS_ALLOWED } from '@env'

export const CreateCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const networkCreated = Boolean(currentCommunity && currentIdentity)

  const [pendingName, setPendingName] = useState<string | null>(null)
  const [showServerOffer, setShowServerOffer] = useState(false)

  const handleCommunityNameSubmit = useCallback((name: string) => {
    setPendingName(name)
    if (QSS_ALLOWED === 'true') {
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
        dispatch(
          navigationActions.navigation({
            screen: ScreenNames.UsernameRegistrationScreen,
          })
        )
      }
      setShowServerOffer(false)
      setPendingName(null)
    },
    [dispatch, pendingName]
  )

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.navigation({
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
