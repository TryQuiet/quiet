import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'

import QuitAppDialog from './QuitAppDialog'

storiesOf('Components/UI/QuitAppDialog', module)
  .add('playground', () => (
    <QuitAppDialog
      open
      handleClose={action('handleClose')}
      handleQuit={action('handleQuit')}
    />
  ))
