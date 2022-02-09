import React, { FC, useEffect } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { initActions } from '../../store/init/init.slice';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen';

import { communities, identity } from '@zbayapp/nectar';

import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component';

export const JoinCommunityScreen: FC = () => {
  const dispatch = useDispatch();

  const currentIdentity = useSelector(identity.selectors.currentIdentity);

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.JoinCommunityScreen));
  });

  const joinCommunity = (link: string) => {
    dispatch(communities.actions.joinCommunity(link));
  };

  useEffect(() => {
    if (currentIdentity !== undefined) {
      replaceScreen(ScreenNames.RegistrationScreen);
    }
  }, [currentIdentity]);

  return (
    <View style={{ flex: 1 }}>
      <JoinCommunity joinCommunityAction={joinCommunity} />
    </View>
  );
};
