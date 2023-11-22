import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Error } from './Error.component'

storiesOf('Error', module).add('Default', () => (
    <Error
        message={
            "Invalid md5sum. Looks like you're trying to download wrong file. Make sure your internet connection can be trusted."
        }
        onPress={storybookLog('Error button click')}
    />
))
