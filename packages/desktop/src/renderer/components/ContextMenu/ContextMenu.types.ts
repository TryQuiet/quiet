export interface ContextMenuProps {
    visible: boolean
    handleClose: () => void
    title: string
    items: ContextMenuItemProps[]
    hint?: string
}

export interface ContextMenuItemProps {
    title: string
    action: () => void
}
