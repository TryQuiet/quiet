import React, { FC } from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { StyledAppbar } from './Appbar.styles'
import { AppbarProps } from './Appbar.types'
import { appImages } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Appbar: FC<AppbarProps> = ({
  title,
  prefix,
  position,
  style,
  back,
  contextMenu,
  crossBackIcon = false,
}) => {
  const arrow_icon = appImages.arrow_left
  const cross_icon = appImages.icon_close
  const menu_icon = appImages.dots
  return (
    <StyledAppbar style={style}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => {
            if (back) back()
          }}
          testID={'appbar_action_item'}
        >
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: 64,
              height: 50,
            }}
          >
            {back ? (
              <Image
                source={crossBackIcon ? cross_icon : arrow_icon}
                resizeMode='cover'
                resizeMethod='resize'
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            ) : (
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
                  {title?.slice(0, 2).toLowerCase()}
                </Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 4, alignItems: `${position || 'center'}` }}>
        <Typography fontSize={16} fontWeight={'medium'}>
          {title}
        </Typography>
      </View>
      <View style={{ flex: 1 }}>
        {contextMenu && (
          <TouchableOpacity
            onPress={event => {
              event.persist()
              contextMenu.handleOpen()
            }}
            testID={'open_menu'}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center', width: 64 }}>
              <Image
                source={menu_icon}
                resizeMode='contain'
                resizeMethod='resize'
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </StyledAppbar>
  )
}
