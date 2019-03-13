import React from 'react'
import PropTypes from 'prop-types'

import Tooltip from './Tooltip'
import Typography from '@material-ui/core/Typography'

export const Elipsis = ({ classes, content, tooltipPlacement, length, interactive }) => (
  <Tooltip title={content} interactive={interactive} placement={tooltipPlacement}>
    <Typography variant='caption' className={classes.content}>
      {content.substring(0, length)}...
    </Typography>
  </Tooltip>
)

Elipsis.propTypes = {
  length: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
  classes: PropTypes.shape({
    content: PropTypes.string
  }),
  tooltipPlacement: PropTypes.oneOf(['left', 'center', 'right']),
  interactive: PropTypes.bool
}

Elipsis.defaultProps = {
  classes: { content: '' },
  interactive: false,
  tooltipPlacement: 'left',
  length: 40
}

export default React.memo(Elipsis)
