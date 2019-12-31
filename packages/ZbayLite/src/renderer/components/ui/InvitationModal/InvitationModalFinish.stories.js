import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, number } from '@storybook/addon-knobs'

import InvitationModalFinish from './InvitationModalFinish'

storiesOf('Components/UI/InvitationModalFinish', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <div style={{ width: 400, height: 600, backgroundColor: 'white' }}>
      <InvitationModalFinish
        open
        handleClose={() => {}}
        reset={() => {}}
        amount={number('amount', 4)}
      />
    </div>
  ))
