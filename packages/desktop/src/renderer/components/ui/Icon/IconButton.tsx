import React from 'react'
import { styled } from '@mui/material/styles'
import IconButtonMui from '@mui/material/IconButton'

import { IIconButtonProps } from './IconButton.d'

const PREFIX = 'IconButton'

const classes = {
    root: `${PREFIX}root`,
}

const StyledIconButtonMui = styled(IconButtonMui)(({ theme }) => ({
    [`& .${classes.root}`]: {
        padding: 6,
        color: theme.typography.body1.color,
    },
}))

export const IconButton: React.FC<IIconButtonProps> = ({ children, onClick }) => {
    return (
        <StyledIconButtonMui classes={{ root: classes.root }} onClick={onClick}>
            {children}
        </StyledIconButtonMui>
    )
}

export default IconButton
