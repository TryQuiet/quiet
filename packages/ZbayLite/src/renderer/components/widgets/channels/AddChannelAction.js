import React, { useState } from 'react'
import * as R from 'ramda'

import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import addIcon from '../../../static/images/zcash/add-icon.svg'
import MenuAction from '../../ui/MenuAction'
import MenuActionItem from '../../ui/MenuActionItem'
import ImportChannelModal from './ImportChannelModal'

const styles = theme => ({
  icon: {
    width: 15,
    height: 15
  },
  button: {
    width: 25,
    height: 25,
    padding: 4,
    color: theme.typography.body2.color,
    backgroundColor: 'rgb(0,0,0,0.26)',
    borderRadius: '50%'
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
        icon={addIcon}
        iconHover={addIcon}
        IconButton={IconButton}
        offset='0 8'
      >
        <MenuActionItem onClick={() => setImportOpen(true)} title='Import' />
        <MenuActionItem onClick={openCreateModal} title='Create' />
      </MenuAction>

      <ImportChannelModal open={importOpen} handleClose={() => setImportOpen(false)} />
    </React.Fragment>
  )
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(AddChannelAction)
