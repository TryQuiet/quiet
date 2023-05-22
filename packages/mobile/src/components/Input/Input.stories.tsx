import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { Input } from './Input.component'

storiesOf('Input', module)
  .add('Default', () => <Input placeholder={'Message #general as @holmes'} />)
  .add('Disabled', () => (
    <Input placeholder={'Message #general as @holmes'} disabled={true} />
  ))
  .add('Label', () => (
    <Input
      label={'Choose your favorite username'}
      placeholder={'Enter a username'}
      validation={undefined}
    />
  ))
  .add('Validation', () => (
    <Input
      label={'Choose your favorite username'}
      placeholder={'Enter a username'}
      validation={'Username invalid'}
    />
  ))
  .add('Hint', () => (
    <Input
      label={'Choose your favorite username'}
      placeholder={'Enter a username'}
      hint={
        'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.'
      }
    />
  ))
  .add('HintValidation', () => (
    <Input
      label={'Choose your favorite username'}
      placeholder={'Enter a username'}
      validation={'Username invalid'}
      hint={
        'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only.'
      }
    />
  ))
