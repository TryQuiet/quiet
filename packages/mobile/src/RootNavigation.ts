import { NavigationContainerRef, StackActions } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'

export type ResolvablePromise<T> = { promise: Promise<T>, resolve: (arg: T) => void }

function resolvablePromise<T>(): ResolvablePromise<T> {
  let resolve
  const promise = new Promise<T>((res) => {
    resolve = res
  });
  return { promise, resolve }
}

export const navigationContainer = resolvablePromise<NavigationContainerRef>()

export const navigate = <Params extends {}>(
  screen: ScreenNames,
  params?: Params
): void => {
  navigationContainer.promise.then(navigator => navigator.navigate(
    screen, params
  ))
}

export const replaceScreen = <Params extends {}>(
  screen: ScreenNames,
  params?: Params
): void => {
  console.log(`replace screen method ${screen}`)
  navigationContainer.promise.then((navigator) => {
    console.log(`resolving navigator promise ${screen}`)
    return navigator.dispatch(
    StackActions.replace(screen, params)
  )})
}
