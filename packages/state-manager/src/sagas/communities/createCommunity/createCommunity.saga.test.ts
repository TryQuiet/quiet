import { testSaga } from 'redux-saga-test-plan'
import { CaptchaContexts, LoadingPanelType } from '@quiet/types'
import type { Socket } from '../../../types'
import { captchaActions } from '../../captcha/captcha.slice'
import { identityActions } from '../../identity/identity.slice'
import { networkActions } from '../../network/network.slice'
import { communitiesActions } from '../communities.slice'
import { createCommunitySaga } from './createCommunity.saga'

describe('createCommunitySaga', () => {
  const socket = { emitWithAck: jest.fn() } as unknown as Socket
  const action = communitiesActions.createCommunity({ name: 'rockets', useServer: true })
  const registered = identityActions.registerUsername({ nickname: 'alice' })
  const challenge = captchaActions.presentChallenge({ context: CaptchaContexts.CREATE_COMMUNITY })
  const previousEnv = process.env.NODE_ENV

  // The saga skips the captcha under NODE_ENV=test; these cases are about the captcha.
  beforeAll(() => {
    process.env.NODE_ENV = 'development'
  })
  afterAll(() => {
    process.env.NODE_ENV = previousEnv
  })

  /** Runs the saga up to the first captcha challenge. */
  const untilChallenge = () =>
    testSaga(createCommunitySaga, socket, action)
      .next()
      .put(networkActions.setLoadingPanelType(LoadingPanelType.Creating))
      .next()
      .next(undefined)
      .take(identityActions.registerUsername)
      .next(registered)
      .put(communitiesActions.requestTermsOfService())
      .next()
      .take(communitiesActions.setTermsOfServiceAccepted)
      .next(communitiesActions.setTermsOfServiceAccepted({ accepted: true }))
      .put(challenge)
      .next()
      .take(captchaActions.setChallengeResult)

  it('returns to the terms of service when the captcha is cancelled, and aborts when they are declined', () => {
    untilChallenge()
      .next(captchaActions.setChallengeResult({ success: false, cancelled: true }))
      .put(communitiesActions.requestTermsOfService())
      .next()
      .take(communitiesActions.setTermsOfServiceAccepted)
      .next(communitiesActions.setTermsOfServiceAccepted({ accepted: false }))
      .isDone()
  })

  it('presents the captcha again after the user agrees again', () => {
    untilChallenge()
      .next(captchaActions.setChallengeResult({ success: false, cancelled: true }))
      .put(communitiesActions.requestTermsOfService())
      .next()
      .take(communitiesActions.setTermsOfServiceAccepted)
      .next(communitiesActions.setTermsOfServiceAccepted({ accepted: true }))
      .put(challenge)
      .next()
      .take(captchaActions.setChallengeResult)
  })

  it('re-presents a failed (not cancelled) challenge without leaving the flow', () => {
    untilChallenge()
      .next(captchaActions.setChallengeResult({ success: false, cancelled: false }))
      .put(challenge)
      .next()
      .take(captchaActions.setChallengeResult)
  })

  it('continues to the backend once the challenge succeeds', () => {
    untilChallenge()
      .next(captchaActions.setChallengeResult({ success: true, cancelled: false }))
      .inspect((effect: { type?: string }) => {
        expect(effect.type).toBe('CALL')
      })
  })
})
