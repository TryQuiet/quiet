import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import PageContent from '../ui/page/PageContent'
import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'

const styles = {
  root: {}
}

export const Home = ({ classes }) => (
  <Page>
    <PageHeader>
      <Grid container alignItems='center' justify='center' className={classes.fullHeight}>
        <Grid item>
          <Typography variant='h5'>
            Home
          </Typography>
        </Grid>
      </Grid>
    </PageHeader>
    <PageContent>
      <Grid container alignItems='center' justify='center' className={classes.fullHeight}>
        <Grid item>
          <Typography>
            Content
          </Typography>
        </Grid>
      </Grid>
    </PageContent>
  </Page>
)

Home.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Home)
