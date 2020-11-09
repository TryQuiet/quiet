import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

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
  },
  icon: {},
  button: {}
})

const RefIconButton = React.forwardRef((props, ref) => <IconButton {...props} ref={ref} />)

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
  const anchor = useRef()
  const closeMenu = () => setOpen(false)
  const toggleMenu = () => setOpen(!open)
  return (
    <React.Fragment>
      <RefIconButton
        className={classes.button}
        ref={anchor}
        onClick={onClick || toggleMenu}
        disabled={disabled}
        disableRipple
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
      >
        <Icon
          className={classes.icon}
          fontSize='inherit'
          src={hover ? iconHover : icon}
        />
      </RefIconButton>
      <PopupMenu
        open={open}
        anchorEl={anchor.current}
        offset={offset}
        placement={placement}
      >
        <ClickAwayListener onClickAway={closeMenu}>
          <MenuList className={classes.menuList}>
            {React.Children.map(children, (child) =>
              React.cloneElement(child, { close: closeMenu })
            )}
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

export default R.compose(
  React.memo,
  withStyles(styles)
)(MenuAction)
