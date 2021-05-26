import React, {FC, useEffect} from 'react';
import {View, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {ScreenNames} from '../../const/ScreenNames.enum';
import {storageSelectors} from '../../store/storage/storage.selectors';
import {navigateTo} from '../../utils/functions/navigateTo/navigateTo';

export const SplashScreen: FC = () => {
  const isStorageInitialized = useSelector(
    storageSelectors.isStorageInitialized,
  );

  useEffect(() => {
    if (isStorageInitialized) {
      navigateTo(ScreenNames.MainScreen);
    }
  }, [isStorageInitialized]);

  return (
    <View>
      <Text>{'SplashScreen'}</Text>
    </View>
  );
};
