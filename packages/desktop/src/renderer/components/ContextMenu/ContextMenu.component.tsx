import React, { FC, useEffect, useRef } from 'react'
import { Grid, List, Typography, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {
  ContextMenuProps,
  ContextMenuHintProps,
  ContextMenuItemListProps,
  ContextMenuItemProps,
} from './ContextMenu.types'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Divider, Drawer } from '../ui'

export const ContextMenu: FC<ContextMenuProps> = ({ visible, handleClose, handleBack, title, children }) => {
  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)

  return (
    <Drawer open={visible} onClose={handleClose} title={'Settings'} anchor='right'>
      <Grid
        ref={ref}
        style={{
          flex: 4,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          backgroundColor: theme.palette.background.default,
          boxShadow: theme.shadows[1],
          width: '375px',
          pointerEvents: 'auto',
        }}
        data-testid={'contextMenu'}
      >
        <Grid
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            textAlign: 'center',
            height: 60,
            width: '100%',
          }}
        >
          <Grid
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            data-testid={`contextMenu-${title.split(' ').join('')}-backArrow`}
            onClick={handleBack || handleClose}
          >
            <CloseIcon />
          </Grid>
          <Grid style={{ flex: 5, justifyContent: 'center' }}>
            <Typography fontSize={16} fontWeight={'medium'} style={{ alignSelf: 'center' }}>
              {title}
            </Typography>
          </Grid>
          <Grid style={{ flex: 1 }}></Grid>
        </Grid>
        <Divider sx={{ width: '100%' }} />
        {children}
      </Grid>
    </Drawer>
  )
}

export const ContextMenuHint: FC<ContextMenuHintProps> = ({ hint }) => {
  return (
    <Grid
      style={{
        width: '100%',
        padding: 16,
      }}
    >
      <Divider />
      <Typography fontWeight={'normal'}>{hint}</Typography>
    </Grid>
  )
}

export const ContextMenuItemList: FC<ContextMenuItemListProps> = ({ items }) => {
  return (
    <List
      style={{
        padding: 0,
        width: '100%',
      }}
      dense
    >
      {items.map((item, index) => {
        return <ContextMenuItem {...item} key={index} />
      })}
    </List>
  )
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, action }) => {
  const theme = useTheme()

  return (
    <>
      <Grid
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '11px 16px',
          width: '100%',
          cursor: 'pointer',
        }}
        onClick={action}
        data-testid={`contextMenuItem${title}`}
      >
        <Grid
          style={{
            flex: 8,
          }}
        >
          <Typography fontWeight={'normal'}>{title}</Typography>
        </Grid>
        <Grid style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
          <NavigateNextIcon />
        </Grid>
      </Grid>
      <Divider />
    </>
  )
}
