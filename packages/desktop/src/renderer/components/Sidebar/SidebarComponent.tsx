import React from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'

import { Scrollbars } from 'rc-scrollbars'
import { AutoSizer } from 'react-virtualized'
import IdentityPanel, { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import ChannelsPanel, { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import TorStatus, { TorStatusProps } from './TorStatus'
import UserProfilePanel, { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'

const PREFIX = 'SidebarComponent'

const classes = {
  root: `${PREFIX}root`,
  padding: `${PREFIX}padding`,
  content: `${PREFIX}content`,
  gutterBottom: `${PREFIX}gutterBottom`,
  walletInfo: `${PREFIX}walletInfo`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    paddingTop: '30px',
    minHeight: '100%',
    width: '220px',
    position: 'relative',
    backgroundImage: 'linear-gradient(290.29deg, #521576 18.61%, #E42656 96.07%)',
    color: theme.palette.colors.white,
  },

  [`& .${classes.padding}`]: {
    padding: 0,
  },

  [`& .${classes.content}`]: {
    height: '100%',
  },

  [`& .${classes.gutterBottom}`]: {
    marginBottom: theme.spacing(4),
  },

  [`& .${classes.walletInfo}`]: {
    backgroundColor: 'rgb(0,0,0,0.1)',
  },
}))

const SidebarComponent: React.FC<IdentityPanelProps & ChannelsPanelProps & TorStatusProps & UserProfilePanelProps> = ({
  ...props
}) => {
  return (
    <StyledGrid container direction='column' className={classes.root}>
      <Grid item xs container direction='column' className={classes.padding}>
        <Grid item>
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
        <TorStatus isTorInitialized={props.isTorInitialized} />
        <Grid item>
          <UserProfilePanel {...props} />
        </Grid>
      </Grid>
    </StyledGrid>
  )
}

export default SidebarComponent
