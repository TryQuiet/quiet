import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from '../../components/Loading/Loading.component';
import { initSelectors } from '../../store/init/init.selectors';

export const SplashScreen: FC = () => {
  const hint = useSelector(initSelectors.initDescription);
  const checks = useSelector(initSelectors.initChecks);
  return (
    <Loading progress={0} description={hint} checks={checks} />
  );
};
