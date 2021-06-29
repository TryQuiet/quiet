import React, { FC, useEffect } from 'react';
import { View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Chat } from '../../components/Chat/Chat.component';
import { publicChannelsSelectors } from '../../store/publicChannels/publicChannels.selectors';
import { publicChannelsActions } from '../../store/publicChannels/publicChannels.slice';

export const MainScreen: FC = () => {
  const dispatch = useDispatch();

  const ZbayChannel = useSelector(publicChannelsSelectors.ZbayChannel);

  const messages = useSelector(
    publicChannelsSelectors.currentChannelDisplayableMessages,
  );

  useEffect(() => {
    if (ZbayChannel !== undefined) {
      dispatch(publicChannelsActions.setCurrentChannel(ZbayChannel.address));
      dispatch(publicChannelsActions.subscribeForTopic(ZbayChannel));
    }
  }, [dispatch, ZbayChannel]);

  return (
    <View style={{ flex: 1 }}>
      {ZbayChannel !== undefined && (
        <Chat
          sendMessageAction={() => {
            console.log('Message sent');
          }}
          channel={ZbayChannel}
          messages={messages}
          user={'holmes'}
        />
      )}
    </View>
  );
};
