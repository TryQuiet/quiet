import React, { FC } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Appbar } from '../Appbar/Appbar.component'
import { ProfilePhoto } from '../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../Typography/Typography.component'
import ImagePlusIcon from '../../assets/icons/svg/image-plus'
import { UserProfileProps } from './UserProfile.types'
import { defaultPalette } from '../../styles/palettes/default.palette'

/**
 * Somebody's profile (Figma BnANosC1KGMUvm8oU2Dr0i, Profile-view 849:7386).
 *
 * The design's header also carries a bio, pronouns, an emoji status, local time and an online dot,
 * and below it sections for roles, private channels in common and moderation. Deliberately none of
 * that is built yet: this is the photo, the name and the action that reaches the person. Of the
 * rest, only bio and channels-in-common are even derivable from a UserProfile today — the others
 * have no data behind them, and empty rows would read as broken rather than unbuilt.
 */
const AVATAR_SIZE = 160
/** The design rounds the avatar at a twelfth of its size (160 -> 13.33). */
const AVATAR_RADIUS = AVATAR_SIZE / 12
const TITLE = 'Profile'
const MESSAGE = 'Message'

/** Design library Button, Small + Secondary: 32 tall, radius 16, 12/6 padding, 14px label. */
const BUTTON_HEIGHT = 32
const BUTTON_RADIUS = 16
/** Design library Button, Secondary: a #B3B3B3 border. gray06 (#F0F0F0) is the divider grey, a
 *  shade too faint to read as a button's edge. */
const BUTTON_BORDER = '#B3B3B3'
/** A third of the avatar, overhanging by a sixth, with the glyph filling three quarters of it. */
const EDIT_BADGE_SIZE = Math.round(AVATAR_SIZE / 3)
const EDIT_BADGE_OVERHANG = Math.round(AVATAR_SIZE / 6.4)
const EDIT_BADGE_GLYPH = Math.round(EDIT_BADGE_SIZE * 0.75)
const TOUCH_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

export const UserProfileComponent: FC<UserProfileProps> = ({
  profile,
  isMe,
  handleBackButton,
  handleMessage,
  handleEditPhoto,
}) => {
  if (profile == null) return null

  const showsEditControl = isMe && handleEditPhoto != null

  return (
    <View
      style={{ flex: 1, backgroundColor: defaultPalette.background.white }}
      testID={`user-profile-component-${profile.userId}`}
    >
      <Appbar title={TITLE} back={handleBackButton} />
      <View style={{ alignItems: 'center', paddingTop: 32, gap: 16 }}>
        {/* The wrapper is padded by the overhang so the control sits INSIDE its bounds. Android
            does not deliver touches to a child drawn outside its parent, so a control hung on
            negative offsets is only tappable where it happens to overlap — here that was the
            inner corner, putting the dead half right under the middle of the circle. The padding
            also gives the avatar the clearance it needs from the top. */}
        <View
          style={
            showsEditControl
              ? { paddingTop: EDIT_BADGE_OVERHANG, paddingRight: EDIT_BADGE_OVERHANG }
              : undefined
          }
        >
          <ProfilePhoto
            username={profile.nickname}
            userId={profile.userId}
            photo={profile.photo}
            profilePhoto={profile.profilePhoto}
            size={AVATAR_SIZE}
            borderRadius={AVATAR_RADIUS}
          />
          {/* The design's edit control (Figma BnANosC1KGMUvm8oU2Dr0i, Avatar-action): a white
              circle overhanging the avatar's TOP-right, holding the image-plus-outline glyph. It
              is drawn at a third of the avatar and overhangs by a sixth — 32 with 15 against the
              96 avatar on the edit screen, 53 with 25 against this 160 one. Only your own photo
              can be changed. */}
          {showsEditControl && (
            <TouchableOpacity
              onPress={handleEditPhoto}
              hitSlop={TOUCH_SLOP}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: EDIT_BADGE_SIZE,
                height: EDIT_BADGE_SIZE,
                borderRadius: EDIT_BADGE_SIZE / 2,
                backgroundColor: defaultPalette.background.white,
                alignItems: 'center',
                justifyContent: 'center',
                // No border in the design — a drop shadow is what lifts the white circle off the
                // photo (black 11%, y+2, blur 10 at 32; scaled with the control, as the design
                // scales it). Android needs elevation as well as the iOS shadow props.
                shadowColor: '#000000',
                shadowOpacity: 0.11,
                shadowRadius: EDIT_BADGE_SIZE / 3.2,
                shadowOffset: { width: 0, height: EDIT_BADGE_SIZE / 16 },
                elevation: 3,
              }}
              testID={'user-profile-edit-photo'}
            >
              <ImagePlusIcon size={EDIT_BADGE_GLYPH} accessibilityLabel={'Change your profile photo'} />
            </TouchableOpacity>
          )}
        </View>
        {/* Name: 28/34 in the design, a step above every other title in the app. */}
        <Typography fontSize={28} fontWeight={'normal'} testID={'user-profile-nickname'}>
          {profile.nickname}
        </Typography>
        {/* Message stays on your own profile too: a DM with just yourself is a real conversation
            in Quiet, so it serves as a note to self. */}
        <TouchableOpacity onPress={handleMessage} testID={'user-profile-message-button'}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: BUTTON_HEIGHT,
                paddingHorizontal: 12,
                borderRadius: BUTTON_RADIUS,
                borderWidth: 1,
                borderColor: BUTTON_BORDER,
                backgroundColor: defaultPalette.background.white,
              }}
            >
              <Typography fontSize={14}>{MESSAGE}</Typography>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}
