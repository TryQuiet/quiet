import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import ErrorModal from './ErrorModal'

storiesOf('Components/UI/ErrorModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    try {
      throw new Error('Something went really badly')
    } catch (error) {
      return (
        <ErrorModal
          open
          message={text('Error message', error.message)}
          traceback={text('Traceback', error.stack)}
          handleClose={action('Handle close')}
          handleCopy={action('Handle copy')}
        />
      )
    }
  })
