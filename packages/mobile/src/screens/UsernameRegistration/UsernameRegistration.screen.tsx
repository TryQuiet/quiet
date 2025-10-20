import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { createLogger } from '../../utils/logger'
import { InvitationDataVersion } from '@quiet/types'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'

const logger = createLogger('UsernameRegistrationScreen')

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const tosRequested = useSelector(communities.selectors.tosRequested)
  const pendingNavigation = useSelector(navigationSelectors.pendingNavigation)
  const usernameRegistered = Boolean(currentIdentity?.userId)

  const handleAction = (nickname: string) => {
    dispatch(identity.actions.registerUsername({ nickname: nickname, isUsernameTaken: false }))
    if (
      (invitationCodes?.version === InvitationDataVersion.v3 && invitationCodes?.qssEnabled) ||
      pendingNavigation === ScreenNames.TermsOfServiceScreen
    ) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.TermsOfServiceScreen }))
      return
    }
    dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ConnectionProcessScreen }))
    logger.info(`TosRequested: ${tosRequested}`)
  }

  return <UsernameRegistration registerUsernameAction={handleAction} usernameRegistered={usernameRegistered} />
}
