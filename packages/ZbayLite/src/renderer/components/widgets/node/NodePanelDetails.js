import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import classNames from 'classnames'
import IconButton from '@material-ui/core/IconButton'
import { shell } from 'electron'

import openAboutWindow from 'about-window'
import NodePanelBlocksField from '../../../containers/widgets/node/NodePanelBlocksField'
import NodePanelNetworkField from '../../../containers/widgets/node/NodePanelNetworkField'
import NodePanelFreeUtxos from '../../../containers/widgets/node/NodePanelFreeUtxos'
import Icon from '../../ui/Icon'
import helpIcon from '../../../static/images/help.svg'
import helpGrayIcon from '../../../static/images/helpGray.svg'
import Tooltip from '../../ui/Tooltip'
import electronStore from '../../../../shared/electronStore'
import { author } from '../../../../../package.json'

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

export const NodePanelDetails = ({ classes, expanded }) => {
  const [hover, setHover] = React.useState(false)
  const waggleVesrion = electronStore.get('waggleVersion')
  return (
    <Grid container direction='column'>
      <Grid
        container
        direction='column'
        className={classNames({
          [classes.details]: true
        })}>
        {expanded && (
          <>
            <Grid item container direction>
              <NodePanelNetworkField />
              <Tooltip
                title='About Zbay'
                className={classes.tooltip}
                placement='bottom'>
                <IconButton
                  className={classes.iconButton}
                  onClick={e => {
                    e.stopPropagation()
                    openAboutWindow({
                      icon_path: `${process.cwd()}/src/renderer/static/images/zcash/zbay-icon.png`,
                      about_page_dir: `${process.cwd()}/node_modules/about-window`,
                      description: `Waggle ${waggleVesrion}`,
                      use_version_info: true,
                      copyright: `Copyright (C) 2021 ${author.name}`
                    })
                  }}
                  onMouseOver={() => {
                    setHover(true)
                  }}
                  onMouseOut={() => {
                    setHover(false)
                  }}>
                  <Icon
                    className={classes.icon}
                    fontSize='inherit'
                    src={hover ? helpIcon : helpGrayIcon}
                  />
                </IconButton>
              </Tooltip>
            </Grid>
            <NodePanelBlocksField />
            {/* <NodePanelConnectionsField /> */}
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
