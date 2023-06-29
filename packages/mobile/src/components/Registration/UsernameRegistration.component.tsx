import React, { FC, useEffect, useState, useRef } from 'react'
import { Image, Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'
import { UsernameRegistrationProps } from './UsernameRegistration.types'
import { appImages } from '../../assets'
import { parseName } from '@quiet/common'
import { defaultTheme } from '../../styles/themes/default.theme'

export const UsernameRegistration: FC<UsernameRegistrationProps> = ({
  registerUsernameAction,
  registerUsernameError,
  usernameRegistered,
  fetching,
}) => {
  const [userName, setUserName] = useState<string | undefined>()
  const [parsedNameDiffers, setParsedNameDiffers] = useState<boolean>(false)
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (fetching) {
      setLoading(true)
      inputRef.current?.setNativeProps({ text: 'Registering username' })
    }
  }, [fetching])

  useEffect(() => {
    if (registerUsernameError) {
      setLoading(false)
      setInputError(registerUsernameError)
    }
  }, [registerUsernameError])

  const onChangeText = (name: string) => {
    setInputError(undefined)
    const parsedName = parseName(name)
    setUserName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  const onPress = () => {
    Keyboard.dismiss()
    setLoading(true)
    if (userName === undefined || userName?.length === 0) {
      setLoading(false)
      setInputError('Username can not be empty')
      return
    }
    registerUsernameAction(userName)
  }

  useEffect(() => {
    if (usernameRegistered) {
      setUserName('')
      setInputError(undefined)
      setLoading(false)
      inputRef.current?.clear()
    }
  }, [usernameRegistered])

  const icon = appImages.icon_warning

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: defaultTheme.palette.background.white,
      }}
      testID={'username-registration-component'}
    >
      <KeyboardAvoidingView
        behavior='height'
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <Typography fontSize={24} fontWeight={'medium'} style={{ marginBottom: 30 }}>
          {'Register a username'}
        </Typography>
        <Input
          onChangeText={onChangeText}
          label={'Choose your favorite username'}
          placeholder={'Enter a username'}
          hint={
            'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.'
          }
          disabled={loading}
          validation={inputError}
          ref={inputRef}
          length={20}
          capitalize={'none'}
        />
        {!inputError && userName !== undefined && userName.length > 0 && parsedNameDiffers && (
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <View style={{ justifyContent: 'center', alignContent: 'center', padding: 5 }}>
              <Image
                source={icon}
                resizeMode='cover'
                resizeMethod='resize'
                style={{
                  alignSelf: 'flex-end',
                  width: 20,
                  height: 20,
                }}
              />
            </View>
            <View style={{ justifyContent: 'center', alignContent: 'center', paddingStart: 4 }}>
              <Typography fontSize={10}>Your username will be registered as </Typography>
              <Typography fontSize={10} fontWeight={'medium'}>{`@${userName}`}</Typography>
            </View>
          </View>
        )}
        <View style={{ marginTop: 20 }}>
          <Button onPress={onPress} title={'Continue'} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
