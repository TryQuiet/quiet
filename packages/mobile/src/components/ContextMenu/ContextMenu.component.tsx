import React, { FC } from 'react'
import { View, Image, FlatList, TouchableWithoutFeedback } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'

import { defaultPalette } from '../../styles/palettes/default.palette'
import { appImages } from '../../../assets'

export const ContextMenu: FC<ContextMenuProps> = ({ visible, handleClose, title, items }) => {
  const icon_close = appImages.icon_close
  return (
    <TouchableWithoutFeedback onPress={handleClose}>
      <View
        style={{
          display: visible ? 'flex' : 'none',
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(52, 52, 52, 0.8)'
        }}>
        <View style={{ flex: 4 }} />
        <TouchableWithoutFeedback>
          <View
            style={{
              flex: 6,
              // position: 'absolute',
              bottom: 0,
              flexDirection: 'column',
              alignItems: 'flex-start',
              backgroundColor: defaultPalette.background.white,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              width: '100%'
            }}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 60,
                width: '100%'
              }}>
              <TouchableWithoutFeedback onPress={handleClose}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 60,
                    height: 60
                  }}>
                  <Image
                    source={icon_close}
                    resizeMode='cover'
                    resizeMethod='resize'
                    style={{
                      width: 13,
                      height: 13
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
              <View style={{ flex: 5, justifyContent: 'center' }}>
                <Typography
                  fontSize={16}
                  fontWeight={'medium'}
                  style={{ lineHeight: 26, alignSelf: 'center' }}>
                  {title}
                </Typography>
              </View>
              <View style={{ flex: 1 }}></View>
            </View>
            <View style={{ width: '100%', paddingBottom: 10 }}>
              <FlatList
                data={items}
                keyExtractor={item => item.title}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      { borderTopWidth: 1, borderColor: defaultPalette.background.gray06 },
                      index === items.length - 1
                        ? { borderBottomWidth: 1 }
                        : { borderBottomWidth: 0 }
                    ]}>
                    <ContextMenuItem {...item} />
                  </View>
                )}
                style={{ backgroundColor: defaultPalette.background.white }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  )
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, action }) => {
  const icon_arrow = appImages.arrow_right_short
  return (
    <TouchableWithoutFeedback onPress={action}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 20,
          paddingRight: 20,
          height: 48,
          width: '100%'
        }}>
        <View
          style={{
            flex: 8,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start'
          }}>
          <Typography fontSize={16} fontWeight={'normal'} style={{ lineHeight: 26 }}>
            {title}
          </Typography>
        </View>
        <View
          style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Image
            source={icon_arrow}
            resizeMode='cover'
            resizeMethod='resize'
            style={{
              width: 8,
              height: 13
            }}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}
