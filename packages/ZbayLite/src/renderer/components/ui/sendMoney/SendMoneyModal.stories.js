import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, number } from '@storybook/addon-knobs'
import BigNumber from 'bignumber.js'

import SendMoneyModal from './SendMoneyModal'

storiesOf('Components/Widgets/SendMoneyModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    let step = number('Step', 1)
    return (
      <SendMoneyModal
        step={step}
        setStep={() => {}}
        rateUsd={new BigNumber(50)}
        rateZec={new BigNumber(0.4)}
        balanceZec={new BigNumber(0.7)}
        open={boolean('Disabled', true)}
        sent={boolean('sent', true)}
        handleClose={() => {}}
      />
    )
  })
