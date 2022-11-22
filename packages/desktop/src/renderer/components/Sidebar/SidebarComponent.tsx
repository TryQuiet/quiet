import React from 'react'
import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'
import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'
import IdentityPanel, { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import ChannelsPanel, { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
// import DirectMessagesPanel from '../../../containers/widgets/channels/DirectMessagesPanel'

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: '30px',
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

const SidebarComponent: React.FC<IdentityPanelProps & ChannelsPanelProps> = ({
  ...props
}) => {
  const classes = useStyles({})
  return (
    <Grid container direction='column' className={classes.root}>
      <Grid item xs container direction='column' className={classes.padding}>
        <Grid item >
          <IdentityPanel {...props} />
        </Grid>
        <Grid item xs container direction='column'>
          <AutoSizer>
            {({ width, height }) => (
              <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
                <ChannelsPanel {...props} />
                {/* <DirectMessagesPanel title='Direct Messages' /> */}
              </Scrollbars>
            )}
          </AutoSizer>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default SidebarComponent
