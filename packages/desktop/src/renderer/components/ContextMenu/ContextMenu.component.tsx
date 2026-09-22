import React, { FC, useEffect, useRef } from 'react'
import { Grid, List, Typography, useTheme } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  ContextMenuProps,
  ContextMenuHintProps,
  ContextMenuItemListProps,
  ContextMenuItemProps,
} from './ContextMenu.types'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Divider, Drawer } from '../ui'
import IconButton from '../ui/Icon/IconButton'
import { rowHover } from '../../design-system/theme/components'

export const ContextMenu: FC<ContextMenuProps> = ({ visible, handleClose, handleBack, title, titleIcon, children }) => {
  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)

  return (
    <Drawer open={visible} onClose={handleClose} anchor='right'>
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
          <IconButton
            onClick={handleBack || handleClose}
            dataTestId={`contextMenu-close-button-${title.split(' ').join('')}`}
          >
            {handleBack ? <ArrowBackIcon style={{ fontSize: '24px' }} /> : <CloseIcon />}
          </IconButton>
          <Grid
            style={{
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              alignContent: 'center',
              display: 'flex',
              flex: 5,
              gap: theme.space.xs,
            }}
            data-testid={'contextMenu-title-wrapper'}
          >
            {titleIcon && titleIcon}
            <Typography variant='h5' data-testid={'contextMenu-title'}>
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
      <Typography>{hint}</Typography>
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

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, subtitle, suffix, destructive, action }) => {
  const theme = useTheme()

  return (
    <>
      <Grid
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: `${theme.space.md}px ${theme.space.lg}px`,
          width: '100%',
          cursor: 'pointer',
        }}
        sx={{ '&:hover': { backgroundColor: rowHover(theme) } }}
        onClick={action}
        data-testid={`contextMenuItem${title.replace(/ /g, '_')}`}
      >
        <Grid
          style={{
            flex: 8,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* The weight is the theme's, not a per-call override. */}
          <Typography style={{ color: destructive ? theme.palette.error.main : undefined }}>{title}</Typography>
          {subtitle && (
            <Typography
              fontWeight={'normal'}
              style={{ fontSize: 12, lineHeight: '16px', color: theme.palette.colors.gray50 }}
            >
              {subtitle}
            </Typography>
          )}
        </Grid>
        <Grid
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {suffix && (
            <Typography fontWeight={'normal'} style={{ color: theme.palette.colors.gray50 }}>
              {suffix}
            </Typography>
          )}
          <NavigateNextIcon />
        </Grid>
      </Grid>
      <Divider />
    </>
  )
}
