import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CreateCommunity } from '../../components/CreateCommunity/CreateCommunity.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { identity, communities } from '@quiet/state-manager'
import { CommunityOwnership, CreateNetworkPayload } from '@quiet/types'

export const CreateCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const networkCreated = Boolean(currentIdentity && !currentIdentity.userCertificate)

  useEffect(() => {
    if (networkCreated) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameRegistrationScreen,
        })
      )
    }
  }, [dispatch, currentIdentity])

  const createCommunityAction = useCallback(
    (name: string) => {
      const payload: CreateNetworkPayload = {
        ownership: CommunityOwnership.Owner,
        name,
      }
      dispatch(communities.actions.createNetwork(payload))
    },
    [dispatch]
  )

  const redirectionAction = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.JoinCommunityScreen,
      })
    )
  }, [dispatch])

  return (
    <CreateCommunity
      createCommunityAction={createCommunityAction}
      redirectionAction={redirectionAction}
      networkCreated={networkCreated}
    />
  )
}
