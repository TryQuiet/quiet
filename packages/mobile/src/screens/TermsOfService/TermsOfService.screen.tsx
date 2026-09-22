import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { TermsOfService } from '../../components/TermsOfService/TermsOfService.component'
import { createLogger } from '../../utils/logger'
import { JoinRecovery } from '../../components/JoinRecovery/JoinRecovery.component'

const logger = createLogger('TermsOfServiceScreen')

/** The host the copy names ("api.tryquiet.org"): the QSS endpoint without scheme and path. */
export const serverHost = (endpoint?: string): string | undefined => {
  const host = endpoint?.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/[/?#].*$/, '')
  return host || undefined
}

export const TermsOfServiceScreen: FC = () => {
  const dispatch = useDispatch()

  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  // The invite carries the server (v5); once the community exists it is on the community.
  const host = serverHost(
    (invitationCodes && 'qssEndpoint' in invitationCodes ? invitationCodes.qssEndpoint : undefined) ??
      currentCommunity?.qssEndpoint
  )

  const onAgree = () => {
    logger.info('User agreed to Terms of Service')
    dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: true }))
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ConnectionProcessScreen,
      })
    )
  }

  const onBack = () => {
    logger.info('User did not agree to Terms of Service')
    dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: false }))
    dispatch(navigationActions.pop())
  }

  return (
    <JoinRecovery>
      <TermsOfService onAgree={onAgree} onBack={onBack} serverHost={host} />
    </JoinRecovery>
  )
}
