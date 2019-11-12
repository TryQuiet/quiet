import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import UpdateModal from './UpdateModal'

storiesOf('Components/Widgets/UpdateModal/UpdateModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <UpdateModal
            open
          />
        </Grid>
      </Grid>
    )
  })
