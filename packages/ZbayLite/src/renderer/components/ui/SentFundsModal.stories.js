import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'

import SentFundsModal from './SentFundsModal'

storiesOf('Components/UI/SentFundsModal', module).add('playground', () => (
  <SentFundsModal
    open
    handleClose={action('handleClose')}
    recipient='norbert'
    memo='random text'
    amountZec='12'
    amountUsd='12'
    feeZec={1}
    feeUsd={1}
  />
))
