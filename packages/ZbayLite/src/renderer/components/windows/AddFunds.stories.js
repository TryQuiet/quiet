import React from 'react'
import { storiesOf } from '@storybook/react'

import AddFunds from './AddFunds'

storiesOf('Components/Windows/AddFunds', module).add('playground', () => {
  return <AddFunds openModal={() => {}} skip={() => {}} />
})
