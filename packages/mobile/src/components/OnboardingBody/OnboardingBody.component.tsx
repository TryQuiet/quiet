import React, { FC, ReactNode } from 'react'
import { View } from 'react-native'

import { onboardingStageBody } from '../../styles/const/onboarding'

/** What onboardingRhythm.test.tsx looks for on every stage, `OnboardingBody` or not. */
export const ONBOARDING_BODY_TEST_ID = 'onboarding-body'

export interface OnboardingBodyProps {
  children: ReactNode
  testID?: string
}

/**
 * The content column of a full-screen onboarding stage: one top inset, one block
 * gap, for every screen in the class.
 *
 * Mobile's counterpart to the desktop `OnboardingBody`. It carries no heading or
 * illustration of its own — the screens differ too much for that — only the
 * vertical rhythm, which is the part that has to be the same everywhere. A screen
 * that sets its own `paddingTop` or `gap` is what makes the flow jump as you move
 * through it, so none of them do.
 */
export const OnboardingBody: FC<OnboardingBodyProps> = ({ children, testID = ONBOARDING_BODY_TEST_ID }) => (
  <View style={onboardingStageBody} testID={testID}>
    {children}
  </View>
)
