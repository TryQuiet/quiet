import { put, select, take } from 'typed-redux-saga'
import { communitiesSelectors } from '../communities.selectors'
import { communitiesActions } from '../communities.slice'

export function* acceptServerSaga(): Generator {
  let community = yield* select(communitiesSelectors.currentCommunity)
  if (!community) {
    return
  }

  if (!community.tosAccepted) {
    yield* put(communitiesActions.requestTermsOfService())
    const choice: ReturnType<typeof communitiesActions.setTermsOfServiceAccepted> = yield* take(
      communitiesActions.setTermsOfServiceAccepted
    )
    if (!choice.payload.accepted) {
      return
    }

    community = yield* select(communitiesSelectors.currentCommunity)
    if (!community) {
      return
    }
  }

  yield* put(
    communitiesActions.updateCommunityData({
      id: community.id,
      updates: {
        tosAccepted: true,
        qssEnabled: true,
        serverHosts: community.serverHosts?.map(server => ({ ...server, accepted: true })),
      },
    })
  )
}
