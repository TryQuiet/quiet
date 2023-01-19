import { Typography } from '@mui/material'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import Linkify from 'react-linkify'
import { styled } from '@mui/material'
import theme from '../../../theme'

const PREFIX = 'TextMessageContent'

const classes = {
  message: `${PREFIX}message`,
  pending: `${PREFIX}pending`,
  link: `${PREFIX}link`
}

const StyledTypography = styled(Typography)(() => ({
  [`& .${classes.message}`]: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },

  [`& .${classes.pending}`]: {
    color: theme.palette.colors.lightGray
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
})) as typeof Typography

export interface TextMessageComponentProps {
  message: string
  messageId: string
  pending: boolean
  openUrl: (url: string) => void
}

export const TextMessageComponent: React.FC<TextMessageComponentProps> = ({
  message,
  messageId,
  pending,
  openUrl
}) => {
  const componentDecorator = (decoratedHref: string, decoratedText: string, key: number): ReactNode => {
    return (
      <a onClick={() => { openUrl(decoratedHref) }} className={classNames({ [classes.link]: true })} key={key}>
        {decoratedText}
      </a>
    )
  }

  return (
    <StyledTypography
      component={'span' as any}
      className={classNames({
        [classes.message]: true,
        [classes.pending]: pending
      })}
      data-testid={`messagesGroupContent-${messageId}`}>
      <Linkify componentDecorator={componentDecorator}>{message}</Linkify>
    </StyledTypography>
  )
}