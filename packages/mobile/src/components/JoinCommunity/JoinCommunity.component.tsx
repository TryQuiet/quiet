import React, { FC, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'
import { TextWithLink } from '../TextWithLink/TextWithLink.component'

import { JoinCommunityProps } from './JoinCommunity.types'

export const JoinCommunity: FC<JoinCommunityProps> = ({ joinCommunityAction }) => {
  const [joinCommunityInput, setJoinCommunityInput] = useState<string | undefined>()
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const onChangeText = (value: string) => {
    setInputError(undefined)
    setJoinCommunityInput(value)
  }

  const onPress = () => {
    Keyboard.dismiss()
    setLoading(true)
    if (joinCommunityInput === undefined || joinCommunityInput?.length === 0) {
      setLoading(false)
      setInputError('Community address can not be empty')
      return
    }
    joinCommunityAction(joinCommunityInput)
  }

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}>
      <KeyboardAvoidingView
        behavior='height'
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingLeft: 20,
          paddingRight: 20
        }}>
        <Typography fontSize={24} fontWeight={'medium'} style={{ marginBottom: 30 }}>
          {'Join community'}
        </Typography>
        <Input
          onChangeText={onChangeText}
          label={'Paste your invite link to join an existing community'}
          placeholder={'Invite link'}
          disabled={loading}
          validation={inputError}
        />
        <View style={{ marginTop: 32 }}>
          <TextWithLink
            text={'You can %a instead'}
            links={[
              {
                tag: 'a',
                label: 'create a new community',
                action: () => {
                  console.log('link clicked')
                }
              }
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
