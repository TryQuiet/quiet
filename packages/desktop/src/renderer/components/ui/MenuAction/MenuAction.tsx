import React, { useState, useRef } from 'react'

import { styled } from '@mui/material/styles'

import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import IconButton, { IconButtonProps, IconButtonTypeMap } from '@mui/material/IconButton'

import Icon from '../Icon/Icon'
import PopupMenu from '../PopupMenu/PopupMenu'
import { ExtendButtonBase, PopperPlacementType } from '@mui/material'

const PREFIX = 'MenuAction'

const classes = {
    menuList: `${PREFIX}menuList`,
    icon: `${PREFIX}icon`,
    button: `${PREFIX}button`,
}

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(() => ({
    [`& .${classes.menuList}`]: {
        paddingTop: 24,
        paddingBottom: 24,
        minWidth: 136,
        borderRadius: 8,
    },

    [`& .${classes.icon}`]: {},
    [`& .${classes.button}`]: {},
}))

const RefIconButton = React.forwardRef<HTMLButtonElement, React.PropsWithChildren<IconButtonProps>>((props, ref) => (
    <IconButton {...props} ref={ref} size='large' />
))

interface MenuActionProps {
    icon: string | ExtendButtonBase<IconButtonTypeMap<object, 'button'>>
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
    placement,
}) => {
    const [open, setOpen] = useState(false)
    const [hover, setHover] = useState(false)
    const toggleHover = () => setHover(!hover)

    const buttonRef = useRef(null)

    const [anchorEl, setAnchorEl] = React.useState(null)

    const closeMenu = () => {
        setAnchorEl(null)
        setOpen(false)
    }

    const toggleMenu = () => {
        setAnchorEl(buttonRef.current)
        setOpen(!open)
    }

    return (
        <Root>
            <RefIconButton
                className={classes.button}
                ref={buttonRef}
                onClick={onClick || toggleMenu}
                disabled={disabled}
                disableRipple
                onMouseEnter={toggleHover}
                onMouseLeave={toggleHover}
            >
                <Icon className={classes.icon} src={hover ? iconHover : icon} />
            </RefIconButton>
            <PopupMenu open={open} anchorEl={anchorEl} offset={offset} placement={placement}>
                <ClickAwayListener onClickAway={closeMenu}>
                    <MenuList className={classes.menuList}>
                        {React.Children.map(children, child => React.cloneElement(child, { close: closeMenu }))}
                    </MenuList>
                </ClickAwayListener>
            </PopupMenu>
        </Root>
    )
}

export default MenuAction
