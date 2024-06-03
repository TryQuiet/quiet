import React from 'react'

import {
  List as MuiList,
  ListProps as MuiListProps,
  ListItem as MuiListItem,
  ListItemProps as MuiListItemProps,
  ListItemButton as MuiListItemButton,
  ListItemButtonProps as MuiListItemButtonProps,
  ListItemIcon as MuiListItemIcon,
  ListItemIconProps as MuiListItemIconProps,
  ListItemText as MuiListItemText,
  ListItemTextProps as MuiListItemTextProps,
} from '@mui/material'

type ListProps = MuiListProps

export const List: React.FC<ListProps> = props => {
  return <MuiList {...props} />
}

type ListItemProps = MuiListItemProps

export const ListItem: React.FC<ListItemProps> = props => {
  return <MuiListItem {...props} />
}

type ListItemButtonProps = MuiListItemButtonProps

export const ListItemButton: React.FC<ListItemButtonProps> = props => {
  return <MuiListItemButton {...props} />
}

type ListItemIconProps = MuiListItemIconProps

export const ListItemIcon: React.FC<ListItemIconProps> = props => {
  return <MuiListItemIcon {...props} />
}

type ListItemTextProps = MuiListItemTextProps

export const ListItemText: React.FC<ListItemTextProps> = props => {
  return <MuiListItemText {...props} />
}

export default List
