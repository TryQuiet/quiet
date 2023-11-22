import React from 'react'
import { styled } from '@mui/material/styles'
import * as R from 'ramda'
import Tooltip from '../Tooltip/Tooltip'
import Typography from '@mui/material/Typography'

const PREFIX = 'Elipsis'

const classes = {
    content: `${PREFIX}content`,
}

const StyledTooltip = styled(Tooltip)({
    [`& .${classes.content}`]: {},
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
    interactive = false,
}) => {
    return (
        <StyledTooltip
            title={content}
            interactive={interactive}
            placement={tooltipPlacement}
            disableHoverListener={content.length < length}
        >
            <Typography variant='caption' className={classes.content}>
                {R.concat(content.substring(0, length), content.length > length ? '...' : '')}
            </Typography>
        </StyledTooltip>
    )
}

export default Elipsis
