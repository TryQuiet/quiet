import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'
import { channelTypeToHeader, channelTypeToInput } from './ChannelMapping'
import ChannelContent from '../../containers/widgets/channels/ChannelContent'

const styles = {
  root: {},
  messages: {
    height: 0 // It seems like flexGrow breaks if we dont set some default height
  }
}

export const Channel = ({ classes, channelType, ...props }) => {
  const Header = channelTypeToHeader[channelType]
  const Input = channelTypeToInput[channelType]
  const [tab, setTab] = React.useState(0)
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

Channel.propTypes = {
  classes: PropTypes.object.isRequired,
  contactId: PropTypes.string
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Channel)
