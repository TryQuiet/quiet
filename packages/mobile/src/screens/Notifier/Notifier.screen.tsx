import React, { FC, useCallback } from 'react'
import { Linking } from 'react-native'
import { Notifier } from '../../components/Notifier/Notifier.component'
import { appImages } from '../../assets'
import { useDispatch } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'

export const NotifierScreen: FC = () => {
  const dispatch = useDispatch()

  const redirection = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const helpline = useCallback(async () => {
    const link = 'mailto:help@quiet.chat'
    await Linking.openURL(link);
  }, [])

  return (
    <Notifier
      onButtonPress={redirection}
      onEmailPress={helpline}
      icon={appImages.update_graphics}
      title={'Coming update will remove communities & messages'}
      message={
        'Quiet’s next release makes joining communities faster and more reliable by letting people join when the owner is offline! However, these changes required us to reset all communities, and both communities and messages will be lost on mobile. We apologize for the inconvenience, and please reach out immediately if you need help backing up messages.'
      }
    />
  )
}
