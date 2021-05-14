import {NavigationContainerRef} from '@react-navigation/native';
import {createRef} from 'react';

import {ScreenNames} from '../../../const/ScreenNames.enum';

export const navigationContainerRef = createRef<NavigationContainerRef>();

export const navigateTo = <Params extends {}>(
  screenName: ScreenNames,
  params?: Params,
): void => {
  navigationContainerRef.current?.navigate(screenName, params);
};
