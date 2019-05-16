import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardMedia from '@material-ui/core/CardMedia'
import { withStyles } from '@material-ui/core/styles'

import ZcashIcon from '../../static/images/zcash/zcash-icon-fullcolor.svg'
import WindowWrapper from '../ui/WindowWrapper'
import NodeStatus from '../../containers/widgets/node/NodeStatus'

const styles = theme => ({
  icon: {
    width: 200,
    height: 200
  },
  card: {
    padding: 2 * theme.spacing.unit
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export const Index = ({ classes }) => (
  <WindowWrapper className={classes.root}>
    <Card className={classes.card}>
      <Grid container direction='row'>
        <CardMedia image={ZcashIcon} className={classes.icon} />
        <CardContent className={classes.content}>
          <Typography variant='body1' align='justify' gutterBottom>
            Waiting for Zcash node.
          </Typography>
          <NodeStatus />
        </CardContent>
      </Grid>
    </Card>
  </WindowWrapper>
)

Index.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Index)
