import React, { FC, useEffect, useState, useRef } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'

import { JoinCommunityProps } from './JoinCommunity.types'

import { Splash } from '../Splash/Splash.component'
import { validateInviteLink } from '../../utils/inviteLink'

import { createLogger } from '../../utils/logger'
import {
  JOIN_WITH_INVITE_LINK_HEADING,
  LINK_DEVICES_HEADING,
  PASTE_LINK_HEADING,
  PASTE_LINK_PLACEHOLDER,
  SCAN_QR_CODE_HEADING,
  SCAN_QR_CODE_INTRO,
} from '@quiet/common'

const logger = createLogger('joinCommunity:component')

/**
 * Title bar · heading · intro per flow. Copy is the prototype's. Every variant
 * draws its own large heading, and a page with a heading gets no bar title, so
 * `titleHidden` keeps only the glyph and `title` is what the bar would have
 * said. Paste a link (3190:10892) is a full-screen h1 stage whose bar title the
 * frame itself hides, and both Link devices paste screens hide it too. The QR
 * flows are no longer served from here: they open the camera sheet, which
 * carries its own titled bar.
 */
const COPY = {
  inviteLink: {
    title: JOIN_WITH_INVITE_LINK_HEADING,
    titleHidden: true,
    heading: PASTE_LINK_HEADING,
    intro: undefined,
  },
  deviceLink: {
    title: LINK_DEVICES_HEADING,
    titleHidden: true,
    heading: SCAN_QR_CODE_HEADING,
    intro: SCAN_QR_CODE_INTRO,
  },
  /** Link devices → Paste link (user addition, 2026-09-13): the paste step under the Link devices title. */
  pasteDeviceLink: { title: LINK_DEVICES_HEADING, heading: PASTE_LINK_HEADING, intro: undefined, titleHidden: true },
} as const

/**
 * "Paste a link to join": one input with placeholder "Link" and Continue.
 * Member and device invitations both land here; the caller decides — except in
 * the Link devices flow, where a member link is an error and stays on this screen.
 * The QR scanner sheets fall back to this form when the camera cannot be used.
 */
export const JoinCommunity: FC<JoinCommunityProps> = ({
  joinCommunityAction,
  handleBackButton,
  invitationCode,
  hasReceivedResponse,
  variant = 'inviteLink',
  ready = true,
  inputError: initialInputError,
  onInputChange,
}) => {
  const [joinCommunityInput, setJoinCommunityInput] = useState<string | undefined>()
  const [inputError, setInputError] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)

  const inputRef = useRef<TextInput>(null)
  const copy = COPY[variant]

  const onChangeText = (value: string) => {
    onInputChange?.()
    setInputError(undefined)
    setJoinCommunityInput(value)
  }

  // The field carries no rules of its own: what counts as an invite link, and what to say
  // when it is not one, is the join field's shared validation.
  const onPress = () => {
    Keyboard.dismiss()

    const result = validateInviteLink(joinCommunityInput, variant)
    if (result.error !== undefined) {
      setLoading(false)
      setInputError(result.error)
      return
    }

    joinCommunityAction(result.data)
  }

  useEffect(() => {
    if (invitationCode) {
      setJoinCommunityInput(invitationCode)
      setInputError(undefined)
      inputRef.current?.setNativeProps({ text: invitationCode })
    }
  }, [invitationCode])

  // The caller's verdict on the last attempt shares the slot under the input with the
  // errors raised here, so it is mirrored into state rather than read straight through.
  // Clearing the field belongs to the effect below: editing the link drops the reported
  // error, and that must not take what is being typed with it.
  useEffect(() => {
    setInputError(initialInputError)
  }, [initialInputError])

  useEffect(() => {
    logger.info(`hasReceivedResponse changed: ${hasReceivedResponse}`)
    if (hasReceivedResponse) {
      logger.info('Resetting component state after receiving response')
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
          <Appbar title={copy.title} withoutTitle={copy.titleHidden} back={handleBackButton} />
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
            style={{
              flex: 1,
              paddingTop: spacing.xl,
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
              placeholder={PASTE_LINK_PLACEHOLDER}
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
