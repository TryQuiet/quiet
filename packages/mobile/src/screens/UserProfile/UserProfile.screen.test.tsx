import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import { publicChannels, users } from '@quiet/state-manager'
import { type UserProfile } from '@quiet/types'
import { UserProfileScreen } from './UserProfile.screen'
import { type UserProfileRouteProps } from '../../route.params'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

const mockDispatch = jest.fn()
const mockSelections = new Map()

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockSelections.get(selector),
}))
// setupTests stubs the picker away entirely (`() => {}`) so that its ESM source never has to be
// parsed; the handler under test needs a callable, so replace it for this file only.
jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn() }))

describe('user profile photo picking', () => {
  const me: UserProfile = { userId: 'me', nickname: 'alice' }
  const route = { params: { userId: me.userId } } as UserProfileRouteProps

  beforeEach(() => {
    mockDispatch.mockClear()
    mockSelections.clear()
    mockSelections.set(users.selectors.userProfiles, { [me.userId]: me })
    mockSelections.set(users.selectors.myUserProfile, me)
    mockSelections.set(publicChannels.selectors.publicChannels, [])
  })

  const pick = (response: unknown) => {
    const picker = launchImageLibrary as jest.Mock
    picker.mockImplementationOnce((_options, callback) => callback(response))
    const view = renderComponent(<UserProfileScreen route={route} />)
    fireEvent.press(view.getByTestId('user-profile-edit-photo'))
  }

  const savedProfiles = () =>
    mockDispatch.mock.calls.map(([action]) => action).filter(action => users.actions.saveUserProfile.match(action))

  /**
   * The crash: the backend stats `path` and an unhandled ENOENT there takes the whole node process
   * down, so a `file://` URI reaching it is fatal rather than merely ignored.
   */
  it("hands the saga a filesystem path, not the picker's file URI", () => {
    pick({
      assets: [
        {
          uri: 'file:///data/user/0/com.quietmobile/cache/rn_image_picker_lib_temp_140c6fde.jpg',
          fileName: 'rn_image_picker_lib_temp_140c6fde.jpg',
        },
      ],
    })

    expect(savedProfiles()).toHaveLength(1)
    expect(savedProfiles()[0].payload).toEqual({
      photo: {
        name: 'rn_image_picker_lib_temp_140c6fde.jpg',
        path: '/data/user/0/com.quietmobile/cache/rn_image_picker_lib_temp_140c6fde.jpg',
      },
    })
  })

  it('decodes a percent-encoded URI', () => {
    pick({ assets: [{ uri: 'file:///storage/emulated/0/DCIM/my%20holiday%20photo.jpg' }] })

    expect(savedProfiles()[0].payload.photo).toEqual({
      name: 'profile-photo.jpg',
      path: '/storage/emulated/0/DCIM/my holiday photo.jpg',
    })
  })

  it('takes originalPath when the URI is a content handle the backend cannot open', () => {
    pick({
      assets: [
        {
          uri: 'content://media/picker/0/com.android.providers.media.photopicker/media/1000000034',
          originalPath: '/storage/emulated/0/DCIM/IMG_0001.jpg',
        },
      ],
    })

    expect(savedProfiles()[0].payload.photo).toEqual({
      name: 'profile-photo.jpg',
      path: '/storage/emulated/0/DCIM/IMG_0001.jpg',
    })
  })

  it('saves nothing when no candidate is a usable path', () => {
    expect(() =>
      pick({ assets: [{ uri: 'content://media/picker/0/com.android.providers.media.photopicker/media/1000000034' }] })
    ).not.toThrow()

    expect(savedProfiles()).toEqual([])
  })

  it('saves nothing when the pick is cancelled', () => {
    pick({ didCancel: true })

    expect(savedProfiles()).toEqual([])
  })
})
