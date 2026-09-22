import React, { FC } from 'react'
import { View, Image, FlatList, TouchableWithoutFeedback, TouchableOpacity, Animated } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { icons } from '../../assets'
import { createLogger } from '../../utils/logger'
import { defaultTheme } from '../../styles/themes/default.theme'

const logger = createLogger('contextMenu:component')

export const ContextMenu: FC<ContextMenuProps> = ({
  visible,
  handleClose,
  title,
  titleIcon,
  items,
  hint,
  link,
  linkAction = () => {
    logger.info('No action attached for link tap gesture.')
  },
  children,
}) => {
  const [show, setShow] = React.useState<boolean>(false)
  const slidingAnimation = React.useRef(new Animated.Value(0)).current
  const icon_close = icons.icon_close

  const menuFadeIn = () => {
    setShow(true)
    Animated.timing(slidingAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  const menuFadeOut = () => {
    Animated.timing(slidingAnimation, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShow(false))
  }

  React.useEffect(() => {
    visible ? menuFadeIn() : menuFadeOut()
  }, [visible])

  return (
    <TouchableWithoutFeedback onPress={handleClose}>
      <Animated.View
        style={{
          display: show ? 'flex' : 'none',
          position: 'absolute',
          width: '100%',
          height: '100%',
          paddingTop: 10,
          overflow: 'hidden',
          transform: [
            {
              translateY: slidingAnimation,
            },
          ],
        }}
      >
        <View style={{ flex: 4 }} />
        <TouchableWithoutFeedback testID={`context_menu_${title}`}>
          <View
            style={{
              flex: 6,
              bottom: 0,
              flexDirection: 'column',
              alignItems: 'flex-start',
              backgroundColor: defaultPalette.background.white,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              shadowColor: defaultPalette.background.black,
              shadowRadius: 7,
              shadowOpacity: 0.7,
              shadowOffset: {
                height: 7,
                width: 0,
              },
              elevation: 12,
              width: '100%',
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 60,
                width: '100%',
              }}
            >
              <TouchableOpacity onPress={handleClose}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 60,
                    height: 60,
                  }}
                >
                  <Image
                    source={icon_close}
                    resizeMode='cover'
                    resizeMethod='resize'
                    style={{
                      width: 13,
                      height: 13,
                    }}
                  />
                </View>
              </TouchableOpacity>
              <View
                style={{
                  flex: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                {titleIcon && titleIcon}
                <Typography fontSize={16} fontWeight={'medium'} style={{ lineHeight: 26, alignSelf: 'center' }}>
                  {title}
                </Typography>
              </View>
              <View style={{ flex: 1 }}></View>
            </View>
            {(hint || link) && (
              <View
                style={{
                  width: '100%',
                  padding: 16,
                  borderTopWidth: 1,
                  borderColor: defaultPalette.background.gray06,
                }}
              >
                <Typography fontSize={14} fontWeight={'normal'} style={{ lineHeight: 20 }}>
                  {hint}
                </Typography>
                <Typography
                  fontSize={14}
                  fontWeight={'normal'}
                  numberOfLines={1}
                  style={{ lineHeight: 20, color: defaultPalette.typography.gray50 }}
                  onPress={linkAction}
                >
                  {link}
                </Typography>
              </View>
            )}

            {items.length !== 0 && (
              <View style={{ width: '100%', paddingBottom: 10 }}>
                <FlatList
                  data={items}
                  keyExtractor={item => item.title}
                  renderItem={({ item, index }) => (
                    <View>
                      <ContextMenuItem {...item} />
                      {/* The design's "Divider-quiet" stops at the row's own 16pt inset rather than
                          running the full width (DM settings 816:28609), and sits under each row —
                          including the last, which closes the group. */}
                      <View
                        style={{
                          height: 1,
                          marginHorizontal: 16,
                          backgroundColor: defaultPalette.background.gray06,
                        }}
                      />
                    </View>
                  )}
                  style={{ backgroundColor: defaultPalette.background.white }}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {children}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, subtitle, suffix, destructive, action }) => {
  const icon_arrow = icons.arrow_right_short
  // "Button row" geometry from the design library (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190): 16pt
  // side inset, 11pt above and below, so a single-line row is 48 tall and one with a subtitle 64.
  const paddingHorizontal = 16
  const paddingVertical = 11
  const minHeight = 48
  return (
    <TouchableOpacity onPress={action} testID={title}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: paddingHorizontal,
          paddingRight: paddingHorizontal,
          paddingVertical,
          minHeight,
          width: '100%',
        }}
        testID={'context-menu-item'}
      >
        <View
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Typography
              fontSize={16}
              fontWeight={'normal'}
              style={{ lineHeight: 26, color: destructive ? defaultTheme.palette.typography.destructive : undefined }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                fontSize={12}
                fontWeight={'normal'}
                style={{ lineHeight: 16, letterSpacing: 0.4, color: defaultTheme.palette.typography.gray50 }}
              >
                {subtitle}
              </Typography>
            )}
          </View>
        </View>
        {/* The count and chevron hug their content and never shrink; the title column takes the
            rest. Sharing the row 8:1 left the count about 22pt of space, so anything past a single
            digit wrapped or vanished (design: the text frame grows, this group is 42 wide). */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {suffix && (
            <Typography
              fontSize={16}
              fontWeight={'normal'}
              style={{ lineHeight: 26, color: defaultTheme.palette.typography.gray50 }}
            >
              {suffix}
            </Typography>
          )}
          <Image
            source={icon_arrow}
            resizeMode='cover'
            resizeMethod='resize'
            style={{
              width: 8,
              height: 13,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}
