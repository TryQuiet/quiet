
import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { Appbar } from './Appbar.component'

storiesOf('Appbar', module)
  .add('Default', () => <Appbar title={'general'} prefix={'#'} back={() => { console.log('back') }} />)
  .add('No arrow', () => <Appbar title={'Quiet'} position={'flex-start'} />)
