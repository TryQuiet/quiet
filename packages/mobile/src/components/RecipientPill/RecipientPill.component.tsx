import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { ProfilePhoto } from '../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../Typography/Typography.component'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { RecipientPillProps } from './RecipientPill.types'

/**
 * A recipient the user has already picked, shown inside the "To:" field.
 *
 * Geometry comes from the DM design library component "Members and roles"
 * (Figma tXuRsUfP6VnSv99dox00C1, 919:47856): 26 tall, radius 8, 8pt of horizontal padding and an
 * 8pt gap, on #F7F7F7 that darkens to #F0F0F0 while pressed. The avatar is always drawn — the
 * design has no variant without one, and ProfilePhoto falls back to a Jdenticon for members who
 * have not set a photo.
 */
export const PILL_HEIGHT = 26
export const PILL_RADIUS = 8
export const PILL_GAP = 8
export const PILL_AVATAR_SIZE = 16
/** Gap between pills, both across and down, per "Search states / State=Selected (2)" (919:48416). */
export const PILL_ROW_GAP = 10

// The close glyph is #A1A1A1 in the design and darkens when it is the thing being pressed. Neither
// tone is in the mobile palette, and both are specific to this control.
const CLOSE_COLOR = '#A1A1A1'
const CLOSE_COLOR_PRESSED = defaultPalette.typography.gray70

export const RecipientPill: React.FC<RecipientPillProps> = ({ label, userId, photo, profilePhoto, onRemove, testID }) => {
  return (
    <Pressable
      accessibilityRole={'button'}
      accessibilityLabel={`Remove ${label}`}
      onPress={onRemove}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      testID={testID}
      style={({ pressed }) => [styles.pill, pressed ? styles.pillPressed : null]}
    >
      {({ pressed }) => (
        <>
          <ProfilePhoto
            username={label}
            userId={userId}
            photo={photo}
            profilePhoto={profilePhoto}
            size={PILL_AVATAR_SIZE}
            borderRadius={4}
          />
          <Typography fontSize={14} style={styles.label} numberOfLines={1}>
            {label}
          </Typography>
          <View style={styles.close}>
            <Typography fontSize={14} style={{ color: pressed ? CLOSE_COLOR_PRESSED : CLOSE_COLOR }}>
              {'✕'}
            </Typography>
          </View>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PILL_GAP,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: defaultPalette.background.gray03,
  },
  pillPressed: {
    backgroundColor: defaultPalette.background.gray06,
  },
  label: {
    color: defaultPalette.typography.gray90,
    maxWidth: 160,
  },
  close: {
    width: PILL_AVATAR_SIZE,
    alignItems: 'center',
  },
})
