import React, { FC } from 'react';
import { Image, View } from 'react-native';
import { appImages } from '../../../assets';
import { Typography } from '../Typography/Typography.component';
import { DisplayableMessageProps } from './Message.types';

export const Message: FC<DisplayableMessageProps> = ({
  message,
  nickname,
  datetime,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
      }}>
      <View style={{ alignItems: 'center', flex: 1, paddingTop: 5 }}>
        <Image
          source={appImages.avatar}
          style={{
            resizeMode: 'cover',
            width: 32,
            height: 32,
            borderRadius: 5,
          }}
        />
      </View>
      <View style={{ flex: 5 }}>
        <View style={{ flexDirection: 'row', paddingBottom: 3 }}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Typography fontSize={16} fontWeight={'medium'}>
              {nickname}
            </Typography>
          </View>
          <View
            style={{ alignSelf: 'flex-start', paddingTop: 2, paddingLeft: 8 }}>
            <Typography fontSize={14} color={'subtitle'}>
              {datetime}
            </Typography>
          </View>
        </View>
        <Typography fontSize={14}>{message.message}</Typography>
      </View>
    </View>
  );
};
