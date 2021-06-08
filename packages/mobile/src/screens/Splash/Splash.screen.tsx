import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../components/Loading/Loading.component';
import { assetsSelectors } from '../../store/assets/assets.selectors';

export const SplashScreen: FC = () => {
  const hint = useSelector(assetsSelectors.downloadHint);
  const progress = useSelector(assetsSelectors.downloadProgress);

  return <Loading progress={progress / 100} description={hint} />;
};
