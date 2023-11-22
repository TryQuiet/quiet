import React from 'react'

import { storiesOf } from '@storybook/react-native'

import { ConfirmationBox } from './ConfirmationBox.component'

storiesOf('ConfirmationBox', module).add('LinkCopied', () => {
    return <ConfirmationBox title={'Link copied'} toggle />
})
