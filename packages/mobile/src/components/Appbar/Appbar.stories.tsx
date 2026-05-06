import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { useContextMenu } from '../../hooks/useContextMenu'

import { Appbar } from './Appbar.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('appBar:stories')

const contextMenu: ReturnType<typeof useContextMenu> = {
  visible: false,
  handleOpen: function (_args?: any): any {},
  handleClose: function (_args?: any): any {},
}

storiesOf('Appbar', module)
  .add('Channel', () => (
    <Appbar
      title={'general'}
      prefix={'#'}
      back={() => {
        logger.info('back')
      }}
    />
  ))
  .add('Community', () => <Appbar title={'Quiet'} position={'flex-start'} contextMenu={contextMenu} />)
