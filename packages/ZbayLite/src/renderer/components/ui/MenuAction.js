import React, { useState } from 'react'
import PropTypes from 'prop-types'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import MenuList from '@material-ui/core/MenuList'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import Icon from './Icon'
import PopupMenu from '../ui/PopupMenu'

const styles = theme => ({
  menuList: {
    paddingTop: 24,
    paddingBottom: 24,
    minWidth: 136,
    borderRadius: 8
  }
})

export const MenuAction = ({
  classes,
  IconButton,
  icon,
  iconHover,
  children,
  offset,
  disabled,
  onClick,
  placement
}) => {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const toggleHover = () => setHover(!hover)
  const [anchor, setAnchor] = useState(React.createRef())
  const closeMenu = () => setOpen(false)
  const toggleMenu = () => setOpen(!open)
  return (
    <React.Fragment>
      <IconButton
        className={classes.button}
        buttonRef={setAnchor}
        onClick={onClick || toggleMenu}
        disabled={disabled}
        disableRipple
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
      >
        <Icon className={classes.icon} fontSize='inherit' src={hover ? iconHover : icon} />
      </IconButton>
      <PopupMenu open={open} anchorEl={anchor} offset={offset} placement={placement}>
        <ClickAwayListener onClickAway={closeMenu}>
          <MenuList className={classes.menuList}>
            {React.Children.map(children, child => React.cloneElement(child, { close: closeMenu }))}
          </MenuList>
        </ClickAwayListener>
      </PopupMenu>
    </React.Fragment>
  )
}

MenuAction.propTypes = {
  classes: PropTypes.object.isRequired,
  IconButton: PropTypes.elementType.isRequired,
  icon: PropTypes.string.isRequired,
  iconHover: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.element),
  offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool.isRequired,
  placement: PropTypes.string,
  onClick: PropTypes.func
}

MenuAction.defaultProps = {
  IconButton,
  disabled: false
}

export default withStyles(styles)(MenuAction)
