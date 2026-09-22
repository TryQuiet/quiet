import React, { FC } from 'react'
import { View, Image, TouchableOpacity, Keyboard } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { StyledAppbar } from './Appbar.styles'
import { AppbarProps } from './Appbar.types'
import { icons } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'
import { DefaultAppbarTitle } from './DefaultAppbarHeaderTitle.component'

/** The smallest comfortable finger target; every guideline puts it at 44. */
const TOUCH_TARGET = 44
/** Extra tappable margin around a control, for the pixels a thumb lands on but the box misses. */
const TOUCH_SLOP = { top: 8, bottom: 8, left: 8, right: 8 }

/** The title bar without its title: the library's 60-tall bar zone, glyph box 28 at (14, 16), icon 16. */
export const BAR_ZONE_HEIGHT = 60
const GLYPH_BOX = 28
const GLYPH_LEFT = 14
const GLYPH_TOP = 16
const GLYPH_ICON = 16
/** Widens the 28 box to a 48 touch target. */
const GLYPH_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 }

export const Appbar: FC<AppbarProps> = ({
  title,
  titleComponent,
  prefix,
  position,
  style,
  back,
  submit,
  contextMenu,
  textColor = 'main',
  iconColor = defaultTheme.palette.typography.main,
  crossBackIcon = false,
  plain = false,
  withoutTitle = false,
}) => {
  const arrow_icon = icons.arrow_left
  const cross_icon = icons.icon_close
  const menu_icon = icons.dots
  const displayedTitleComponent =
    titleComponent != null ? (
      titleComponent
    ) : (
      <DefaultAppbarTitle title={title ?? ''} fontSize={16} fontWeight={'medium'} textColor={textColor} />
    )
  if (withoutTitle) {
    return (
      <View
        style={[{ height: BAR_ZONE_HEIGHT, backgroundColor: defaultTheme.palette.background.white }, style]}
        testID={'appbar_without_title'}
      >
        {back ? (
          <TouchableOpacity
            onPress={back}
            testID={'appbar_action_item'}
            accessibilityRole='button'
            accessibilityLabel={crossBackIcon ? 'Close' : 'Go back'}
            hitSlop={GLYPH_HIT_SLOP}
            style={{
              position: 'absolute',
              left: GLYPH_LEFT,
              top: GLYPH_TOP,
              width: GLYPH_BOX,
              height: GLYPH_BOX,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={crossBackIcon ? cross_icon : arrow_icon}
              resizeMode='cover'
              resizeMethod='resize'
              accessible={false}
              style={{ width: GLYPH_ICON, height: GLYPH_ICON }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }
  return (
    <StyledAppbar style={style}>
      {/* alignSelf stretch so the control fills the bar's height rather than sitting in a 50px
          band inside it — the strip above and below a centred child is dead to a finger. */}
      <View style={{ flex: 1, alignSelf: 'stretch' }}>
        <TouchableOpacity
          onPress={() => {
            if (back) back()
          }}
          hitSlop={TOUCH_SLOP}
          style={{ flex: 1 }}
          testID={'appbar_action_item'}
          accessibilityRole={back ? 'button' : undefined}
          accessibilityLabel={back ? (crossBackIcon ? 'Close' : 'Go back') : undefined}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: 64,
              minHeight: TOUCH_TARGET,
            }}
          >
            {back ? (
              <Image
                source={crossBackIcon ? cross_icon : arrow_icon}
                resizeMode='cover'
                resizeMethod='resize'
                accessible={false}
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            ) : plain ? null : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  backgroundColor: defaultTheme.palette.background.lushSky,
                }}
              >
                <Typography fontSize={14} color={'white'}>
                  {prefix}
                  {title?.slice(0, 1).toLocaleUpperCase()}
                </Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 4, alignItems: `${position || 'center'}` }}>{displayedTitleComponent}</View>
      <View style={{ flex: 1, alignSelf: 'stretch' }}>
        {contextMenu && (
          <TouchableOpacity
            onPress={event => {
              event.persist()
              Keyboard.dismiss()
              contextMenu.handleOpen()
            }}
            // The glyph is 16px. The target is the whole column, the full height of the bar, plus
            // slop past the screen edge — a menu in the corner should never need aiming.
            hitSlop={TOUCH_SLOP}
            style={{ flex: 1 }}
            testID={'open_menu'}
            accessibilityRole='button'
            accessibilityLabel='More options'
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: 64,
                minHeight: TOUCH_TARGET,
              }}
            >
              <Image
                source={menu_icon}
                resizeMode='contain'
                resizeMethod='resize'
                tintColor={iconColor}
                accessible={false}
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            </View>
          </TouchableOpacity>
        )}
        {submit && (
          <TouchableOpacity
            onPress={event => {
              event.persist()
              submit()
            }}
            // The label alone is about 40x20, well under the 44 a finger needs. Padding gives the
            // target without moving the text, and hitSlop covers the rest.
            hitSlop={TOUCH_SLOP}
            style={{ flex: 1 }}
            testID={'submit'}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: TOUCH_TARGET,
                minHeight: TOUCH_TARGET,
                paddingHorizontal: 8,
              }}
            >
              <Typography style={{ color: defaultTheme.palette.typography.blue }} fontSize={16}>
                Done
              </Typography>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </StyledAppbar>
  )
}
