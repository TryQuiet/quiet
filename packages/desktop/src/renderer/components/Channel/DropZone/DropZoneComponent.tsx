import fs from 'fs'
import { styled } from '@mui/material/styles'
import React from 'react'

import { Grid } from '@mui/material'
import Icon from '../../ui/Icon/Icon'
import dropFiles from '../../../static/images/dropFiles.svg'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

const StyledDropZoneComponent = styled(Grid)(() => ({
  position: 'relative'
}))

const StyledActiveDropZoneComponent = styled('div')(({ theme }) => ({
  ...theme.typography.h2,
  position: 'absolute',
  zIndex: 1000,
  height: '100%',
  width: '100%',
  textAlign: 'center',
  background: 'rgba(255,255,255,0.9)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}))

interface DropZoneComponentProps {
  handleFileDrop: (arg: any) => void
  channelName: string
  children?: React.ReactNode
}

export const ActiveDropZoneComponent: React.FC<{
  channelName: string
}> = ({
  channelName
}) => {
  return (
    <StyledActiveDropZoneComponent>
      <Icon src={dropFiles} />
      <p>Upload to {channelName}</p>
    </StyledActiveDropZoneComponent>
  )
}

export const DropZoneComponent: React.FC<DropZoneComponentProps> = ({
  children,
  channelName,
  handleFileDrop
}) => {
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (handleFileDrop) {
          if (!item.files.length) return
          if (item.files[0].path === '') return
          try {
            if (fs.statSync(item.files[0].path).isDirectory()) return
          } catch (e) {
            // See: https://github.com/react-dnd/react-dnd/issues/3458
            console.error('drop error: ', e.message)
            return
          }
          handleFileDrop(item)
        }
      },
      canDrop(_item: any) {
        return true
      },
      collect: (monitor: DropTargetMonitor) => {
        const item: any = monitor.getItem()
        if (item) {
          console.log('collect', item.files, item.items)
        }

        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop()
        }
      }
    }),
    [handleFileDrop]
  )
  const dropIsActive = canDrop && isOver
  return (
    <StyledDropZoneComponent item xs container direction='column' data-testid='drop-zone' ref={drop}>
      {dropIsActive && <ActiveDropZoneComponent channelName={channelName}/>}
      {children}
    </StyledDropZoneComponent>
  )
}
