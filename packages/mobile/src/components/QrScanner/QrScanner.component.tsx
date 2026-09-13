import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import {
  Camera,
  type CameraRuntimeError,
  type Code,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera'

import { createLogger } from '../../utils/logger'
import { parseScannedCode } from './parseScannedCode'
import { QrScannerSheet } from './QrScannerSheet.component'
import type { QrScannerProps, QrScannerStatus } from './QrScanner.types'

const logger = createLogger('qrScanner')

/**
 * The scanner sheets with a live camera: asks for the camera, decodes QR codes
 * natively (VisionCamera's code scanner) and hands a Quiet invitation, parsed
 * exactly as a pasted link, to `onDecoded` once. A code that is not a Quiet
 * invitation shows the paste field's error and scanning continues.
 */
export const QrScanner: FC<QrScannerProps> = ({
  title,
  intro,
  onDecoded,
  onClose,
  onUsePasteLink,
  testID = 'qr-scanner',
}) => {
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')
  const [status, setStatus] = useState<QrScannerStatus>(hasPermission ? 'scanning' : 'requesting')
  const [invalid, setInvalid] = useState(false)
  const statusRef = useRef(status)
  statusRef.current = status
  const lastText = useRef<string | null>(null)

  useEffect(() => {
    if (hasPermission) {
      // Granted now, or later in the system settings (the hook re-checks on foreground).
      setStatus(current => (current === 'requesting' || current === 'denied' ? 'scanning' : current))
      return
    }
    let cancelled = false
    setStatus('requesting')
    requestPermission()
      .then(granted => {
        if (!cancelled) setStatus(granted ? 'scanning' : 'denied')
      })
      .catch(error => {
        logger.warn('Camera permission request failed', error)
        if (!cancelled) setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [hasPermission, requestPermission])

  const onError = useCallback((error: CameraRuntimeError) => {
    logger.warn(`Camera unavailable: ${error.code}`, error.message)
    setStatus(current => (current === 'stopped' ? current : 'unavailable'))
  }, [])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => {
      if (statusRef.current !== 'scanning') return
      const text = codes.find(code => code.value)?.value
      if (text === undefined || text === lastText.current) return
      lastText.current = text
      const data = parseScannedCode(text)
      if (!data) {
        setInvalid(true)
        return
      }
      setInvalid(false)
      setStatus('stopped')
      onDecoded(data)
    },
  })

  const shown: QrScannerStatus = status === 'scanning' && !device ? 'unavailable' : status
  const camera =
    device && (status === 'scanning' || status === 'stopped') ? (
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={status === 'scanning'}
        codeScanner={codeScanner}
        onError={onError}
        testID={`${testID}-camera`}
      />
    ) : null

  return (
    <QrScannerSheet
      title={title}
      intro={intro}
      status={shown}
      invalid={invalid}
      camera={camera}
      onClose={onClose}
      onUsePasteLink={onUsePasteLink}
      testID={testID}
    />
  )
}
