import { call, delay, select } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { waitForNavigatorDelay } from '../../publicChannels/const/delays';
import { initSelectors } from '../init.selectors';

export function* waitForNavigatorSaga(): Generator {
  while (true) {
    const isNavigatorReady = yield* select(initSelectors.isNavigatorReady);
    if (isNavigatorReady) {
      yield* call(navigateTo, ScreenNames.SplashScreen);
      break;
    }
    yield* delay(waitForNavigatorDelay);
  }
}
