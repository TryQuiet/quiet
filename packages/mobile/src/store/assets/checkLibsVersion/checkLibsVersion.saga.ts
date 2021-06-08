import Config from 'react-native-config';
import { select, put, call, take } from 'typed-redux-saga';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { assetsSelectors } from '../assets.selectors';
import { assetsActions } from '../assets.slice';
import { startDownload } from '../manageDownload/manageDownload.saga';

export function* checkLibsVersionSaga(): Generator {
  const currentVersion = yield select(assetsSelectors.currentLibsVersion);
  if (JSON.stringify(currentVersion) !== JSON.stringify(Config.LIBS_VERSION)) {
    const url = Config.S3 + '.libs';
    yield* put(
      assetsActions.setDownloadHint(
        'Downloading libraries with power to keep you safe',
      ),
    );
    while (true) {
      try {
        yield* call(navigateTo, ScreenNames.SplashScreen);
        yield* startDownload(url, 'libs', Config.LIBS_VERSION, Config.LIBS_MD5);
        yield put(assetsActions.setCurrentLibsVersion(Config.LIBS_VERSION));
        break;
      } catch (e) {
        yield* call(navigateTo, ScreenNames.ErrorScreen, {
          error: (e as Error).message,
        });
        yield take(assetsActions.retryDownload.type);
        break;
      }
    }
  }
}
