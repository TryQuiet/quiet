import React, { FC } from 'react'
import { Pressable, View } from 'react-native'

import { spacing } from '../../styles/const/spacing'
import { AddCircleIcon } from '../../assets/icons/svg/community-home-icons'
import { Typography } from '../Typography/Typography.component'
import { LIST_ROW_PRESSED, LIST_TEXT_OPACITY } from './ListRow.component'

import type { ListSectionTitleProps } from './CommunityHome.types'

/** Height of the design library's `List title` row. */
export const LIST_TITLE_HEIGHT = 36

/** Side of the library's `t-add` glyph. */
const ADD_GLYPH_SIZE = 16

/**
 * The tapped disc behind the plus. The library has no pressed state for a lone
 * glyph, and a fill the glyph's own size is barely perceptible, so the disc is
 * the size of a comfortable touch target and sits behind the glyph without
 * moving it: it is absolutely positioned, so the 16px box still holds the
 * frame's 16px right margin.
 */
const ADD_PRESS_SIZE = 28

/**
 * The design library's `List title`: a medium-weight section label with an
 * optional circled plus at the far right. Same 36px row and 16px side padding
 * as `List item` (Figma: Community home 5446:76594).
 *
 * The title row itself has no hover state in the library (`List title`
 * 3797:16103 draws no fill on Hover) — only the plus is clickable, so only the
 * plus takes a tapped state, filling its own circle.
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
      <Pressable
        onPress={onAdd}
        testID={addTestID}
        accessibilityRole='button'
        accessibilityLabel={addAccessibilityLabel ?? `Add to ${title}`}
        hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
        style={{ width: ADD_GLYPH_SIZE, height: ADD_GLYPH_SIZE }}
      >
        {({ pressed }) => (
          <>
            {pressed && (
              <View
                testID={addTestID ? `${addTestID}_pressed` : undefined}
                style={{
                  position: 'absolute',
                  top: (ADD_GLYPH_SIZE - ADD_PRESS_SIZE) / 2,
                  left: (ADD_GLYPH_SIZE - ADD_PRESS_SIZE) / 2,
                  width: ADD_PRESS_SIZE,
                  height: ADD_PRESS_SIZE,
                  borderRadius: ADD_PRESS_SIZE / 2,
                  backgroundColor: LIST_ROW_PRESSED,
                }}
              />
            )}
            <AddCircleIcon size={ADD_GLYPH_SIZE} />
          </>
        )}
      </Pressable>
    )}
  </View>
)
