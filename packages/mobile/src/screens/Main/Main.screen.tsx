import React, { FC, useEffect } from 'react';
import { View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Chat } from '../../components/Chat/Chat.component';
import { publicChannelsSelectors } from '../../store/publicChannels/publicChannels.selectors';
import { publicChannelsActions } from '../../store/publicChannels/publicChannels.slice';

export const MainScreen: FC = () => {
  const dispatch = useDispatch();

  const ZbayChannel = useSelector(publicChannelsSelectors.ZbayChannel);

  const displayableMessages = useSelector(
    publicChannelsSelectors.formattedChannelMessages,
  );

  useEffect(() => {
    if (ZbayChannel !== undefined) {
      dispatch(publicChannelsActions.subscribeForTopic(ZbayChannel));
      dispatch(
        publicChannelsActions.setCurrentChannelAddress(ZbayChannel.address),
      );
      dispatch(publicChannelsActions.fetchAllMessages(ZbayChannel.address));
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
          messages={displayableMessages}
          user={'holmes'}
        />
      )}
    </View>
  );
};
