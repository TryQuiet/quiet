import React from 'react'
import { CircularProgress, Grid, Typography } from '@mui/material'

export interface IChannelNetworkStatusProps {
  isConnectedToOtherPeers: boolean
  communityHasPeers: boolean
  channelName: string
}

export const ChannelNetworkStatus: React.FC<IChannelNetworkStatusProps> = ({
  isConnectedToOtherPeers,
  communityHasPeers,
  channelName,
}) => {
  return (
    <Grid
      container
      style={{
        display: !isConnectedToOtherPeers && communityHasPeers ? 'flex' : 'none',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '11px 16px 11px 16px',
        width: '100%',
        borderTop: '1px solid #F0F0F0',
        borderRadius: '16px 16px 0px 0px',
      }}
      data-testid={`quietTryingToConnect-${channelName}`}
    >
      <Grid
        item
        style={{
          display: 'flex',
          flexDirection: 'row',
          paddingRight: '12px',
        }}
      >
        <CircularProgress color='inherit' className={'channelQuietConnectingSpinner'} size={20} />
      </Grid>
      <Typography fontSize={16} fontWeight={'normal'} justifyContent={'center'}>
        Quiet is trying to connect...
      </Typography>
    </Grid>
  )
}

export default ChannelNetworkStatus
