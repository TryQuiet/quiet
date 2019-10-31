import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import BigNumber from 'bignumber.js'

import SendFundsForm from './SendFundsForm'

storiesOf('Components/Widgets/SendFundsModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    const payload = {
      background: 28,
      tag: 'dirtbike',
      nickname: 'roks33'
    }
    return (
      <SendFundsForm
        rateUsd={new BigNumber(50)}
        rateZec={1 / new BigNumber(50)}
        balanceZec={new BigNumber(0.7)}
        open={boolean('Disabled', true)}
        handleClose={() => {}}
        values={{
          zec: 21
        }}
        shippingData={{
          street: 'test',
          country: 'Poland',
          region: '',
          postalCode: '21',
          city: 'San Francisco',
          address: 'Green street'
        }}
        payload={payload}
      />
    )
  })
