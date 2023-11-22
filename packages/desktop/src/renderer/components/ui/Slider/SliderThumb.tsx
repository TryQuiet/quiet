import React from 'react'
import { styled } from '@mui/material/styles'

const PREFIX = 'SliderThumb'

const classes = {
    root: `${PREFIX}root`,
}

const Root = styled('div')({
    [`&.${classes.root}`]: {
        width: 18,
        height: 18,
        background: '#d8d8d8',
        borderColor: '#979797',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: '50%',
    },
})

export const SliderThumb: React.FC = () => {
    return <Root className={classes.root} />
}

export default SliderThumb
