import React from 'react'
// import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import { storiesOf } from '@storybook/react'
import { withKnobs, number, select, text } from '@storybook/addon-knobs'

import Paper from '@material-ui/core/Paper'

import ZcashBalance from './ZcashBalance'

storiesOf('Components/Widgets/WallePanel/ZcashBalance', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    const alignValue = select(
      'Align',
      ['flex-start', 'flex-end'],
      'flex-start'
    )
    return (
      <Paper style={{ padding: 8, width: 300 }}>
        <ZcashBalance
          title={text('title', 'Available')}
          align={alignValue}
          usdBalance={new BigNumber(number('usdBalance', 23.22))}
          zecBalance={new BigNumber(number('zecBalance', 0.2232))}
          usdLocked={new BigNumber(number('usdLocked', 1.123))}
          zecLocked={new BigNumber(number('zecLocked', 0.0045))}
        />
      </Paper>
    )
  })
