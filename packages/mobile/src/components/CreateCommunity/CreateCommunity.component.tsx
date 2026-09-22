import React, { FC, useEffect, useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Appbar } from '../Appbar/Appbar.component'
import { onboardingStageBody } from '../../styles/const/onboarding'
import { ONBOARDING_BODY_TEST_ID } from '../OnboardingBody/OnboardingBody.component'
import { Button } from '../Button/Button.component'
import { Input } from '../Input/Input.component'
import { Typography } from '../Typography/Typography.component'

import { CreateCommunityProps } from './CreateCommunity.types'
import { Splash } from '../Splash/Splash.component'
import { CREATE_COMMUNITY_HEADING } from '@quiet/common'

/**
 * Create a community · Figma 2811:2451. The frame hides its bar title: the back
 * glyph alone, the heading is the title, content top-anchored 24 under the bar zone.
 */
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
          <Appbar withoutTitle back={handleBackButton} />
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
            style={onboardingStageBody}
            testID={ONBOARDING_BODY_TEST_ID}
          >
            <Typography variant={'h3'} horizontalTextAlign={'center'}>
              {CREATE_COMMUNITY_HEADING}
            </Typography>
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
