import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initSelectors } from '../../store/init/init.selectors'
import { initActions } from '../../store/init/init.slice'
import { SplashScreenProps } from './Splash.types'
import { Splash } from '../../components/Splash/Splash.component'

export const SplashScreen: FC<SplashScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const ready = useSelector(initSelectors.ready)

  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    if (ready) {
      dispatch(initActions.deepLink(code))
    }
  }, [ready, route.params?.code])

  return <Splash />
}
