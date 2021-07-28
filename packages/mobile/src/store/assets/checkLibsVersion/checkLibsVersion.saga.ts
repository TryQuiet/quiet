import { Dispatch } from 'react';
import Config from 'react-native-config';
import { select, put, fork, call, take } from 'typed-redux-saga';
import { appImages } from '../../../../assets';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { initActions } from '../../init/init.slice';
import { waitForNavigatorSaga } from '../../init/waitForNavigator/waitForNavigator.saga';
import { assetsSelectors } from '../assets.selectors';
import { assetsActions } from '../assets.slice';
import { startDownload } from '../manageDownload/manageDownload.saga';

export function* checkLibsVersionSaga(): Generator {
  const currentVersion = yield select(assetsSelectors.currentLibsVersion);
  if (JSON.stringify(currentVersion) !== JSON.stringify(Config.LIBS_VERSION)) {
    const url = Config.S3 + '.libs';
    yield* put(
      initActions.updateInitDescription(
        'Downloading libraries with power to keep you safe',
      ),
    );
    while (true) {
      try {
        yield* fork(waitForNavigatorSaga);
        yield* startDownload(url, 'libs', Config.LIBS_VERSION, Config.LIBS_MD5);
        yield put(assetsActions.setCurrentLibsVersion(Config.LIBS_VERSION));
        break;
      } catch (e) {
        yield* call(navigateTo, ScreenNames.ErrorScreen, {
          onPress: (dispatch: Dispatch<any>) => {
            dispatch(assetsActions.retryDownload());
          },
          icon: appImages.zbay_icon,
          title: 'Download error',
          message: (e as Error).message,
        });
        yield take(assetsActions.retryDownload.type);
        break;
      }
    }
  }
}
