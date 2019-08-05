import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { decorate } from '@storybook/addon-actions'

import VaultUnlockerForm from './VaultUnlockerForm.js'

const finishSubmitting = decorate([args => {
  setTimeout(() => args[1].setSubmitting(false), 1000)
  return args
}])

storiesOf('Components/Widgets/VaultUnlockerForm', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={16}>
        <Grid item>
          <VaultUnlockerForm
            onSubmit={finishSubmitting.action('onSubmit')}
            locked={boolean('locked2', true)}
          />
        </Grid>
      </Grid>
    )
  })
