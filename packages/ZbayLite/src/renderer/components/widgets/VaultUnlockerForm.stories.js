import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, text } from '@storybook/addon-knobs'
import { action, decorate } from '@storybook/addon-actions'

import VaultUnlocker from '../VaultUnlocker.js'
import VaultUnlockerForm from './VaultUnlockerForm.js'

const finishSubmitting = decorate([args => {
  setTimeout(() => args[1].setSubmitting(false), 1000)
  return args
}])

storiesOf('Components/Widgets/VaultUnlockerForm', module)
  .addDecorator(withKnobs)
// .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <Grid container direction='column' spacing={16}>
        <Grid item>
          <VaultUnlocker
            onClick={action('onClick')}
            onCloseSnackbar={action('onCloseSnacbkar')}
            handleSetPassword={action('handleSetPassword')}
            handleTogglePassword={action('handleTogglePassword')}
            unlocking={boolean('unlocking', false)}
            locked={boolean('locked', true)}
            passwordVisible={boolean('password visible', false)}
            error={text('error', '')}
          />
        </Grid>
        <Grid item>
          <VaultUnlockerForm
            onSubmit={finishSubmitting.action('onSubmit')}
            locked={boolean('locked2', true)}
          />
        </Grid>
      </Grid>
    )
  })
