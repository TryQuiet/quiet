import React, { FC } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { spacing } from '../../styles/const/spacing'
import { AddCircleIcon } from '../../assets/icons/svg/community-home-icons'
import { Typography } from '../Typography/Typography.component'
import { LIST_TEXT_OPACITY } from './ListRow.component'

import type { ListSectionTitleProps } from './CommunityHome.types'

/** Height of the design library's `List title` row. */
export const LIST_TITLE_HEIGHT = 36

/**
 * The design library's `List title`: a medium-weight section label with an
 * optional circled plus at the far right. Same 36px row and 16px side padding
 * as `List item` (Figma: Community home 5446:76594).
 */
export const ListSectionTitle: FC<ListSectionTitleProps> = ({
  title,
  onAdd,
  addAccessibilityLabel,
  addTestID,
  testID,
}) => (
  <View
    testID={testID}
    style={{
      height: LIST_TITLE_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    }}
  >
    <Typography
      variant={'subtitle'}
      color={'charcoal'}
      numberOfLines={1}
      style={{ flex: 1, opacity: LIST_TEXT_OPACITY }}
    >
      {title}
    </Typography>
    {onAdd && (
      <TouchableOpacity
        onPress={onAdd}
        testID={addTestID}
        accessibilityRole='button'
        accessibilityLabel={addAccessibilityLabel ?? `Add to ${title}`}
        hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
      >
        <AddCircleIcon />
      </TouchableOpacity>
    )}
  </View>
)
