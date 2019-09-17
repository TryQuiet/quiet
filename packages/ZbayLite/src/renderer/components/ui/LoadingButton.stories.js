import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import LoadingButton from './LoadingButton'

storiesOf('Components/UI/LoadingButton', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <LoadingButton inProgress={boolean('inProgress', false)} />
  ))
