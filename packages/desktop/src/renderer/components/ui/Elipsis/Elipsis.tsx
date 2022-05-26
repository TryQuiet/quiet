import React from 'react'
import * as R from 'ramda'

import { makeStyles } from '@material-ui/core'

import Tooltip from '../Tooltip/Tooltip'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles({
  content: {}
})

interface ElipsisProps {
  content: string
  length: number
  tooltipPlacement?: 'bottom-start' | 'bottom' | 'bottom-end'
  interactive?: boolean
}

export const Elipsis: React.FC<ElipsisProps> = ({
  content,
  length = 40,
  tooltipPlacement = 'bottom-start',
  interactive = false
}) => {
  const classes = useStyles({})

  return (
    <Tooltip
      title={content}
      interactive={interactive}
      placement={tooltipPlacement}
      disableHoverListener={content.length < length}>
      <Typography variant='caption' className={classes.content}>
        {R.concat(content.substring(0, length), content.length > length ? '...' : '')}
      </Typography>
    </Tooltip>
  )
}

export default Elipsis
