import {StackActions} from '@react-navigation/native';

import {ScreenNames} from '../../../const/ScreenNames.enum';
import {navigationContainerRef} from '../navigateTo/navigateTo';

export const replaceScreen = <Params extends {}>(
  screenName: ScreenNames,
  params?: Params,
): void => {
  navigationContainerRef.current?.dispatch(
    StackActions.replace(screenName, params),
  );
};
