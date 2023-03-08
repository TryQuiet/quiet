
import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { Appbar } from './Appbar.component'

storiesOf('Appbar', module)
  .add('Channel', () => <Appbar title={'general'} prefix={'#'} back={() => { console.log('back') }} />)
  .add('Community', () => <Appbar title={'Quiet'} position={'flex-start'} hasContextMenu={true} />)
