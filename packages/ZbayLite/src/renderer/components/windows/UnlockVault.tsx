import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import VaultUnlockerForm from '../../containers/widgets/VaultUnlockerForm'

const useStyles = makeStyles(() => ({
  gridRoot: {
    'min-height': '100vh',
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  }
}))

export const UnlockVault = () => {
  const classes = useStyles({})
  return (
    <WindowWrapper>
      <Grid
        container
        justify='center'
        alignItems='center'
        className={classes.gridRoot}
      >
        <VaultUnlockerForm />
      </Grid>
    </WindowWrapper>
  )
}

export default UnlockVault
