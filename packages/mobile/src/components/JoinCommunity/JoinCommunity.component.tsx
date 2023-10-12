import React, { FC, useEffect, useState, useRef } from 'react'
import { Keyboard, KeyboardAvoidingView, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'
import { TextWithLink } from '../TextWithLink/TextWithLink.component'

import { JoinCommunityProps } from './JoinCommunity.types'
import { getInvitationCodes } from '@quiet/state-manager'

import { Splash } from '../Splash/Splash.component'

export const JoinCommunity: FC<JoinCommunityProps> = ({
  joinCommunityAction,
  redirectionAction,
  invitationCode,
  networkCreated,
  ready = true,
}) => {
  const [joinCommunityInput, setJoinCommunityInput] = useState<string | undefined>()
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)

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

    let submitValue
    try {
      submitValue = getInvitationCodes(joinCommunityInput.trim())
    } catch (e) {
      console.warn(`Could not parse invitation code, reason: ${e.message}`)
    }

    if (!submitValue) {
      setLoading(false)
      setInputError('Please check your invitation code and try again')
      return
    }

    joinCommunityAction(submitValue)
  }

  useEffect(() => {
    if (invitationCode) {
      setJoinCommunityInput(invitationCode)
      setInputError(undefined)
      setLoading(true)
      inputRef.current?.setNativeProps({ text: invitationCode })
    }
  }, [invitationCode])

  useEffect(() => {
    if (networkCreated) {
      setInputError(undefined)
      setJoinCommunityInput('')
    }
  }, [networkCreated])

  return (
    <>
      {ready ? (
        <View
          style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
          testID={'join-community-component'}
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
              {'Join community'}
            </Typography>
            <Input
              onChangeText={onChangeText}
              label={'Paste your invite link to join an existing community'}
              placeholder={'Invite link'}
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
                    label: 'create a new community',
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
      ) : (
        <Splash />
      )}
    </>
  )
}
