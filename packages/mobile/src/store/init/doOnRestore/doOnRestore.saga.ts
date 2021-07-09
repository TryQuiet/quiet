import { select, call } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { initSelectors } from '../init.selectors';

export function* doOnRestoreSaga(): Generator {
  const currentScreen = yield* select(initSelectors.currentScreen);
  if (currentScreen !== ScreenNames.SplashScreen) {
    yield* call(replaceScreen, currentScreen, {});
  }
}
