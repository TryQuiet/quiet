import React, { ReactNode } from 'react'

import MuiMenuItem from '@material-ui/core/MenuItem'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(() => ({
  root: {
    minHeight: 25,
    margin: 0,
    fontSize: 14,
    letterSpacing: 0.4,
    paddingTop: 5,
    paddingBottom: 5
  }
}))

interface MenuActionItemProps {
  onClick: (e: React.MouseEvent) => void
  title: ReactNode
  close?: () => void
  closeAfterAction?: boolean
}

export const MenuActionItem: React.FC<MenuActionItemProps> = ({
  onClick,
  title,
  close,
  closeAfterAction = true
}) => {
  const classes = useStyles({})
  return (
    <MuiMenuItem
      onClick={e => {
        onClick(e)
        closeAfterAction && close()
      }}
      className={classes.root}
    >
      {title}
    </MuiMenuItem>
  )
}

export default MenuActionItem
