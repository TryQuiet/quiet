import fs from 'fs'
import { styled } from '@mui/material/styles';
import React from 'react'

import { Grid } from '@mui/material'
import Icon from '../../ui/Icon/Icon'
import dropFiles from '../../../static/images/dropFiles.svg'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

const PREFIX = 'ActiveDropZoneComponent';

const classes = {
  dropActiveBg: `${PREFIX}dropActiveBg`,
  dropActive: `${PREFIX}dropActive`
};

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`& .${classes.dropActiveBg}`]: {
    position: 'relative'
  },

  [`& .${classes.dropActive}`]: {
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
  }
}));

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
    <div className={classes.dropActive}>
      <Icon src={dropFiles} />
      <p>Upload to {channelName}</p>
    </div>
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
          if (fs.statSync(item.files[0].path).isDirectory()) return
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
    <StyledGrid item xs className={dropIsActive ? classes.dropActiveBg : '' } container direction='column' data-testid='drop-zone' ref={drop}>
      {dropIsActive && <ActiveDropZoneComponent channelName={channelName}/>}
      {children}
    </StyledGrid>
  );
}
