import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha'
import { useDispatch } from 'react-redux'
import { useIsFocused, useRoute } from '@react-navigation/native'
import { CaptchaRouteProps } from '../../route.params'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { communities } from '@quiet/state-manager'
import { defaultTheme } from '../../styles/themes/default.theme'
import { createLogger } from '../../utils/logger'
import Config from 'react-native-config'

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

export const CaptchaScreen: FC = () => {
  const dispatch = useDispatch()
  const route = useRoute<CaptchaRouteProps>()
  const isFocused = useIsFocused()

  const captchaRef = useRef<ConfirmHcaptcha | null>(null)
  const [status, setStatus] = useState<CaptchaStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const siteKey = Config.HCAPTCHA_SITEKEY ?? '10000000-ffff-ffff-ffff-000000000001'
  const reason = route.params?.reason ?? 'verification'

  const copy = useMemo(() => {
    switch (reason) {
      case 'create-community':
        return {
          title: 'Verify before creating',
          description: 'Complete the challenge so we can create your community.',
        }
      case 'sign-in':
        return {
          title: 'Verify your identity',
          description: 'Complete the challenge to continue signing in.',
        }
      default:
        return {
          title: 'Prove you are human',
          description: 'Complete the challenge to continue.',
        }
    }
  }, [reason])

  useEffect(() => {
    if (!isFocused) {
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
  }, [isFocused])

  const closeScreen = useCallback(
    (logMessage?: string) => {
      if (logMessage) {
        logger.info(logMessage)
      }
      captchaRef.current?.hide()
      dispatch(navigationActions.pop())
    },
    [dispatch]
  )

  const handleSolved = useCallback(
    (token: string) => {
      logger.info('hCaptcha solved successfully')
      captchaRef.current?.hide()
      dispatch(communities.actions.hcaptchaTokenReceived({ token }))
      closeScreen()
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
        closeScreen('User cancelled hCaptcha challenge')
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

  logger.info('Rendering CaptchaScreen for siteKey ' + siteKey)

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.description}>{copy.description}</Text>
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
      <ConfirmHcaptcha
        ref={captchaRef}
        siteKey={siteKey}
        onMessage={handleMessage}
        languageCode={route.params?.languageCode}
        passiveSiteKey={false}
        size={'normal'}
      />
    </View>
  )
}

export default CaptchaScreen

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
