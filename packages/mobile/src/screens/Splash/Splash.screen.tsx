import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initSelectors } from '../../store/init/init.selectors'
import { initActions } from '../../store/init/init.slice'
import { SplashScreenProps } from './Splash.types'
import { Splash } from '../../components/Splash/Splash.component'
import { createLogger } from '../../utils/logger'

const logger = createLogger('splash:screen')

export const SplashScreen: FC<SplashScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const ready = useSelector(initSelectors.ready)

  useEffect(() => {
    let code = route.path

    // Screen hasn't been open through a link
    if (!code) {
      logger.info('INIT_NAVIGATION: Skipping deep link flow.')
      return
    }

    if (code.charAt(0) === '?') {
      code = code.slice(1, code.length)
    }

    if (ready) {
      logger.info('INIT_NAVIGATION: Starting deep link flow.')
      dispatch(initActions.deepLink(code))
    }
  }, [ready, route.path])

  return <Splash />
}
