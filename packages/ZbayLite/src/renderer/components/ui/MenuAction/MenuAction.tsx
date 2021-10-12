import React, { useState, createRef } from 'react'

import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import MenuList from '@material-ui/core/MenuList'
import IconButton, { IconButtonProps, IconButtonTypeMap } from '@material-ui/core/IconButton'
import { makeStyles } from '@material-ui/core/styles'

import Icon from '../Icon/Icon'
import PopupMenu from '../PopupMenu/PopupMenu'
import { ExtendButtonBase, PopperPlacementType } from '@material-ui/core'

const useStyles = makeStyles(() => ({
  menuList: {
    paddingTop: 24,
    paddingBottom: 24,
    minWidth: 136,
    borderRadius: 8
  },
  icon: {},
  button: {}
}))

const RefIconButton = React.forwardRef<HTMLButtonElement, React.PropsWithChildren<IconButtonProps>>((props, ref) => (
  <IconButton {...props} ref={ref} />
))

interface MenuActionProps {
  icon: string | ExtendButtonBase<IconButtonTypeMap<{}, 'button'>>
  iconHover: string
  children?: any
  offset: string | number
  placement?: PopperPlacementType
  disabled?: boolean
  onClick?: () => void
}

export const MenuAction: React.FC<MenuActionProps> = ({
  icon = IconButton,
  iconHover,
  children,
  offset,
  disabled = false,
  onClick,
  placement
}) => {
  const classes = useStyles({})

  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const toggleHover = () => setHover(!hover)

  const anchor = createRef<HTMLButtonElement>()

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
        onMouseLeave={toggleHover}>
        <Icon className={classes.icon} src={hover ? iconHover : icon} />
      </RefIconButton>
      <PopupMenu open={open} anchorEl={anchor.current} offset={offset} placement={placement}>
        <ClickAwayListener onClickAway={closeMenu}>
          <MenuList className={classes.menuList}>
            {React.Children.map(children, child => React.cloneElement(child, { close: closeMenu }))}
          </MenuList>
        </ClickAwayListener>
      </PopupMenu>
    </React.Fragment>
  )
}

export default MenuAction
