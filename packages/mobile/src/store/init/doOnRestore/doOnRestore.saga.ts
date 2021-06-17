import { select, call } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { initSelectors } from '../init.selectors';

export function* doOnRestoreSaga(): Generator {
  const isRestored = yield* select(initSelectors.isRestored);
  if (isRestored) {
    yield* call(replaceScreen, ScreenNames.MainScreen);
  }
}
