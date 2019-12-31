import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, number, boolean } from '@storybook/addon-knobs'
import BigNumber from 'bignumber.js'

import InvitationModalGenerate from './InvitationModalGenerate'

storiesOf('Components/UI/InvitationModalGenerate', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <div style={{ width: 400, height: 600, backgroundColor: 'white' }}>
      <InvitationModalGenerate
        open
        balance={BigNumber(10)}
        handleClose={() => {}}
        amount={number('amount', 4)}
        zecRate={50.2}
        includeAffiliate={() => {}}
        affiliate={boolean('affiliate', true)}
      />
    </div>
  ))
