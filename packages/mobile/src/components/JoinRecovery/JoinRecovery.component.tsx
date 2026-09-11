import React, { FC, PropsWithChildren } from 'react'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import { initActions } from '../../store/init/init.slice'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

/** Keep interrupted onboarding visible while the socket-owned sagas recover. */
export const JoinRecovery: FC<PropsWithChildren> = ({ children }) => {
  const dispatch = useDispatch()
  const pendingJoin = useSelector(communities.selectors.pendingJoin)
  const connected = useSelector(initSelectors.isWebsocketConnected)
  const uncertain = pendingJoin?.status !== 'draft'

  if (!pendingJoin || (connected && pendingJoin.status !== 'interrupted')) return <>{children}</>

  const cancel = () => {
    // Only drafts can be canceled locally: no request has touched backend state.
    if (pendingJoin.status !== 'draft') return
    dispatch(communities.actions.clearInvitationCodes())
    dispatch(navigationActions.replaceScreen({ screen: ScreenNames.GetStartedScreen }))
  }

  return (
    <View
      testID='join-recovery'
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        gap: 20,
        backgroundColor: defaultTheme.palette.background.white,
      }}
    >
      <Typography fontSize={24} fontWeight='medium'>
        {uncertain ? 'Joining was interrupted' : 'Joining paused'}
      </Typography>
      <Typography fontSize={14}>
        {uncertain
          ? 'Quiet lost its connection after your details were submitted. Close and reopen Quiet to check whether joining completed before trying again.'
          : 'Quiet needs to reconnect before joining can continue. Your invitation and submitted details are kept for this attempt.'}
      </Typography>
      {!uncertain && (
        <>
          <Button title='Try reconnecting' onPress={() => dispatch(initActions.resumeWebsocketConnection())} />
          <Button title='Cancel joining' onPress={cancel} negative />
        </>
      )}
    </View>
  )
}
