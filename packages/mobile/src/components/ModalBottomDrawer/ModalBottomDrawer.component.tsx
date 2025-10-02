import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, PanResponder, TouchableWithoutFeedback, View, Image } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { icons } from '../../assets'
import { ModalBottomDrawerProps } from './ModalBottomDrawer.types'

export const ModalBottomDrawer: FC<ModalBottomDrawerProps> = ({
  visible,
  onClose,
  showHandle = true,
  children,
  testIdPrefix = 'modal_bottom_drawer',
  heightRatio = 2 / 3,
  heightPx,
}) => {
  const screenH = Dimensions.get('screen').height
  const SHEET_H = Math.min(Math.round(heightPx ?? screenH * heightRatio), screenH)
  const OPEN_Y = 0
  const CLOSED_Y = SHEET_H // translateY relative to its anchored position

  // we render the full-screen container and animate the sheet up from CLOSED_Y to OPEN_Y
  const [mounted, setMounted] = useState(false)
  const translateY = useRef(new Animated.Value(CLOSED_Y)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: OPEN_Y,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: CLOSED_Y,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // swipe-to-dismiss
  const pan = useRef(new Animated.Value(0)).current // positive = drag down
  const threshold = Math.max(80, SHEET_H * 0.18)

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4, // start on vertical drag
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) {
            // only allow dragging downward
            pan.setValue(g.dy)
          }
        },
        onPanResponderRelease: (_, g) => {
          const shouldClose = g.vy > 1.2 || g.dy > threshold
          if (shouldClose) {
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: CLOSED_Y,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]).start(() => {
              pan.setValue(0)
              onClose()
            })
          } else {
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start()
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start()
        },
      }),
    [CLOSED_Y, onClose, pan, threshold, translateY, backdropOpacity]
  )

  if (!mounted) return null

  return (
    <View
      pointerEvents='box-none'
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        zIndex: 1000,
      }}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            ...StyleSheetBackdrop,
            opacity: backdropOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        testID={testIdPrefix}
        style={{
          height: SHEET_H,
          width: '100%',
          backgroundColor: defaultPalette.background.white,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          shadowColor: defaultPalette.background.black,
          shadowRadius: 7,
          shadowOpacity: 0.7,
          shadowOffset: { height: 7, width: 0 },
          elevation: 12,
          paddingBottom: 8,
          transform: [{ translateY: Animated.add(translateY, pan) }],
        }}
        {...panResponder.panHandlers}
      >
        {/* Grab-handle */}
        {showHandle && (
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: defaultPalette.background.gray06,
                opacity: 0.9,
              }}
            />
          </View>
        )}

        {/* Header */}
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={icons.arrow_left}
                style={{ width: 13, height: 13 }}
                resizeMode='cover'
                resizeMethod='resize'
              />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>{children}</View>
      </Animated.View>
    </View>
  )
}

const StyleSheetBackdrop = {
  position: 'absolute' as const,
  inset: 0 as const,
  backgroundColor: 'rgba(0,0,0,0.28)',
}

export default ModalBottomDrawer
