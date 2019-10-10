import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'
import ChannelInput from '../../containers/widgets/channels/ChannelInput'
import ChannelHeader from '../../containers/widgets/channels/ChannelHeader'
import DirectMessagesHeader from '../../containers/widgets/channels/DirectMessagesHeader'
import ChannelContent from '../../containers/widgets/channels/ChannelContent'

const styles = {
  root: {},
  messages: {
    height: 0 // It seems like flexGrow breaks if we dont set some default height
  }
}

export const Channel = ({ classes, contactId }) => {
  return (
    <Page>
      <PageHeader>
        {contactId ? <DirectMessagesHeader contactId={contactId} /> : <ChannelHeader />}
      </PageHeader>
      <Grid item xs className={classes.messages}>
        <ChannelContent contactId={contactId} />
      </Grid>
      <Grid item>
        <ChannelInput contactId={contactId} />
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
