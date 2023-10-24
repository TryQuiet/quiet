import React, { FC } from 'react'
import { View, Image, FlatList, TouchableWithoutFeedback, TouchableOpacity, Animated } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { appImages } from '../../assets'

export const ContextMenu: FC<ContextMenuProps> = ({
  visible,
  handleClose,
  title,
  items,
  hint,
  link,
  linkAction = () => {
    console.log('No action attached for link tap gesture.')
  },
  children,
}) => {
  const [show, setShow] = React.useState<boolean>(false)
  const slidingAnimation = React.useRef(new Animated.Value(0)).current
  const icon_close = appImages.icon_close

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
              <View style={{ flex: 5, justifyContent: 'center' }}>
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
                    <View
                      style={[
                        { borderTopWidth: 1, borderColor: defaultPalette.background.gray06 },
                        index === items.length - 1 ? { borderBottomWidth: 1 } : { borderBottomWidth: 0 },
                      ]}
                    >
                      <ContextMenuItem {...item} />
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

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, action }) => {
  const icon_arrow = appImages.arrow_right_short
  return (
    <TouchableOpacity onPress={action} testID={title}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          height: 48,
          width: '100%',
        }}
      >
        <View
          style={{
            flex: 8,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <Typography fontSize={16} fontWeight={'normal'} style={{ lineHeight: 26 }}>
            {title}
          </Typography>
        </View>
        <View style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
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
