import React, { ReactNode } from 'react'

import { styled } from '@mui/material/styles'

import MuiMenuItem from '@mui/material/MenuItem'

const PREFIX = 'MenuActionItem'

const classes = {
  root: `${PREFIX}root`,
}

const StyledMuiMenuItem = styled(MuiMenuItem)(() => ({
  [`&.${classes.root}`]: {
    minHeight: 25,
    margin: 0,
    fontSize: 14,
    letterSpacing: 0.4,
    paddingTop: 5,
    paddingBottom: 5,
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
