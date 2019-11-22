import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import NodeStatus from '../../../containers/widgets/node/NodeStatus'
import NodePanelDetails from '../../../containers/widgets/node/NodePanelDetails'
import Tooltip from '../../ui/Tooltip'

const styles = theme => ({
  expansionDetails: {
    padding: 0,
    margin: 0
  },
  expander: {
    boxShadow: 'none',
    color: theme.palette.colors.white,
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    width: '100%'
  },
  root: {
    position: 'relative'
  },
  icon: {
    color: 'inherit',
    fontSize: 15,
    marginLeft: -10,
    marginRight: 0
  },
  panelSummary: {
    padding: 0,
    margin: 0,
    height: 35,
    minHeight: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    '&:hover': {
      color: 'rgba(255, 255, 255, 1)'
    }
  },
  expanded: {
    backgroundColor: 'rgb(0,0,0,0.3)'
  },
  expandedSummary: {
    minHeight: '15px !important'
  },
  tooltip: {
    marginRight: 10,
    marginTop: 0
  },
  baseNotExpanded: {
    width: '80px'
  },
  baseExpanded: {
    width: '100%'
  }
})

export const NodePanel = ({ classes, expanded, status, setExpanded }) => (
  <Grid
    item
    container
    justify='flex-end'
    className={classNames({
      [classes.root]: true
    })}
  >
    <Grid
      item
      className={classNames({
        [classes.baseExpanded]: expanded,
        [classes.baseNotExpanded]: !expanded
      })}
    >
      <ExpansionPanel
        expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        square
        classes={{ root: classes.expander, expanded: classes.expanded }}
      >
        <Tooltip title={status} className={classes.tooltip} placement='bottom-end'>
          <ExpansionPanelSummary
            classes={{
              root: classes.panelSummary,
              expandIcon: classes.icon,
              expanded: classes.expandedSummary
            }}
            expandIcon={<ExpandMoreIcon fontSize='inherit' />}
          >
            <NodeStatus />
          </ExpansionPanelSummary>
        </Tooltip>

        <ExpansionPanelDetails className={classes.expansionDetails}>
          <NodePanelDetails expanded={expanded} />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </Grid>
  </Grid>
)

NodePanel.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(NodePanel)
