import React, { useState } from 'react'
import PropTypes from 'prop-types'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import MenuList from '@material-ui/core/MenuList'
import MuiMenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import PopupMenu from '../ui/PopupMenu'
import { MenuItem } from './channels/types'

const styles = theme => ({
  menuItem: {
    height: 8,
    width: 80,
    paddingLeft: 2.5 * theme.spacing.unit,
    paddingRight: 2.5 * theme.spacing.unit,
    fontSize: '0.75rem'
  },
  menuList: {
    padding: `${1.5 * theme.spacing.unit}px 0`
  },
  button: {},
  icon: {}
})

export const MenuAction = ({ classes, IconButton, Icon, menuItems, offset }) => {
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
          disableRipple
        >
          <Icon className={classes.icon} />
        </IconButton>
        <PopupMenu
          open={open}
          anchorEl={anchor}
          offset={offset}
        >
          <MenuList className={classes.menuList}>
            { menuItems.map(menuItem => (
              <MuiMenuItem onClick={menuItem.onClick} className={classes.menuItem} key={menuItem.title}>
                {menuItem.title}
              </MuiMenuItem>
            ))}
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
  menuItems: PropTypes.arrayOf(
    PropTypes.instanceOf(MenuItem)
  ).isRequired,
  offset: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
}

MenuAction.defaultProps = {
  IconButton
}

export default withStyles(styles)(MenuAction)
