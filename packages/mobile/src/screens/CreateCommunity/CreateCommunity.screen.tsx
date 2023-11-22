import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { identity, communities } from '@quiet/state-manager'
import { CommunityOwnership, CreateNetworkPayload } from '@quiet/types'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { CreateCommunity } from '../../components/CreateCommunity/CreateCommunity.component'

export const CreateCommunityScreen: FC = () => {
    const dispatch = useDispatch()

    const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

    const currentCommunity = useSelector(communities.selectors.currentCommunity)
    const currentIdentity = useSelector(identity.selectors.currentIdentity)

    const networkCreated = Boolean(currentCommunity && !currentIdentity?.userCertificate)

    const createCommunityAction = useCallback(
        (name: string) => {
            const payload: CreateNetworkPayload = {
                ownership: CommunityOwnership.Owner,
                name,
            }
            dispatch(communities.actions.createNetwork(payload))
            dispatch(
                navigationActions.navigation({
                    screen: ScreenNames.UsernameRegistrationScreen,
                })
            )
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
            ready={isWebsocketConnected}
        />
    )
}
