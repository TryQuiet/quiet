import React, { FC, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View, BackHandler } from 'react-native'
import { initActions } from '../../store/init/init.slice'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { Chat } from '../../components/Chat/Chat.component'

import { identity, messages, publicChannels } from '@quiet/state-manager'

export const ChannelScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.ChannelScreen))
  })

  const handleBackButtonClick = () => {
    replaceScreen(ScreenNames.ChannelListScreen)
    return true
  }

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick)
    }
  }, [])

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const currentChannel = useSelector(publicChannels.selectors.currentChannel)

  const channelMessagesCount = useSelector(publicChannels.selectors.currentChannelMessagesCount)

  const channelMessages = useSelector(publicChannels.selectors.currentChannelMessagesMergedBySender)

  const sendMessageAction = useCallback(
    (message: string) => {
      dispatch(messages.actions.sendMessage({ message }))
    },
    [dispatch]
  )

  const loadMessages = useCallback(
    (load: boolean) => {
      dispatch(messages.actions.lazyLoading({load}))
    },
    [dispatch]
  )

  return (
    <View style={{ flex: 1 }}>
      {currentChannel && (
        <Chat
          sendMessageAction={sendMessageAction}
          loadMessagesAction={loadMessages}
          channel={currentChannel}
          user={currentIdentity.nickname}
          messages={{
            count: channelMessagesCount,
            groups: channelMessages
          }}
        />
      )}
    </View>
  )
}
