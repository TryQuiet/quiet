import React, { FC, useEffect, useState, useRef } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'

import { JoinCommunityProps } from './JoinCommunity.types'
import { getInvitationCodes } from '@quiet/state-manager'

import { Splash } from '../Splash/Splash.component'
import { InvitationData } from '@quiet/types'

import { createLogger } from '../../utils/logger'

const logger = createLogger('joinCommunity:component')

/** Title bar · heading · intro per flow. Copy is the prototype's. */
const COPY = {
  inviteLink: { title: 'Join with invite link', heading: 'Paste a link to Join', intro: undefined },
  qrCode: { title: 'Join with QR code', heading: 'Join with QR code', intro: undefined },
  deviceLink: {
    title: 'Link devices',
    heading: 'Scan QR code',
    intro: 'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.',
  },
} as const

/**
 * "Paste a link to Join": one input with placeholder "Link" and Continue.
 * Member and device invitations both land here; the caller decides.
 * Without a scanner, the QR-code flows also take the link this way.
 */
export const JoinCommunity: FC<JoinCommunityProps> = ({
  joinCommunityAction,
  handleBackButton,
  invitationCode,
  hasReceivedResponse,
  variant = 'inviteLink',
  ready = true,
}) => {
  const [joinCommunityInput, setJoinCommunityInput] = useState<string | undefined>()
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)
  const copy = COPY[variant]

  const onChangeText = (value: string) => {
    setInputError(undefined)
    setJoinCommunityInput(value)
  }

  const onPress = () => {
    Keyboard.dismiss()

    if (joinCommunityInput === undefined || joinCommunityInput?.length === 0) {
      setLoading(false)
      setInputError('Community address can not be empty')
      return
    }

    let submitValue: InvitationData | null = null
    try {
      submitValue = getInvitationCodes(joinCommunityInput.trim())
    } catch (e) {
      logger.error(`Could not parse invitation code`, e)
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
      inputRef.current?.setNativeProps({ text: invitationCode })
    }
  }, [invitationCode])

  useEffect(() => {
    logger.info(`hasReceivedResponse changed: ${hasReceivedResponse}`)
    if (hasReceivedResponse) {
      logger.info('Resetting component state after receiving response')
      setInputError(undefined)
      setJoinCommunityInput('')
      setLoading(false)
      inputRef.current?.setNativeProps({ text: '' })
    }
  }, [hasReceivedResponse])

  return (
    <>
      {ready ? (
        <View
          style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
          testID={'join-community-component'}
        >
          <Appbar title={copy.title} back={handleBackButton} />
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: spacing.lg,
              gap: spacing.xl,
            }}
          >
            <View style={{ gap: spacing.sm }}>
              <Typography variant={'h3'} horizontalTextAlign={'center'}>
                {copy.heading}
              </Typography>
              {copy.intro ? (
                <Typography variant={'body'} horizontalTextAlign={'center'}>
                  {copy.intro}
                </Typography>
              ) : null}
            </View>
            <Input
              onChangeText={onChangeText}
              placeholder={'Link'}
              disabled={loading}
              validation={inputError}
              ref={inputRef}
              autoCorrect={false}
              testID={'paste-link-input'}
            />
            <Button onPress={onPress} title={'Continue'} loading={loading} testID={'paste-link-continue'} />
          </KeyboardAvoidingView>
        </View>
      ) : (
        <Splash />
      )}
    </>
  )
}
