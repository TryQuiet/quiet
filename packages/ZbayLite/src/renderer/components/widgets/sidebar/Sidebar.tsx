import React from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'

import IdentityPanel from '../../../containers/ui/IdentityPanel'
import ChannelsPanel from '../../../containers/widgets/channels/ChannelsPanel'
import DirectMessagesPanel from '../../../containers/widgets/channels/DirectMessagesPanel'

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100%',
    width: '220px',
    position: 'relative',
    backgroundImage: 'linear-gradient(290.29deg, #521576 18.61%, #E42656 96.07%)',
    color: theme.palette.colors.white
  },
  padding: {
    padding: 0
  },
  content: {
    height: '100%'
  },
  gutterBottom: {
    marginBottom: theme.spacing(4)
  },
  walletInfo: {
    backgroundColor: 'rgb(0,0,0,0.1)'
  }
}))

const Sidebar: React.FC = () => {
  const classes = useStyles({})
  return (
    <Grid container direction='column' className={classes.root}>
      <Grid item xs container direction='column' className={classes.padding}>
        <Grid item >
          <IdentityPanel />
        </Grid>
        <Grid item xs container direction='column'>
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
                <ChannelsPanel title='Channels' />
                <DirectMessagesPanel title='Direct Messages' />
              </Scrollbars>
            )}
          </AutoSizer>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Sidebar
