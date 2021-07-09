import { RouteProp } from '@react-navigation/core';
import { ScreenNames } from './const/ScreenNames.enum';

export type RootStackParamList = {
  [ScreenNames.SplashScreen]: undefined;
  [ScreenNames.MainScreen]: undefined;
  [ScreenNames.RegistrationScreen]: {
    error: string | undefined;
  };
  [ScreenNames.SuccessScreen]: {
    onPress: () => void;
    icon: any;
    title: string;
    message?: string;
  };
  [ScreenNames.ErrorScreen]: {
    error: string;
  };
};

export type RegistrationRouteProp = RouteProp<
  RootStackParamList,
  ScreenNames.RegistrationScreen
>;

export type SuccessRouteProp = RouteProp<
  RootStackParamList,
  ScreenNames.SuccessScreen
>;

export type ErrorRouteProp = RouteProp<
  RootStackParamList,
  ScreenNames.ErrorScreen
>;
