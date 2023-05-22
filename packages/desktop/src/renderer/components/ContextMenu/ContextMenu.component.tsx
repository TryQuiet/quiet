import React, { FC, useEffect, useRef } from 'react'

import { Grid, List, Typography } from '@mui/material'

import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'

import Icon from '../ui/Icon/Icon'
import arrowLeft from '../../static/images/arrowLeft.svg'
import arrowRightShort from '../../static/images/arrowRightShort.svg'

export const ContextMenu: FC<ContextMenuProps> = ({
  visible,
  handleClose,
  title,
  items,
  hint,
}) => {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target)) {
        if (visible) {
          handleClose()
        }
      }
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [ref])

  return (
    <Grid
      style={{
        display: visible ? 'flex' : 'none',
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 9001,
        pointerEvents: 'none'
      }}>
      <Grid style={{ flex: 6 }} onClick={handleClose} />
      <Grid
        ref={ref}
        style={{
          flex: 4,
          // position: 'absolute',
          bottom: 0,
          flexDirection: 'column',
          alignItems: 'flex-start',
          backgroundColor: '#ffffff',
          boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
          // shadowColor: '#000000',
          // shadowRadius: 7,
          // shadowOpacity: 0.7,
          // shadowOffset: {
          //   height: 7,
          //   width: 0
          // },
          // elevation: 12,
          maxWidth: '375px',
          pointerEvents: 'auto'
        }}
        data-testId={'contextMenu'}>
        <Grid
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '-10px',
            height: 60,
            width: '100%'
          }}>
          <Grid
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={handleClose}>
            <Icon src={arrowLeft} />
          </Grid>
          <Grid style={{ flex: 5, justifyContent: 'center' }}>
            <Typography fontSize={16} fontWeight={'medium'} style={{ alignSelf: 'center' }}>
              {title} settings
            </Typography>
          </Grid>
          <Grid style={{ flex: 1 }}></Grid>
        </Grid>
        {hint && (
          <Grid
            style={{
              width: '100%',
              padding: 16,
              borderTopWidth: 1,
              borderColor: '#F0F0F0'
            }}>
            <Typography fontSize={14} fontWeight={'normal'}>
              {hint}
            </Typography>
          </Grid>
        )}
        <List>
          {items.map((item, index) => {
            return (
              <Grid
                style={{
                  cursor: 'pointer',
                  borderTop: '1px solid',
                  borderColor: '#F0F0F0',
                  borderBottomWidth: index === items.length - 1 ? '1px solid' : 0
                }}
                key={index}>
                <ContextMenuItem {...item} />
              </Grid>
            )
          })}
        </List>
      </Grid>
    </Grid>
  )
}

export const ContextMenuItem: FC<ContextMenuItemProps> = ({ title, action }) => {
  return (
    <Grid
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        height: 48,
        width: '100%'
      }}
      onClick={action}
      data-testId={`contextMenuItem${title}`}>
      <Grid
        style={{
          flex: 8
        }}>
        <Typography fontSize={16} fontWeight={'normal'}>
          {title}
        </Typography>
      </Grid>
      <Grid style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Icon src={arrowRightShort} />
      </Grid>
    </Grid>
  )
}
