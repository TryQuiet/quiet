import { ScreenNames } from '../../const/ScreenNames.enum'

/**
 * Where a failed join puts the user.
 *
 * Every way a join can fail is reported on the invite field, so the flow comes back to the
 * field the link was typed in rather than to the three-way choice, which has nothing to
 * carry the message. The entries before the last one are what the paste screen's back arrow
 * retraces: a one-deep reset would leave it with nowhere to go.
 *
 * It is a whole stack and not a single screen because the failures that reach it have wiped
 * Redux, the navigator included (`finalizeAdmissionReset`), so the path the user would have
 * walked has to be rebuilt rather than assumed.
 */
export const JOIN_FAILURE_STACK: ScreenNames[] = [
  ScreenNames.GetStartedScreen,
  ScreenNames.JoinCommunityScreen,
  ScreenNames.OpenInviteLinkScreen,
  ScreenNames.PasteInviteLinkScreen,
]
