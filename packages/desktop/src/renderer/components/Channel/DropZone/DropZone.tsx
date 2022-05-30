import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import Icon from '../../ui/Icon/Icon'
import dropFiles from '../../../static/images/dropFiles.svg'

interface DropZoneComponentProps {
  dropTargetRef: any
  channelName: string
  isActive: boolean
}

const useStyles = makeStyles(theme => ({
  root: {},
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
  dropTargetRef,
  channelName,
  isActive
}) => {
  const classes = useStyles({})
  return (
    <Grid item xs className={isActive && classes.dropActiveBg} container direction='column' data-testid='drop-zone' ref={dropTargetRef}>
      {isActive && <ActiveDropZoneComponent channelName={channelName}/>}
      {children}
    </Grid>
  )
}
