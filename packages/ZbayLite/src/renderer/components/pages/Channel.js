import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import PageContent from '../ui/page/PageContent'
import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'

import ChannelHeader from '../../containers/widgets/channels/ChannelHeader'
import DirectMessagesHeader from '../../containers/widgets/channels/DirectMessagesHeader'
import ChannelContent from '../../containers/widgets/channels/ChannelContent'

const styles = {
  root: {}
}

export const Channel = ({ classes, contactId }) => (
  <Page>
    <PageHeader>
      {contactId ? <DirectMessagesHeader contactId={contactId} /> : <ChannelHeader />}
    </PageHeader>
    <PageContent>
      <ChannelContent contactId={contactId} />
    </PageContent>
  </Page>
)

Channel.propTypes = {
  classes: PropTypes.object.isRequired,
  contactId: PropTypes.string
}

export default withStyles(styles)(Channel)
