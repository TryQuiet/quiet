import React, {FC, useEffect} from 'react';
import {Text, ScrollView} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {publicChannelsSelectors} from '../../store/publicChannels/publicChannels.selectors';
import {publicChannelsActions} from '../../store/publicChannels/publicChannels.slice';

export const MainScreen: FC = () => {
  const messages = useSelector(publicChannelsSelectors.currentChannelMessages);
  const dispatch = useDispatch();

  const ZbayChannel = useSelector(publicChannelsSelectors.ZbayChannel);

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
    <ScrollView>
      {messages.map(message => (
        <Text key={message.id}>{message.message}</Text>
      ))}
    </ScrollView>
  );
};
