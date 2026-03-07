import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha'
import { useDispatch, useSelector } from 'react-redux'
import { captcha } from '@quiet/state-manager'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { createLogger } from '../../../utils/logger'
import ModalBottomDrawer from '../ModalBottomDrawer.component'

const logger = createLogger('CaptchaScreen')

type CaptchaStatus = 'idle' | 'loading' | 'presenting' | 'error'

interface HCaptchaMessageEvent {
  nativeEvent: {
    data: string
  }
  success: boolean
  markUsed?: () => void
  reset: () => void
}

export const CaptchaDrawer: FC = () => {
  const dispatch = useDispatch()

  const captchaRef = useRef<ConfirmHcaptcha | null>(null)
  const [status, setStatus] = useState<CaptchaStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const captchaRequested = useSelector(captcha.selectors.captchaRequested)
  const siteKey = useSelector(captcha.selectors.siteKey)

  const visible = useMemo(() => {
    logger.info(`captchaRequested: ${captchaRequested}`)
    logger.info(`siteKey: ${siteKey}`)
    return captchaRequested && siteKey !== ''
  }, [captchaRequested, siteKey])

  useEffect(() => {
    if (!visible) {
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    const presentTimer = setTimeout(() => {
      captchaRef.current?.show()
    }, 100)

    return () => {
      clearTimeout(presentTimer)
      captchaRef.current?.hide()
      setStatus('idle')
      setErrorMessage(null)
    }
  }, [visible])

  const closeScreen = useCallback(
    (logMessage?: string) => {
      if (logMessage) {
        logger.info(logMessage)
      }
      captchaRef.current?.hide()
      dispatch(captcha.actions.captchaFormResponse({ error: 'Captcha screen cancelled by user' }))
    },
    [dispatch]
  )

  const handleSolved = useCallback(
    (token: string) => {
      logger.info('hCaptcha solved successfully')
      captchaRef.current?.hide()
      dispatch(captcha.actions.captchaFormResponse({ token }))
    },
    [closeScreen, dispatch]
  )

  const handleRetry = useCallback(() => {
    logger.info('Retrying hCaptcha challenge')
    setErrorMessage(null)
    setStatus('loading')
    captchaRef.current?.show()
  }, [])

  const handleMessage = useCallback(
    (event: HCaptchaMessageEvent) => {
      const data = event?.nativeEvent?.data
      if (!data) {
        return
      }

      logger.debug('hCaptcha event received', data)

      if (data === 'open') {
        setStatus('presenting')
        setErrorMessage(null)
        return
      }

      if (data === 'challenge-closed' || data === 'cancel') {
        logger.info('hCaptcha challenge closed by user')
        setErrorMessage('Challenge was cancelled.')
        setStatus('error')
        captchaRef.current?.hide()
        return
      }

      if (data === 'challenge-expired') {
        logger.warn('hCaptcha challenge expired')
        setStatus('error')
        setErrorMessage('The challenge expired. Try again.')
        event.reset()
        setTimeout(() => captchaRef.current?.show(), 150)
        return
      }

      if (event.success) {
        event.markUsed?.()
        handleSolved(data)
        return
      }

      logger.error('hCaptcha verification failed', data)
      captchaRef.current?.hide()
      setStatus('error')
      setErrorMessage('Verification failed. Try again.')
    },
    [closeScreen, handleSolved]
  )

  return (
    <>
      <ModalBottomDrawer visible={visible} onClose={closeScreen} heightRatio={1}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Prove you are human</Text>
            <Text style={styles.description}>Complete the challenge to continue.</Text>
            {status === 'loading' && (
              <View style={styles.indicatorRow}>
                <ActivityIndicator color={defaultTheme.palette.background.lushSky} />
                <Text style={styles.secondaryText}>Loading challenge…</Text>
              </View>
            )}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryLabel}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              onPress={() => closeScreen('Captcha screen cancelled via button')}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalBottomDrawer>
      {siteKey !== '' && (
        <ConfirmHcaptcha ref={captchaRef} siteKey={siteKey} onMessage={handleMessage} size={'invisible'} />
      )}
    </>
  )
}

export default CaptchaDrawer

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultTheme.palette.background.white,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: defaultTheme.palette.typography.main,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: defaultTheme.palette.typography.subtitle,
    textAlign: 'center',
    marginBottom: 24,
  },
  indicatorRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  secondaryText: {
    marginTop: 12,
    fontSize: 14,
    color: defaultTheme.palette.typography.gray50,
    textAlign: 'center',
  },
  errorBanner: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: defaultTheme.palette.background.lightPurple,
    borderWidth: 1,
    borderColor: defaultTheme.palette.typography.error,
    marginBottom: 16,
  },
  errorText: {
    color: defaultTheme.palette.typography.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 12,
  },
  retryLabel: {
    color: defaultTheme.palette.main.brand,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelLabel: {
    color: defaultTheme.palette.main.brand,
    fontSize: 16,
    fontWeight: '500',
  },
})
