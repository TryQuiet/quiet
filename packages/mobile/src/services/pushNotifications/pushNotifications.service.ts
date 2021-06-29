import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { Socket, io } from 'socket.io-client';
import { SocketActionTypes } from '../../store/socket/const/actionTypes';
import {
  AskForMessagesResponse,
  ChannelMessages,
  ChannelMessagesIdsResponse,
} from '../../store/publicChannels/publicChannels.slice';
import { IMessage } from '../../store/publicChannels/publicChannels.types';
import config from '../../store/socket/config';

const notificationChannelId = 'zbay-incoming-notifications';
const notificationId = Math.floor(Math.random() * 10 ** 6);

export const createLocalNotification = (message: IMessage) => {
  PushNotification.localNotification({
    autoCancel: true,
    channelId: notificationChannelId,
    id: notificationId,
    title: 'Zbay',
    message: message.message,
  });
};

export const useNotifications = (): void => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      return;
    }
    PushNotification.createChannel(
      {
        channelName: 'Incoming messages',
        channelDescription: 'Categorise incoming messages notifications',
        channelId: notificationChannelId,
        importance: 4,
        playSound: false,
        soundName: 'default',
        vibrate: true,
      },
      () => null,
    );
  }, []);
};

export const pushNotifications = async (
  persistentData: ChannelMessages,
): Promise<void> => {
  const socket = await connect();

  let channelMessages = persistentData;

  socket.on(
    SocketActionTypes.SEND_MESSAGES_IDS,
    (payload: ChannelMessagesIdsResponse) => {
      storeIncomingMessagesIds(payload);
      checkMissingChannelMessages(payload);
    },
  );

  socket.on(
    SocketActionTypes.RESPONSE_ASK_FOR_MESSAGES,
    (payload: AskForMessagesResponse) => {
      if (AppState.currentState !== 'active') {
        const message = payload.messages[0];
        createLocalNotification(message);
      }
    },
  );

  const storeIncomingMessagesIds = (payload: ChannelMessagesIdsResponse) => {
    const channelAddress = payload.channelAddress;
    if (channelAddress in channelMessages) {
      channelMessages[channelAddress].ids = payload.ids;
    } else {
      channelMessages[channelAddress] = {
        ids: payload.ids,
        messages: {},
      };
    }
  };

  const checkMissingChannelMessages = (payload: ChannelMessagesIdsResponse) => {
    const channel = channelMessages[payload.channelAddress];
    const missingMessages = channel.ids.filter(id => !(id in channel.messages));
    if (missingMessages.length > 0) {
      askForMessages(missingMessages);
    }
  };

  const askForMessages = (missingMessages: string[]) => {
    socket.emit(SocketActionTypes.ASK_FOR_MESSAGES, missingMessages);
  };

  return new Promise(() => null);
};

export const connect = async (): Promise<Socket> => {
  const socket = io(config.socket.address);
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      resolve(socket);
    });
  });
};
