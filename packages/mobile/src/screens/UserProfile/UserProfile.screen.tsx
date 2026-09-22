import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Config from 'react-native-config'
import RNFS from 'react-native-fs'

import { findDmChannelWithMembers } from '@quiet/common'
import { launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker'

import { publicChannels, users } from '@quiet/state-manager'

import { ScreenNames } from '../../const/ScreenNames.enum'
import { UserProfileComponent } from '../../components/UserProfile/UserProfile.component'
import { UserProfileScreenProps } from './UserProfile.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { createLogger } from '../../utils/logger'

const logger = createLogger('UserProfileScreen')

const FILE_URI_PREFIX = 'file://'
const DEFAULT_PHOTO_NAME = 'profile-photo.jpg'

/**
 * The picker returns a URI — on Android a percent-encoded `file://` copy in the app's cache —
 * but saveUserProfile.saga forwards `path` to the backend, which stats it as a plain filesystem
 * path. Handing it a URI is not a survivable mistake there: attachFile's ENOENT surfaces as an
 * unhandled rejection and backendManager shuts the whole node process down, taking the app with
 * it. sendFileMessage.saga strips the scheme for message attachments; nothing does it for us.
 *
 * A URI that is not a file one (`content://`, `http://`) would fail the same way, so it is
 * rejected here rather than passed on — the caller falls back to the asset's other candidate.
 */
const filePathFromUri = (uri: string | undefined): string | undefined => {
  if (uri == null) return undefined
  const path = uri.startsWith(FILE_URI_PREFIX) ? uri.slice(FILE_URI_PREFIX.length) : uri
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return undefined
  }
  return decoded.startsWith('/') ? decoded : undefined
}

/**
 * Detox drives only the app under test, and the gallery is a different app entirely
 * (com.google.android.photopicker), so an e2e run can never get past it. The e2e build — and only
 * it, no shipped env file carries this — answers with what the picker would have returned for a
 * file the spec put in the app's cache, percent-encoded `file://` URI and all, since that shape is
 * what took the backend down. Everything downstream of here is then the real thing.
 */
const pickPhoto = (callback: (response: ImagePickerResponse) => void): void => {
  const e2eName = Config.E2E_PROFILE_PHOTO_NAME
  if (e2eName) {
    callback({ assets: [{ uri: `file://${encodeURI(`${RNFS.CachesDirectoryPath}/${e2eName}`)}`, fileName: e2eName }] })
    return
  }
  launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, callback)
}

export const UserProfileScreen: FC<UserProfileScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { userId } = route.params

  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const channels = useSelector(publicChannels.selectors.publicChannels)

  const profile = userProfiles[userId]

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  /**
   * A DM is created together with its first message, so there is nothing to create here. Either the
   * conversation already exists, in which case open it, or the composer opens with this person
   * already chosen and the message they type is what brings the DM into being.
   */
  const handleMessage = useCallback(() => {
    if (me == null) {
      logger.error('Cannot start a DM without knowing who I am')
      return
    }
    const existing = findDmChannelWithMembers([userId], me.userId, channels)
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: existing?.id ?? '',
      })
    )
    dispatch(
      publicChannels.actions.setNewMessageOpen({
        isOpen: existing == null,
        recipientIds: existing == null ? [userId] : undefined,
      })
    )
    dispatch(navigationActions.navigation({ screen: ScreenNames.ChannelScreen }))
  }, [dispatch, me, userId, channels])

  /**
   * Parity with desktop's Edit profile, which is a file picker and nothing more. The saga only
   * reads `name` and `path` off what it is given, so an Asset stands in for the web File the
   * payload type names — the same substitution Channel.screen makes for message attachments.
   */
  const handleEditPhoto = useCallback(() => {
    pickPhoto(response => {
      if (response.didCancel) return
      const asset = response.assets?.[0]
      const path = filePathFromUri(asset?.uri) ?? filePathFromUri(asset?.originalPath)
      if (path == null) {
        logger.error('Picked no usable image', asset?.uri, response.errorMessage)
        return
      }
      dispatch(
        users.actions.saveUserProfile({
          photo: { name: asset?.fileName ?? DEFAULT_PHOTO_NAME, path } as unknown as File,
        })
      )
    })
  }, [dispatch])

  return (
    <UserProfileComponent
      profile={profile}
      isMe={me?.userId === userId}
      handleBackButton={handleBackButton}
      handleMessage={handleMessage}
      handleEditPhoto={handleEditPhoto}
    />
  )
}
