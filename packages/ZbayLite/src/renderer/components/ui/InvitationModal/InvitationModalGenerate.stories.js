import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, number, boolean } from '@storybook/addon-knobs'

import InvitationModalGenerate from './InvitationModalGenerate'

storiesOf('Components/UI/InvitationModalGenerate', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <InvitationModalGenerate
      open
      handleClose={() => {}}
      amount={number('amount', 4)}
      zecRate={50.2}
      includeAffiliate={() => {}}
      affiliate={boolean('affiliate', true)}
    />
  ))
