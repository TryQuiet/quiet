import React, { useState } from 'react'
import * as R from 'ramda'

import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import AddIcon from '@material-ui/icons/Add'

import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'
import CreateChannelModal from '../../../containers/widgets/channels/CreateChannelModal'
import ImportChannelModal from './ImportChannelModal'

const styles = theme => ({
  icon: {
    fontSize: 26,
    color: theme.palette.colors.white,
    backgroundColor: 'rgb(0,0,0,0.26)',
    borderRadius: 19
  },
  button: {
    padding: '4px',
    color: theme.typography.body2.color
  }
})

export const AddChannelAction = ({ classes, openCreateModal }) => {
  const [importOpen, setImportOpen] = useState(false)
  return (
    <React.Fragment>
      <MenuAction
        classes={{
          button: classes.button,
          icon: classes.icon
        }}
        Icon={AddIcon}
        IconButton={IconButton}
        offset='0 8'
      >
        <MenuActionItem onClick={() => setImportOpen(true)} title='Import' />
        <MenuActionItem onClick={openCreateModal} title='Create' />
      </MenuAction>
      <CreateChannelModal />
      <ImportChannelModal open={importOpen} handleClose={() => setImportOpen(false)} />
    </React.Fragment>
  )
}

export default R.compose(
  withStyles(styles),
  React.memo
)(AddChannelAction)
