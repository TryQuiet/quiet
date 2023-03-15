import { PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { communities } from '@quiet/state-manager'

export function* handleInvitationCodeSaga(
    action: PayloadAction<ReturnType<typeof communities.actions.handleInvitationCode>['payload']>
  ): Generator {
    console.log('handleInvitationCodeSaga', action.payload)
    const currentCommunityId = yield* select(communities.selectors.currentCommunityId)
    console.log('handleInvitationCodeSaga currentCommunityId', currentCommunityId)
    if (currentCommunityId) {
        // set alert text
        console.log('Sorry, you can only join one community at a time. This will change soon.')
        return
    }

    const code = action.payload
    console.log('handling code::::', code)
    // Sanitize 'code'?
    yield* put(communities.actions.setInvitationCode(code))
}