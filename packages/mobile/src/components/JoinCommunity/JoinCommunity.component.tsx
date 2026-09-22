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
import { InvitationData, isDeviceInvitationData } from '@quiet/types'
import type { PasteInviteLinkVariant } from '../../route.params'

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

/** The paste field's error for text that is not a Quiet invitation; the QR scanner shows the same. */
export const INVALID_INVITATION_ERROR = 'Please check your invite link and try again'

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

/** The Link devices flow's variants: only a device link is accepted there. */
const DEVICE_LINK_VARIANTS: PasteInviteLinkVariant[] = ['deviceLink', 'pasteDeviceLink']

/** Shown under the input for a member link (or any other invitation) in the Link devices flow. Undesigned copy. */
export const NOT_A_DEVICE_LINK_ERROR = 'This is not a device link. Use the link from Link devices on your other device.'

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
      setInputError(INVALID_INVITATION_ERROR)
      return
    }

    if (DEVICE_LINK_VARIANTS.includes(variant) && !isDeviceInvitationData(submitValue)) {
      setLoading(false)
      setInputError(NOT_A_DEVICE_LINK_ERROR)
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
      setInputError(initialInputError)
      setJoinCommunityInput('')
      setLoading(false)
      inputRef.current?.setNativeProps({ text: '' })
    }
  }, [hasReceivedResponse, initialInputError])

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
