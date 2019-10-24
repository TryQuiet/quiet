import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { Formik } from 'formik'

import AdvertModal from './AdvertModal'

storiesOf('Components/UI/AdvertModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    try {
      throw new Error('Something went really badly')
    } catch (error) {
      return (
        <Formik>
          <AdvertModal
            open
            message={text('Error message', error.message)}
            traceback={text('Traceback', error.stack)}
            handleClose={action('Handle close')}
            handleCopy={action('Handle copy')}
          />
        </Formik>
      )
    }
  })
