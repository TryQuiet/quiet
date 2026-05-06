import React from 'react'

export interface ContextMenuProps {
  visible: boolean
  handleClose: () => void
  handleBack?: () => void
  title: string
  children?: React.ReactNode
}

export interface ContextMenuHintProps {
  hint?: string
}

export interface ContextMenuItemListProps {
  items: ContextMenuItemProps[]
}

export interface ContextMenuItemProps {
  title: string
  action: () => void
}
