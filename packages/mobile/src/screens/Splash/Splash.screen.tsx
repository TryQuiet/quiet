import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../components/Loading/Loading.component';
import { assetsSelectors } from '../../store/assets/assets.selectors';
import { initSelectors } from '../../store/init/init.selectors';

export const SplashScreen: FC = () => {
  const progress = useSelector(assetsSelectors.downloadProgress);
  const hint = useSelector(initSelectors.initDescription);
  const checks = useSelector(initSelectors.initChecks);
  return (
    <Loading progress={progress / 100} description={hint} checks={checks} />
  );
};
