import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler } from 'react-native'
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha'
import { useDispatch, useSelector } from 'react-redux'
import { captcha } from '@quiet/state-manager'
import { defaultTheme } from '../../styles/themes/default.theme'
import { createLogger } from '../../utils/logger'

const logger = createLogger('CaptchaModal')

interface HCaptchaMessageEvent {
  nativeEvent: { data: string }
  success: boolean
  markUsed?: () => void
  reset: () => void
}

const SHOW_DELAY_MS = 100

// Polyfill: react-native-modal@13 (bundled inside @hcaptcha/react-native-hcaptcha)
// calls BackHandler.removeEventListener which was removed in RN 0.72+. Its
// absence crashes the modal on hide. Install a no-op shim if missing.
// (addEventListener still returns a subscription with .remove() so leak is minor.)
const bhMut = BackHandler as unknown as { removeEventListener?: (...args: unknown[]) => boolean }
if (typeof bhMut.removeEventListener !== 'function') {
  bhMut.removeEventListener = () => true
}

export const CaptchaModal: FC = () => {
  const dispatch = useDispatch()
  const captchaRef = useRef<ConfirmHcaptcha | null>(null)
  // Guard against the library's hide()/onMessage emitting repeated cancels
  // after we've already dispatched a terminal response for this session.
  const respondedRef = useRef(false)

  const captchaRequested = useSelector(captcha.selectors.captchaRequested)
  const siteKey = useSelector(captcha.selectors.siteKey)

  // Latch the first non-empty siteKey so the native modal stays mounted
  // across community-leave flows that wipe redux state. Unmounting the
  // library's RN modal mid-presentation crashes iOS WebView.
  const [mountedSiteKey, setMountedSiteKey] = useState('')
  useEffect(() => {
    if (siteKey && siteKey !== mountedSiteKey) {
      setMountedSiteKey(siteKey)
    }
  }, [siteKey, mountedSiteKey])

  useEffect(() => {
    if (!mountedSiteKey) return
    if (captchaRequested && siteKey !== '') {
      logger.info(`Showing captcha for ${siteKey}`)
      respondedRef.current = false
      const id = setTimeout(() => captchaRef.current?.show(), SHOW_DELAY_MS)
      return () => clearTimeout(id)
    }
    // Pass no argument: the library synthesizes an onMessage({data:'cancel'})
    // when hide() is called with a truthy source, which would re-enter our
    // handler and loop.
    captchaRef.current?.hide()
    return undefined
  }, [captchaRequested, siteKey, mountedSiteKey])

  const respond = useCallback(
    (payload: Parameters<typeof captcha.actions.captchaFormResponse>[0]) => {
      if (respondedRef.current) return
      respondedRef.current = true
      dispatch(captcha.actions.captchaFormResponse(payload))
    },
    [dispatch]
  )

  const handleMessage = useCallback(
    (event: HCaptchaMessageEvent) => {
      const data = event?.nativeEvent?.data
      if (!data) return
      if (respondedRef.current) return

      if (data === 'open') return

      if (data === 'cancel' || data === 'challenge-closed') {
        logger.info('hCaptcha cancelled')
        respond({ error: 'Captcha cancelled by user' })
        captchaRef.current?.hide()
        return
      }

      if (data === 'challenge-expired' || data === 'expired') {
        logger.warn('hCaptcha expired, resetting')
        event.reset?.()
        return
      }

      if (event.success) {
        event.markUsed?.()
        logger.info('hCaptcha solved')
        respond({ token: data })
        captchaRef.current?.hide()
        return
      }

      logger.error('hCaptcha verification failed', data)
      respond({ error: `Captcha error: ${data}` })
      captchaRef.current?.hide()
    },
    [respond]
  )

  if (mountedSiteKey === '') return null

  return (
    <ConfirmHcaptcha
      ref={captchaRef}
      siteKey={mountedSiteKey}
      onMessage={handleMessage}
      size='invisible'
      orientation='portrait'
      languageCode='en'
      showLoading
      loadingIndicatorColor={defaultTheme.palette.background.lushSky}
    />
  )
}

export default CaptchaModal
