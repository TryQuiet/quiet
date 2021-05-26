import React, {FC, useEffect} from 'react';
import {Text, ScrollView} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {publicChannelsSelectors} from '../../store/publicChannels/publicChannels.selectors';
import {publicChannelsActions} from '../../store/publicChannels/publicChannels.slice';
import {IChannelInfo} from '../../store/publicChannels/publicChannels.types';

export const MainScreen: FC = () => {
  const channels = useSelector(publicChannelsSelectors.publicChannels);
  const messages = useSelector(publicChannelsSelectors.currentChannelMessages);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(publicChannelsActions.getPublicChannels());
  }, [dispatch]);

  useEffect(() => {
    let Zbay: IChannelInfo | null = null;
    for (var i = 0; i < channels.length; i++) {
      if (
        channels[i].address ===
        'zs10zkaj29rcev9qd5xeuzck4ly5q64kzf6m6h9nfajwcvm8m2vnjmvtqgr0mzfjywswwkwke68t00'
      ) {
        Zbay = channels[i];
        break;
      }
    }
    if (Zbay !== null) {
      dispatch(publicChannelsActions.subscribeForTopic(Zbay));
      dispatch(publicChannelsActions.setCurrentChannelAddress(Zbay.address));
      dispatch(publicChannelsActions.fetchAllMessages(Zbay.address));
    }
  }, [dispatch, channels]);

  return (
    <ScrollView>
      {messages.map(message => (
        <Text key={message.id}>{message.message}</Text>
      ))}
    </ScrollView>
  );
};
