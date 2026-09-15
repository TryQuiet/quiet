import { navigationRef, resetToScreen } from './RootNavigation'
import { ScreenNames } from './const/ScreenNames.enum'

it('removes previous screens and invitation parameters when returning to Join Community', () => {
  jest.spyOn(navigationRef, 'isReady').mockReturnValue(true)
  const reset = jest.spyOn(navigationRef, 'resetRoot').mockImplementation(() => undefined)
  resetToScreen(ScreenNames.JoinCommunityScreen)
  expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: ScreenNames.JoinCommunityScreen }] })
  jest.restoreAllMocks()
})
