import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import PageContent from '../ui/page/PageContent'
import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'

import ChannelHeader from '../../containers/widgets/channels/ChannelHeader'
import ChannelContent from '../widgets/channels/ChannelContent'

const styles = {
  root: {}
}

// export const Home = ({ classes }) => (
//   <Page>
//     <PageHeader>
//       <Grid container alignItems='center' justify='center' className={classes.fullHeight}>
//         <Grid item>
//           <Typography variant='h5'>
//             Home
//           </Typography>
//         </Grid>
//       </Grid>
//     </PageHeader>
//     <PageContent>
//       <Grid container alignItems='center' justify='center' className={classes.fullHeight}>
//         <Grid item>
//           <Typography>
//             Content
//           </Typography>
//         </Grid>
//       </Grid>
//     </PageContent>
//   </Page>
// )

export const Home = ({ classes }) => (
  <Page>
    <PageHeader>
      <ChannelHeader />
    </PageHeader>
    <PageContent>
      <ChannelContent />
    </PageContent>
  </Page>
)

Home.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Home)
