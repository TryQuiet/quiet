import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { TermsOfService } from '../../components/TermsOfService/TermsOfService.component'
import { createLogger } from '../../utils/logger'
import { nativeServicesActions } from '../../store/nativeServices/nativeServices.slice'

const logger = createLogger('TermsOfServiceScreen')

export const TermsOfServiceScreen: FC = () => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  const onAgree = () => {
    logger.info('User agreed to Terms of Service')
    dispatch(
      communities.actions.setTermsOfServiceAccepted({
        communityId: currentCommunity?.id,
        accepted: true,
      })
    )
    if (currentCommunity) {
      dispatch(navigationActions.pop())
      return
    }
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ConnectionProcessScreen,
      })
    )
  }

  const onBack = () => {
    logger.info('User did not agree to Terms of Service')
    if (currentCommunity) {
      dispatch(nativeServicesActions.leaveCommunity())
      return
    }
    dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: false }))
    dispatch(navigationActions.pop())
  }

  const onLeave = () => {
    logger.info('User chose to leave the community from Terms of Service screen')
    dispatch(communities.actions.setTermsOfServiceAccepted({ accepted: false }))
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.CreateCommunityScreen,
      })
    )
  }

  return <TermsOfService onAgree={onAgree} onBack={onBack} onLeave={onLeave} />
}
