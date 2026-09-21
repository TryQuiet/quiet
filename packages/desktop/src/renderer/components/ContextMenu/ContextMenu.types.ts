import React from 'react'

export interface ContextMenuProps {
  visible: boolean
  handleClose: () => void
  handleBack?: () => void
  title: string
  titleIcon?: React.ReactElement
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
  /** Drawn under the title, as the design's Permissions row explains itself. */
  subtitle?: string
  /** Drawn to the right of the row, before the chevron — a count or a current value. */
  suffix?: string
  /** Draws the row in the warning colour, as the designs do for Delete channel. */
  destructive?: boolean
  action: () => void
}
