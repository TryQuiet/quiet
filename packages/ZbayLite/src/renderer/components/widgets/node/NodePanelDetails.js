import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import IconButton from '@material-ui/core/IconButton'
import { shell } from 'electron'

import NodePanelBlocksField from '../../../containers/widgets/node/NodePanelBlocksField'
import NodePanelConnectionsField from '../../../containers/widgets/node/NodePanelConnectionsField'
import NodePanelNetworkField from '../../../containers/widgets/node/NodePanelNetworkField'
import NodePanelFreeUtxos from '../../../containers/widgets/node/NodePanelFreeUtxos'
import Icon from '../../ui/Icon'
import helpIcon from '../../../static/images/help.svg'
import helpGrayIcon from '../../../static/images/helpGray.svg'
import expandLogsInactiveIcon from '../../../static/images/logs/inactiveLogPanel.svg'
import expandLogsHoveredIcon from '../../../static/images/logs/hoveredLogPanel.svg'
import Tooltip from '../../ui/Tooltip'

const styles = theme => ({
  details: {
    padding: 16,
    paddingTop: 0
  },
  iconButtonLogs: {
    marginTop: -3,
    padding: 0,
    marginRight: 8,
    paddingBottom: 6,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  iconButton: {
    marginTop: -3,
    padding: 0,
    paddingBottom: 6,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  tooltip: {
    marginTop: 0
  }
})

export const NodePanelDetails = ({ classes, expanded, showLogsPanel }) => {
  const [hover, setHover] = React.useState(false)
  const [logsHover, setLogsHover] = React.useState(false)

  return (
    <Grid container direction='column'>
      <Grid
        container
        direction='column'
        className={classNames({
          [classes.details]: true
        })}
      >
        {expanded && (
          <>
            <Grid item container direction>
              <NodePanelNetworkField />
              <Tooltip
                title='Logs'
                className={classes.tooltip}
                placement='bottom'
              >
                <IconButton
                  classes={{ root: classes.iconButtonLogs }}
                  onClick={(e) => {
                    e.stopPropagation()
                    showLogsPanel()
                  }}
                  onMouseOver={() => {
                    setLogsHover(true)
                  }}
                  onMouseOut={() => {
                    setLogsHover(false)
                  }}
                >
                  <Icon
                    className={classes.icon}
                    fontSize='inherit'
                    src={logsHover ? expandLogsHoveredIcon : expandLogsInactiveIcon}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip
                title='Learn more about node status'
                className={classes.tooltip}
                placement='bottom'
              >
                <IconButton
                  className={classes.iconButton}
                  onClick={e => {
                    e.stopPropagation()
                    shell.openExternal('https://www.zbay.app/faq.html#node-info')
                  }}
                  onMouseOver={() => {
                    setHover(true)
                  }}
                  onMouseOut={() => {
                    setHover(false)
                  }}
                >
                  <Icon
                    className={classes.icon}
                    fontSize='inherit'
                    src={hover ? helpIcon : helpGrayIcon}
                  />
                </IconButton>
              </Tooltip>
            </Grid>
            <NodePanelBlocksField />
            <NodePanelConnectionsField />
            <NodePanelFreeUtxos />
          </>
        )}
      </Grid>
    </Grid>
  )
}

NodePanelDetails.propTypes = {
  classes: PropTypes.object.isRequired,
  expanded: PropTypes.bool.isRequired
}

export default R.compose(React.memo, withStyles(styles))(NodePanelDetails)
