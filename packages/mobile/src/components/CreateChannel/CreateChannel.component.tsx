import React, { FC, useState, useRef, useEffect } from 'react'
import { Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'

import { Input } from '../Input/Input.component'
import { Button } from '../Button/Button.component'

import { Appbar } from '../Appbar/Appbar.component'

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
  handleBackButton,
}) => {
  const [createChannelInput, setCreateChannelInput] = useState<string | undefined>()

  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)

  const onChangeText = (value: string) => {
    setInputError(undefined)
    setCreateChannelInput(value)
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

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID='create-channel-component'>
      <Appbar title='Create channel' back={handleBackButton} />
      <KeyboardAvoidingView
        behavior='height'
        style={{
          flex: 1,
          marginTop: 24,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <Input
          onChangeText={onChangeText}
          label='Add a name for your channel'
          placeholder='Channel name'
          length={20}
          disabled={loading}
          validation={inputError}
          ref={inputRef}
          autoCorrect={false}
        />
        <View style={{ marginTop: 12 }}>
          <Button onPress={onPress} title='Continue' width={108} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
