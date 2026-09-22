import React, { ReactNode } from 'react'

import { styled } from '@mui/material/styles'

import MuiMenuItem from '@mui/material/MenuItem'

const PREFIX = 'MenuActionItem'

const classes = {
  root: `${PREFIX}root`,
}

// Row metrics come from the theme's MuiMenuItem override ('Button row', library 5578:43515).
const StyledMuiMenuItem = styled(MuiMenuItem)(() => ({
  [`&.${classes.root}`]: {
    margin: 0,
  },
}))

interface MenuActionItemProps {
  onClick: (e: React.MouseEvent) => void
  title: ReactNode
  close?: () => void
  closeAfterAction?: boolean
}

export const MenuActionItem: React.FC<MenuActionItemProps> = ({ onClick, title, close, closeAfterAction = true }) => {
  return (
    <StyledMuiMenuItem
      onClick={e => {
        onClick(e)
        if (close) {
          closeAfterAction && close()
        }
      }}
      className={classes.root}
    >
      {title}
    </StyledMuiMenuItem>
  )
}

export default MenuActionItem
