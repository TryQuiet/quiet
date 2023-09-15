import React, { FC, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { initActions } from '../../store/init/init.slice'
import { SplashScreenProps } from './Splash.types'
import { Loading } from '../../components/Loading/Loading.component'

export const SplashScreen: FC<SplashScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const code = route.params?.code

    // Screen hasn't been open through a link
    if (!code) return

    dispatch(initActions.deepLink(code))
  }, [route.params?.code])

  return <Loading />
}
