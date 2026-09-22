import React, { FC, ReactNode } from 'react'
import { View } from 'react-native'
import { Button } from '../Button/Button.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'

export type AgreeAndJoinProps = {
  onAgree: () => void
  /** The back arrow: the user did not agree. */
  onBack: () => void
  /** The left-aligned body, naming the host and carrying whatever link it needs. */
  children: ReactNode
  /** The button's label; the frame says "Agree & Join". */
  agreeLabel?: string
  testID?: string
  agreeTestID?: string
}

/**
 * Agree & join · Figma 3054:4090 (server opt-in) / 2811:2724 (joiner): a titled
 * bar ("Agree & join", back arrow, hairline — this one is designed titled, and
 * the screen has no heading of its own, so the bar title stays), one
 * left-aligned paragraph and one button. Nothing else: the back arrow is the
 * way out, and every caller maps it to declining.
 *
 * The shell only — each step supplies its own body, because the two that use it
 * are not asking the same question. The terms step asks the joiner to accept
 * the policy; the device-link step has to say what contacting the server
 * exposes.
 */
export const AgreeAndJoin: FC<AgreeAndJoinProps> = ({
  onAgree,
  onBack,
  children,
  agreeLabel = 'Agree & Join',
  testID = 'agree-and-join',
  agreeTestID = 'agree-and-join-confirm',
}) => (
  <View style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }} testID={testID}>
    <Appbar title={'Agree & join'} back={onBack} />
    <View style={{ padding: spacing.lg, gap: spacing.lg, alignItems: 'flex-start' }}>
      {children}
      <Button title={agreeLabel} onPress={onAgree} newDesign testID={agreeTestID} />
    </View>
  </View>
)

export default AgreeAndJoin
