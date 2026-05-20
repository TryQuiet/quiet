import React from 'react'
import { render, act } from '@testing-library/react-native'
import { useDispatch, useSelector } from 'react-redux'
import { captcha } from '@quiet/state-manager'
import CaptchaModal from './CaptchaModal.component'

let mockCaptchaState = {
  captchaRequested: true,
  siteKey: 'test-site-key',
}

const mockDispatch = jest.fn()
const mockShow = jest.fn()
const mockHide = jest.fn()
let latestOnMessage: ((event: unknown) => void) | null = null

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock('@quiet/state-manager', () => ({
  captcha: {
    selectors: {
      captchaRequested: (state: typeof mockCaptchaState) => state.captchaRequested,
      siteKey: (state: typeof mockCaptchaState) => state.siteKey,
    },
    actions: {
      captchaFormResponse: (payload: unknown) => ({ type: 'captcha/captchaFormResponse', payload }),
    },
  },
}))

jest.mock('@hcaptcha/react-native-hcaptcha', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: React.forwardRef(({ onMessage, siteKey }: any, ref: any) => {
      latestOnMessage = onMessage
      React.useImperativeHandle(ref, () => ({ show: mockShow, hide: mockHide }))
      return <View testID='mock-hcaptcha' accessibilityLabel={siteKey} />
    }),
  }
})

describe('CaptchaModal', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockCaptchaState = { captchaRequested: true, siteKey: 'test-site-key' }
    mockDispatch.mockClear()
    mockShow.mockClear()
    mockHide.mockClear()
    latestOnMessage = null
    ;(useDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useSelector as jest.Mock).mockImplementation(selector => selector(mockCaptchaState))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('mounts ConfirmHcaptcha and calls show() when captcha is requested', () => {
    render(<CaptchaModal />)
    act(() => {
      jest.runAllTimers()
    })
    expect(mockShow).toHaveBeenCalled()
  })

  it('dispatches the solved token on success message', () => {
    render(<CaptchaModal />)
    act(() => {
      latestOnMessage?.({
        nativeEvent: { data: 'mock-solved-token-abcdefghijklmnopqrstuvwxyz123456' },
        success: true,
        markUsed: jest.fn(),
        reset: jest.fn(),
      })
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      captcha.actions.captchaFormResponse({ token: 'mock-solved-token-abcdefghijklmnopqrstuvwxyz123456' })
    )
  })

  it('dispatches a cancellation on challenge-closed', () => {
    render(<CaptchaModal />)
    act(() => {
      latestOnMessage?.({
        nativeEvent: { data: 'challenge-closed' },
        success: false,
        reset: jest.fn(),
      })
    })
    expect(mockDispatch).toHaveBeenCalledWith(
      captcha.actions.captchaFormResponse({ error: 'Captcha cancelled by user' })
    )
  })
})
