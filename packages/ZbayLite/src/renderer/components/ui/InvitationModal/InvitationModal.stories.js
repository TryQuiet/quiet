import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import InvitationModal from './InvitationModal'

storiesOf('Components/UI/InvitationModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => (
    <InvitationModal
      open
      handleClose={() => {}}
      info='some random info does not matter at all'
      title='Hello i am title'
    />
  ))
