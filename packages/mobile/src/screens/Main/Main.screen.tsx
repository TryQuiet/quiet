import React, { FC, useEffect } from 'react';
import { View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Chat } from '../../components/Chat/Chat.component';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { identitySelectors } from '../../store/identity/identity.selectors';
import { initActions } from '../../store/init/init.slice';
import { messagesActions } from '../../store/messages/messages.slice';
import { publicChannelsSelectors } from '../../store/publicChannels/publicChannels.selectors';
import { publicChannelsActions } from '../../store/publicChannels/publicChannels.slice';

export const MainScreen: FC = () => {
  const dispatch = useDispatch();

  const ZbayChannel = useSelector(publicChannelsSelectors.ZbayChannel);

  const messages = useSelector(
    publicChannelsSelectors.currentChannelDisplayableMessages,
  );

  const username = useSelector(identitySelectors.zbayNickname);

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.MainScreen));
  });

  useEffect(() => {
    if (ZbayChannel !== undefined) {
      dispatch(publicChannelsActions.setCurrentChannel(ZbayChannel.address));
      dispatch(publicChannelsActions.subscribeForTopic(ZbayChannel));
    }
  }, [dispatch, ZbayChannel]);

  const sendMessage = (message: string) => {
    dispatch(messagesActions.sendMessage(message));
  };

  return (
    <View style={{ flex: 1 }}>
      {ZbayChannel !== undefined && (
        <Chat
          sendMessageAction={sendMessage}
          channel={ZbayChannel}
          messages={messages}
          user={username}
        />
      )}
    </View>
  );
};
