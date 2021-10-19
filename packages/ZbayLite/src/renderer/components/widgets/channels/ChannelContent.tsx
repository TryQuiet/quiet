import React from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import RootRef from '@material-ui/core/RootRef'

import { channelTypeToMessages } from '../../pages/ChannelMapping'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import { Mentions } from '../../../store/handlers/mentions'

const useStyles = makeStyles((theme) => ({
  fullHeight: {
    height: '100%',
    backgroundColor: theme.palette.colors.white
  },
  mentionsDiv: {
    marginBottom: 8
  }
}))

interface ChannelMessagesProps {
  contactId: string
  measureRef?: React.RefObject<unknown>
  contentRect: string
  channelType?: CHANNEL_TYPE
  tab?: number
  mentions: { channelId: Mentions[] }
  removeMention: (name: string) => void
}

export const ChannelContent: React.FC<ChannelMessagesProps> = ({
  contactId,
  measureRef,
  contentRect,
  channelType
}) => {
  const classes = useStyles({})
  const ChannelMessages = channelTypeToMessages[channelType]
  return (
    <Grid item container direction='column' className={classes.fullHeight}>
      <Grid item xs>
        <RootRef rootRef={measureRef}>
          <ChannelMessages
            channelId={contactId}
            contactId={contactId}
            contentRect={contentRect}
          />
        </RootRef>
      </Grid>
    </Grid>
  )
}

export default ChannelContent
