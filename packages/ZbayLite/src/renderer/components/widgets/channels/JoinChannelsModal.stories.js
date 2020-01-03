import React from 'react'
import Immutable from 'immutable'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import create from '../../../store/create'

import { withStore } from '../../../../../.storybook/decorators'

import JoinChannelModal from './JoinChannelModal'

const store = create({
  initialState: Immutable.Map({
    publicChannels: Immutable.Map({})
  })
})

storiesOf('Components/Widgets/Channels/JoinChannelModal', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .addDecorator(withStore(store))
  .add('playground', () => {
    return (
      <JoinChannelModal
        open
        publicChannels={Immutable.Map({ 1: { name: 'test' } })}
        handleClose={() => {}}
      />
    )
  })
