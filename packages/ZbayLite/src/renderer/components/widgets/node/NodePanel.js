import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'

import ExpandLessIcon from '@material-ui/icons/ExpandLess'

import NodeStatus from '../../../containers/widgets/node/NodeStatus'
import NodePanelDetails from '../../../containers/widgets/node/NodePanelDetails'

const styles = theme => ({
  expansionDetails: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(2),
    paddingTop: 0,
    paddingBottom: theme.spacing(1.5)
  },
  expander: {
    backgroundColor: theme.palette.primary.light,
    boxShadow: 'none'
  },
  root: {
    position: 'relative'
  }
})

export const NodePanel = ({ classes, className }) => (
  <Grid
    item
    container
    justify='center'
    className={classNames({
      [classes.root]: true,
      [className]: className
    })}>
    <Grid item xs>
      <ExpansionPanel square className={classes.expander}>
        <ExpansionPanelSummary expandIcon={<ExpandLessIcon />}>
          <NodeStatus />
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.expansionDetails}>
          <NodePanelDetails />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </Grid>
  </Grid>
)

NodePanel.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(NodePanel)
