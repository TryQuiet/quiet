import React, { FC } from 'react'
import { View, Image, TouchableOpacity, Keyboard } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { StyledAppbar } from './Appbar.styles'
import { AppbarProps } from './Appbar.types'
import { icons } from '../../assets'
import { defaultTheme } from '../../styles/themes/default.theme'
import { DefaultAppbarTitle } from './DefaultAppbarHeaderTitle.component'

export const Appbar: FC<AppbarProps> = ({
  title,
  titleComponent,
  prefix,
  position,
  style,
  back,
  submit,
  contextMenu,
  crossBackIcon = false,
}) => {
  const arrow_icon = icons.arrow_left
  const cross_icon = icons.icon_close
  const menu_icon = icons.dots
  const displayedTitleComponent =
    titleComponent != null ? titleComponent : <DefaultAppbarTitle title={title} fontSize={16} fontWeight={'medium'} />
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
      <View style={{ flex: 4, alignItems: `${position || 'center'}` }}>{displayedTitleComponent}</View>
      <View style={{ flex: 1 }}>
        {contextMenu && (
          <TouchableOpacity
            onPress={event => {
              event.persist()
              Keyboard.dismiss()
              contextMenu.handleOpen()
            }}
            testID={'open_menu'}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center', width: 64, height: 50 }}>
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
        {submit && (
          <TouchableOpacity
            onPress={event => {
              event.persist()
              submit()
            }}
            testID={'submit'}
          >
            <View style={{ justifyContent: 'center', alignItems: 'center', width: 64, height: 50 }}>
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
