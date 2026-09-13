import { useEffect, useRef, useState } from 'react'

import { requestCameraAccess } from '../../../camera'
import { createLogger } from '../../../logger'
import { decodeQrImage } from './decodeQr'

const logger = createLogger('qrScanner')

export type QrScannerStatus =
  /** Waiting for the OS / Chromium permission and the stream. */
  | 'requesting'
  /** Frames are being decoded. */
  | 'scanning'
  /** The user (or the OS) refused the camera. */
  | 'denied'
  /** No camera, or the camera cannot be opened. */
  | 'unavailable'
  /** A code was accepted and the camera released. */
  | 'stopped'

export interface UseQrScannerOptions {
  /** Called once per newly seen code; return true to accept it and stop the camera. */
  onCode: (text: string) => boolean
  /** Decode cadence; 100ms ≈ 10 fps keeps the renderer responsive. */
  intervalMs?: number
}

const HAVE_CURRENT_DATA = 2

const statusForError = (error: unknown): QrScannerStatus => {
  const name = (error as { name?: string } | null)?.name
  return name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError'
    ? 'denied'
    : 'unavailable'
}

/**
 * Opens the camera into the returned <video>, decodes a frame every `intervalMs` and
 * releases the stream when a code is accepted or the component unmounts.
 */
export const useQrScanner = ({ onCode, intervalMs = 100 }: UseQrScannerOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<QrScannerStatus>('requesting')
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setInterval> | undefined
    let canvas: HTMLCanvasElement | null = null
    let lastText: string | null = null

    /** Stop decoding and the camera (the element keeps its ended stream until unmount). */
    const release = () => {
      if (timer) clearInterval(timer)
      timer = undefined
      stream?.getTracks().forEach(track => track.stop())
      stream = null
    }

    const decodeFrame = () => {
      const video = videoRef.current
      if (!video || video.readyState < HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return
      canvas = canvas ?? document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const text = decodeQrImage(context.getImageData(0, 0, canvas.width, canvas.height))
      if (text === null || text === lastText) return
      lastText = text
      if (onCodeRef.current(text)) {
        release()
        if (!cancelled) setStatus('stopped')
      }
    }

    const start = async () => {
      const access = await requestCameraAccess()
      if (cancelled) return
      if (access.status === 'denied') {
        setStatus('denied')
        return
      }
      const mediaDevices = navigator.mediaDevices
      if (!mediaDevices?.getUserMedia) {
        setStatus('unavailable')
        return
      }
      try {
        stream = await mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      } catch (error) {
        logger.warn('Camera unavailable', error)
        if (!cancelled) setStatus(statusForError(error))
        return
      }
      if (cancelled || !videoRef.current) {
        release()
        return
      }
      videoRef.current.srcObject = stream
      try {
        await videoRef.current.play()
      } catch (error) {
        logger.warn('Camera preview did not start', error)
      }
      if (cancelled) {
        release()
        return
      }
      setStatus('scanning')
      timer = setInterval(decodeFrame, intervalMs)
    }

    void start()
    return () => {
      cancelled = true
      release()
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [intervalMs])

  return { videoRef, status }
}
