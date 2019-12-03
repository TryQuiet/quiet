import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import UsernameCreated from './UsernameCreated.js'

storiesOf('Components/UI/UsernameCreatedModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item style={{ backgroundColor: 'white' }}>
          <UsernameCreated handleClose={() => {}} setFormSent={() => {}} />
        </Grid>
      </Grid>
    )
  })
