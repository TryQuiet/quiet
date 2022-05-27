import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

interface DropZoneComponentProps {
  dropTargetRef: any
  isActive: boolean
}

const useStyles = makeStyles(theme => ({
  root: {},
  dropActive: {
    opacity: 0.2
  },
  dropInactive: {
    opacity: 1
  }
}))

export const DropZoneComponent: React.FC<DropZoneComponentProps> = ({
  children,
  dropTargetRef,
  isActive
}) => {
  const classes = useStyles({})
  return (
    <Grid item className={isActive ? classes.dropActive : classes.dropInactive } container direction='column' style={{ height: '100vh' }} data-testid='drop-zone' ref={dropTargetRef}>
      {isActive && <p>U CAN DRO P NOW</p>}
      {children}
    </Grid>
  )
}
