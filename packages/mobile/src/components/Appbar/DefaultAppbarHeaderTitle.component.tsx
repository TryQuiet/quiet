import React from 'react'
import { HeaderTitleProps } from './Appbar.types'
import { Typography } from '../Typography/Typography.component'

export const DefaultAppbarTitle: React.FC<HeaderTitleProps> = (props: HeaderTitleProps) => {
  const fontSize = props.fontSize ?? 16
  const fontWeight = props.fontWeight ?? 'medium'
  return (
    <Typography fontSize={fontSize} fontWeight={fontWeight}>
      {props.title}
    </Typography>
  )
}
