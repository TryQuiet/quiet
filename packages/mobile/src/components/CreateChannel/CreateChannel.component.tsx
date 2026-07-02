import React, { FC, useState, useRef, useEffect } from 'react'
import { Keyboard, KeyboardAvoidingView, TextInput, View, Image, Switch, Platform } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'

import { Typography } from '../Typography/Typography.component'
import { Input } from '../Input/Input.component'
import { Button } from '../Button/Button.component'

import { parseName } from '@quiet/common'
import { Appbar } from '../Appbar/Appbar.component'

import { icons } from '../../assets'
import LockIcon from '../../assets/icons/svg/lock'

export interface CreateChannelProps {
  canCreateChannel: boolean
  canCreatePrivateChannel: boolean
  createChannelAction: (name: string, isPublic: boolean) => void
  channelCreationError?: string
  clearComponent?: boolean
  handleBackButton: () => void
}

// Private channels are hidden from the UI for now
const SHOW_PRIVATE_CHANNEL_TOGGLE = false

export const CreateChannel: FC<CreateChannelProps> = ({
  canCreateChannel,
  canCreatePrivateChannel,
  createChannelAction,
  channelCreationError,
  clearComponent,
  handleBackButton,
}) => {
  const [createChannelInput, setCreateChannelInput] = useState<string | undefined>()
  const [channelIsPrivate, setChannelIsPrivate] = useState<boolean>(false)
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)

  const onChangeText = (value: string) => {
    setInputError(undefined)
    // inputRef.current?.setNativeProps({ text: value })

    const parsedName = parseName(value)

    setCreateChannelInput(parsedName)
    setParsedNameDiffers(value !== parsedName)
  }

  const onPress = () => {
    Keyboard.dismiss()
    setLoading(true)
    if (createChannelInput === undefined || createChannelInput?.length === 0) {
      setLoading(false)
      setInputError('Channel name can not be empty')
      return
    }
    createChannelAction(createChannelInput, !channelIsPrivate)
  }

  const toggleSwitch = () => {
    setChannelIsPrivate(!channelIsPrivate)
  }

  useEffect(() => {
    if (channelCreationError) {
      setInputError(channelCreationError)
      setLoading(false)
    }
  }, [channelCreationError])

  useEffect(() => {
    if (clearComponent) {
      setCreateChannelInput('')
      setChannelIsPrivate(false)
      setInputError(undefined)
      setLoading(false)
      inputRef.current?.clear()
    }
  }, [clearComponent])

  const warning_icon = icons.icon_warning

  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'create-channel-component'}
    >
      <Appbar title={'Create channel'} back={handleBackButton} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={{
          flex: 1,
          marginTop: 24,
          paddingLeft: 20,
          paddingRight: 20,
          marginBottom: 16,
        }}
      >
        <Input
          onChangeText={onChangeText}
          label={'Add a name for your channel'}
          placeholder={'Channel name'}
          length={20}
          disabled={loading}
          validation={inputError}
          ref={inputRef}
          autoCorrect={false}
        />
        {!inputError &&
          createChannelInput?.length !== undefined &&
          createChannelInput.length > 0 &&
          parsedNameDiffers && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                marginTop: 12,
                marginBottom: 16,
              }}
            >
              <View>
                <Image
                  source={warning_icon}
                  resizeMode='cover'
                  resizeMethod='resize'
                  style={{
                    width: 16,
                    height: 16,
                  }}
                />
              </View>
              <View testID={'create_channel_name_warning'}>
                <Typography fontSize={14}>{'Your channel will be created as'}</Typography>
                <Typography fontSize={14} fontWeight={'medium'}>
                  {`#${createChannelInput}`}
                </Typography>
              </View>
            </View>
          )}
        {SHOW_PRIVATE_CHANNEL_TOGGLE && canCreatePrivateChannel && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              height: 'auto',
              width: 'auto',
            }}
            testID={'create_channel_private'}
          >
            <View testID={'create_channel_private_lock'} style={{ flex: 1 }}>
              <LockIcon fill={false} />
            </View>
            <View testID={'create_channel_private_label'} style={{ flex: 8 }}>
              <Typography fontSize={16}>{'Private channel'}</Typography>
              <Typography
                fontSize={12}
                color={'gray50'}
                style={{
                  flexWrap: 'wrap',
                }}
              >
                {'Only assigned members and roles have access'}
              </Typography>
            </View>
            <View testID={'create_channel_private_toggle'} style={{ flex: 2 }}>
              <Switch
                trackColor={{
                  false: defaultTheme.palette.typography.gray50,
                  true: defaultTheme.palette.background.grassGreen,
                }}
                thumbColor={defaultTheme.palette.background.white}
                onValueChange={toggleSwitch}
                value={channelIsPrivate}
                style={{
                  height: 32,
                  width: 52,
                }}
              />
            </View>
          </View>
        )}
        <View style={{ marginTop: 12 + 12 }}>
          <Button onPress={onPress} title={'Continue'} width={108} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
