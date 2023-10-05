import { storiesOf } from '@storybook/react-native'
import React from 'react'
import PossibleImpersonationAttackComponent from './PossibleImpersonationAttack.component'

storiesOf('PossibleImpersonationAttack', module).add('Default', () => (
  <PossibleImpersonationAttackComponent communityName='devteam' leaveCommunity={() => {}} handleBackButton={() => {}} />
))
