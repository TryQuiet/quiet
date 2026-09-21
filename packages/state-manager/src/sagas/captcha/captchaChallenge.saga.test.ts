import { AnyAction } from 'redux'
import { runSaga, stdChannel } from 'redux-saga'
import { CaptchaContexts, SocketActions } from '@quiet/types'
import { Socket } from '../../types'
import { captchaActions, captchaReducer } from './captcha.slice'
import { captchaMasterSaga } from './captchaMasterSaga'

describe('CAPTCHA challenge event ordering', () => {
  const start = () => {
    const input = stdChannel()
    let state = { Captcha: captchaReducer(undefined, { type: '@@INIT' }) }
    const results: AnyAction[] = []
    const dispatch = (action: AnyAction) => {
      state = { Captcha: captchaReducer(state.Captcha, action) }
      if (captchaActions.setChallengeResult.match(action)) results.push(action)
      input.put(action)
    }
    const socket = { emit: jest.fn() }
    const task = runSaga(
      { channel: input, dispatch, getState: () => state },
      captchaMasterSaga,
      socket as unknown as Socket
    )
    dispatch(captchaActions.presentChallenge({ context: CaptchaContexts.CREATE_COMMUNITY }))
    return { dispatch, task, socket, results, getState: () => state.Captcha }
  }

  it('accepts successful verification after a delayed connection reset follows the desktop token', async () => {
    const test = start()
    try {
      test.dispatch(captchaActions.captchaFormResponse({ token: 'desktop-test-token' }))
      // IPC delivered the token before Socket.IO delivered the connection reset.
      test.dispatch(captchaActions.setCaptchaVerified(false))
      test.dispatch(captchaActions.setCaptchaVerified(true))
      expect(test.results.map(action => action.payload)).toEqual([{ success: true, cancelled: false }])
      expect(test.getState().captchaRequested).toBe(false)
    } finally {
      test.task.cancel()
      await test.task.toPromise()
    }
  })

  it('accepts backend verification without requiring another desktop token', async () => {
    const test = start()
    try {
      // QSS can verify a token already held by the backend when a challenge starts.
      test.dispatch(captchaActions.setCaptchaVerified(true))
      expect(test.results.map(action => action.payload)).toEqual([{ success: true, cancelled: false }])
    } finally {
      test.task.cancel()
      await test.task.toPromise()
    }
  })

  it('requests a new challenge after failed verification and allows the user to cancel', async () => {
    const test = start()
    try {
      test.dispatch(captchaActions.captchaFormResponse({ token: 'rejected-token' }))
      test.dispatch(captchaActions.setCaptchaVerified(false))
      expect(test.socket.emit.mock.calls.filter(([event]) => event === SocketActions.HCAPTCHA_REQUEST)).toHaveLength(2)
      test.dispatch(captchaActions.captchaFormResponse({ error: 'Captcha cancelled by user' }))
      expect(test.results.map(action => action.payload)).toEqual([{ success: false, cancelled: true }])
      expect(test.getState().captchaRequested).toBe(false)
    } finally {
      test.task.cancel()
      await test.task.toPromise()
    }
  })
})
