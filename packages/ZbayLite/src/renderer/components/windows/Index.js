import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardMedia from '@material-ui/core/CardMedia'
import LinearProgress from '@material-ui/core/LinearProgress'
import { withStyles } from '@material-ui/core/styles'

import ZcashIcon from '../../static/images/zcash/zbay-icon.svg'
import WindowWrapper from '../ui/WindowWrapper'

const styles = theme => ({
  icon: {
    width: 150,
    height: 150
  },
  card: {
    padding: theme.spacing(2)
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

export const Index = ({ classes, bootstrapping, bootstrappingMessage }) => (
  <WindowWrapper className={classes.root}>
    <Card className={classes.card}>
      <Grid container direction='row'>
        <CardMedia image={ZcashIcon} className={classes.icon} />
        <CardContent className={classes.content}>
          <Typography variant='body1' align='justify' gutterBottom>
            { bootstrapping ? bootstrappingMessage : 'Waiting for Zcash node.'}
          </Typography>
          <LinearProgress />
        </CardContent>
      </Grid>
    </Card>
  </WindowWrapper>
)

Index.propTypes = {
  classes: PropTypes.object.isRequired,
  bootstrapping: PropTypes.bool.isRequired,
  bootstrappingMessage: PropTypes.string.isRequired
}

Index.defaultProps = {
  bootstrapping: false,
  bootstrappingMessage: ''
}

export default withStyles(styles)(Index)
