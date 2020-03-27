import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import AddFunds from './AddFunds'

storiesOf('Components/Widgets/Settings/AddFunds', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <AddFunds
            transparentAddress={'address transparent'}
            privateAddress={'zs123-test-address'}
            setCurrentTab={() => {}}
          />
        </Grid>
      </Grid>
    )
  })
