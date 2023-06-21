import React, { FC, useEffect, useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'
import { TextWithLink } from '../TextWithLink/TextWithLink.component'

import { CreateCommunityProps } from './CreateCommunity.types'

export const CreateCommunity: FC<CreateCommunityProps> = ({
  createCommunityAction,
  redirectionAction,
  networkCreated,
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
    setLoading(true)
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
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'create-community-component'}
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
          {'Create a community'}
        </Typography>
        <Input
          onChangeText={onChangeText}
          label={'Add a name for your community'}
          placeholder={'Community name'}
          disabled={loading}
          validation={inputError}
          ref={inputRef}
        />
        <View style={{ marginTop: 32 }}>
          <TextWithLink
            text={'You can %a instead'}
            links={[
              {
                tag: 'a',
                label: 'join a community',
                action: redirectionAction,
              },
            ]}
          />
        </View>
        <View style={{ marginTop: 32 }}>
          <Button onPress={onPress} title={'Continue'} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
