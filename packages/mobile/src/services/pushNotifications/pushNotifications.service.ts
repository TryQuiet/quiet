import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';
import config from '../../store/socket/config';
import { SocketActionTypes } from '../../store/socket/const/actionTypes';
import { IMessage } from '../../store/publicChannels/publicChannels.types';
import PushNotification from 'react-native-push-notification';
import { AppState } from 'react-native';

const notificationChannelId = 'zbay-incoming-notifications';

export const useNotifications = (): void => {
  useEffect(() => {
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

export const pushNotifications = async (): Promise<void> => {
  const socket = await connect();

  let waiting = false;

  socket.on(
    SocketActionTypes.RESPONSE_FETCH_ALL_MESSAGES,
    (payload: { channelAddress: string; messages: IMessage[] }) => {
      if (AppState.currentState !== 'active') {
        if (!waiting) {
          const message = getIncomingMessage(payload.messages);
          createLocalNotification(message);
          waiting = true;
          setInterval(() => {
            waiting = false;
          }, 1500);
        }
      }
    },
  );

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

export const getIncomingMessage = (payload: IMessage[]) => {
  const messages: IMessage[] = payload.sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  const message: IMessage = messages[0];
  return message;
};

export const createLocalNotification = (message: IMessage) => {
  const notificationId = Math.floor(Math.random() * 10 ** 6);
  PushNotification.localNotification({
    autoCancel: true,
    channelId: notificationChannelId,
    id: notificationId,
    title: 'Zbay',
    message: message.message,
  });
};
