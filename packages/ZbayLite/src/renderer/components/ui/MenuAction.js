import React, { useState } from 'react'
import PropTypes from 'prop-types'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import MenuList from '@material-ui/core/MenuList'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import PopupMenu from '../ui/PopupMenu'

const styles = theme => ({
  menuList: {
    padding: `${1.5 * theme.spacing.unit}px 0`
  },
  button: {},
  icon: {}
})

export const MenuAction = ({ classes, IconButton, Icon, children, offset, disabled }) => {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(React.createRef())
  const closeMenu = () => setOpen(false)
  const toggleMenu = () => setOpen(!open)
  return (
    <ClickAwayListener onClickAway={closeMenu}>
      <React.Fragment>
        <IconButton
          className={classes.button}
          buttonRef={setAnchor}
          onClick={toggleMenu}
          disabled={disabled}
          disableRipple
        >
          <Icon className={classes.icon} fontSize='inherit' />
        </IconButton>
        <PopupMenu
          open={open}
          anchorEl={anchor}
          offset={offset}
        >
          <MenuList className={classes.menuList}>
            { children }
          </MenuList>
        </PopupMenu>
      </React.Fragment>
    </ClickAwayListener>
  )
}

MenuAction.propTypes = {
  classes: PropTypes.object.isRequired,
  IconButton: PropTypes.elementType.isRequired,
  Icon: PropTypes.elementType.isRequired,
  children: PropTypes.arrayOf(
    PropTypes.element
  ).isRequired,
  offset: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  disabled: PropTypes.bool.isRequired
}

MenuAction.defaultProps = {
  IconButton,
  disabled: false
}

export default withStyles(styles)(MenuAction)
