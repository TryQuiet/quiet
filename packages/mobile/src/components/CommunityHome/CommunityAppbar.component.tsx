import React, { FC } from 'react'
import { Keyboard, TouchableOpacity, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { CaretDownIcon } from '../../assets/icons/svg/community-home-icons'
import { Typography } from '../Typography/Typography.component'
import { CommunityIcon } from './CommunityIcon.component'

export interface CommunityAppbarProps {
  communityName: string
  /** Shows the unread mark on the community icon. */
  unread?: boolean
  /** Opens the community context menu. */
  onPress: () => void
}

/** Height of the design library's `Title bar / Community`. */
export const COMMUNITY_APPBAR_HEIGHT = 64

const COMMUNITY_ICON_SIZE = 28

/**
 * The design library's `Title bar / Community` (Figma: 5446:75351, laid out at
 * mobile width in 5497:38082): a brand-purple bar carrying the community icon,
 * the community name and a caret. The whole group opens the community context
 * menu.
 *
 * The design's right-hand zone holds a search glyph and the user's own avatar.
 * Neither is built on mobile — there is no channel search and no profile
 * screen — and the design's own "For V1 2025" variant already drops the search
 * glyph, so the zone is empty here.
 */
export const CommunityAppbar: FC<CommunityAppbarProps> = ({ communityName, unread = false, onPress }) => (
  <View
    testID={'community_appbar'}
    style={{
      height: COMMUNITY_APPBAR_HEIGHT,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: defaultTheme.palette.main.brand,
    }}
  >
    <TouchableOpacity
      onPress={() => {
        Keyboard.dismiss()
        onPress()
      }}
      testID={'open_menu'}
      accessibilityRole='button'
      accessibilityLabel={`${communityName}, community options`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        alignSelf: 'flex-start',
        maxWidth: '100%',
      }}
    >
      <CommunityIcon name={communityName} size={COMMUNITY_ICON_SIZE} unread={unread} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
        <Typography variant={'h5'} color={'white'} numberOfLines={1} style={{ flexShrink: 1 }}>
          {communityName}
        </Typography>
        <CaretDownIcon />
      </View>
    </TouchableOpacity>
  </View>
)
