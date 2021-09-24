import React, { useState } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Page from '../ui/Page/Page'
import PageHeader from '../ui/Page/PageHeader'
import { channelTypeToHeader, channelTypeToInput } from './ChannelMapping'
import ChannelContent from '../../containers/widgets/channels/ChannelContent'
import { CHANNEL_TYPE } from './ChannelTypes'

const useStyles = makeStyles(() => ({
  root: {},
  messages: {
    height: 0 // It seems like flexGrow breaks if we dont set some default height
  }
}))

interface IChannelComponentProps {
  channelType: CHANNEL_TYPE
  contactId?: string
  offer?: string
}

type InputProps = Omit<IChannelComponentProps, 'channelType'> & {
  setTab: (arg: number) => void // for now
}

export const Channel: React.FC<IChannelComponentProps> = ({ channelType, ...props }) => {
  const classes = useStyles({})
  const [tab, setTab] = useState(0)

  const Header = channelTypeToHeader[channelType]
  const Input = channelTypeToInput[channelType] as React.FC<InputProps> // for now

  return (
    <Page>
      <PageHeader>
        <Header {...props} tab={tab} setTab={setTab} channelType={channelType} />
      </PageHeader>
      <Grid item xs className={classes.messages}>
        <ChannelContent tab={tab} {...props} channelType={channelType} />
      </Grid>
      <Grid item>
        <Input {...props} setTab={setTab} />
      </Grid>
    </Page>
  )
}

export default Channel
