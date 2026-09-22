import { put, select } from 'typed-redux-saga'
import { modalsSelectors } from './modals.selectors'
import { modalsActions } from './modals.slice'
import { ModalName } from './modals.types'

const isSettingsOpenSelector = modalsSelectors.open(ModalName.accountSettingsModal)

/**
 * Settings is rendered as a drawer on top of the channel view, so a channel switch
 * triggered while it is open (Ctrl+K search, clicking a new message notification)
 * happens out of sight: the user asked to be taken to a channel and ends up staring
 * at Settings instead. Close Settings so the channel they picked becomes visible.
 *
 * Only Settings is closed - every other modal keeps its current behaviour.
 */
export function* closeSettingsOnChannelSwitchSaga(): Generator {
  const isSettingsOpen = yield* select(isSettingsOpenSelector)
  if (!isSettingsOpen) return
  yield* put(modalsActions.closeModal(ModalName.accountSettingsModal))
}
