import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'

import PageContent from '../ui/page/PageContent'
import Page from '../ui/page/Page'
import PageHeader from '../ui/page/PageHeader'

const styles = {
  root: {},
  fullHeight: {
    minHeight: '100%'
  }
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
