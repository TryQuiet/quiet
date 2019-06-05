import React from 'react'
import { storiesOf } from '@storybook/react'
import { decorate } from '@storybook/addon-actions'

import Paper from '@material-ui/core/Paper'

import VaultCreator from './VaultCreator'

const finishSubmitting = decorate([args => {
  args[1].setSubmitting(false)
  return args
}])

storiesOf('Components/Widgets/VaultCrator', module)
  .add('initial screen', () => {
    return (
      <Paper style={{ padding: 8 }}>
        <VaultCreator onSend={finishSubmitting.action('onSend')} />
      </Paper>
    )
  })
