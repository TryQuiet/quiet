import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, number } from '@storybook/addon-knobs'

import InvitationModalFinish from './InvitationModalFinish'

storiesOf('Components/UI/InvitationModalFinish', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <InvitationModalFinish
      open
      handleClose={() => {}}
      reset={() => {}}
      amount={number('amount', 4)}
    />
  ))
