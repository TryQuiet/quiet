import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Button from '@material-ui/core/Button'
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import { withStyles } from '@material-ui/core/styles'

import PopupMenu from '../../ui/PopupMenu'
import SpentFilter from '../../../containers/widgets/channels/SpentFilter'

const styles = theme => ({
  spendButton: {
    fontSize: 13,
    borderRadius: 13,
    backgroundColor: theme.palette.colors.gray,
    color: theme.palette.colors.black
  },
  tooltip: {
    borderRadius: 10,
    padding: 12,
    paddingBottom: 16,
    minWidth: '190px'
  }
})

export const SpentFilterAction = ({ classes }) => {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(React.createRef())
  const closeMenu = () => setOpen(false)
  const toggleMenu = () => setOpen(!open)
  return (
    <ClickAwayListener onClickAway={closeMenu}>
      <React.Fragment>
        <Button
          variant='contained'
          size='small'
          color='primary'
          onClick={toggleMenu}
          buttonRef={setAnchor}
          className={classes.spendButton}
        >
          Ad Spend
        </Button>
        <PopupMenu open={open} anchorEl={anchor} className={classes.tooltip} offset={'0 15'}>
          <SpentFilter onClickAway={closeMenu} />
        </PopupMenu>
      </React.Fragment>
    </ClickAwayListener>
  )
}

SpentFilterAction.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SpentFilterAction)
