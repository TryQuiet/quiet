import React, { FC, useState, useRef, useEffect } from 'react'

import { Keyboard, KeyboardAvoidingView, TextInput, View, Image } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'

import { Typography } from '../Typography/Typography.component'
import { Input } from '../Input/Input.component'
import { Button } from '../Button/Button.component'

import { parseName } from '@quiet/common'
import { Appbar } from '../Appbar/Appbar.component'

import { appImages } from '../../../assets'

export interface CreateChannelProps {
  createChannelAction: (name: string) => void
  channelCreationError?: string
  clearComponent?: boolean
  handleBackButton: () => void
}

export const CreateChannel: FC<CreateChannelProps> = ({
  createChannelAction,
  channelCreationError,
  clearComponent,
  handleBackButton
}) => {
  const [createChannelInput, setCreateChannelInput] = useState<string | undefined>()
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>()

  const onChangeText = (value: string) => {
    setInputError(null)
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
    createChannelAction(createChannelInput)
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
      setInputError(undefined)
      setLoading(false)
      inputRef.current?.clear()
    }
  }, [clearComponent])

  const warning_icon = appImages.icon_warning

  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'create-channel-component'}>
      <Appbar title={'Create channel'} back={handleBackButton} />
      <KeyboardAvoidingView
        behavior='height'
        style={{
          flex: 1,
          marginTop: 24,
          paddingLeft: 20,
          paddingRight: 20
        }}>
        <Input
          onChangeText={onChangeText}
          label={'Add a name for your channel'}
          placeholder={'Channel name'}
          length={20}
          disabled={loading}
          validation={inputError}
          ref={inputRef}
        />
        {!inputError && createChannelInput?.length > 0 && parsedNameDiffers && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              marginTop: 12
            }}>
            <View>
              <Image
                source={warning_icon}
                resizeMode='cover'
                resizeMethod='resize'
                style={{
                  width: 16,
                  height: 16
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
        <View style={{ marginTop: 12 }}>
          <Button onPress={onPress} title={'Continue'} width={108} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
