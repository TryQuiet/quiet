import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import PageContent from '../ui/page/PageContent'
import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'

import ChannelHeader from '../../containers/widgets/channels/ChannelHeader'
import ChannelContent from '../../containers/widgets/channels/ChannelContent'

const styles = {
  root: {}
}

export const Channel = ({ classes }) => (
  <Page>
    <PageHeader>
      <ChannelHeader />
    </PageHeader>
    <PageContent>
      <ChannelContent />
    </PageContent>
  </Page>
)

Channel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Channel)
