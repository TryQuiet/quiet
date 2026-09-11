import React, { FC, useEffect, useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'

import { CreateCommunityProps } from './CreateCommunity.types'
import { Splash } from '../Splash/Splash.component'

export const CreateCommunity: FC<CreateCommunityProps> = ({
  createCommunityAction,
  handleBackButton,
  networkCreated,
  ready = true,
}) => {
  const [createCommunityInput, setCreateCommunityInput] = useState<string | undefined>()
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)

  const onChangeText = (value: string) => {
    setInputError(undefined)
    setCreateCommunityInput(value)
  }

  const onPress = () => {
    Keyboard.dismiss()
    // disabling loading because we support going back to create community screen now
    // setLoading(true)
    if (createCommunityInput === undefined || createCommunityInput?.length === 0) {
      setLoading(false)
      setInputError('Community name can not be empty')
      return
    }
    createCommunityAction(createCommunityInput)
  }

  useEffect(() => {
    if (networkCreated) {
      setCreateCommunityInput('')
      setInputError(undefined)
      setLoading(false)
      inputRef.current?.clear()
    }
  }, [networkCreated])

  return (
    <>
      {ready ? (
        <View
          style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
          testID={'create-community-component'}
        >
          <Appbar title={'Create a community'} back={handleBackButton} />
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing.lg,
              gap: spacing.xl,
            }}
          >
            <Typography variant={'h3'}>{'Create a community'}</Typography>
            <Input
              onChangeText={onChangeText}
              label={'Add a name for your community'}
              placeholder={'Community name'}
              disabled={loading}
              validation={inputError}
              ref={inputRef}
              autoCorrect={false}
              testID={'create-community-input'}
            />
            <Button onPress={onPress} title={'Continue'} loading={loading} testID={'create-community-continue'} />
          </KeyboardAvoidingView>
        </View>
      ) : (
        <Splash />
      )}
    </>
  )
}
