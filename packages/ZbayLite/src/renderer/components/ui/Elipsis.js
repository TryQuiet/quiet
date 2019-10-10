import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Tooltip from './Tooltip'
import Typography from '@material-ui/core/Typography'

export const Elipsis = ({ classes, content, tooltipPlacement, length, interactive }) => (
  <Tooltip
    title={content}
    interactive={interactive}
    placement={tooltipPlacement}
    disableHoverListener={content.length < length}
  >
    <Typography variant='caption' className={classes.content}>
      {R.concat(
        content.substring(0, length),
        content.length > length ? '...' : ''
      )}
    </Typography>
  </Tooltip>
)

Elipsis.propTypes = {
  length: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
  classes: PropTypes.shape({
    content: PropTypes.string
  }),
  tooltipPlacement: PropTypes.oneOf(['bottom-start', 'bottom', 'bottom-end']),
  interactive: PropTypes.bool
}

Elipsis.defaultProps = {
  classes: { content: '' },
  interactive: false,
  tooltipPlacement: 'bottom-start',
  length: 40
}

export default React.memo(Elipsis)
