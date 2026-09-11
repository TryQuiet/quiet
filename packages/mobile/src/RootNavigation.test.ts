import { StackRouter } from '@react-navigation/native'

import { ScreenNames } from './const/ScreenNames.enum'
import { navigate, navigationRef, pop, replaceScreen } from './RootNavigation'

describe('root stack navigation', () => {
  const router = StackRouter({ initialRouteName: ScreenNames.ChannelListScreen })
  const options = {
    routeNames: Object.values(ScreenNames),
    routeParamList: {},
    routeGetIdList: {},
  }
  let state = router.getInitialState(options)

  beforeEach(() => {
    state = router.getInitialState(options)
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true)
    // Use the same router as the native stack: assertions below check the
    // resulting history, rather than merely accepting any dispatched action.
    jest.spyOn(navigationRef, 'dispatch').mockImplementation(action => {
      const resolvedAction = typeof action === 'function' ? action(state) : action
      const nextState = router.getStateForAction(
        state,
        resolvedAction as Parameters<typeof router.getStateForAction>[1],
        options
      )
      state = router.getRehydratedState(nextState ?? state, options)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns from a channel to the existing list without leaving duplicate screens behind', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const listKey = state.routes[0].key

    for (let visit = 0; visit < 3; visit += 1) {
      navigate(ScreenNames.ChannelScreen)
      expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen, ScreenNames.ChannelScreen])

      navigate(ScreenNames.ChannelListScreen)
      expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen])
      expect(state.routes[0].key).toBe(listKey)
    }

    // A later system Back must not reopen a channel that was already closed.
    pop()
    expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen])
    expect(warn).not.toHaveBeenCalled()
  })

  it('pushes a new destination and returns through intermediate screens to an existing destination', () => {
    navigate(ScreenNames.ChannelScreen)
    const channelKey = state.routes[1].key
    navigate(ScreenNames.ChannelMembershipScreen, { channelId: 'general', channelName: 'general' })
    navigate(ScreenNames.UpdateChannelMembershipScreen, { channelId: 'general', channelName: 'general' })

    navigate(ScreenNames.ChannelScreen)

    expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen, ScreenNames.ChannelScreen])
    expect(state.routes[1].key).toBe(channelKey)
  })

  it('updates parameters on the focused screen without adding another instance', () => {
    navigate(ScreenNames.DeleteChannelScreen, { channelId: 'first', channelName: 'first' })
    const screenKey = state.routes[1].key

    navigate(ScreenNames.DeleteChannelScreen, { channelId: 'second', channelName: 'second' })

    expect(state.routes).toHaveLength(2)
    expect(state.routes[1]).toMatchObject({
      key: screenKey,
      params: { channelId: 'second', channelName: 'second' },
    })
  })

  it('replaces the current screen while preserving the preceding back destination', () => {
    navigate(ScreenNames.ChannelScreen)
    replaceScreen(ScreenNames.QRCodeScreen)

    expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen, ScreenNames.QRCodeScreen])

    pop()
    expect(state.routes.map(route => route.name)).toEqual([ScreenNames.ChannelListScreen])
  })

  it('does not dispatch before the navigation container is ready', () => {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(false)

    navigate(ScreenNames.ChannelScreen)
    replaceScreen(ScreenNames.QRCodeScreen)
    pop()

    expect(navigationRef.dispatch).not.toHaveBeenCalled()
  })
})
