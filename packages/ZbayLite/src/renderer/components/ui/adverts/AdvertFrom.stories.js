import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import BigNumber from 'bignumber.js'

import AdvertForm from './AdvertForm'

storiesOf('Components/Widgets/AdvertForm', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <AdvertForm
        rateUsd={new BigNumber(50)}
        rateZec={1 / new BigNumber(50)}
        balanceZec={new BigNumber(0.7)}
        open={boolean('Disabled', true)}
        handleClose={() => {}}
      />
    )
  })
