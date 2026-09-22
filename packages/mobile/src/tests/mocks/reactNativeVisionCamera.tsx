/* eslint-disable */
import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

/**
 * Stands in for react-native-vision-camera in jest (wired in setupTests.tsx).
 * Tests turn these knobs before rendering; the Camera is a plain view carrying
 * every prop, so a test drives `codeScanner.onCodeScanned` and `onError` from
 * `getByTestId(...).props`.
 */
export const visionCameraMock = {
  hasPermission: true,
  /** What requestPermission resolves with (and sets hasPermission to). */
  grant: true,
  device: { id: 'back', position: 'back' } as { id: string; position: string } | undefined,
}

export const resetVisionCameraMock = (): void => {
  visionCameraMock.hasPermission = true
  visionCameraMock.grant = true
  visionCameraMock.device = { id: 'back', position: 'back' }
}

export const useCameraPermission = () => {
  const [hasPermission, setHasPermission] = useState(visionCameraMock.hasPermission)
  const requestPermission = useCallback(async () => {
    // The OS prompt answers asynchronously; settle after the current render like the native module does.
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    setHasPermission(visionCameraMock.grant)
    return visionCameraMock.grant
  }, [])
  return { hasPermission, requestPermission }
}

export const useCameraDevice = () => visionCameraMock.device

export const useCodeScanner = <T,>(scanner: T): T => scanner

export const Camera = (props: Record<string, unknown>) => <View {...props} />
