import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initSelectors } from '../../store/init/init.selectors'
import { initActions } from '../../store/init/init.slice'
import { SplashScreenProps } from './Splash.types'
import { Loading } from '../../components/Loading/Loading.component'

export const SplashScreen: FC<SplashScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const hint = useSelector(initSelectors.initDescription)
  const checks = useSelector(initSelectors.initChecks)

  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    dispatch(initActions.deepLink(code))
  }, [route.params?.code])

  return <Loading progress={0} description={hint} checks={checks} />
}
