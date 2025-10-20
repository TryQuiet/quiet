import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { TermsOfService } from '../../components/TermsOfService/TermsOfService.component'
import { createLogger } from '../../utils/logger'

const logger = createLogger('TermsOfServiceScreen')

export const TermsOfServiceScreen: FC = () => {
  const dispatch = useDispatch()

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

  return <TermsOfService onAgree={onAgree} onBack={onBack} />
}
