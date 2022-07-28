import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import Icon from '../../ui/Icon/Icon'
import dropFiles from '../../../static/images/dropFiles.svg'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { files } from '@quiet/state-manager'

interface DropZoneComponentProps {
  handleFileDrop: (arg: any) => void
  channelName: string
}

const useStyles = makeStyles(theme => ({
  dropActiveBg: {
    position: 'relative'
  },
  dropActive: {
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
}))

export const ActiveDropZoneComponent: React.FC<{
  channelName: string
}> = ({
  channelName
}) => {
  const classes = useStyles({})
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
  const classes = useStyles({})
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (handleFileDrop) {
          if (!item.files.length) return
          if (item.files[0].path === '') return
          if (item.files[0].type === '') return
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
    <Grid item xs className={dropIsActive ? classes.dropActiveBg : '' } container direction='column' data-testid='drop-zone' ref={drop}>
      {dropIsActive && <ActiveDropZoneComponent channelName={channelName}/>}
      {children}
    </Grid>
  )
}
